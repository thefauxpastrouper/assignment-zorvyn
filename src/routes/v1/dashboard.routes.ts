import { Router } from "express";
import { authGuard } from "middleware/auth.guard";
import { statusGuard } from "middleware/status.guard";
import * as DashboardController from "../../controllers/dashboard.controller";
import { DashboardQuerySchema } from "validators/dashboard.schema";
import { validate } from "../../middleware/validate.middleware";

const dashboardRoutes = Router();

dashboardRoutes.use(authGuard, statusGuard);

dashboardRoutes.get('/overview', DashboardController.getDashboardOverview);
dashboardRoutes.get('/summary', DashboardController.getFinancialSummary);
dashboardRoutes.get('/categories', DashboardController.getCategoryTotals);

dashboardRoutes.get('/trends/monthly', validate(DashboardQuerySchema), DashboardController.getMonthlyTrends);
dashboardRoutes.get('/trends/weekly', validate(DashboardQuerySchema),DashboardController.getWeeklyTrends);
dashboardRoutes.get('/recent', validate(DashboardQuerySchema) ,DashboardController.getRecentActivity);

export default dashboardRoutes;