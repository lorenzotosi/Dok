import { Router } from 'express';
import {
    changeUserRole, getAdminDocumentInfo,
    getAdminDocumentLogs,
    getAllUsers,
    getUserDetails,
    getUserFileSystem
} from '../controllers/admin.controller.js';
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @openapi
 * /api/admin/users:
 *   get:
 *     summary: Ottieni tutti gli utenti registrati con stato di presenza (Solo Admin)
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista di utenti con informazioni di base e presenza online
 *       401:
 *         description: Non autorizzato
 *       403:
 *         description: Privilegi di amministratore richiesti
 */
router.get('/users', requireAuth, requireAdmin, getAllUsers);

/**
 * @openapi
 * /api/admin/users/{id}:
 *   get:
 *     summary: Ottieni i dettagli e le metriche di un utente specifico (Solo Admin)
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID dell'utente
 *     responses:
 *       200:
 *         description: Informazioni dettagliate dell'utente e metriche di utilizzo
 *       401:
 *         description: Non autorizzato
 *       403:
 *         description: Privilegi di amministratore richiesti
 *       404:
 *         description: Utente non trovato
 */
router.get('/users/:id', requireAuth, requireAdmin, getUserDetails);

/**
 * @openapi
 * /api/admin/users/{id}/filesystem:
 *   get:
 *     summary: Ottieni l'albero del file system di un utente specifico (Solo Admin)
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID dell'utente
 *     responses:
 *       200:
 *         description: Albero dei file e delle cartelle dell'utente
 *       401:
 *         description: Non autorizzato
 *       403:
 *         description: Privilegi di amministratore richiesti
 */
router.get('/users/:id/filesystem', requireAuth, requireAdmin, getUserFileSystem);

/**
 * @openapi
 * /api/admin/users/{id}/role:
 *   patch:
 *     summary: Modifica il ruolo di un utente (Solo Admin)
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID dell'utente target
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [USER, ADMIN]
 *                 example: ADMIN
 *     responses:
 *       200:
 *         description: Ruolo aggiornato con successo
 *       400:
 *         description: Dati non validi
 *       401:
 *         description: Non autorizzato
 *       403:
 *         description: Operazione negata (es. modifica di se stessi o mancanza di permessi admin)
 *       404:
 *         description: Utente non trovato
 */
router.patch('/users/:id/role', requireAuth, requireAdmin, changeUserRole);

/**
 * @openapi
 * /api/admin/documents/{id}/logs:
 *  get:
 *      summary: Ottieni lo storico completo dei log di un documento (Solo Admin)
 *      tags:
 *          - Admin
 *      security:
 *          - BearerAuth: []
 *      parameters:
 *          - in: path
 *          name: id
 *          required: true
 *          schema:
 *              type: string
 *          description: ID del documento
 *      responses:
 *          200:
 *              description: Array di audit logs
 *          401:
 *              description: Non autorizzato
 *          403:
 *              description: Privilegi di amministratore richiesti
 */
router.get('/documents/:id/logs', requireAuth, requireAdmin, getAdminDocumentLogs);

/**
 * @openapi
 * /api/admin/documents/{id}:
 *  get:
 *      summary: Ottieni le informazioni base di un documento (Solo Admin)
 *      tags:
 *          - Admin
 *      security:
*           - BearerAuth: []
 *      parameters:
 *          - in: path
 *          name: id
 *          required: true
 *          schema:
 *              type: string
 *              description: ID del documento
 *      responses:
 *          200:
 *              description: Informazioni recuperate
 *          401:
 *              description: Non autorizzato
 *          403:
 *              description: Privilegi di amministratore richiesti
 */
router.get('/documents/:id', requireAuth, requireAdmin, getAdminDocumentInfo);

export default router;