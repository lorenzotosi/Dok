import { Router } from 'express';
import { rewriteText } from '../controllers/llm.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

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
router.post('/rewrite', requireAuth, rewriteText);


export default router