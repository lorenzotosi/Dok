import express, { type Request, type Response } from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import apiRoutes from './routes/api.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

connectDB();

app.use('/api', apiRoutes);

app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'Server funzionante!' });
});

app.listen(PORT, () => {
    console.log(`Server in esecuzione su http://localhost:${PORT}`);
});