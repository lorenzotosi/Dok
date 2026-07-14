import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import { setupSockets } from './sockets/index.js';
import { app } from './app.js';
import {connectRedis, redisClient} from "./config/redis.js";
import { flushAllDocumentsOnShutdown } from './sockets/handlers/document.handler.js';
import { PresenceManager } from './sockets/presenceManager.js';
import mongoose from "mongoose";

const PORT = process.env.PORT || 3000;

await connectRedis();
connectDB();
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

app.set('io', io);

await setupSockets(io);

httpServer.listen(PORT, () => {
    console.log(`Server in esecuzione su http://localhost:${PORT}`);
});

async function handleGracefulShutdown(signal: string) {
    PresenceManager.setShuttingDown();

    console.log(`\n🛑 [${signal}] Ricevuto segnale di terminazione. Avvio pipeline di spegnimento...`);

    httpServer.close(async (err) => {
        if (err) console.error("[Shutdown] Errore durante la chiusura del server HTTP:", err);
        console.log("[Shutdown] Server HTTP chiuso. Il Load Balancer instraderà i client sul nodo superstite.");

        try {
            await PresenceManager.flushPresenceOnShutdown();
            await flushAllDocumentsOnShutdown();

            console.log("[Shutdown] Disconnessione dei client WebSocket locali...");
            io.close();

            console.log("[Shutdown] Disconnessione da Redis e MongoDB...");
            if (redisClient.isOpen) {
                await redisClient.quit();
            }
            if (mongoose.connection.readyState === 1) {
                await mongoose.connection.close();
            }

            console.log("[Shutdown] Pipeline completata senza perdite di dati. Processo terminato.");
            process.exit(0);
        } catch (shutdownError) {
            console.error("[Shutdown Fatal] Errore critico durante la pipeline:", shutdownError);
            process.exit(1);
        }
    });

    setTimeout(() => {
        console.error("⚠️ [Shutdown Force] Spegnimento bloccato (Timeout 10s). Forzatura uscita!");
        process.exit(1);
    }, 10000);
}

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM')); // Inviato da Orchestrator Docker
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));   // Inviato da Terminale (CTRL+C)