import { z } from "zod";
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
extendZodWithOpenApi(z);


const roleEnum = z.enum(["ADMIN", "ANALYST", "VIEWER"]);

export const CreateUserSchema = z.object({
    body: z.object({
        email: z.email({ error: "Invalid email address" }).openapi({example: "adityakumar@gmail.com", description: "Email id of the user"}),
        password: z.string({ error: "Password is required" })
            .min(6, { error: "Password must be at least 6 characters" })
            .max(100, { error: "Password must be at most 100 characters" }).openapi({example: "random123", description: "Password of the user"}),
        role: roleEnum.optional().openapi({example: "ADMIN", description: "Role that is to be assigned to the user"}),
        isActive: z.boolean().optional().openapi({example: "true", description: "Provides soft delete functionality to admin"}),
    }).openapi('CreateUserRequest')
});


export const UpdateUserSchema = z.object({
    body: z.object({
        role: roleEnum.optional().openapi({example: "ADMIN", description: "Role that is to be assigned to the user"}),
        isActive: z.boolean().optional().openapi({example: "true", description: "Provides soft delete functionality to admin"}),
    }).openapi('UpdateUserRequest')
});


