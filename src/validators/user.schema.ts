import { z } from "zod";

const roleEnum = z.enum(["ADMIN", "ANALYST", "VIEWER"]);

export const CreateUserSchema = z.object({
    email: z.email({ error: "Invalid email address" }),
    password: z.string({ error: "Password is required" })
        .min(6, { error: "Password must be at least 6 characters" })
        .max(100, { error: "Password must be at most 100 characters" }),
    role: roleEnum.optional(),
    isActive: z.boolean().optional(),
});

export const UpdateUserSchema = z.object({
    role: roleEnum.optional(),
    isActive: z.boolean().optional(),
});

