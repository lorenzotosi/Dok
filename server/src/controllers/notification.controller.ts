import { type Response } from 'express';
import { NotificationService } from '../services/notification.service.js';
import { type AuthRequest } from '../middlewares/auth.middleware.js';

/**
 * Recupera tutte le notifiche dell'utente loggato
 */
export const getNotifications = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const notifications = await NotificationService.getNotifications(userId);
        res.json(notifications);
    } catch (error) {
        console.error('Errore recupero notifiche:', error);
        res.status(500).json({ error: 'Errore durante il recupero delle notifiche' });
    }
};

/**
 * Recupera solo le notifiche non lette dell'utente loggato
 */
export const getUnreadNotifications = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const notifications = await NotificationService.getUnreadNotifications(userId);
        res.json(notifications);
    } catch (error) {
        console.error('Errore recupero notifiche non lette:', error);
        res.status(500).json({ error: 'Errore durante il recupero delle notifiche non lette' });
    }
};

/**
 * Segna una specifica notifica come letta
 */
export const markAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const updatedNotification = await NotificationService.markAsRead(userId);

        if (!updatedNotification) {
            return res.status(404).json({ error: 'Notifica non trovata' });
        }

        res.json(updatedNotification);
    } catch (error) {
        console.error('Errore markAsRead:', error);
        res.status(500).json({ error: 'Errore durante l\'aggiornamento della notifica' });
    }
};

/**
 * Segna tutte le notifiche dell'utente come lette
 */
export const markAllAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        await NotificationService.markAllAsRead(userId);
        res.json({ message: 'Tutte le notifiche sono state segnate come lette' });
    } catch (error) {
        console.error('Errore markAllAsRead:', error);
        res.status(500).json({ error: 'Errore durante l\'aggiornamento delle notifiche' });
    }
};

/**
 * Elimina una specifica notifica
 */
export const deleteNotification = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const deleted = await NotificationService.deleteNotification(userId);

        if (!deleted) {
            return res.status(404).json({ error: 'Notifica non trovata' });
        }

        res.json({ message: 'Notifica eliminata con successo' });
    } catch (error) {
        console.error('Errore deleteNotification:', error);
        res.status(500).json({ error: 'Errore durante l\'eliminazione della notifica' });
    }
};
