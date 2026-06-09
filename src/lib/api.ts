import { supabase } from './supabase'

/**
 * POST JSON to one of our /api routes with the caller's Supabase access token
 * attached as `Authorization: Bearer <token>`.
 *
 * The server verifies that token to derive the user's identity (see
 * api/_auth.ts), so route bodies must NOT include a `userId` — it would be
 * ignored and is no longer trusted.
 */
export async function apiPost(
  path: string,
  body: Record<string, unknown> = {},
): Promise<Response> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  if (supabase) {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`
    }
  }

  return fetch(path, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}
