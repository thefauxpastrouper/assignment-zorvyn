import { type Request, type Response, type NextFunction } from "express";
import { Role } from '../services/prisma/generated/prisma/client';

export const roleGuard = (allowedRoles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`
            });
        }
        next();
    };
};