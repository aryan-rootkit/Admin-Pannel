/**
 * Rate Limiting Utility
 * Prevents DDoS attacks and API abuse
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

interface RateLimitOptions {
  interval: number; // Time window in milliseconds
  max: number; // Maximum requests per interval
}

export function rateLimit(options: RateLimitOptions) {
  const { interval, max } = options;

  return (identifier: string): { allowed: boolean; remaining: number; resetTime: number } => {
    const now = Date.now();
    const key = identifier;

    // Clean up expired entries
    if (store[key] && store[key].resetTime < now) {
      delete store[key];
    }

    // Initialize or get existing entry
    if (!store[key]) {
      store[key] = {
        count: 1,
        resetTime: now + interval,
      };
      return { allowed: true, remaining: max - 1, resetTime: store[key].resetTime };
    }

    // Check if limit exceeded
    if (store[key].count >= max) {
      return { allowed: false, remaining: 0, resetTime: store[key].resetTime };
    }

    // Increment count
    store[key].count++;
    return { allowed: true, remaining: max - store[key].count, resetTime: store[key].resetTime };
  };
}

// Default rate limiters
export const apiRateLimit = rateLimit({
  interval: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
});

export const authRateLimit = rateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
});

export const writeRateLimit = rateLimit({
  interval: 60 * 1000, // 1 minute
  max: 30, // 30 write operations per minute
});
