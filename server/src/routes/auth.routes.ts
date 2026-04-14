//metto qui le rotte dell'autenticazione, dato che abbiamo una cartella
//per le rotte tanto vale organizzarle in file diversi anziché tutte in uno
import { Router, type Response} from 'express';
import { register, login } from '../controllers/auth.controller.js';
import { requireAuth, type AuthRequest} from '../middlewares/auth.middleware.js';

const router = Router();

// Rotte Pubbliche
router.post('/register', register);
router.post('/login', login);

// Rotta Protetta (per testare che il token funzioni)
// Qualsiasi rotta che usa requireAuth dovrà richiedere un JWT valido
router.get('/me', requireAuth, (req: AuthRequest, res: Response) => {
    res.status(200).json({
        message: 'Accesso autorizzato',
        user: req.user
    });
});

export default router;