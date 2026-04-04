import { type Request, type Response } from 'express';
import { UserService } from '../services/user.service';
import { successResponse } from '../utils/response';
import { respondWithError } from '../utils/clientError';

export const createUser = async (req: Request, res: Response) => {
    try {
        const { email, password, role, isActive } = req.body;
        const user = await UserService.createUser({ email, password, role, isActive });
        return successResponse(res, user, 'User created successfully');
    } catch (error: unknown) {
        return respondWithError(res, error, { context: 'users.create' });
    }
};

export const listUsers = async (req: Request, res: Response) => {
    try {
        const users = await UserService.listUsers();
        return successResponse(res, users);
    } catch (error: unknown) {
        return respondWithError(res, error, { context: 'users.list' });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { role, isActive } = req.body;
        const user = await UserService.updateUser(id, { role, isActive });
        return successResponse(res, user, 'User updated successfully');
    } catch (error: unknown) {
        return respondWithError(res, error, { context: 'users.update' });
    }
};
