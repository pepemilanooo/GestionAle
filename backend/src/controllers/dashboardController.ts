import { Response } from 'express';
import { PrismaClient, JobStatus } from '@prisma/client';

const prisma = new PrismaClient();

export const getDashboardStats = async (req: any, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayCount, inProgressCount, delayedCount, completedToday, lowStockProducts] = await Promise.all([
      prisma.intervention.count({ where: { scheduledAt: { gte: today, lt: new Date(today.getTime() + 86400000) } } }),
      prisma.intervention.count({ where: { status: JobStatus.IN_PROGRESS } }),
      prisma.intervention.count({ where: { status: JobStatus.PLANNED, scheduledAt: { lt: today } } }),
      prisma.intervention.count({ where: { status: JobStatus.COMPLETED, completedAt: { gte: today } } }),
      prisma.product.findMany({ where: { isActive: true, stock: { lte: prisma.product.fields.minStock } }, select: { id: true, name: true, stock: true, minStock: true, unit: true }, take: 5 }),
    ]);

    res.json({
      success: true,
      stats: { todayInterventions: todayCount, inProgress: inProgressCount, delayed: delayedCount, completedToday, lowStockProducts, topTechnicians: [] }
    });
  } catch (error) { res.status(500).json({ error: 'Errore statistiche' }); }
};