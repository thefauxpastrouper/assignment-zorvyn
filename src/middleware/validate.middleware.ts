import type { Request, Response, NextFunction } from 'express';
import { z, ZodError} from 'zod';

export const validate = (schema: z.ZodType<any, any, any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      req.body = result.body;
      req.query = result.query;
      req.params = result.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: "ValidationError",
          details: error.issues.map((err) => ({
            location: err.path[0], 
            field: err.path[1] || "general",
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};