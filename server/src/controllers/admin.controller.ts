// server/src/controllers/admin.controller.ts
import type { Request, Response } from 'express';
import { AdminService } from '../services/admin.service.js';
import { PresenceManager } from '../sockets/presenceManager.js';

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const users = await AdminService.getAllUsersBasicInfo();

        const userIds = users.map(user => user._id.toString());
        const onlineUsersSet = await PresenceManager.getOnlineUsers(userIds);

        const usersWithPresence = users.map((user) => {
            const userIdStr = user._id.toString();
            return {
                id: userIdStr,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                lastSeen: user.lastSeen,
                isOnline: onlineUsersSet.has(userIdStr)
            };
        });

        res.status(200).json(usersWithPresence);
    } catch (error) {
        console.error('[AdminController] Errore nel recupero utenti:', error);
        res.status(500).json({ error: 'Errore interno del server durante il recupero utenti.' });
    }
};

export const getUserDetails = async (req: Request, res: Response): Promise<void> => {
    try {
        const idParam = req.params.id;
        if (!idParam || typeof idParam !== 'string') {
            res.status(400).json({ error: 'ID utente mancante o non valido.' });
            return;
        }
        const userId: string = idParam;

        const data = await AdminService.getUserMetrics(userId);
        const isOnline = await PresenceManager.isUserOnline(userId);

        const response = {
            id: data.user._id.toString(),
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            email: data.user.email,
            role: data.user.role,
            isOnline: isOnline,
            lastSeen: data.user.lastSeen,
            docsCreated: data.metrics.docsCreated,
            docsSharedByMe: data.metrics.docsSharedByMe,
            docsSharedWithMe: data.metrics.docsSharedWithMe
        };

        res.status(200).json(response);
    } catch (error: any) {
        if (error.message === 'Utente non trovato') {
            res.status(404).json({ error: error.message });
        } else {
            console.error('[AdminController] Errore dettaglio utente:', error);
            res.status(500).json({ error: 'Errore interno del server' });
        }
    }
};