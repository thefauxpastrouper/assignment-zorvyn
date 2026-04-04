import { describe, expect, it } from 'vitest';
import { ListRecordsQuerySchema } from '../validators/record.schema';

describe('ListRecordsQuerySchema', () => {
  it('applies defaults for page and limit', () => {
    const result = ListRecordsQuerySchema.parse({ query: {} });

    expect(result.query.page).toBe(1);
    expect(result.query.limit).toBe(10);
    expect(result.query.q).toBeUndefined();
  });

  it('accepts a query string search parameter', () => {
    const result = ListRecordsQuerySchema.parse({ query: { q: 'rent', category: 'utilities' } });

    expect(result.query.q).toBe('rent');
    expect(result.query.category).toBe('utilities');
  });
});
