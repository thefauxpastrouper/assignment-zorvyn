import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/auth.service', () => ({
  AuthService: {
    signupUser: vi.fn(),
    signinUser: vi.fn(),
  },
}));

import * as AuthController from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';

const mockedAuthService = AuthService as any;

const createResponse = () => {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  return { status, json } as any;
};

describe('AuthController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signup', () => {
    it('signs up a user successfully', async () => {
      const expected = { id: 'user-1', email: 'test@example.com' };
      mockedAuthService.signupUser.mockResolvedValue(expected);

      const req = { body: { email: 'test@example.com', password: 'password123' } } as any;
      const res = createResponse();

      await AuthController.signup(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User signed up successfully',
        data: expected,
      });
    });

    it('returns 400 error when signup fails', async () => {
      mockedAuthService.signupUser.mockRejectedValue(new Error('Email already exists'));

      const req = { body: { email: 'existing@example.com', password: 'password123' } } as any;
      const res = createResponse();

      await AuthController.signup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Email already exists',
      });
    });
  });

  describe('signin', () => {
    it('signs in a user successfully', async () => {
      const expected = {
        user: { id: 'user-1', email: 'test@example.com' },
        token: 'jwt-token',
      };
      mockedAuthService.signinUser.mockResolvedValue(expected);

      const req = { body: { email: 'test@example.com', password: 'password123' } } as any;
      const res = createResponse();

      await AuthController.signin(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User signed in successfully',
        data: expected,
      });
    });

    it('returns 400 error when signin fails', async () => {
      mockedAuthService.signinUser.mockRejectedValue(new Error('Invalid credentials'));

      const req = { body: { email: 'test@example.com', password: 'wrongpassword' } } as any;
      const res = createResponse();

      await AuthController.signin(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid credentials',
      });
    });
  });
});