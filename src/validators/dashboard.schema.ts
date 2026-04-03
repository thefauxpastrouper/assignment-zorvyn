import { z } from "zod";

export const DashboardQuerySchema = z.object({
  query: z.object({
    months: z.coerce
      .number()
      .int()
      .min(1, "Minimum 1 month")
      .max(24, "Maximum 24 months")
      .optional()
      .default(6),

    weeks: z.coerce
      .number()
      .int()
      .min(1, "Minimum 1 week")
      .max(52, "Maximum 52 weeks")
      .optional()
      .default(4),

    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(50, "Limit cannot exceed 50")
      .optional()
      .default(5),
  }),
});