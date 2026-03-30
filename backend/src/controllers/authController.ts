import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e password richiesti' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    
    if (!user || !user.isActive || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        role: user.role,
        phone: user.phone,
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Errore server' });
  }
};

export const getMe = async (req: any, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, phone: true, isActive: true }
    });
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });
    res.json({ success: true, user: { ...user, fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() } });
  } catch (error) {
    res.status(500).json({ error: 'Errore server' });
  }
};