import { Server, Socket } from 'socket.io';
import jwt from "jsonwebtoken";
import { createAdapter } from "@socket.io/redis-adapter";
import { redisClient } from "../config/redis.js";

import { PresenceManager } from './presenceManager.js';
import { NotificationManager } from './notificationManager.js';
import { registerDocumentHandlers } from './handlers/document.handler.js';
import { registerAdminHandlers } from './handlers/admin.handler.js';
import type {AuthPayload} from "../middlewares/auth.middleware.js";

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';

export const setupSockets = async (io: Server) => {

  const pubClient = redisClient.duplicate();
  const subClient = redisClient.duplicate();
  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));

  PresenceManager.init(io);
  NotificationManager.init(io);

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      console.warn('[Socket Auth] Connessione rifiutata: Token mancante.');
      socket.data.user = { id: null, role: 'USER' };
      console.log("[Socket Auth] Utente GUEST connesso.");
      return next();
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
      socket.data.user = { id: decoded.id, role: decoded.role };
      console.log(`[Socket Auth] Token valido. Utente ID decodificato: ${decoded.id}`);
      next();
    } catch (err: any) {
      console.error(`[Socket Auth] Token NON valido: ${err.message}`);
      next(new Error('Autenticazione fallita: Token non valido'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.user?.id;
    if (userId) {
      console.log(`🟢 Nuovo client ACCOUNT connesso (ID: ${userId}): ${socket.id}`);
    } else {
      console.log(`🟢 Nuovo client GUEST connesso: ${socket.id}`);
    }

    if (userId) {
      socket.join(`user:${userId}`);
      console.log(`[Socket] Utente ${userId} iscritto alla stanza privata: user:${userId}`);
      PresenceManager.addConnection(userId, socket.id);
      console.log(`[Presence] Stato interno aggiornato per UserID: ${userId}`);

    }

    registerAdminHandlers(io, socket);
    registerDocumentHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.io] Utente DISCONNESSO. SocketID: ${socket.id}. Motivo: ${reason}`);
      if (userId) {
        PresenceManager.removeConnection(userId, socket.id);
      }
      console.log(`🔴 Client disconnesso: ${socket.id}. Motivo: ${reason}`);
    });
  });
};