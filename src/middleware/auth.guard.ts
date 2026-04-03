import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authGuard = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({error: "Unauthorized", message: "No token provided"})
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

        req.user = {
            id: decoded.id,
            role: decoded.role,
            isActive: decoded.isActive
        };
        next();
    }catch(error){
        return res.status(440).json({ error: "Session Expired", message: "Invalid or Expired Token"})
    }
};