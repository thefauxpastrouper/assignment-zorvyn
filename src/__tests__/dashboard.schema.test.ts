import { describe, expect, it } from 'vitest';
import { DashboardQuerySchema } from '../validators/dashboard.schema';

describe('DashboardQuerySchema', () => {
  it('applies default values for all optional fields', () => {
    const result = DashboardQuerySchema.parse({ query: {} });

    expect(result.query.months).toBe(6);
    expect(result.query.weeks).toBe(4);
    expect(result.query.limit).toBe(5);
  });

  it('accepts valid custom values', () => {
    const result = DashboardQuerySchema.parse({
      query: {
        months: 12,
        weeks: 8,
        limit: 10,
      },
    });

    expect(result.query.months).toBe(12);
    expect(result.query.weeks).toBe(8);
    expect(result.query.limit).toBe(10);
  });

  it('coerces string numbers to numbers', () => {
    const result = DashboardQuerySchema.parse({
      query: {
        months: '12',
        weeks: '8',
        limit: '10',
      },
    });

    expect(result.query.months).toBe(12);
    expect(result.query.weeks).toBe(8);
    expect(result.query.limit).toBe(10);
  });

  it('rejects months less than 1', () => {
    expect(() => {
      DashboardQuerySchema.parse({
        query: { months: 0 },
      });
    }).toThrow('Minimum 1 month');
  });

  it('rejects months greater than 24', () => {
    expect(() => {
      DashboardQuerySchema.parse({
        query: { months: 25 },
      });
    }).toThrow('Maximum 24 months');
  });

  it('rejects weeks less than 1', () => {
    expect(() => {
      DashboardQuerySchema.parse({
        query: { weeks: 0 },
      });
    }).toThrow('Minimum 1 week');
  });

  it('rejects weeks greater than 52', () => {
    expect(() => {
      DashboardQuerySchema.parse({
        query: { weeks: 53 },
      });
    }).toThrow('Maximum 52 weeks');
  });

  it('rejects limit less than 1', () => {
    expect(() => {
      DashboardQuerySchema.parse({
        query: { limit: 0 },
      });
    }).toThrow();
  });

  it('rejects limit greater than 50', () => {
    expect(() => {
      DashboardQuerySchema.parse({
        query: { limit: 51 },
      });
    }).toThrow('Limit cannot exceed 50');
  });
});