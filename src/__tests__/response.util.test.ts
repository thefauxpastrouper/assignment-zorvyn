import { describe, expect, it, vi } from 'vitest';
import { errorResponse, successResponse } from '../utils/response';

describe('response utils', () => {
  it('returns a success response payload', () => {
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res = { status } as any;

    successResponse(res, { id: 1 }, 'Created');

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      success: true,
      message: 'Created',
      data: { id: 1 },
    });
  });

  it('returns an error response payload', () => {
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res = { status } as any;

    errorResponse(res, 'Bad request', 400);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: 'Bad request',
    });
  });
});
