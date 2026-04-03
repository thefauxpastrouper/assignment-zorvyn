import { z } from "zod";
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
extendZodWithOpenApi(z);


const roleEnum = z.enum(["ADMIN", "ANALYST", "VIEWER"]);

export const CreateUserSchema = z.object({
    body: z.object({
        email: z.email({ error: "Invalid email address" }),
        password: z.string({ error: "Password is required" })
            .min(6, { error: "Password must be at least 6 characters" })
            .max(100, { error: "Password must be at most 100 characters" }),
        role: roleEnum.optional(),
        isActive: z.boolean().optional(),
    }).openapi('CreateUserRequest')
});


export const UpdateUserSchema = z.object({
    body: z.object({
        role: roleEnum.optional(),
        isActive: z.boolean().optional(),
    }).openapi('UpdateUserRequest')
});


