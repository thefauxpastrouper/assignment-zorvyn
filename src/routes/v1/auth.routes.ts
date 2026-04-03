import { Router } from "express";
import * as AuthController from "controllers/auth.controller";
import { SigninSchema, SignupSchema } from "validators/auth.schema";
import { validate } from "middleware/validate.middleware";

const authRoutes = Router();

authRoutes.post('/signup', validate(SigninSchema),AuthController.signup);
authRoutes.post('/signin', validate(SignupSchema),AuthController.signin);

export default authRoutes;
