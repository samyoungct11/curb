import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'
import { rateLimit } from './_ratelimit.js'
import { requireUser, supabaseAdmin } from './_auth.js'

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  if (!(await rateLimit(req, res, 'exchange-token'))) return

  const userId = await requireUser(req, res)
  if (!userId) return
  // requireUser fails closed when the client is null, so it's non-null here.
  const supabase = supabaseAdmin!

  const { public_token, institution_name } = req.body as {
    public_token: string
    institution_name: string
  }

  if (!public_token) {
    return res.status(400).json({ error: 'public_token required' })
  }

  try {
    // Exchange public token → permanent access token (never sent to browser)
    const exchangeResp = await plaid.itemPublicTokenExchange({ public_token })
    const { access_token, item_id } = exchangeResp.data

    const { data, error } = await supabase
      .from('plaid_items')
      .upsert(
        { user_id: userId, access_token, item_id, institution_name },
        { onConflict: 'item_id' },
      )
      .select()
      .single()

    if (error) throw error

    res.json({ success: true, item_db_id: data.id })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('exchange-token error:', msg)
    res.status(500).json({ error: 'Failed to exchange token' })
  }
}
