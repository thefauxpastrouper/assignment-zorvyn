import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/error';

export const globalErrorHandler = (
  err: any, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || "Internal Server Error";

  // Log the error for the backend team (Pino or console)
  console.error(`[ERROR] ${req.method} ${req.url}: ${message}`);

  res.status(statusCode).json({
    success: false,
    error: err.name !== 'Error' ? err.name : "ServerError",
    message: message,
    // Only show stack trace in development mode
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};