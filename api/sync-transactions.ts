import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'
import { createClient } from '@supabase/supabase-js'
import { rateLimit } from './_ratelimit.js'
import { requireUser } from './_auth.js'

const plaidEnv = (process.env.PLAID_ENV ?? 'sandbox') as keyof typeof PlaidEnvironments

const plaid = new PlaidApi(
  new Configuration({
    basePath: PlaidEnvironments[plaidEnv],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
        'PLAID-SECRET': process.env.PLAID_SECRET!,
      },
    },
  }),
)

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// Map Plaid's personal_finance_category primary values → Curb category names
const CATEGORY_MAP: Record<string, string> = {
  FOOD_AND_DRINK: 'Restaurants',
  TRANSPORTATION: 'Transport',
  TRAVEL: 'Travel',
  ENTERTAINMENT: 'Entertainment',
  GENERAL_MERCHANDISE: 'Shopping',
  PERSONAL_CARE: 'Personal',
  MEDICAL: 'Health',
  RENT_AND_UTILITIES: 'Rent & Bills',
  EDUCATION: 'Education',
  HOME_IMPROVEMENT: 'Personal',
  GENERAL_SERVICES: 'Personal',
  LOAN_PAYMENTS: 'Rent & Bills',
  GOVERNMENT_AND_NON_PROFIT: 'Other',
  INCOME: 'Other',
  TRANSFER_IN: 'Other',
  TRANSFER_OUT: 'Other',
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  if (!(await rateLimit(req, res, 'sync-transactions'))) return

  const userId = await requireUser(req, res)
  if (!userId) return

  try {
    // Load all connected bank accounts for this user
    const { data: items, error: itemsErr } = await supabase
      .from('plaid_items')
      .select('*')
      .eq('user_id', userId)

    if (itemsErr) throw itemsErr
    if (!items?.length) return res.json({ transactions: [] })

    for (const item of items) {
      // Retrieve stored cursor (null = first sync)
      const { data: cursorRow } = await supabase
        .from('plaid_sync_cursors')
        .select('cursor')
        .eq('plaid_item_id', item.id)
        .maybeSingle()

      let cursor: string | undefined = cursorRow?.cursor ?? undefined
      let hasMore = true
      const added: ReturnType<typeof mapTxn>[] = []

      // Page through all updates since last cursor
      while (hasMore) {
        const syncResp = await plaid.transactionsSync({
          access_token: item.access_token,
          cursor,
          options: { include_personal_finance_category: true },
        })

        for (const t of syncResp.data.added) {
          if (!t.pending) added.push(mapTxn(t, userId, item.id))
        }

        cursor = syncResp.data.next_cursor
        hasMore = syncResp.data.has_more
      }

      // Persist cursor
      await supabase.from('plaid_sync_cursors').upsert(
        { plaid_item_id: item.id, cursor, last_synced_at: new Date().toISOString() },
        { onConflict: 'plaid_item_id' },
      )

      // Upsert transactions (idempotent)
      if (added.length > 0) {
        await supabase.from('transactions').upsert(added, { onConflict: 'id' })
      }
    }

    // Return last 90 days for this user
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 90)

    const { data: recent, error: recentErr } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('date', cutoff.toISOString().slice(0, 10))
      .order('date', { ascending: false })
      .limit(500)

    if (recentErr) throw recentErr

    res.json({ transactions: recent ?? [] })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('sync-transactions error:', msg)
    res.status(500).json({ error: 'Failed to sync transactions' })
  }
}

function mapTxn(
  t: {
    transaction_id: string
    amount: number
    date: string
    merchant_name?: string | null
    name: string
    personal_finance_category?: { primary: string } | null
    pending: boolean
  },
  userId: string,
  plaidItemId: string,
) {
  const rawCat = t.personal_finance_category?.primary ?? ''
  return {
    id: t.transaction_id,
    user_id: userId,
    plaid_item_id: plaidItemId,
    amount: t.amount,         // Plaid: positive = debit (money out)
    date: t.date,
    merchant: t.merchant_name ?? t.name,
    category: CATEGORY_MAP[rawCat] ?? 'Other',
    raw_category: rawCat,
    pending: t.pending,
  }
}
