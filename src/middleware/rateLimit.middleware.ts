import type { Request, Response, NextFunction } from 'express';

const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
const RATE_LIMIT_MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 100);

type RateLimitEntry = {
  count: number;
  firstRequestTimestamp: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

const cleanupExpiredEntries = () => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.firstRequestTimestamp > RATE_LIMIT_WINDOW_MS) {
      rateLimitStore.delete(key);
    }
  }
};

setInterval(cleanupExpiredEntries, RATE_LIMIT_WINDOW_MS).unref();

export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const clientId = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const existingEntry = rateLimitStore.get(clientId);

  if (!existingEntry || now - existingEntry.firstRequestTimestamp > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(clientId, {
      count: 1,
      firstRequestTimestamp: now,
    });
    return next();
  }

  if (existingEntry.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterSeconds = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - existingEntry.firstRequestTimestamp)) / 1000);
    res.setHeader('Retry-After', String(retryAfterSeconds));
    return res.status(429).json({
      success: false,
      error: 'TooManyRequests',
      message: `Rate limit exceeded. Try again in ${retryAfterSeconds} seconds.`,
    });
  }

  existingEntry.count += 1;
  rateLimitStore.set(clientId, existingEntry);
  return next();
};
