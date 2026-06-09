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

// Built guarded: createClient throws synchronously if the URL/key are missing.
// This runs at module load, so an unguarded throw would crash every request
// with FUNCTION_INVOCATION_FAILED (500) instead of a clean auth failure. If
// the auth backend isn't configured we leave this null and FAIL CLOSED (deny)
// in requireUser — the secure default for an authorization check.
const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = url && serviceKey ? createClient(url, serviceKey) : null

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
  // Auth backend not configured → fail CLOSED (deny). Never let an
  // unconfigured server fall through to trusting unverified input.
  if (!supabase) {
    res.status(401).json({ error: 'unauthorized' })
    return null
  }

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
