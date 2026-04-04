import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../utils/db', () => ({
  prisma: {
    record: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { RecordService } from '../services/record.service';
import { prisma } from '../utils/db';

const mockedPrisma = prisma as any;

describe('RecordService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when creating a record with a non-positive amount', async () => {
    await expect(RecordService.createRecord('user-1', { amount: 0 })).rejects.toThrow(
      'Amount must be positive'
    );
  });

  it('creates a record successfully', async () => {
    const mockRecord = { id: 'rec-1', amount: 100, category: 'Rent', type: 'EXPENSE' };
    mockedPrisma.record.create.mockResolvedValue(mockRecord);

    const result = await RecordService.createRecord('user-1', {
      amount: 100,
      type: 'EXPENSE',
      category: 'Rent',
    });

    expect(result).toBe(mockRecord);
    expect(mockedPrisma.record.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          amount: 100,
          category: 'Rent',
          type: 'EXPENSE',
        }),
      })
    );
  });

  it('returns a record by id when found', async () => {
    const mockRecord = { id: 'rec-1', amount: 100, category: 'Rent' };
    mockedPrisma.record.findFirst.mockResolvedValue(mockRecord);

    const result = await RecordService.getRecordById('rec-1');

    expect(result).toBe(mockRecord);
    expect(mockedPrisma.record.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'rec-1', deletedAt: null },
      })
    );
  });

  it('throws when requested record does not exist', async () => {
    mockedPrisma.record.findFirst.mockResolvedValue(null);

    await expect(RecordService.getRecordById('rec-missing')).rejects.toThrow('Record not found');
  });

  it('applies pagination, search, and date filters when listing records', async () => {
    const records = [{ id: 'rec-1', category: 'Utilities', description: 'Monthly rent' }];
    mockedPrisma.record.findMany.mockResolvedValue(records);
    mockedPrisma.record.count.mockResolvedValue(1);

    const result = await RecordService.getRecords('user-1', {
      page: 2,
      limit: 5,
      q: 'rent',
      type: 'EXPENSE',
      category: 'Utilities',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    });

    expect(result).toEqual({
      records,
      pagination: {
        total: 1,
        page: 2,
        limit: 5,
        totalPages: 1,
      },
    });

    expect(mockedPrisma.record.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 5,
        skip: 5,
        orderBy: { date: 'desc' },
        where: expect.objectContaining({
          userId: 'user-1',
          deletedAt: null,
          type: 'EXPENSE',
          category: 'Utilities',
          AND: [
            expect.objectContaining({
              OR: expect.arrayContaining([
                expect.objectContaining({
                  category: expect.objectContaining({ contains: 'rent', mode: 'insensitive' }),
                }),
                expect.objectContaining({
                  description: expect.objectContaining({ contains: 'rent', mode: 'insensitive' }),
                }),
              ]),
            }),
          ],
          date: {
            gte: new Date('2026-01-01'),
            lte: new Date('2026-01-31'),
          },
        }),
      })
    );
  });

  it('soft deletes a record via update', async () => {
    const mockUpdated = { id: 'rec-1', deletedAt: new Date() };
    mockedPrisma.record.update.mockResolvedValue(mockUpdated);

    const result = await RecordService.deleteRecord('rec-1');

    expect(result).toBe(mockUpdated);
    expect(mockedPrisma.record.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'rec-1' },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      })
    );
  });

  it('updates a record successfully', async () => {
    const mockUpdated = { id: 'rec-1', category: 'Travel' };
    mockedPrisma.record.update.mockResolvedValue(mockUpdated);

    const result = await RecordService.updateRecord('rec-1', { category: 'Travel' });

    expect(result).toBe(mockUpdated);
    expect(mockedPrisma.record.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'rec-1' },
        data: { category: 'Travel' },
      })
    );
  });

  // Edge cases
  it('throws when creating a record with negative amount', async () => {
    await expect(RecordService.createRecord('user-1', { amount: -100 })).rejects.toThrow(
      'Amount must be positive'
    );
  });

  it('throws when creating a record with non-numeric amount', async () => {
    await expect(RecordService.createRecord('user-1', { amount: '100' as any })).rejects.toThrow(
      'Amount must be positive'
    );
  });

  it('throws when creating a record with missing required fields', async () => {
    await expect(RecordService.createRecord('user-1', { amount: 100 })).rejects.toThrow();
  });

  it('handles very large amounts', async () => {
    const mockRecord = { id: 'rec-1', amount: 999999999, category: 'Investment', type: 'INCOME' };
    mockedPrisma.record.create.mockResolvedValue(mockRecord);

    const result = await RecordService.createRecord('user-1', {
      amount: 999999999,
      type: 'INCOME',
      category: 'Investment',
    });

    expect(result.amount).toBe(999999999);
  });

  it('handles decimal amounts', async () => {
    const mockRecord = { id: 'rec-1', amount: 99.99, category: 'Food', type: 'EXPENSE' };
    mockedPrisma.record.create.mockResolvedValue(mockRecord);

    const result = await RecordService.createRecord('user-1', {
      amount: 99.99,
      type: 'EXPENSE',
      category: 'Food',
    });

    expect(result.amount).toBe(99.99);
  });

  it('throws when getting record by invalid id', async () => {
    mockedPrisma.record.findFirst.mockResolvedValue(null);

    await expect(RecordService.getRecordById('')).rejects.toThrow('Record not found');
  });

  it('filters records by type only', async () => {
    const records = [{ id: 'rec-1', category: 'Salary', description: 'Monthly' }];
    mockedPrisma.record.findMany.mockResolvedValue(records);
    mockedPrisma.record.count.mockResolvedValue(1);

    const result = await RecordService.getRecords('user-1', { type: 'INCOME' });

    expect(mockedPrisma.record.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: 'INCOME',
        }),
      })
    );
  });

  it('filters records by category only', async () => {
    const records = [{ id: 'rec-1', category: 'Utilities', description: 'Electricity' }];
    mockedPrisma.record.findMany.mockResolvedValue(records);
    mockedPrisma.record.count.mockResolvedValue(1);

    const result = await RecordService.getRecords('user-1', { category: 'Utilities' });

    expect(mockedPrisma.record.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          category: 'Utilities',
        }),
      })
    );
  });

  it('handles search query with special characters', async () => {
    const records = [{ id: 'rec-1', category: 'Food & Dining', description: 'Restaurant' }];
    mockedPrisma.record.findMany.mockResolvedValue(records);
    mockedPrisma.record.count.mockResolvedValue(1);

    const result = await RecordService.getRecords('user-1', { q: 'Food & Dining' });

    expect(mockedPrisma.record.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: [
            {
              OR: expect.arrayContaining([
                expect.objectContaining({
                  category: expect.objectContaining({ contains: 'Food & Dining', mode: 'insensitive' }),
                }),
              ]),
            },
          ],
        }),
      })
    );
  });

  it('handles empty search query', async () => {
    const records = [{ id: 'rec-1', category: 'Salary' }];
    mockedPrisma.record.findMany.mockResolvedValue(records);
    mockedPrisma.record.count.mockResolvedValue(1);

    const result = await RecordService.getRecords('user-1', { q: '' });

    expect(mockedPrisma.record.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({
          AND: expect.any(Array),
        }),
      })
    );
  });

  it('applies date range filtering with start date only', async () => {
    mockedPrisma.record.findMany.mockResolvedValue([]);
    mockedPrisma.record.count.mockResolvedValue(0);

    await RecordService.getRecords('user-1', { startDate: '2026-01-01' });

    expect(mockedPrisma.record.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          date: {
            gte: new Date('2026-01-01'),
          },
        }),
      })
    );
  });

  it('applies date range filtering with end date only', async () => {
    mockedPrisma.record.findMany.mockResolvedValue([]);
    mockedPrisma.record.count.mockResolvedValue(0);

    await RecordService.getRecords('user-1', { endDate: '2026-12-31' });

    expect(mockedPrisma.record.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          date: {
            lte: new Date('2026-12-31'),
          },
        }),
      })
    );
  });

  it('throws when updating non-existent record', async () => {
    mockedPrisma.record.update.mockRejectedValue(new Error('Record not found'));

    await expect(RecordService.updateRecord('nonexistent', { category: 'New Category' })).rejects.toThrow('Record not found');
  });

  it('allows updating with empty data object', async () => {
    const mockUpdated = { id: 'rec-1', category: 'Original' };
    mockedPrisma.record.update.mockResolvedValue(mockUpdated);

    const result = await RecordService.updateRecord('rec-1', {});

    expect(result).toBe(mockUpdated);
    expect(mockedPrisma.record.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'rec-1' },
        data: {},
      })
    );
  });

  it('handles soft delete of already deleted record', async () => {
    mockedPrisma.record.update.mockRejectedValue(new Error('Record not found'));

    await expect(RecordService.deleteRecord('already-deleted')).rejects.toThrow('Record not found');
  });
});
