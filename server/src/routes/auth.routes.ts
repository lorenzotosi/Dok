//metto qui le rotte dell'autenticazione, dato che abbiamo una cartella
//per le rotte tanto vale organizzarle in file diversi anziché tutte in uno
import { Router, type Response} from 'express';
import {register, login, logout} from '../controllers/auth.controller.js';
import { requireAuth, type AuthRequest} from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Registra un nuovo utente
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: utente@esempio.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: passwordSicura123
 *               firstName:
 *                 type: string
 *                 example: Mario
 *               lastName:
 *                 type: string
 *                 example: Rossi
 *     responses:
 *       201:
 *         description: Utente registrato con successo. Restituisce le informazioni dell'utente e il token JWT.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c85
 *                     email:
 *                       type: string
 *                       example: utente@esempio.com
 *                     role:
 *                       type: string
 *                       example: USER
 *                     firstName:
 *                       type: string
 *                       example: Mario
 *                     lastName:
 *                       type: string
 *                       example: Rossi
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Dati non validi o errore di validazione
 *       409:
 *         description: Email già in uso
 */
router.post('/register', register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Effettua il login di un utente esistente
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: utente@esempio.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: passwordSicura123
 *     responses:
 *       200:
 *         description: Login effettuato con successo. Restituisce le informazioni dell'utente e il token JWT.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c85
 *                     email:
 *                       type: string
 *                       example: utente@esempio.com
 *                     role:
 *                       type: string
 *                       example: USER
 *                     firstName:
 *                       type: string
 *                       example: Mario
 *                     lastName:
 *                       type: string
 *                       example: Rossi
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Email e password sono obbligatori
 *       401:
 *         description: Credenziali non valide
 */
router.post('/login', login);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Effettua il logout dell'utente corrente
 *     tags:
 *       - Authentication
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logout registrato con successo. Dati sincronizzati.
 *       401:
 *         description: Non autorizzato (token mancante o non valido)
 *       500:
 *         description: Errore interno durante il logout
 */
router.post('/logout', requireAuth, logout);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Restituisce le informazioni dell'utente autenticato corrente
 *     tags:
 *       - Authentication
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Informazioni dell'utente recuperate con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Accesso autorizzato
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c85
 *                     role:
 *                       type: string
 *                       example: USER
 *       401:
 *         description: Non autorizzato (token mancante o non valido)
 */
router.get('/me', requireAuth, (req: AuthRequest, res: Response) => {
    res.status(200).json({
        message: 'Accesso autorizzato',
        user: req.user
    });
});

export default router;