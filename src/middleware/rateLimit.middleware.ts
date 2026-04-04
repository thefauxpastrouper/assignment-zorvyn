import type { Request, Response, NextFunction } from 'express';

const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;
const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 100;

type RateLimitEntry = {
  count: number;
  firstRequestTimestamp: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();
(global as any).rateLimitStore = rateLimitStore;

const getRateLimitConfig = () => {
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? DEFAULT_RATE_LIMIT_WINDOW_MS);
  const maxRequests = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? DEFAULT_RATE_LIMIT_MAX_REQUESTS);

  return {
    windowMs: Number.isFinite(windowMs) && windowMs > 0 ? windowMs : DEFAULT_RATE_LIMIT_WINDOW_MS,
    maxRequests: Number.isInteger(maxRequests) && maxRequests > 0 ? maxRequests : DEFAULT_RATE_LIMIT_MAX_REQUESTS,
  };
};

const cleanupExpiredEntries = (windowMs: number) => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.firstRequestTimestamp > windowMs) {
      rateLimitStore.delete(key);
    }
  }
};

export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const { windowMs, maxRequests } = getRateLimitConfig();
  cleanupExpiredEntries(windowMs);

  const clientId = req.ip || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const existingEntry = rateLimitStore.get(clientId);

  if (!existingEntry || now - existingEntry.firstRequestTimestamp > windowMs) {
    rateLimitStore.set(clientId, {
      count: 1,
      firstRequestTimestamp: now,
    });
    return next();
  }

  if (existingEntry.count >= maxRequests) {
    const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - existingEntry.firstRequestTimestamp)) / 1000));
    res.setHeader('Retry-After', String(retryAfterSeconds));
    return res.status(429).json({
      success: false,
      error: 'TooManyRequests',
      message: `Rate limit exceeded. Try again in ${retryAfterSeconds} seconds.`,
    });
  }

  existingEntry.count += 1;
  return next();
};
