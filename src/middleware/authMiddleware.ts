import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '../models/user';

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = header.slice('Bearer '.length);

  const payload = jwt.decode(token) as AuthenticatedUser | null;
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  req.user = { id: payload.id, email: payload.email, role: payload.role };
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const role = req.user?.role;

  if (role !== 'ADMIN') {
    res.status(403).json({ error: 'Forbidden: admin role required' });
    return;
  }

  next();
}
