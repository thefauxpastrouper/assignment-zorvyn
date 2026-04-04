import { type Request, type Response } from 'express';
import { AuthService } from "../services/auth.service";
import { successResponse } from 'utils/response';
import { respondWithError } from 'utils/clientError';

export const signup = async (req: Request, res: Response) => {
    try {
        let { email, password } = req.body;
        let user = await AuthService.signupUser({ email, password });
        return successResponse(res, user, "User signed up successfully");

    } catch (error: unknown) {
        return respondWithError(res, error, { context: "auth.signup" });
    }
};

export const signin = async (req: Request, res: Response) => {
    try {
        let { email, password } = req.body;
        let data = await AuthService.signinUser({ email, password });
        return successResponse(res, data, "User signed in successfully");
    } catch (error: unknown) {
        return respondWithError(res, error, { context: "auth.signin" });
    }
};
