// apps/server/src/index.ts
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import fileRoutes from './routes/fileRoutes.js';

// Importiamo i contratti (DTO) dal nostro pacchetto shared
import type { ClientToServerEvents, ServerToClientEvents } from 'shared';

// Carica variabili d'ambiente
dotenv.config();

const app = express();
// Pattern: Wrapping dell'istanza Express nel server HTTP nativo
const server = http.createServer(app);

// Configurazione Middlewares REST
app.use(cors());
app.use(express.json()); // Parsing del body in JSON

// Pattern: Pub/Sub & Heartbeat tramite Socket.io
// Tipizziamo rigorosamente il server con i nostri DTO condivisi
const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, any, any>(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173', // URL standard di Vite
        methods: ['GET', 'POST']
    },
    // Heartbeat configurato: ping ogni 25s per rilevare client disconnessi
    pingInterval: 25000,
    pingTimeout: 20000
});

// Connessione a MongoDB (Archivio a lungo termine)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/drive_clone_crdt';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ Connesso a MongoDB (Database Documentale).');
        console.log('   Pronto per gestire Eventual Consistency e Optimistic Locking.');
    })
    .catch((err) => {
        console.error('❌ Errore di connessione a MongoDB:', err);
        process.exit(1);
    });

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Il server distribuito è operativo.' });
});

app.use('/api/files', fileRoutes);

// ==========================================
// REGISTRAZIONE SOCKET HANDLERS (Pub/Sub)
// ==========================================
io.on('connection', (socket: any) => {
    console.log(`🔌 Nuovo client connesso (Trasporto Binario): ${socket.id}`);

    // Iscrizione a un "Topic" (Room di Socket.io) per un documento specifico
    socket.on('joinDocument', (documentId: string) => {
        socket.join(documentId);
        console.log(`Client ${socket.id} è entrato nella stanza del documento: ${documentId}`);
        // Qui in futuro caricheremo lo stato Y.js in memoria (RAM) se non esiste,
        // e faremo il fetch "Eventually Consistent" da MongoDB.
    });

    socket.on('disconnect', (reason: string) => {
        console.log(`❌ Client disconnesso: ${socket.id} (Motivo: ${reason})`);
    });
});

// Avvio del server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server in ascolto sulla porta ${PORT}`);
});