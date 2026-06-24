import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import { setupSockets } from './sockets/index.js';
import { app } from './app.js';
import {connectRedis} from "./config/redis.js";

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