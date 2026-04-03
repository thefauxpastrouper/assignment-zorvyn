import { z } from "zod";

export const SignupSchema = z.object({
    email: z.email({ error: "Invalid email address" }),
    password: z.string({ error: "Password is required" })
        .min(6, { error: "Password must be at least 6 characters" })
        .max(100, { error: "Password must be at most 100 characters" }),
});

export const SigninSchema = z.object({
    email: z.email({ error: "Invalid email address" }),
    password: z.string({ error: "Password is required" })
        .min(1, { error: "Password is required" }),
});
