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

  static async getRecords(userId: string, query: any) {
    const { page = 1, limit = 10, type, category } = query;
    const skip = (Number(page) - 1) * Number(limit);

    return await prisma.record.findMany({
      where: { 
        userId, 
        deletedAt: null,
        ...(type && { type }),
        ...(category && { category })
      },
      take: Number(limit),
      skip,
      orderBy: { date: 'desc' },
      select: recordSelect
    });
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