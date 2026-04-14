import type { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';

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

        const data = await authService.login(email, password);
        res.status(200).json(data);
    } catch (error: any) {
        res.status(401).json({ error: error.message });
    }
};