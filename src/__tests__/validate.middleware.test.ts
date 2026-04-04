import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { validate } from '../middleware/validate.middleware';

describe('validate middleware', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: any;

  beforeEach(() => {
    mockReq = {
      body: {},
      query: {},
      params: {},
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  it('calls next() when validation passes', async () => {
    const schema = z.object({
      body: z.object({
        name: z.string(),
        age: z.number(),
      }),
    });

    const middleware = validate(schema);
    mockReq.body = { name: 'John', age: 25 };

    await middleware(mockReq, mockRes, mockNext);

    expect(mockReq.body).toEqual({ name: 'John', age: 25 });
    expect(mockNext).toHaveBeenCalled();
  });

  it('properly assigns validated body, query, and params', async () => {
    const schema = z.object({
      body: z.object({
        title: z.string(),
      }),
      query: z.object({
        page: z.coerce.number(),
      }),
      params: z.object({
        id: z.string(),
      }),
    });

    const middleware = validate(schema);
    mockReq.body = { title: 'Test', extra: 'field' };
    mockReq.query = { page: '1', extra: 'param' };
    mockReq.params = { id: '123', extra: 'param' };

    await middleware(mockReq, mockRes, mockNext);

    expect(mockReq.body).toEqual({ title: 'Test' });
    expect(mockReq.query).toEqual({ page: 1 });
    expect(mockReq.params).toEqual({ id: '123' });
    expect(mockNext).toHaveBeenCalled();
  });

  it('returns 400 with validation errors', async () => {
    const schema = z.object({
      body: z.object({
        email: z.string().email(),
        age: z.number().min(18),
      }),
    });

    const middleware = validate(schema);
    mockReq.body = { email: 'invalid-email', age: 15 };

    await middleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'ValidationError',
      details: expect.arrayContaining([
        expect.objectContaining({
          location: 'body',
          field: 'email',
          message: expect.stringContaining('Invalid email'),
        }),
        expect.objectContaining({
          location: 'body',
          field: 'age',
          message: expect.stringContaining('Too small'),
        }),
      ]),
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('handles ZodError with multiple issues', async () => {
    const schema = z.object({
      body: z.object({
        name: z.string().min(2),
        email: z.string().email(),
      }),
      query: z.object({
        limit: z.coerce.number().max(100),
      }),
    });

    const middleware = validate(schema);
    mockReq.body = { name: 'A', email: 'invalid' };
    mockReq.query = { limit: 200 };

    await middleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'ValidationError',
      details: expect.arrayContaining([
        expect.objectContaining({ location: 'body', field: 'name' }),
        expect.objectContaining({ location: 'body', field: 'email' }),
        expect.objectContaining({ location: 'query', field: 'limit' }),
      ]),
    });
  });

  it('calls next with error when non-ZodError occurs', async () => {
    const schema = z.object({
      body: z.object({
        name: z.string(),
      }),
    });

    // Mock schema.parseAsync to throw a non-ZodError
    const originalParseAsync = schema.parseAsync.bind(schema);
    schema.parseAsync = vi.fn().mockImplementation(() => {
      throw new Error('Unexpected error');
    }) as any;

    const middleware = validate(schema);
    mockReq.body = { name: 'John' };

    await middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(new Error('Unexpected error'));
    expect(mockRes.status).not.toHaveBeenCalled();

    // Restore original parseAsync
    schema.parseAsync = originalParseAsync as any;
  });

  it('handles empty request objects', async () => {
    const schema = z.object({
      body: z.object({}).optional(),
      query: z.object({}).optional(),
      params: z.object({}).optional(),
    });

    const middleware = validate(schema);

    await middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('preserves undefined values when schema allows optional', async () => {
    const schema = z.object({
      body: z.object({
        name: z.string(),
        description: z.string().optional(),
      }),
    });

    const middleware = validate(schema);
    mockReq.body = { name: 'Test' };

    await middleware(mockReq, mockRes, mockNext);

    expect(mockReq.body).toEqual({ name: 'Test' });
    expect(mockNext).toHaveBeenCalled();
  });
});