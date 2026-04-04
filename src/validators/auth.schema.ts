import { z } from "zod";
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
extendZodWithOpenApi(z);

const signupRoleEnum = z.enum(["ADMIN", "ANALYST", "VIEWER"]);

export const SignupSchema = z.object({
    body: z.object({
        email: z.email({ error: "Invalid email address" }).openapi({example: "adityakumar@gmail.com", description: "Email id of the user"}),
        password: z.string({ error: "Password is required" })
            .min(6, { error: "Password must be at least 6 characters" })
            .max(100, { error: "Password must be at most 100 characters" }).openapi({
                example: "random123",
                description: "Password of the user for this backend"
            }),
        role: signupRoleEnum
            .optional()
            .default("VIEWER")
            .openapi({
                example: "VIEWER",
                description: "Role for the new account (defaults to VIEWER if omitted)",
            }),
    }).openapi("SignupRequest", {
        example: {
            email: "adityakumar@gmail.com",
            password: "random123",
            role: "ANALYST",
        },
    })
});

export const SigninSchema = z.object({
    body: z.object({
        email: z.email({ error: "Invalid email address" }).openapi({example: "adityakumar@gmail.com", description: "Email id of the user"}),
        password: z.string({ error: "Password is required" })
            .min(1, { error: "Password is required" }).openapi({
                example: "random123",
                description: "Password of the user for this backend"
            }),
    }).openapi('SigninRequest')
});
