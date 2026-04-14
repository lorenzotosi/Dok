// server/src/index.ts
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import { setupSockets } from './sockets/index.js';
import { app } from './app.js'; // Importiamo l'app pulita

const PORT = process.env.PORT || 3000;

//connessione al database
connectDB();

// creazione server HTTP
const httpServer = createServer(app);

//config Socket.io
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

setupSockets(io);

//Letsgonski Letsgo
httpServer.listen(PORT, () => {
    console.log(`Server in esecuzione su http://localhost:${PORT}`);
});