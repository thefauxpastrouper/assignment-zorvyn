import { z } from "zod";
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
extendZodWithOpenApi(z);

export const SignupSchema = z.object({
    body: z.object({
        email: z.email({ error: "Invalid email address" }).openapi({example: "aditya@gmail.com", description: "Email id of the user."}),
        password: z.string({ error: "Password is required" })
            .min(6, { error: "Password must be at least 6 characters" })
            .max(100, { error: "Password must be at most 100 characters" }).openapi({
                example: "random123",
                description: "Password of the user for this backend"
            }),
    }).openapi('SignupRequest')
});

export const SigninSchema = z.object({
    body: z.object({
        email: z.email({ error: "Invalid email address" }).openapi({example: "aditya@gmail.com", description: "Email id of the user."}),
        password: z.string({ error: "Password is required" })
            .min(1, { error: "Password is required" }).openapi({
                example: "random123",
                description: "Password of the user for this backend"
            }),
    }).openapi('SigninRequest')
});
