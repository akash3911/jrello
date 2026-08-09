/**
 * In-Memory Sliding Window Rate Limiter for production API protection
 */

interface RateLimitTracker {
  count: number;
  resetAt: number;
}

const cache = new Map<string, RateLimitTracker>();

export interface RateLimitOptions {
  intervalMs?: number; // Time window in milliseconds (default 60s)
  maxRequests?: number; // Max requests per window (default 100)
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
} {
  const intervalMs = options.intervalMs || 60 * 1000;
  const maxRequests = options.maxRequests || 100;
  const now = Date.now();

  const record = cache.get(identifier);

  if (!record || now > record.resetAt) {
    // New or expired window
    const newRecord: RateLimitTracker = {
      count: 1,
      resetAt: now + intervalMs,
    };
    cache.set(identifier, newRecord);

    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      reset: Math.ceil((newRecord.resetAt - now) / 1000),
    };
  }

  if (record.count >= maxRequests) {
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      reset: Math.ceil((record.resetAt - now) / 1000),
    };
  }

  record.count += 1;
  return {
    success: true,
    limit: maxRequests,
    remaining: maxRequests - record.count,
    reset: Math.ceil((record.resetAt - now) / 1000),
  };
}
