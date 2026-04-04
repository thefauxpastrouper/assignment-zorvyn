import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/dashboard.service', () => ({
  DashboardService: {
    getDashboardOverview: vi.fn(),
    getFinancialSummary: vi.fn(),
    getCategoryTotals: vi.fn(),
    getMonthlyTrends: vi.fn(),
    getWeeklyTrends: vi.fn(),
  },
}));

import * as DashboardController from '../controllers/dashboard.controller';
import { DashboardService } from '../services/dashboard.service';

const mockedDashboardService = DashboardService as any;

const createResponse = () => {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  return { status, json } as any;
};

describe('DashboardController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDashboardOverview', () => {
    it('returns dashboard overview successfully', async () => {
      const expected = {
        summary: { totalIncome: 5000, totalExpenses: 3000, netBalance: 2000 },
        categoryTotals: [],
        monthlyTrends: [],
        weeklyTrends: [],
        recentActivity: [],
      };
      mockedDashboardService.getDashboardOverview.mockResolvedValue(expected);

      const req = { user: { id: 'user-1' } } as any;
      const res = createResponse();

      await DashboardController.getDashboardOverview(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Dashboard overview fetched successfully',
        data: expected,
      });
    });

    it('returns 400 error when service throws', async () => {
      mockedDashboardService.getDashboardOverview.mockRejectedValue(new Error('Database error'));

      const req = { user: { id: 'user-1' } } as any;
      const res = createResponse();

      await DashboardController.getDashboardOverview(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Database error',
      });
    });
  });

  describe('getFinancialSummary', () => {
    it('returns financial summary successfully', async () => {
      const expected = { totalIncome: 5000, totalExpenses: 3000, netBalance: 2000 };
      mockedDashboardService.getFinancialSummary.mockResolvedValue(expected);

      const req = { user: { id: 'user-1' } } as any;
      const res = createResponse();

      await DashboardController.getFinancialSummary(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Summary fetched successfully',
        data: expected,
      });
    });
  });

  describe('getCategoryTotals', () => {
    it('returns category totals successfully', async () => {
      const expected = [
        { category: 'Salary', type: 'INCOME', total: 5000 },
        { category: 'Rent', type: 'EXPENSE', total: 1500 },
      ];
      mockedDashboardService.getCategoryTotals.mockResolvedValue(expected);

      const req = { user: { id: 'user-1' } } as any;
      const res = createResponse();

      await DashboardController.getCategoryTotals(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Categories fetched successfully',
        data: expected,
      });
    });
  });

  describe('getMonthlyTrends', () => {
    it('returns monthly trends with default parameters', async () => {
      const expected = [{ month: '2026-04', income: 5000, expenses: 3000 }];
      mockedDashboardService.getMonthlyTrends.mockResolvedValue(expected);

      const req = { user: { id: 'user-1' }, query: {} } as any;
      const res = createResponse();

      await DashboardController.getMonthlyTrends(req, res);

      expect(mockedDashboardService.getMonthlyTrends).toHaveBeenCalledWith('user-1', undefined);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Monthly trends fetched successfully',
        data: expected,
      });
    });

    it('returns monthly trends with custom months parameter', async () => {
      mockedDashboardService.getMonthlyTrends.mockResolvedValue([]);

      const req = { user: { id: 'user-1' }, query: { months: '12' } } as any;
      const res = createResponse();

      await DashboardController.getMonthlyTrends(req, res);

      expect(mockedDashboardService.getMonthlyTrends).toHaveBeenCalledWith('user-1', 12);
    });

    it('handles invalid months parameter gracefully', async () => {
      mockedDashboardService.getMonthlyTrends.mockResolvedValue([]);

      const req = { user: { id: 'user-1' }, query: { months: 'invalid' } } as any;
      const res = createResponse();

      await DashboardController.getMonthlyTrends(req, res);

      // parseInt('invalid', 10) returns NaN, which should be passed as undefined
      expect(mockedDashboardService.getMonthlyTrends).toHaveBeenCalledWith('user-1', NaN);
    });
  });

  describe('getWeeklyTrends', () => {
    it('returns weekly trends with default parameters', async () => {
      const expected = [{ week: '2026-04-01', income: 1200, expenses: 800 }];
      mockedDashboardService.getWeeklyTrends.mockResolvedValue(expected);

      const req = { user: { id: 'user-1' }, query: {} } as any;
      const res = createResponse();

      await DashboardController.getWeeklyTrends(req, res);

      expect(mockedDashboardService.getWeeklyTrends).toHaveBeenCalledWith('user-1', undefined);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Weekly trends fetched successfully',
        data: expected,
      });
    });

    it('returns weekly trends with custom weeks parameter', async () => {
      mockedDashboardService.getWeeklyTrends.mockResolvedValue([]);

      const req = { user: { id: 'user-1' }, query: { weeks: '16' } } as any;
      const res = createResponse();

      await DashboardController.getWeeklyTrends(req, res);

      expect(mockedDashboardService.getWeeklyTrends).toHaveBeenCalledWith('user-1', 16);
    });
  });
});