import type { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

export const validate = (schema: z.ZodType<any, any, any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (result.body) {
        Object.keys(req.body).forEach((key) => delete req.body[key]);
        Object.assign(req.body, result.body);
      }

      if (result.query) {
        Object.keys(req.query).forEach((key) => delete req.query[key]);
        Object.assign(req.query, result.query);
      }

      if (result.params) {
        Object.keys(req.params).forEach((key) => delete req.params[key]);
        Object.assign(req.params, result.params);
      }

      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: "ValidationError",
          details: error.issues.map((issue) => ({
            location: issue.path[0],
            field: issue.path[1] || "general",
            message: issue.message,
          })),
        });
      }
      return next(error);
    }
  };
};