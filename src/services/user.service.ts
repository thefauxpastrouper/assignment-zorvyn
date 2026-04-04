import { prisma } from '../utils/db';
import bcrypt from 'bcryptjs';
import { Role } from './prisma/generated/prisma/enums';

export class UserService {
    static async createUser(data: any) {
        const { email, password, role, isActive } = data;

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
                role: role || Role.VIEWER,
                isActive: isActive !== undefined ? isActive : true,
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

    static async listUsers() {
        return prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
            }
        });
    }

    static async updateUser(id: string, data: any) {
        const { role, isActive } = data;
        const updateData: any = {};
        if (role) updateData.role = role;
        if (isActive !== undefined) updateData.isActive = isActive;

        return prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
            }
        });
    }
}
