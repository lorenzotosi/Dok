import { Server, Socket } from 'socket.io';
import * as Y from 'yjs';
import Document from '../models/Document.js';
import { activeDocuments } from './sync.types.js';
import { TiptapTransformer } from '@hocuspocus/transformer';
import { PresenceManager } from './presenceManager.js';
import type { AuthPayload } from "../middlewares/auth.middleware.js";
import jwt from "jsonwebtoken";
import { redisClient } from "../config/redis.js";
import { createAdapter } from "@socket.io/redis-adapter";

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';

const handleClientLeave = async (documentId: string) => {
  const state = activeDocuments.get(documentId);
  if (!state) return;

  state.clientsCount -= 1;

  if (state.clientsCount <= 0) {
    console.log(`[GC] Nessun client in ${documentId}. Pulizia memoria...`);
    if (state.saveTimeout) clearTimeout(state.saveTimeout);

    try {
      const finalBinaryState = Y.encodeStateAsUpdate(state.ydoc);
      const tiptapJson = TiptapTransformer.fromYdoc(state.ydoc, 'default' /*, [StarterKit] */);
      await Document.findByIdAndUpdate(documentId, {
        yjsState: Buffer.from(finalBinaryState),
        tiptapJson: tiptapJson
      });
      console.log(`[DB] Stato finale di ${documentId} salvato.`);
    } catch (error) {
      console.error(`[DB Errore] Salvataggio fallito per ${documentId}:`, error);
    }

    state.ydoc.destroy();
    activeDocuments.delete(documentId);
  }
};

export const setupSockets = async (io: Server) => {
  const pubClient = redisClient.duplicate();
  const subClient = redisClient.duplicate();

  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));

  PresenceManager.init(io);

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token;
    console.log(`[Socket Auth] Tentativo di connessione. Token ricevuto: ${token ? 'SI' : 'NO'}`);

    if (!token) {
      console.warn('[Socket Auth] Connessione rifiutata: Token mancante.');
      socket.data.user = { id: null, role: 'USER' };
      //return next(new Error('Autenticazione Socket fallita: Token mancante'));
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
      return next(new Error('Autenticazione Socket fallita: Token non valido'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.user?.id;
    if (userId) {
      console.log(`🟢 Nuovo client ACCOUNT connesso (ID: ${userId}): ${socket.id}`);
    } else {
      console.log(`🟢 Nuovo client GUEST connesso: ${socket.id}`);
    }

    const userRole = socket.data.user?.role;

    if (userId) {
      socket.join(`user:${userId}`);
      console.log(`[Socket] Utente ${userId} iscritto alla stanza privata: user:${userId}`);
      PresenceManager.addConnection(userId, socket.id);
      console.log(`[Presence] Stato interno aggiornato per UserID: ${userId}`);
    }

    socket.on('join_admin_dashboard', (callback?: () => void) => {
      if (userRole === 'ADMIN') {
        socket.join('admin:dashboard');
        console.log(`[ACL] Admin ${userId} iscritto agli aggiornamenti real-time.`);
        if (callback) callback();
      } else {
        console.warn(`[ACL] Utente ${userId} ha tentato di iscriversi come Admin senza permessi.`);
      }
    });

    socket.on('leave_admin_dashboard', () => {
      socket.leave('admin:dashboard');
    });

    socket.on('join-document', async (documentId: string) => {
      if (socket.rooms.has(documentId)) return;
      socket.join(documentId);

      if (!activeDocuments.has(documentId)) {
        const dbDoc = await Document.findById(documentId);

        if (!dbDoc) {
          socket.emit('error', { message: 'Documento non trovato' });
          return;
        }

        const ydoc = new Y.Doc();

        if (dbDoc && dbDoc.yjsState && dbDoc.yjsState.length > 0) {
          Y.applyUpdate(ydoc, new Uint8Array(dbDoc.yjsState));
        }

        activeDocuments.set(documentId, {
          ydoc,
          clientsCount: 1,
          saveTimeout: null
        });
        console.log(`📄 Documento ${documentId} caricato in RAM.`);
      } else {
        const state = activeDocuments.get(documentId)!;
        state.clientsCount += 1;
      }

      const state = activeDocuments.get(documentId)!;
      socket.emit('sync-document', Y.encodeStateAsUpdate(state.ydoc));
    });

    socket.on('crdt-update', ({ documentId, update }: { documentId: string, update: Uint8Array }) => {
      const state = activeDocuments.get(documentId);
      if (!state) return;

      Y.applyUpdate(state.ydoc, new Uint8Array(update));
      socket.to(documentId).emit('crdt-update', update);

      if (state.saveTimeout) clearTimeout(state.saveTimeout);

      state.saveTimeout = setTimeout(async () => {
        try {
          const binaryState = Y.encodeStateAsUpdate(state.ydoc);
          const tiptapJson = TiptapTransformer.fromYdoc(state.ydoc, 'default');
          await Document.findByIdAndUpdate(documentId, {
            yjsState: Buffer.from(binaryState),
            tiptapJson: tiptapJson
          });
          console.log(`💾 Documento ${documentId} persistito su DB dopo inattività.`);
        } catch (error) {
          console.error("Errore salvataggio debounced:", error);
        }
      }, 3000);
    });

    //multi cursor
    socket.on('awareness-update', ({ documentId, update }: { documentId: string, update: any }) => {
      socket.to(documentId).emit('awareness-update', update);
    });

    socket.on('leave-document', async (documentId: string) => {
      if (!socket.rooms.has(documentId)) return;
      socket.leave(documentId);
      await handleClientLeave(documentId);
    });

    socket.on('disconnecting', async () => {
      const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
      for (const documentId of rooms) {
        await handleClientLeave(documentId);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.io] Utente DISCONNESSO. SocketID: ${socket.id}. Motivo: ${reason}`);
      if (userId) {
        PresenceManager.removeConnection(userId, socket.id);
      }
      console.log(`🔴 Client disconnesso: ${socket.id}`);
    });

    //socket.on('join-private-dashboard', () => {
    //  socket.join('private-dashboard');
    //});

    socket.on('join-public-dashboard', () => {
      socket.join('global-dashboard');
      console.log(`[Real-time] Utente ${socket.id} monitora la dashboard pubblica`);
    });

    socket.on('join-shared-dashboard', () => {
      socket.join('shared-dashboard');
      console.log(`[Real-time] Utente ${socket.id} monitora la dashboard condivisa`);
    });

  });

};