//questo file si occupa esclusivamente di configurare Express (middleware, rotte ecc...)
//non deve sapere nulla di WebSocket!

import express, { type Request, type Response } from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';

export const app = express();

app.use(cors());
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api', apiRoutes);

app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'Server funzionante!' });
});