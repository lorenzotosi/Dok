import { Router } from 'express';
import { createDoc, getDoc, getAllDocuments, deleteDocument, renameDocument, getSharedDocs, shareDoc, unshareDoc, addComment, deleteComment } from '../controllers/document.controller.js';
import { requireAuth, optionalAuth } from '../middlewares/auth.middleware.js';
import { requireBodyField, validateMongoIdParam } from '../middlewares/validation.middleware.js';

const router = Router();

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
router.post('/', requireAuth, requireBodyField('title'), createDoc);

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
router.get('/shared', requireAuth, getSharedDocs);

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
router.get('/:id', optionalAuth, getDoc);

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
router.get('/', optionalAuth, getAllDocuments);

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
router.delete('/:id', requireAuth, validateMongoIdParam('id'), deleteDocument);

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
router.put('/rename', requireAuth, requireBodyField('id'), requireBodyField('newTitle'), renameDocument);

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
 *                 enum: [viewer, editor, commenter]
 *                 example: viewer
 *     responses:
 *       200:
 *         description: Documento condiviso correttamente
 */
router.put('/share', requireAuth, requireBodyField('id'), requireBodyField('email'), requireBodyField('role'), shareDoc);

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
router.put('/unshare', requireAuth, requireBodyField('id'), requireBodyField('userId'), unshareDoc);

/**
 * @openapi
 * /api/documents/{id}/comments:
 *   post:
 *     summary: Aggiungi un commento a un documento
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: Questo è un commento
 *     responses:
 *       201:
 *         description: Commento aggiunto
 *       403:
 *         description: Non autorizzato
 *       404:
 *         description: Documento non trovato
 */
router.post('/:id/comments', requireAuth, validateMongoIdParam('id'), requireBodyField('content'), addComment);

/**
 * @openapi
 * /api/documents/{id}/comments/{commentId}:
 *   delete:
 *     summary: Elimina un commento da un documento
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
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del commento
 *     responses:
 *       200:
 *         description: Commento eliminato
 *       403:
 *         description: Non autorizzato
 *       404:
 *         description: Documento o commento non trovato
 */
router.delete('/:id/comments/:commentId', requireAuth, validateMongoIdParam('id'), validateMongoIdParam('commentId'), deleteComment);


export default router