import { beforeEach, describe, expect, it, vi } from 'vitest';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

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
const mockedBcrypt = bcryptjs as any;
const mockedJwt = jwt as any;

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
      role: 'VIEWER',
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
      role: 'VIEWER',
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    expect(mockedPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'test@example.com',
          role: 'VIEWER',
        }),
      })
    );
  });

  it('creates a user with the requested role', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);
    mockedPrisma.user.create.mockResolvedValue({
      id: 'user-2',
      email: 'analyst@example.com',
      role: 'ANALYST',
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    await AuthService.signupUser({
      email: 'analyst@example.com',
      password: 'password123',
      role: 'ANALYST',
    });

    expect(mockedPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: 'ANALYST' }),
      })
    );
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

  // Edge cases
  it('throws when signing up with empty email', async () => {
    await expect(AuthService.signupUser({ email: '', password: 'password123' })).rejects.toThrow(
      'Email and password are required'
    );
  });

  it('throws when signing up with null email', async () => {
    await expect(AuthService.signupUser({ email: null as any, password: 'password123' })).rejects.toThrow(
      'Email and password are required'
    );
  });

  it('throws when signing up with undefined password', async () => {
    await expect(AuthService.signupUser({ email: 'test@example.com', password: undefined as any })).rejects.toThrow(
      'Email and password are required'
    );
  });

  it('handles bcrypt hashing errors', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);
    mockedBcrypt.hash.mockRejectedValue(new Error('Hashing failed'));

    await expect(
      AuthService.signupUser({ email: 'test@example.com', password: 'password123' })
    ).rejects.toThrow('Hashing failed');
  });

  it('handles database creation errors', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);
    mockedBcrypt.hash.mockImplementation(async () => 'hashed-password');
    mockedPrisma.user.create.mockRejectedValue(new Error('Database connection failed'));

    await expect(
      AuthService.signupUser({ email: 'test@example.com', password: 'password123' })
    ).rejects.toThrow('Database connection failed');
  });

  it('throws when signing in with non-existent user', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);

    await expect(
      AuthService.signinUser({ email: 'nonexistent@example.com', password: 'password123' })
    ).rejects.toThrow('Invalid email or password');
  });

  it('throws when signing in with inactive user', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      password: 'hashed-password',
      role: 'USER',
      isActive: false,
    });

    await expect(
      AuthService.signinUser({ email: 'test@example.com', password: 'password123' })
    ).rejects.toThrow('Invalid email or password');
  });

  it('throws when password comparison fails', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      password: 'hashed-password',
      role: 'USER',
      isActive: true,
    });

    mockedBcrypt.compare.mockResolvedValue(false);

    await expect(
      AuthService.signinUser({ email: 'test@example.com', password: 'wrongpassword' })
    ).rejects.toThrow('Invalid email or password');
  });

  it('handles JWT signing errors', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      password: 'hashed-password',
      role: 'USER',
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    mockedBcrypt.compare.mockImplementation(async () => true);
    mockedJwt.sign.mockImplementation(() => {
      throw new Error('JWT signing failed');
    });

    await expect(
      AuthService.signinUser({ email: 'test@example.com', password: 'password123' })
    ).rejects.toThrow('JWT signing failed');
  });

  it('returns correct user data with different roles', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'admin@example.com',
      password: 'hashed-password',
      role: 'ADMIN',
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    mockedBcrypt.compare.mockImplementation(async () => true);
    mockedJwt.sign.mockImplementation(() => 'test-token');

    const result = await AuthService.signinUser({
      email: 'admin@example.com',
      password: 'password123',
    });

    expect(result.user.role).toBe('ADMIN');
  });
});
