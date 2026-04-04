import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/user.service', () => ({
  UserService: {
    createUser: vi.fn(),
    listUsers: vi.fn(),
    updateUser: vi.fn(),
  },
}));

import * as UserController from '../controllers/user.controller';
import { UserService } from '../services/user.service';

const mockedUserService = UserService as any;

const createResponse = () => {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  return { status, json } as any;
};

describe('UserController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createUser', () => {
    it('creates a user and returns success response', async () => {
      const expected = { id: 'user-1', email: 'test@example.com' };
      mockedUserService.createUser.mockResolvedValue(expected);

      const req = { body: { email: 'test@example.com', password: 'password123' } } as any;
      const res = createResponse();

      await UserController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User created successfully',
        data: expected,
      });
    });

    it('returns a 400 error response when createUser throws', async () => {
      mockedUserService.createUser.mockRejectedValue(new Error('Email already exists'));

      const req = { body: { email: 'existing@example.com', password: 'password123' } } as any;
      const res = createResponse();

      await UserController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Email already exists',
      });
    });
  });

  describe('listUsers', () => {
    it('lists users successfully', async () => {
      const expected = [
        { id: '1', email: 'user1@example.com' },
        { id: '2', email: 'user2@example.com' },
      ];
      mockedUserService.listUsers.mockResolvedValue(expected);

      const req = {} as any;
      const res = createResponse();

      await UserController.listUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data: expected,
      });
    });

    it('returns 400 error when listUsers throws', async () => {
      mockedUserService.listUsers.mockRejectedValue(new Error('Database error'));

      const req = {} as any;
      const res = createResponse();

      await UserController.listUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Database error',
      });
    });
  });

  describe('updateUser', () => {
    it('updates a user successfully', async () => {
      const expected = { id: 'user-1', email: 'test@example.com', role: 'ADMIN' };
      mockedUserService.updateUser.mockResolvedValue(expected);

      const req = { params: { id: 'user-1' }, body: { role: 'ADMIN' } } as any;
      const res = createResponse();

      await UserController.updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User updated successfully',
        data: expected,
      });
    });

    it('returns 400 error when updateUser throws', async () => {
      mockedUserService.updateUser.mockRejectedValue(new Error('User not found'));

      const req = { params: { id: 'nonexistent' }, body: { role: 'ADMIN' } } as any;
      const res = createResponse();

      await UserController.updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found',
      });
    });
  });
});