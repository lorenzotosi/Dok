import type { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import type {AuthRequest} from "../middlewares/auth.middleware.js";

const authService = new AuthService();

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await authService.register(req.body);
        res.status(201).json(data);
    } catch (error: any) {
        // 11000 è per i valori duplicati in mongodb
        if (error.code === 11000) {
            res.status(409).json({ error: 'Email già in uso.' });
            return;
        }
        res.status(400).json({ error: error.message });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email e password sono obbligatori.' });
            return;
        }

        const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const clientIp = Array.isArray(rawIp) ? rawIp[0] : rawIp;

        const data = await authService.login(email, password, clientIp);
        res.status(200).json(data);
    } catch (error: any) {
        res.status(401).json({ error: error.message });
    }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        await authService.logout(userId);

        res.status(200).json({ message: 'Logout registrato con successo. Dati sincronizzati.' });
    } catch (error) {
        console.error('[AuthController] Errore durante il logout:', error);
        res.status(500).json({ error: 'Errore interno durante il logout.' });
    }
};