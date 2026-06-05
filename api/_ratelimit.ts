import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

/**
 * Shared IP-based rate limiter for the api/* routes.
 *
 * Backed by Upstash Redis so limits hold across Vercel's stateless serverless
 * invocations (an in-memory counter would reset on every cold start and is not
 * shared between concurrent instances).
 *
 * Configuration (Vercel env / .env.local):
 *   UPSTASH_REDIS_REST_URL    — Upstash database REST URL
 *   UPSTASH_REDIS_REST_TOKEN  — Upstash database REST token
 *
 * If either is missing we FAIL OPEN (allow the request) so local dev and
 * un-provisioned environments keep working — the limiter only engages once
 * credentials are present.
 */

const hasUpstash = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
)

// One sliding window shared across routes: 20 requests / minute / IP.
// Build inside a try/catch: Redis.fromEnv() throws synchronously on a
// malformed URL/token (e.g. stray quotes, missing https://, trailing space).
// This runs at module load, so an unguarded throw would crash EVERY request
// with FUNCTION_INVOCATION_FAILED. On any construction error we log and fall
// back to null (fail open) rather than take the route down.
const limiter = (() => {
  if (!hasUpstash) return null
  try {
    return new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(20, '1 m'),
      prefix: 'curb-rl',
      analytics: false,
    })
  } catch (err) {
    console.error(
      'rate limit disabled — bad Upstash config:',
      err instanceof Error ? err.message : err,
    )
    return null
  }
})()

/** Best-effort client IP from the proxy chain. */
function clientIp(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for']
  const raw = Array.isArray(fwd) ? fwd[0] : fwd
  return raw?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'anon'
}

/**
 * Enforce the rate limit for a request. Returns `true` if the caller should
 * proceed, or `false` if it was throttled (in which case a 429 has already
 * been sent and the handler must return immediately).
 *
 * @param route short identifier so different endpoints get independent buckets
 */
export async function rateLimit(
  req: VercelRequest,
  res: VercelResponse,
  route: string,
): Promise<boolean> {
  if (!limiter) return true // not configured — fail open

  try {
    const key = `${route}:${clientIp(req)}`
    const { success, limit, remaining, reset } = await limiter.limit(key)
    res.setHeader('X-RateLimit-Limit', String(limit))
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, remaining)))
    if (!success) {
      const retryAfter = Math.max(0, Math.ceil((reset - Date.now()) / 1000))
      res.setHeader('Retry-After', String(retryAfter))
      res.status(429).json({ error: 'rate_limited' })
      return false
    }
    return true
  } catch (err) {
    // Never let a limiter/Redis outage take down the route — fail open.
    console.error('rate limit error:', err instanceof Error ? err.message : err)
    return true
  }
}
