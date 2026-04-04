import { beforeEach, describe, expect, it, vi } from 'vitest';
import { rateLimiter } from '../middleware/rateLimit.middleware';

describe('rateLimiter middleware', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: any;

  beforeEach(() => {
    mockReq = {
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
    };
    mockRes = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();
    vi.clearAllMocks();

    // Clear rate limit store before each test
    (global as any).rateLimitStore?.clear();
  });

  it('allows request within rate limit', () => {
    rateLimiter(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it('blocks request exceeding rate limit', () => {
    // Mock environment variables
    process.env.RATE_LIMIT_MAX_REQUESTS = '2';
    process.env.RATE_LIMIT_WINDOW_MS = '1000';

    // First request
    rateLimiter(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);

    // Second request
    mockNext.mockClear();
    rateLimiter(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);

    // Third request should be blocked
    mockNext.mockClear();
    rateLimiter(mockReq, mockRes, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'TooManyRequests',
      message: expect.stringContaining('Rate limit exceeded'),
    });
    expect(mockRes.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(String));
  });

  it('uses default values when env vars not set', () => {
    delete process.env.RATE_LIMIT_MAX_REQUESTS;
    delete process.env.RATE_LIMIT_WINDOW_MS;

    // Should allow up to 100 requests in 60 seconds by default
    for (let i = 0; i < 100; i++) {
      rateLimiter(mockReq, mockRes, mockNext);
    }

    expect(mockNext).toHaveBeenCalledTimes(100);

    // 101st request should be blocked
    rateLimiter(mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(429);
  });

  it('handles different client IPs separately', () => {
    const req1 = { ...mockReq, ip: '192.168.1.1' };
    const req2 = { ...mockReq, ip: '192.168.1.2' };

    process.env.RATE_LIMIT_MAX_REQUESTS = '1';

    // First IP can make request
    rateLimiter(req1, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);

    // Second IP can also make request
    mockNext.mockClear();
    rateLimiter(req2, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('uses socket remoteAddress when ip is not available', () => {
    const reqWithoutIp = {
      socket: { remoteAddress: '10.0.0.1' },
    };

    rateLimiter(reqWithoutIp as any, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('uses "unknown" when neither ip nor remoteAddress available', () => {
    const reqUnknown = {};

    rateLimiter(reqUnknown as any, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('calculates retry-after header correctly', () => {
    process.env.RATE_LIMIT_MAX_REQUESTS = '1';
    process.env.RATE_LIMIT_WINDOW_MS = '5000'; // 5 seconds

    // First request
    rateLimiter(mockReq, mockRes, mockNext);

    // Second request (should be blocked)
    rateLimiter(mockReq, mockRes, mockNext);

    expect(mockRes.setHeader).toHaveBeenCalledWith('Retry-After', expect.stringMatching(/^[0-9]+$/));
    const retryAfter = parseInt(mockRes.setHeader.mock.calls[0][1]);
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(5);
  });

  it('resets counter after window expires', () => {
    process.env.RATE_LIMIT_MAX_REQUESTS = '1';
    process.env.RATE_LIMIT_WINDOW_MS = '100'; // Very short window

    // First request
    rateLimiter(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);

    // Wait for window to expire
    return new Promise((resolve) => {
      setTimeout(() => {
        // Second request should be allowed again
        mockNext.mockClear();
        rateLimiter(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalledTimes(1);
        resolve(void 0);
      }, 150);
    });
  });
});