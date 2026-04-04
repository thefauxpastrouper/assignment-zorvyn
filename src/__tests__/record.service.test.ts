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
});
