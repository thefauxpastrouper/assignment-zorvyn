import { prisma } from '../utils/db';

export class DashboardService {

    static async getFinancialSummary(userId: string) {
        const aggregations = await prisma.record.groupBy({
            by: ['type'],
            where: {
                userId,
                deletedAt: null
            },
            _sum: {
                amount: true,
            },
        });

        const totals = aggregations.reduce((acc, curr) => {
            acc[curr.type] = Number(curr._sum.amount) || 0;
            return acc;
        }, { INCOME: 0, EXPENSE: 0 } as Record<string, number>);

        return {
            totalIncome: totals.INCOME || 0,
            totalExpenses: totals.EXPENSE || 0,
            netBalance: (totals.INCOME || 0) - (totals.EXPENSE || 0),
        };
    }

    static async getCategoryTotals(userId: string) {
        const categories = await prisma.record.groupBy({
            by: ['category', 'type'],
            where: {
                userId,
                deletedAt: null
            },
            _sum: {
                amount: true
            },
            orderBy: {
                _sum: {
                    amount: 'desc'
                }
            }
        });

        return categories.map(item => ({
            category: item.category,
            type: item.type,
            total: Number(item._sum.amount) || 0
        }));
    }

    static async getMonthlyTrends(userId: string, months: number = 6) {
        return await prisma.$queryRaw`
            SELECT
                TO_CHAR(DATE_TRUNC('month', "date"), 'YYYY-MM') as "month",
                SUM(CASE WHEN "type" = 'INCOME' THEN "amount"::FLOAT ELSE 0 END) as "income",
                SUM(CASE WHEN "type" = 'EXPENSE' THEN "amount"::FLOAT ELSE 0 END) as "expenses"
            FROM "Record"
            WHERE "userId" = ${userId}
                AND "deletedAt" IS NULL
            GROUP BY DATE_TRUNC('month', "date")
            ORDER BY DATE_TRUNC('month', "date") DESC
            LIMIT ${months}
        `;
    }

    static async getWeeklyTrends(userId: string, weeks: number = 8) {
        return await prisma.$queryRaw`
            SELECT
                TO_CHAR(DATE_TRUNC('week', "date"), 'YYYY-MM-DD') as "week",
                SUM(CASE WHEN "type" = 'INCOME' THEN "amount"::FLOAT ELSE 0 END) as "income",
                SUM(CASE WHEN "type" = 'EXPENSE' THEN "amount"::FLOAT ELSE 0 END) as "expenses"
            FROM "Record"
            WHERE "userId" = ${userId}
                AND "deletedAt" IS NULL
            GROUP BY DATE_TRUNC('week', "date")
            ORDER BY DATE_TRUNC('week', "date") DESC
            LIMIT ${weeks}
        `;
    }

    static async getRecentActivity(userId: string, limit: number = 5) {
        return await prisma.record.findMany({
            where: { userId, deletedAt: null },
            orderBy: { date: 'desc' },
            take: limit,
            select: {
                id: true,
                amount: true,
                type: true,
                category: true,
                date: true,
                description: true
            }
        });
    }

    /**
     * Returns all dashboard data in a single call — avoids multiple round trips.
     */
    static async getDashboardOverview(userId: string) {
        const [summary, categoryTotals, monthlyTrends, weeklyTrends, recentActivity] =
            await Promise.all([
                this.getFinancialSummary(userId),
                this.getCategoryTotals(userId),
                this.getMonthlyTrends(userId),
                this.getWeeklyTrends(userId),
                this.getRecentActivity(userId),
            ]);

        return {
            summary,
            categoryTotals,
            monthlyTrends,
            weeklyTrends,
            recentActivity,
        };
    }
}