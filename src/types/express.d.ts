import { Role } from "../services/prisma/generated/prisma/enums";

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                role: Role;
                isActive: boolean;
            };
        }
    }
}

export { };