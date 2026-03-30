import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getClients = async (req: Request, res: Response) => {
  try {
    const { search, page = '1', limit = '20' } = req.query;
    const where: any = { isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);
    const [clients, total] = await Promise.all([
      prisma.client.findMany({ where, skip, take, include: { _count: { select: { locations: true } } }, orderBy: { name: 'asc' } }),
      prisma.client.count({ where }),
    ]);
    res.json({ success: true, data: clients, pagination: { page: parseInt(page as string), limit: take, total, totalPages: Math.ceil(total / take) } });
  } catch (error) { res.status(500).json({ error: 'Errore recupero clienti' }); }
};

export const getClientById = async (req: Request, res: Response) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: { locations: { include: { zones: { include: { traps: true } }, _count: { select: { interventions: true } } } } },
    });
    if (!client) return res.status(404).json({ error: 'Cliente non trovato' });
    res.json({ success: true, data: client });
  } catch (error) { res.status(500).json({ error: 'Errore server' }); }
};

export const createClient = async (req: Request, res: Response) => {
  try {
    const { name, type, email, phone, vatNumber, notes } = req.body;
    const client = await prisma.client.create({ data: { name, type, email, phone, vatNumber, notes } });
    res.status(201).json({ success: true, data: client });
  } catch (error) { res.status(500).json({ error: 'Errore creazione cliente' }); }
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
    res.json({ success: true, data: products });
  } catch (error) { res.status(500).json({ error: 'Errore prodotti' }); }
};