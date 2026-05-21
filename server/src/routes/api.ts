import { Router } from 'express';
import { createFolder, getFoldersInsideParent, getAllFolders, deleteFolder } from '../controllers/folder.controller.js';
import { createDoc, getDoc, getAllDocuments, deleteDocument, renameDocument, getSharedDocs, shareDoc, unshareDoc } from '../controllers/document.controller.js';
import { getNotifications, getUnreadNotifications, markAsRead, markAllAsRead, deleteNotification } from '../controllers/notification.controller.js';
import { rewriteText } from '../controllers/llm.controller.js';
import { requireBodyField, validateMongoIdParam } from '../middlewares/validation.middleware.js';
import authRoutes from './auth.routes.js';
import { requireAuth, optionalAuth } from '../middlewares/auth.middleware.js';
import adminRoutes from "./admin.routes.js";

const router = Router();

//rotte in cu-el file di nome auth.routes
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);

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
router.get('/notifications', requireAuth, getNotifications);

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
router.get('/notifications/unread', requireAuth, getUnreadNotifications);

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
router.put('/notifications/read-all', requireAuth, markAllAsRead);

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
router.put('/notifications/:id/read', requireAuth, /*validateMongoIdParam('id'),*/ markAsRead);

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
router.delete('/notifications/:id', requireAuth, /*validateMongoIdParam('id'),*/ deleteNotification);

/**
 * @openapi
 * /api/folders:
 *   post:
 *     summary: Crea una nuova cartella
 *     tags:
 *       - Folders
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Progetti
 *               parentId:
 *                 type: string
 *                 nullable: true
 *                 example: 60d21b4667d0d8992e610c85
 *               visibility:
 *                 type: string
 *                 enum: [private, public]
 *                 default: private
 *     responses:
 *       201:
 *         description: Cartella creata con successo
 *       401:
 *         description: Non autorizzato
 */
router.post('/folders', requireAuth, requireBodyField('name'), createFolder); // Crea una cartella, 'name' obbligatorio

/**
 * @openapi
 * /api/folders:
 *   get:
 *     summary: Ottieni le cartelle all'interno di una cartella padre (o a livello radice)
 *     tags:
 *       - Folders
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: parentId
 *         required: false
 *         schema:
 *           type: string
 *         description: ID della cartella padre. Se non fornito, restituisce quelle radice.
 *     responses:
 *       200:
 *         description: Lista di cartelle
 */
router.get('/folders', optionalAuth, getFoldersInsideParent);    // Ottieni la lista delle cartelle

/**
 * @openapi
 * /api/folders/all:
 *   get:
 *     summary: Ottieni tutte le cartelle visibili dall'utente
 *     tags:
 *       - Folders
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista di tutte le cartelle dell'utente
 */
router.get('/folders/all', optionalAuth, getAllFolders);    // Ottieni la lista di tutte le cartelle

/**
 * @openapi
 * /api/folders/{_id}:
 *   delete:
 *     summary: Elimina una cartella
 *     tags:
 *       - Folders
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: _id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID della cartella da eliminare
 *     responses:
 *       200:
 *         description: Cartella eliminata con successo
 *       403:
 *         description: Permesso negato
 *       404:
 *         description: Cartella non trovata
 */
router.delete('/folders/:_id', requireAuth, validateMongoIdParam('_id'), deleteFolder);    // Elimina cartella (ID valido richiesto)

/**
 * @openapi
 * /api/documents:
 *   post:
 *     summary: Crea un nuovo documento
 *     tags:
 *       - Documents
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: Documento Importante
 *               folderId:
 *                 type: string
 *                 nullable: true
 *                 example: 60d21b4667d0d8992e610c85
 *               visibility:
 *                 type: string
 *                 enum: [private, public]
 *                 default: private
 *     responses:
 *       201:
 *         description: Documento creato con successo
 */
router.post('/documents', requireAuth, requireBodyField('title'), createDoc);

/**
 * @openapi
 * /api/documents/shared:
 *   get:
 *     summary: Ottieni i documenti condivisi con l'utente corrente
 *     tags:
 *       - Documents
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista di documenti condivisi
 */
router.get('/documents/shared', requireAuth, getSharedDocs);

/**
 * @openapi
 * /api/documents/{id}:
 *   get:
 *     summary: Ottieni un documento per ID
 *     tags:
 *       - Documents
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del documento
 *     responses:
 *       200:
 *         description: Dettaglio del documento
 *       404:
 *         description: Documento non trovato
 */
router.get('/documents/:id', optionalAuth, getDoc);

/**
 * @openapi
 * /api/documents:
 *   get:
 *     summary: Ottieni i documenti (filtrabili per cartella)
 *     tags:
 *       - Documents
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: parentId
 *         required: false
 *         schema:
 *           type: string
 *         description: ID della cartella padre. Se non fornito, restituisce quelli a livello radice.
 *     responses:
 *       200:
 *         description: Lista di documenti
 */
router.get('/documents', optionalAuth, getAllDocuments);

/**
 * @openapi
 * /api/documents/{id}:
 *   delete:
 *     summary: Elimina un documento
 *     tags:
 *       - Documents
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del documento da eliminare
 *     responses:
 *       200:
 *         description: Documento eliminato
 *       403:
 *         description: Non autorizzato
 *       404:
 *         description: Documento non trovato
 */
router.delete('/documents/:id', requireAuth, validateMongoIdParam('id'), deleteDocument);

/**
 * @openapi
 * /api/documents/rename:
 *   put:
 *     summary: Rinomina un documento
 *     tags:
 *       - Documents
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - newTitle
 *             properties:
 *               id:
 *                 type: string
 *                 example: 60d21b4667d0d8992e610c85
 *               newTitle:
 *                 type: string
 *                 example: Nuovo Nome Documento
 *     responses:
 *       200:
 *         description: Documento rinominato con successo
 */
router.put('/documents/rename', requireAuth, requireBodyField('id'), requireBodyField('newTitle'), renameDocument);

/**
 * @openapi
 * /api/documents/share:
 *   put:
 *     summary: Condividi un documento con un utente tramite email
 *     tags:
 *       - Documents
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - email
 *               - role
 *             properties:
 *               id:
 *                 type: string
 *                 example: 60d21b4667d0d8992e610c85
 *               email:
 *                 type: string
 *                 format: email
 *                 example: destinatario@esempio.com
 *               role:
 *                 type: string
 *                 enum: [viewer, editor]
 *                 example: viewer
 *     responses:
 *       200:
 *         description: Documento condiviso correttamente
 */
router.put('/documents/share', requireAuth, requireBodyField('id'), requireBodyField('email'), requireBodyField('role'), shareDoc);

/**
 * @openapi
 * /api/documents/unshare:
 *   put:
 *     summary: Rimuovi la condivisione di un documento per un utente
 *     tags:
 *       - Documents
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - userId
 *             properties:
 *               id:
 *                 type: string
 *                 example: 60d21b4667d0d8992e610c85
 *               userId:
 *                 type: string
 *                 example: 60d21b4667d0d8992e610c85
 *     responses:
 *       200:
 *         description: Condivisione rimossa correttamente
 */
router.put('/documents/unshare', requireAuth, requireBodyField('id'), requireBodyField('userId'), unshareDoc);

/**
 * @openapi
 * /api/llm/rewrite:
 *   post:
 *     summary: Riscrivi testo usando un modello LLM
 *     tags:
 *       - LLM
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *               - instruction
 *             properties:
 *               text:
 *                 type: string
 *                 example: Questo è un testo informale.
 *               instruction:
 *                 type: string
 *                 example: Rendilo più formale e professionale.
 *     responses:
 *       200:
 *         description: Testo riscritto con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rewrittenText:
 *                   type: string
 *                   example: Si tratta di un testo formale.
 */
router.post('/llm/rewrite', requireAuth, rewriteText);

export default router;