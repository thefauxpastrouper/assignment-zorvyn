import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { authGuard } from '../middleware/auth.guard';

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
  },
}));

const mockedJwt = jwt as any;

describe('authGuard middleware', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: any;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  it('calls next() with valid token', () => {
    const validToken = 'Bearer valid.jwt.token';
    const decodedUser = { id: 'user-1', role: 'USER', isActive: true };

    mockReq.headers.authorization = validToken;
    mockedJwt.verify.mockReturnValue(decodedUser);

    authGuard(mockReq, mockRes, mockNext);

    expect(mockedJwt.verify).toHaveBeenCalledWith('valid.jwt.token', expect.any(String));
    expect(mockReq.user).toEqual(decodedUser);
    expect(mockNext).toHaveBeenCalled();
  });

  it('returns 401 when no authorization header', () => {
    authGuard(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'No token provided',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 401 when authorization header has no Bearer prefix', () => {
    mockReq.headers.authorization = 'invalid-token';

    authGuard(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'No token provided',
    });
  });

  it('returns 440 when token is expired', () => {
    const expiredToken = 'Bearer expired.jwt.token';
    mockReq.headers.authorization = expiredToken;

    const error = new Error('Token expired');
    (error as any).name = 'TokenExpiredError';
    mockedJwt.verify.mockImplementation(() => {
      throw error;
    });

    authGuard(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(440);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Session Expired',
      message: 'Invalid or Expired Token',
    });
  });

  it('returns 440 when token is invalid', () => {
    const invalidToken = 'Bearer invalid.jwt.token';
    mockReq.headers.authorization = invalidToken;

    mockedJwt.verify.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    authGuard(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(440);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Session Expired',
      message: 'Invalid or Expired Token',
    });
  });

  it('handles different user roles', () => {
    const adminToken = 'Bearer admin.jwt.token';
    const decodedAdmin = { id: 'admin-1', role: 'ADMIN', isActive: true };

    mockReq.headers.authorization = adminToken;
    mockedJwt.verify.mockReturnValue(decodedAdmin);

    authGuard(mockReq, mockRes, mockNext);

    expect(mockReq.user).toEqual(decodedAdmin);
    expect(mockReq.user.role).toBe('ADMIN');
  });

  it('handles inactive users', () => {
    const inactiveToken = 'Bearer inactive.jwt.token';
    const decodedInactive = { id: 'user-1', role: 'USER', isActive: false };

    mockReq.headers.authorization = inactiveToken;
    mockedJwt.verify.mockReturnValue(decodedInactive);

    authGuard(mockReq, mockRes, mockNext);

    expect(mockReq.user).toEqual(decodedInactive);
    expect(mockReq.user.isActive).toBe(false);
  });
});