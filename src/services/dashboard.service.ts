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
            by: ['category'],
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
            total: Number(item._sum.amount) || 0
        }));
    }

    static async getMonthlyTrends(userId: string) {
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
      LIMIT 6
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
}