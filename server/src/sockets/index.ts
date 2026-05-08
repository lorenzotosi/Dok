import { Server, Socket } from 'socket.io';
import jwt from "jsonwebtoken";
import { createAdapter } from "@socket.io/redis-adapter";
import { redisClient } from "../config/redis.js";

import { PresenceManager } from './presenceManager.js';
import { NotificationManager } from './notificationManager.js';
import { registerDocumentHandlers } from './handlers/document.handler.js';
import { registerAdminHandlers } from './handlers/admin.handler.js';

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
    if (!token) return next(new Error('Autenticazione fallita: Token mancante'));

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      socket.data.user = { id: decoded.id, role: decoded.role };
      next();
    } catch (err) {
      next(new Error('Autenticazione fallita: Token non valido'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.user?.id;

    if (userId) {
      console.log(`🟢 Client connesso: ${socket.id} (User: ${userId})`);
      socket.join(`user:${userId}`);
      PresenceManager.addConnection(userId, socket.id);
    }

    registerAdminHandlers(io, socket);
    registerDocumentHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      if (userId) {
        PresenceManager.removeConnection(userId, socket.id);
      }
      console.log(`🔴 Client disconnesso: ${socket.id}. Motivo: ${reason}`);
    });
  });
};