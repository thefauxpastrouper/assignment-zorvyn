import { Router } from "express";
import * as AuthController from "controllers/auth.controller";
import { SigninSchema, SignupSchema } from "validators/auth.schema";
import { validate } from "middleware/validate.middleware";

const authRoutes = Router();

authRoutes.post('/signup', validate(SignupSchema), AuthController.signup);
authRoutes.post('/signin', validate(SigninSchema), AuthController.signin);


export default authRoutes;
