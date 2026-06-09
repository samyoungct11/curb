import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Configuration, PlaidApi, PlaidEnvironments, CountryCode, Products } from 'plaid'
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  if (!(await rateLimit(req, res, 'create-link-token'))) return

  const userId = await requireUser(req, res)
  if (!userId) return

  try {
    const response = await plaid.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'Curb',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    })
    res.json({ link_token: response.data.link_token })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('create-link-token error:', msg)
    res.status(500).json({ error: 'Failed to create link token' })
  }
}
