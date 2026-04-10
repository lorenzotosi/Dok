import express, { type Request, type Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); // Per leggere i body in JSON (visto a lezione)

// Rotta di test (Health Check)
app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'Server funzionante!' });
});

// Avvio del server
app.listen(PORT, () => {
    console.log(`🚀 Server in esecuzione su http://localhost:${PORT}`);
});