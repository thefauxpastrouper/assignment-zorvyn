import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../utils/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  __esModule: true,
  default: {
    hash: vi.fn(async () => 'hashed-password'),
  },
}));

import { UserService } from '../services/user.service';
import { prisma } from '../utils/db';

const mockedPrisma = prisma as any;

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createUser', () => {
    it('throws when email or password is missing', async () => {
      await expect(UserService.createUser({})).rejects.toThrow(
        'Email and password are required'
      );
      await expect(UserService.createUser({ email: '' })).rejects.toThrow(
        'Email and password are required'
      );
      await expect(UserService.createUser({ password: '' })).rejects.toThrow(
        'Email and password are required'
      );
    });

    it('throws when a user already exists', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        UserService.createUser({ email: 'test@example.com', password: 'password123' })
      ).rejects.toThrow('User with this email already exists');
    });

    it('creates a user successfully with default values', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);
      mockedPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        role: 'VIEWER',
        isActive: true,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      });

      const result = await UserService.createUser({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        role: 'VIEWER',
        isActive: true,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      });
      expect(mockedPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'test@example.com',
            password: 'hashed-password',
            role: 'VIEWER',
            isActive: true,
          }),
        })
      );
    });

    it('creates a user with custom role and isActive', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);
      mockedPrisma.user.create.mockResolvedValue({
        id: 'user-2',
        email: 'admin@example.com',
        role: 'ADMIN',
        isActive: false,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      });

      const result = await UserService.createUser({
        email: 'admin@example.com',
        password: 'password123',
        role: 'ADMIN',
        isActive: false,
      });

      expect(result.role).toBe('ADMIN');
      expect(result.isActive).toBe(false);
    });
  });

  describe('listUsers', () => {
    it('returns all users with selected fields', async () => {
      const mockUsers = [
        { id: '1', email: 'user1@example.com', role: 'VIEWER', isActive: true, createdAt: new Date() },
        { id: '2', email: 'user2@example.com', role: 'ADMIN', isActive: false, createdAt: new Date() },
      ];
      mockedPrisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await UserService.listUsers();

      expect(result).toEqual(mockUsers);
      expect(mockedPrisma.user.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });
    });

    it('returns empty array when no users exist', async () => {
      mockedPrisma.user.findMany.mockResolvedValue([]);

      const result = await UserService.listUsers();

      expect(result).toEqual([]);
    });
  });

  describe('updateUser', () => {
    it('updates user role successfully', async () => {
      const mockUpdatedUser = {
        id: 'user-1',
        email: 'test@example.com',
        role: 'ADMIN',
        isActive: true,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      };
      mockedPrisma.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await UserService.updateUser('user-1', { role: 'ADMIN' });

      expect(result).toEqual(mockUpdatedUser);
      expect(mockedPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { role: 'ADMIN' },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });
    });

    it('updates user isActive status', async () => {
      mockedPrisma.user.update.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        role: 'VIEWER',
        isActive: false,
        createdAt: new Date(),
      });

      const result = await UserService.updateUser('user-1', { isActive: false });

      expect(result.isActive).toBe(false);
    });

    it('updates both role and isActive', async () => {
      mockedPrisma.user.update.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        role: 'ANALYST',
        isActive: true,
        createdAt: new Date(),
      });

      const result = await UserService.updateUser('user-1', { role: 'ANALYST', isActive: true });

      expect(result.role).toBe('ANALYST');
      expect(result.isActive).toBe(true);
    });

    it('throws when user update fails', async () => {
      mockedPrisma.user.update.mockRejectedValue(new Error('User not found'));

      await expect(UserService.updateUser('nonexistent', { role: 'ADMIN' })).rejects.toThrow('User not found');
    });
  });
});