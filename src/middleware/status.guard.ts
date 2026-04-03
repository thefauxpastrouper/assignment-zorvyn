import { type Request, type Response, type NextFunction } from "express";

export const statusGuard = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.isActive) {
    return res.status(403).json({ 
      error: 'Account Inactive', 
      message: 'Please contact support to reactivate your account.' 
    });
  }
  next();
};