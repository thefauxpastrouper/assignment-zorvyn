import { Router } from "express";
import * as AuthController from "controllers/auth.controller";

const authRoutes = Router();

authRoutes.post('/signup', AuthController.signup);
authRoutes.post('/signin', AuthController.signin);

export default authRoutes;
