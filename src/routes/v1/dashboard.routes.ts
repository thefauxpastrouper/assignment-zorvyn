import { Router } from "express";
import * as DashboardController from "../../controllers/dashboard.controller";

const dashboardRoutes = Router();

dashboardRoutes.use('/financialsummary', DashboardController.getFinancialSummary);
dashboardRoutes.use('/categorytools', DashboardController.getCategoryTotals);
dashboardRoutes.use('/monthlytrends', DashboardController.getMonthlyTrends)
dashboardRoutes.use('/recentactivity', DashboardController.getRecentActivity);

export default dashboardRoutes;