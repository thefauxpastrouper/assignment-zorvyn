import { Router } from "express";
import { authGuard } from "middleware/auth.guard";
import { statusGuard } from "middleware/status.guard";
import { roleGuard } from "middleware/role.guard";
import { Role } from "@prisma/client";
import * as UserController from "controllers/user.controller";
import { CreateUserSchema, UpdateUserSchema } from "validators/user.schema";
import { validate } from "middleware/validate.middleware";

const userRoutes = Router();

userRoutes.use(authGuard, statusGuard);

userRoutes.post('/', roleGuard([Role.ADMIN]), validate(CreateUserSchema), UserController.createUser);
userRoutes.get('/', roleGuard([Role.ADMIN]), UserController.listUsers);
userRoutes.patch('/:id', roleGuard([Role.ADMIN]), validate(UpdateUserSchema), UserController.updateUser);

export default userRoutes;
