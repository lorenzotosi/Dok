import type { Request, Response } from 'express';
import { AdminService } from '../services/admin.service.js';
import { PresenceManager } from '../sockets/presenceManager.js';
import type {AuthRequest} from "../middlewares/auth.middleware.js";
import {NotificationManager} from "../sockets/notificationManager.js";

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

export const getUserFileSystem = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.params.id;
        if (!userId || typeof userId !== 'string') {
            res.status(400).json({ error: 'ID utente non valido' });
            return;
        }

        const fileSystem = await AdminService.getUserFileSystem(userId);
        res.status(200).json(fileSystem);
    } catch (error) {
        console.error('[AdminController] Errore recupero FileSystem:', error);
        res.status(500).json({ error: 'Errore nel recupero dell\'albero dei file.' });
    }
};

export const changeUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const targetUserId = req.params.id;
        const { role } = req.body;
        const requesterId = req.user!.id;

        if (!targetUserId || typeof targetUserId !== 'string') {
            res.status(400).json({ error: 'ID utente non valido.' });
            return;
        }

        if (role !== 'USER' && role !== 'ADMIN') {
            res.status(400).json({ error: 'Ruolo specificato non valido.' });
            return;
        }

        if (targetUserId === requesterId) {
            res.status(403).json({ error: 'Operazione negata: Non puoi modificare il tuo stesso ruolo.' });
            return;
        }
        await AdminService.changeUserRole(targetUserId, role);

        NotificationManager.notifyRoleChanged(targetUserId, role);

        res.status(200).json({ message: `Ruolo aggiornato con successo a ${role}` });
    } catch (error: any) {
        if (error.message === 'Utente non trovato') {
            res.status(404).json({ error: error.message });
        } else {
            console.error('[AdminController] Errore cambio ruolo:', error);
            res.status(500).json({ error: 'Errore interno del server durante il cambio ruolo.' });
        }
    }
};