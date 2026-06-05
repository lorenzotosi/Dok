import { Router } from 'express';
import { createFolder, getFoldersInsideParent, getAllFolders, deleteFolder } from '../controllers/folder.controller.js';
import { requireAuth, optionalAuth } from '../middlewares/auth.middleware.js';
import { requireBodyField, validateMongoIdParam } from '../middlewares/validation.middleware.js';

const router = Router();

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
router.post('/', requireAuth, requireBodyField('name'), createFolder); // Crea una cartella, 'name' obbligatorio

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
router.get('/', optionalAuth, getFoldersInsideParent);    // Ottieni la lista delle cartelle

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
router.get('/all', optionalAuth, getAllFolders);    // Ottieni la lista di tutte le cartelle

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
router.delete('/:_id', requireAuth, validateMongoIdParam('_id'), deleteFolder);    // Elimina cartella (ID valido richiesto)


export default router