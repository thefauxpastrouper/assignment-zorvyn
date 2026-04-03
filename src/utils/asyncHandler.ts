import type { Request, Response, NextFunction } from 'express';

// This function takes your controller and wraps it in a promise
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};