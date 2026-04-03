import { Router } from "express";
import { authGuard } from "middleware/auth.guard";
import { statusGuard } from "middleware/status.guard";
import * as DashboardController from "../../controllers/dashboard.controller";

const dashboardRoutes = Router();

dashboardRoutes.use(authGuard, statusGuard);

dashboardRoutes.get('/overview', DashboardController.getDashboardOverview);
dashboardRoutes.get('/summary', DashboardController.getFinancialSummary);
dashboardRoutes.get('/categories', DashboardController.getCategoryTotals);
dashboardRoutes.get('/trends/monthly', DashboardController.getMonthlyTrends);
dashboardRoutes.get('/trends/weekly', DashboardController.getWeeklyTrends);
dashboardRoutes.get('/recent', DashboardController.getRecentActivity);

export default dashboardRoutes;