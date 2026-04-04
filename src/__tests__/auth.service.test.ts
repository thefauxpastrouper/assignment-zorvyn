import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../utils/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(async () => 'hashed-password'),
    compare: vi.fn(async (password: string, hash: string) => password === 'password123' && hash === 'hashed-password'),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(() => 'test-token'),
  },
}));

import { AuthService } from '../services/auth.service';
import { prisma } from '../utils/db';

const mockedPrisma = prisma as any;

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when email or password is missing during signup', async () => {
    await expect(AuthService.signupUser({ email: '', password: '' })).rejects.toThrow(
      'Email and password are required'
    );
  });

  it('throws when a user already exists', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });

    await expect(
      AuthService.signupUser({ email: 'test@example.com', password: 'password123' })
    ).rejects.toThrow('User with this email already exists');
  });

  it('creates a user successfully', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);
    mockedPrisma.user.create.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      role: 'USER',
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const result = await AuthService.signupUser({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result).toEqual({
      id: 'user-1',
      email: 'test@example.com',
      role: 'USER',
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    expect(mockedPrisma.user.create).toHaveBeenCalled();
  });

  it('throws on signin with invalid credentials', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      password: 'wrong-hash',
      role: 'USER',
      isActive: true,
    });

    await expect(
      AuthService.signinUser({ email: 'test@example.com', password: 'password123' })
    ).rejects.toThrow('Invalid email or password');
  });

  it('returns a signed token and user object on successful signin', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      password: 'hashed-password',
      role: 'USER',
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const result = await AuthService.signinUser({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result).toEqual({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        role: 'USER',
        isActive: true,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      token: 'test-token',
    });
  });
});
