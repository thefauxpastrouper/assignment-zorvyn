import { prisma } from '../utils/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role, type Role as RoleValue } from './prisma/generated/prisma/enums';

export class AuthService {
    static async signupUser(data: { email: string; password: string; role?: RoleValue }) {
        const { email, password, role: requestedRole } = data;
        const role = requestedRole ?? Role.VIEWER;

        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new Error('User with this email already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role,
            },
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
            }
        });

        return user;
    }

    static async signinUser(data: any) {
        const { email, password } = data;

        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user || !user.isActive || !(await bcrypt.compare(password, user.password))) {
            throw new Error('Invalid email or password');
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, isActive: user.isActive },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '1d' }
        );

        const { password: _, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword,
            token
        };
    }
}