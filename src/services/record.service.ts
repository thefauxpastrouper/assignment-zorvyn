import { prisma } from '../utils/db';

const recordSelect = {
  id: true,
  amount: true,
  type: true,
  category: true,
  date: true,
  description: true,
  userId: true,
  user: {
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true
    }
  },
  deletedAt: true
};

export class RecordService {
  static async createRecord(userId: string, data: any) {
    if (data.amount <= 0) throw new Error("Amount must be positive");
    return await prisma.record.create({
      data: { ...data, userId },
      select: recordSelect
    });
  }

  static async getRecordById(id: string) {
    const record = await prisma.record.findFirst({
      where: { id, deletedAt: null },
      select: recordSelect
    });
    if (!record) throw new Error("Record not found");
    return record;
  }

  static async getRecords(userId: string, query: any) {
    const { page = 1, limit = 10, q, type, category, startDate, endDate } = query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;
    const searchQuery = typeof q === 'string' ? q.trim() : '';

    // Build filter conditions
    const where: any = {
      userId,
      deletedAt: null,
      ...(type && { type }),
      ...(category && { category }),
    };

    if (searchQuery) {
      where.AND = [
        {
          OR: [
            { category: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } },
          ]
        }
      ];
    }

    // Date range filtering
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const [records, total] = await Promise.all([
      prisma.record.findMany({
        where,
        take: limitNum,
        skip,
        orderBy: { date: 'desc' },
        select: recordSelect
      }),
      prisma.record.count({ where })
    ]);

    return {
      records,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }

  // soft deletion
  static async deleteRecord(id: string) {
    return await prisma.record.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: recordSelect
    });
  }

  static async updateRecord(id: string, data: any) {
    return await prisma.record.update({
      where: { id },
      data: data,
      select: recordSelect
    });
  }
}