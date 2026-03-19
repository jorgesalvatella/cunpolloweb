/**
 * Simple in-memory rate limiter for serverless functions.
 * Uses a sliding window approach. Entries auto-expire.
 *
 * Note: This works per-instance on Vercel. For distributed rate limiting,
 * upgrade to Upstash Redis + @upstash/ratelimit.
 */

const store = new Map<string, number[]>();

// Cleanup old entries periodically to prevent memory leaks
const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, timestamps] of store) {
    const valid = timestamps.filter((t) => now - t < windowMs);
    if (valid.length === 0) {
      store.delete(key);
    } else {
      store.set(key, valid);
    }
  }
}

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterMs: number } {
  cleanup(windowMs);

  const now = Date.now();
  const timestamps = store.get(key) || [];

  // Filter to only timestamps within the window
  const valid = timestamps.filter((t) => now - t < windowMs);

  if (valid.length >= maxRequests) {
    const oldest = valid[0];
    const retryAfterMs = oldest + windowMs - now;
    return { allowed: false, retryAfterMs };
  }

  valid.push(now);
  store.set(key, valid);
  return { allowed: true, retryAfterMs: 0 };
}
