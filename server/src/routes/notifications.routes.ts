import { Router } from 'express';
import { getNotifications, getUnreadNotifications, markAsRead, markAllAsRead, deleteNotification } from '../controllers/notification.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @openapi
 * /api/notifications:
 *   get:
 *     summary: Ottieni le notifiche dell'utente corrente
 *     tags:
 *       - Notifications
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista di tutte le notifiche dell'utente
 *       401:
 *         description: Non autorizzato
 */
router.get('/', requireAuth, getNotifications);

/**
 * @openapi
 * /api/notifications/unread:
 *   get:
 *     summary: Ottieni le notifiche non lette dell'utente corrente
 *     tags:
 *       - Notifications
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista di notifiche non lette
 *       401:
 *         description: Non autorizzato
 */
router.get('/unread', requireAuth, getUnreadNotifications);

/**
 * @openapi
 * /api/notifications/read-all:
 *   put:
 *     summary: Segna tutte le notifiche come lette
 *     tags:
 *       - Notifications
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Tutte le notifiche segnate come lette
 *       401:
 *         description: Non autorizzato
 */
router.put('/read-all', requireAuth, markAllAsRead);

/**
 * @openapi
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Segna una specifica notifica come letta
 *     tags:
 *       - Notifications
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID della notifica
 *     responses:
 *       200:
 *         description: Notifica segnata come letta
 *       401:
 *         description: Non autorizzato
 *       404:
 *         description: Notifica non trovata
 */
router.put('/:id/read', requireAuth, /*validateMongoIdParam('id'),*/ markAsRead);

/**
 * @openapi
 * /api/notifications/{id}:
 *   delete:
 *     summary: Elimina una specifica notifica
 *     tags:
 *       - Notifications
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID della notifica da eliminare
 *     responses:
 *       200:
 *         description: Notifica eliminata
 *       401:
 *         description: Non autorizzato
 *       404:
 *         description: Notifica non trovata
 */
router.delete('/:id', requireAuth, /*validateMongoIdParam('id'),*/ deleteNotification);


export default router
