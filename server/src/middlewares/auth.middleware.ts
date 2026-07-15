import type {NextFunction, Request, Response} from 'express';
import jwt, {type JwtPayload} from 'jsonwebtoken';
import {UserModel, UserRole} from '../models/User.js';

export interface AuthRequest extends Request {
    user?: { id: string; role: UserRole };
}

export interface AuthPayload extends JwtPayload {
    id: string;
    role: UserRole;
}

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Autenticazione richiesta. Token mancante.' });
        return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'Token non fornito.' });
        return;
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (typeof decoded === 'string') {
            res.status(401).json({ error: 'Formato token non valido (stringa ricevuta).' });
            return;
        }

        const payload = decoded as AuthPayload;
        if (!payload.id || !payload.role) {
            res.status(401).json({ error: 'Payload del token malformato (dati mancanti).' });
            return;
        }

        req.user = { id: payload.id, role: payload.role };
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token non valido o scaduto.' });
    }
};

export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return next();
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (typeof decoded === 'string') {
            return next();
        }

        const payload = decoded as AuthPayload;
        if (!payload.id || !payload.role) {
            return next();
        }

        req.user = { id: payload.id, role: payload.role };
    } catch (error) {
        return next();
    }
    next();
};

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user || req.user.role !== UserRole.ADMIN) {
            res.status(403).json({ error: 'Accesso negato. Privilegi di amministratore richiesti.' });
            return;
        }

        const currentUser = await UserModel.findById(req.user.id).select('role');

        if (!currentUser) {
            res.status(401).json({ error: 'Utente non trovato nel sistema.' });
            return;
        }

        if (currentUser.role !== 'ADMIN') {
            res.status(403).json({ error: 'Accesso negato. I privilegi di amministratore sono stati revocati.' });
            return;
        }
        next();

    } catch (error) {
        console.error('[AUTH MIDDLEWARE] Errore verifica privilegi admin:', error);
        res.status(500).json({ error: 'Errore interno durante la verifica dei permessi.' });
    }
};