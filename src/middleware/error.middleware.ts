import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/error';
import { clientErrorKey, resolveClientError } from '../utils/clientError';

export const globalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    console.error(`[ERROR] ${req.method} ${req.url}: ${err.message}`);
    return res.status(err.statusCode).json({
      success: false,
      error: err.name,
      message: err.message,
      stack:
        process.env.NODE_ENV === 'development' && err.stack
          ? err.stack
          : undefined,
    });
  }

  const resolved = resolveClientError(err);
  console.error(`[ERROR] ${req.method} ${req.url}: ${resolved.logDetail}`);
  if (process.env.NODE_ENV === 'development' && err instanceof Error && err.stack) {
    console.error(err.stack);
  }

  return res.status(resolved.statusCode).json({
    success: false,
    error: clientErrorKey(err, resolved.statusCode),
    message: resolved.message,
    stack:
      process.env.NODE_ENV === 'development' && err instanceof Error
        ? err.stack
        : undefined,
  });
};