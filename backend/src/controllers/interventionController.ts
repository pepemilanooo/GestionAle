import { Request, Response } from 'express';
import { PrismaClient, JobStatus, TrapStatus } from '@prisma/client';

const prisma = new PrismaClient();

export const getInterventions = async (req: any, res: Response) => {
  try {
    const { status, from, to, page = '1', limit = '20' } = req.query;
    const where: any = {};
    
    if (status) where.status = status;
    if (req.user.role === 'TECHNICIAN') where.technicianId = req.user.userId;
    if (from || to) {
      where.scheduledAt = {};
      if (from) where.scheduledAt.gte = new Date(from as string);
      if (to) where.scheduledAt.lte = new Date(to as string);
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [interventions, total] = await Promise.all([
      prisma.intervention.findMany({
        where, skip, take,
        include: {
          technician: { select: { id: true, firstName: true, lastName: true } },
          location: { include: { client: { select: { id: true, name: true, type: true } } } },
          _count: { select: { trapActivities: true, productUsages: true } },
        },
        orderBy: { scheduledAt: 'desc' },
      }),
      prisma.intervention.count({ where }),
    ]);

    res.json({ success: true, data: interventions, pagination: { page: parseInt(page as string), limit: take, total, totalPages: Math.ceil(total / take) } });
  } catch (error) { res.status(500).json({ error: 'Errore recupero interventi' }); }
};

export const getInterventionById = async (req: Request, res: Response) => {
  try {
    const intervention = await prisma.intervention.findUnique({
      where: { id: req.params.id },
      include: {
        technician: { select: { id: true, firstName: true, lastName: true } },
        location: { include: { client: true, zones: { include: { traps: true } } } },
        productUsages: { include: { product: true } },
        trapActivities: { include: { trap: true } },
      },
    });
    if (!intervention) return res.status(404).json({ error: 'Intervento non trovato' });
    res.json({ success: true, data: intervention });
  } catch (error) { res.status(500).json({ error: 'Errore server' }); }
};

export const createIntervention = async (req: Request, res: Response) => {
  try {
    const { locationId, technicianId, scheduledAt, priority = 1, notes } = req.body;
    if (!locationId || !technicianId || !scheduledAt) {
      return res.status(400).json({ error: 'Dati mancanti', message: 'Location, tecnico e data sono obbligatori' });
    }
    const intervention = await prisma.intervention.create({
      data: { locationId, technicianId, scheduledAt: new Date(scheduledAt), status: JobStatus.PLANNED, priority, notes },
      include: { technician: { select: { id: true, firstName: true, lastName: true } }, location: { include: { client: { select: { id: true, name: true } } } } },
    });
    res.status(201).json({ success: true, message: 'Intervento creato', data: intervention });
  } catch (error) { res.status(500).json({ error: 'Errore creazione' }); }
};

export const completeIntervention = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { trapActivities, productUsages, signatureBase64, notes, duration } = req.body;
  
  try {
    const result = await prisma.$transaction(async (tx) => {
      const intervention = await tx.intervention.findUnique({ where: { id }, include: { location: { include: { client: true } } } });
      if (!intervention) throw new Error('Intervento non trovato');
      if (intervention.status === JobStatus.COMPLETED) throw new Error('Già completato');
      
      const updated = await tx.intervention.update({
        where: { id },
        data: { status: JobStatus.COMPLETED, completedAt: new Date(), signatureUrl: signatureBase64, notes, duration },
      });

      if (trapActivities?.length) {
        await tx.trapActivity.createMany({
          data: trapActivities.map((a: any) => ({ interventionId: id, trapId: a.trapId, status: a.status || TrapStatus.OK, findings: a.findings, baitCondition: a.baitCondition, baitReplaced: a.baitReplaced || false })),
        });
      }

      if (productUsages?.length) {
        for (const usage of productUsages) {
          const product = await tx.product.findUnique({ where: { id: usage.productId } });
          if (!product) throw new Error('Prodotto non trovato');
          if (product.stock < usage.quantity) throw new Error(`Stock insufficiente per ${product.name}`);
          await tx.productUsage.create({ data: { interventionId: id, productId: usage.productId, quantity: usage.quantity } });
          await tx.product.update({ where: { id: usage.productId }, data: { stock: { decrement: usage.quantity } } });
        }
      }
      return { intervention: updated, location: intervention.location };
    });

    res.json({ success: true, message: 'Intervento completato', data: { interventionId: id, clientName: result.location.client.name } });
  } catch (error: any) { res.status(400).json({ error: error.message }); }
};

export const startIntervention = async (req: Request, res: Response) => {
  try {
    const intervention = await prisma.intervention.update({ where: { id: req.params.id, status: JobStatus.PLANNED }, data: { status: JobStatus.IN_PROGRESS } });
    res.json({ success: true, message: 'Intervento avviato', data: intervention });
  } catch (error) { res.status(400).json({ error: 'Impossibile avviare' }); }
};

export const deleteIntervention = async (req: Request, res: Response) => {
  try { await prisma.intervention.delete({ where: { id: req.params.id } }); res.json({ success: true, message: 'Intervento eliminato' }); }
  catch (error) { res.status(500).json({ error: 'Errore eliminazione' }); }
};