import { Router } from "express";
import recordRoutes from "./record.routes";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import dashboardRoutes from "./dashboard.routes";

const v1Router = Router();

v1Router.use('/auth', authRoutes);
v1Router.use('/users', userRoutes);
v1Router.use('/records', recordRoutes);
v1Router.use('/dashboard', dashboardRoutes);

export default v1Router;