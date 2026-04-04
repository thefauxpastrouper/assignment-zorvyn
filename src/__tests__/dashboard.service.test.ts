import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../utils/db', () => ({
  prisma: {
    record: {
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

import { DashboardService } from '../services/dashboard.service';
import { prisma } from '../utils/db';

const mockedPrisma = prisma as any;

describe('DashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getFinancialSummary', () => {
    it('returns correct totals for income and expenses', async () => {
      mockedPrisma.record.groupBy.mockResolvedValue([
        { type: 'INCOME', _sum: { amount: 5000 } },
        { type: 'EXPENSE', _sum: { amount: 3000 } },
      ]);

      const result = await DashboardService.getFinancialSummary('user-1');

      expect(result).toEqual({
        totalIncome: 5000,
        totalExpenses: 3000,
        netBalance: 2000,
      });
    });

    it('returns zero values when no records exist', async () => {
      mockedPrisma.record.groupBy.mockResolvedValue([]);

      const result = await DashboardService.getFinancialSummary('user-1');

      expect(result).toEqual({
        totalIncome: 0,
        totalExpenses: 0,
        netBalance: 0,
      });
    });

    it('handles missing income or expense types', async () => {
      mockedPrisma.record.groupBy.mockResolvedValue([
        { type: 'EXPENSE', _sum: { amount: 1500 } },
      ]);

      const result = await DashboardService.getFinancialSummary('user-1');

      expect(result).toEqual({
        totalIncome: 0,
        totalExpenses: 1500,
        netBalance: -1500,
      });
    });
  });

  describe('getCategoryTotals', () => {
    it('returns category totals ordered by amount', async () => {
      const mockCategories = [
        { category: 'Salary', type: 'INCOME', _sum: { amount: 5000 } },
        { category: 'Rent', type: 'EXPENSE', _sum: { amount: 1500 } },
        { category: 'Food', type: 'EXPENSE', _sum: { amount: 800 } },
      ];
      mockedPrisma.record.groupBy.mockResolvedValue(mockCategories);

      const result = await DashboardService.getCategoryTotals('user-1');

      expect(result).toEqual([
        { category: 'Salary', type: 'INCOME', total: 5000 },
        { category: 'Rent', type: 'EXPENSE', total: 1500 },
        { category: 'Food', type: 'EXPENSE', total: 800 },
      ]);
    });

    it('returns empty array when no records exist', async () => {
      mockedPrisma.record.groupBy.mockResolvedValue([]);

      const result = await DashboardService.getCategoryTotals('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('getMonthlyTrends', () => {
    it('returns monthly trends with default 6 months', async () => {
      const mockTrends = [
        { month: '2026-04', income: 5000, expenses: 3000 },
        { month: '2026-03', income: 4500, expenses: 2800 },
      ];
      mockedPrisma.$queryRaw.mockResolvedValue(mockTrends);

      const result = await DashboardService.getMonthlyTrends('user-1');

      expect(mockedPrisma.$queryRaw).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT 6')
      );
      expect(result).toEqual(mockTrends);
    });

    it('returns monthly trends with custom months limit', async () => {
      const mockTrends = [{ month: '2026-04', income: 5000, expenses: 3000 }];
      mockedPrisma.$queryRaw.mockResolvedValue(mockTrends);

      const result = await DashboardService.getMonthlyTrends('user-1', 12);

      expect(mockedPrisma.$queryRaw).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT 12')
      );
      expect(result).toEqual(mockTrends);
    });
  });

  describe('getWeeklyTrends', () => {
    it('returns weekly trends with default 8 weeks', async () => {
      const mockTrends = [
        { week: '2026-04-01', income: 1200, expenses: 800 },
        { week: '2026-03-25', income: 1100, expenses: 750 },
      ];
      mockedPrisma.$queryRaw.mockResolvedValue(mockTrends);

      const result = await DashboardService.getWeeklyTrends('user-1');

      expect(mockedPrisma.$queryRaw).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT 8')
      );
      expect(result).toEqual(mockTrends);
    });

    it('returns weekly trends with custom weeks limit', async () => {
      mockedPrisma.$queryRaw.mockResolvedValue([]);

      await DashboardService.getWeeklyTrends('user-1', 4);

      expect(mockedPrisma.$queryRaw).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT 4')
      );
    });
  });

  describe('getRecentActivity', () => {
    it('returns recent records with default limit', async () => {
      const mockRecords = [
        { id: '1', amount: 100, type: 'EXPENSE', category: 'Food', date: new Date(), description: 'Lunch' },
        { id: '2', amount: 2000, type: 'INCOME', category: 'Salary', date: new Date(), description: 'Monthly salary' },
      ];
      mockedPrisma.record.findMany.mockResolvedValue(mockRecords);

      const result = await DashboardService.getRecentActivity('user-1');

      expect(result).toEqual(mockRecords);
      expect(mockedPrisma.record.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', deletedAt: null },
        orderBy: { date: 'desc' },
        take: 5,
        select: {
          id: true,
          amount: true,
          type: true,
          category: true,
          date: true,
          description: true,
        },
      });
    });

    it('returns recent records with custom limit', async () => {
      mockedPrisma.record.findMany.mockResolvedValue([]);

      await DashboardService.getRecentActivity('user-1', 10);

      expect(mockedPrisma.record.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 })
      );
    });
  });

  describe('getDashboardOverview', () => {
    it('returns complete dashboard overview', async () => {
      const mockSummary = { totalIncome: 5000, totalExpenses: 3000, netBalance: 2000 };
      const mockCategories = [{ category: 'Salary', type: 'INCOME', total: 5000 }];
      const mockMonthly = [{ month: '2026-04', income: 5000, expenses: 3000 }];
      const mockWeekly = [{ week: '2026-04-01', income: 1200, expenses: 800 }];
      const mockActivity = [{ id: '1', amount: 100, type: 'EXPENSE', category: 'Food', date: new Date() }];

      vi.spyOn(DashboardService, 'getFinancialSummary').mockResolvedValue(mockSummary);
      vi.spyOn(DashboardService, 'getCategoryTotals').mockResolvedValue(mockCategories);
      vi.spyOn(DashboardService, 'getMonthlyTrends').mockResolvedValue(mockMonthly);
      vi.spyOn(DashboardService, 'getWeeklyTrends').mockResolvedValue(mockWeekly);
      vi.spyOn(DashboardService, 'getRecentActivity').mockResolvedValue(mockActivity);

      const result = await DashboardService.getDashboardOverview('user-1');

      expect(result).toEqual({
        summary: mockSummary,
        categoryTotals: mockCategories,
        monthlyTrends: mockMonthly,
        weeklyTrends: mockWeekly,
        recentActivity: mockActivity,
      });
    });
  });
});