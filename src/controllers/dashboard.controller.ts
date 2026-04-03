import { successResponse, errorResponse } from "utils/response"
import { DashboardService } from "../services/dashboard.service";
import type { Request, Response} from "express";

export const getFinancialSummary = async (req: Request, res: Response) => {
    try {
        let { userId } = req.body;
        let summary = await DashboardService.getFinancialSummary(userId);
        return successResponse(res, summary, "Summary fetched successfully");
    }catch(error: any) {
        return errorResponse(res, error.message)
    }
}

export const getCategoryTotals = async (req: Request, res: Response) => {
    try {
        let { userId } = req.body;
        let categories = await DashboardService.getCategoryTotals(userId);
        return successResponse(res, categories, "Categories fetched successfully");
    }catch(error: any) {
        return errorResponse(res, error.message);
    } 
}

export const getMonthlyTrends = async (req: Request, res: Response) => {
    try {
        let { userId } = req.body;
        let monthlyTrends = await DashboardService.getMonthlyTrends(userId);
        return successResponse(res, monthlyTrends, "Monthly trends fetched successfully");
    }catch(error: any) {
        return errorResponse(res, error.message);
    }
}

export const getRecentActivity = async (req: Request, res: Response) => {
    try {
        let { userId } = req.body;
        let limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
        
        let recentActivity = await DashboardService.getRecentActivity(userId, limit);
        return successResponse(res, recentActivity, "Recent activity fetched successfully");
    }catch(error: any) {
        return errorResponse(res, error.message);
    }
}