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

    const watchdog = setTimeout(() => {
        console.error("[Shutdown Force] Spegnimento bloccato (Timeout). Forzatura uscita!");
        process.exit(1);
    }, 8000);

    try {
        await PresenceManager.flushPresenceOnShutdown();
        await flushAllDocumentsOnShutdown();

        console.log("[Shutdown] Disconnessione forzata dei client e stop al server HTTP...");
        io.close();

        console.log("[Shutdown] Disconnessione da Redis e MongoDB...");
        if (redisClient.isOpen) {
            await redisClient.quit();
        }
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }

        clearTimeout(watchdog);
        console.log("[Shutdown] Pipeline completata senza perdite di dati. Processo terminato.");
        process.exit(0);
    } catch (shutdownError) {
        console.error("[Shutdown Fatal] Errore critico durante la pipeline:", shutdownError);
        process.exit(1);
    }
}

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM')); // Inviato da Orchestrator Docker
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));   // Inviato da Terminale (CTRL+C)