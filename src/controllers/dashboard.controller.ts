import { successResponse, errorResponse } from "utils/response"
import { DashboardService } from "../services/dashboard.service";
import type { Request, Response} from "express";

export const getDashboardOverview = async (req: Request, res: Response) => {
    try {
        const overview = await DashboardService.getDashboardOverview(req.user!.id);
        return successResponse(res, overview, "Dashboard overview fetched successfully");
    } catch (error: any) {
        return errorResponse(res, error.message);
    }
}

export const getFinancialSummary = async (req: Request, res: Response) => {
    try {
        const summary = await DashboardService.getFinancialSummary(req.user!.id);
        return successResponse(res, summary, "Summary fetched successfully");
    } catch (error: any) {
        return errorResponse(res, error.message);
    }
}

export const getCategoryTotals = async (req: Request, res: Response) => {
    try {
        const categories = await DashboardService.getCategoryTotals(req.user!.id);
        return successResponse(res, categories, "Categories fetched successfully");
    } catch (error: any) {
        return errorResponse(res, error.message);
    }
}

export const getMonthlyTrends = async (req: Request, res: Response) => {
    try {
        const months = req.query.months ? parseInt(req.query.months as string, 10) : undefined;
        const monthlyTrends = await DashboardService.getMonthlyTrends(req.user!.id, months);
        return successResponse(res, monthlyTrends, "Monthly trends fetched successfully");
    } catch (error: any) {
        return errorResponse(res, error.message);
    }
}

export const getWeeklyTrends = async (req: Request, res: Response) => {
    try {
        const weeks = req.query.weeks ? parseInt(req.query.weeks as string, 10) : undefined;
        const weeklyTrends = await DashboardService.getWeeklyTrends(req.user!.id, weeks);
        return successResponse(res, weeklyTrends, "Weekly trends fetched successfully");
    } catch (error: any) {
        return errorResponse(res, error.message);
    }
}

export const getRecentActivity = async (req: Request, res: Response) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
        const recentActivity = await DashboardService.getRecentActivity(req.user!.id, limit);
        return successResponse(res, recentActivity, "Recent activity fetched successfully");
    } catch (error: any) {
        return errorResponse(res, error.message);
    }
}