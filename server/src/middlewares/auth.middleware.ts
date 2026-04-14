import type {Request, Response, NextFunction} from 'express';
import jwt, {type JwtPayload} from 'jsonwebtoken';
import { UserRole } from '../models/User.js';

// Estendiamo l'interfaccia Request di Express per includere l'utente decodificato
export interface AuthRequest extends Request {
    user?: { id: string; role: UserRole };
}

export interface AuthPayload extends JwtPayload {
    id: string;
    role: UserRole;
}

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';

// Pattern: Token Bearer Validation
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

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
        res.status(401).json({ error: 'Utente non autenticato.' });
        return;
    }

    if (req.user.role !== UserRole.ADMIN) {
        res.status(403).json({ error: 'Accesso negato. Privilegi di amministratore richiesti.' });
        return;
    }

    next();
};