// Fixed-window in-memory rate limiter. Suitable for a single Node instance
// (local dev, one-container deploys); on serverless each instance gets its
// own window, which still blunts brute-force bursts. Swap for a shared store
// (Redis / DB) if the API ever scales horizontally.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Returns true when the call is allowed, false when the window is exhausted. */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= max) return false;

  bucket.count += 1;
  return true;
}

/** Clears a key early (e.g. after a successful login). */
export function clearRateLimit(key: string): void {
  buckets.delete(key);
}
