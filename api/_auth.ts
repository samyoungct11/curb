import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

/**
 * Server-side identity check for the api/* routes.
 *
 * These routes use the Supabase SERVICE-ROLE key, which BYPASSES row-level
 * security. That means a `userId` taken from the request body is fully
 * attacker-controlled — anyone could pass someone else's id and read or
 * mutate their data (an IDOR / broken-object-level-authorization hole).
 *
 * The only trustworthy source of identity is the caller's Supabase access
 * token, sent as `Authorization: Bearer <token>`. We verify it here and
 * derive the user id from the verified JWT — never from the body.
 */

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

/**
 * Verify the caller and return their user id, or send a 401 and return null.
 *
 * Usage:
 *   const userId = await requireUser(req, res)
 *   if (!userId) return
 */
export async function requireUser(
  req: VercelRequest,
  res: VercelResponse,
): Promise<string | null> {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : null
  if (!token) {
    res.status(401).json({ error: 'unauthorized' })
    return null
  }

  // getUser(jwt) validates the token signature/expiry against the auth server
  // and returns the associated user — independent of the client's own key.
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) {
    res.status(401).json({ error: 'unauthorized' })
    return null
  }
  return data.user.id
}
