import { z } from "zod";
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
extendZodWithOpenApi(z);


export const DashboardQuerySchema = z.object({
  query: z.object({
    months: z.coerce
      .number()
      .int()
      .min(1, "Minimum 1 month")
      .max(24, "Maximum 24 months")
      .optional()
      .default(6)
      .openapi({
        example: 6,
        description: "Number of months to include in the dashboard data"
      }),

    weeks: z.coerce
      .number()
      .int()
      .min(1, "Minimum 1 week")
      .max(52, "Maximum 52 weeks")
      .optional()
      .default(4)
      .openapi({
        example: 4,
        description: "Number of weeks to include in the dashboard data"
      }),

    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(50, "Limit cannot exceed 50")
      .optional()
      .default(5)
      .openapi({
        example: 5,
        description: "Limit the number of records returned"
      }),
  }),
}).openapi('DashboardQuery');