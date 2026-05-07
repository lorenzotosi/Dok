import { type Response } from 'express';
import { UseLLM } from '../llm/UseLLM.js';
import { type AuthRequest } from '../middlewares/auth.middleware.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

if (!GEMINI_API_KEY) {
    console.warn('ATTENZIONE: GEMINI_API_KEY non configurata negli environment variables.');
}

const llm = new UseLLM(GEMINI_API_KEY);

/**
 * Controller per la riscrittura del testo tramite LLM
 */
export const rewriteText = async (req: AuthRequest, res: Response) => {
    try {
        const { text, instruction } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Il testo da riscrivere è obbligatorio.' });
        }

        if (!instruction) {
            return res.status(400).json({ error: 'L\'istruzione di riscrittura è obbligatoria.' });
        }

        const result = await llm.makeCall(text, instruction);

        console.log(result);

        return res.json({ rewrittenText: result.rewrittenText });

    } catch (error) {
        console.error('Errore LLM Controller:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Errore durante l\'elaborazione della richiesta LLM'
        });
    }
};
