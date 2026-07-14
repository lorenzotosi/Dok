import {UserModel} from '../models/User.js';
import type {Server} from "socket.io";

let ioInstance: Server;
let isShuttingDown = false;
const localUserSessions = new Map<string, Set<string>>();

export const PresenceManager = {

    init(io: Server) {
        ioInstance = io;
        isShuttingDown = false;
        localUserSessions.clear();
    },

    setShuttingDown() {
        console.log("[Presence] Scudo RAM: blocco dei timeout asincroni individuali.");
        isShuttingDown = true;
    },

    async addConnection(userId: string, socketId: string): Promise<void> {
        if (isShuttingDown) return;

        if (!localUserSessions.has(userId)) {
            localUserSessions.set(userId, new Set());
        }
        localUserSessions.get(userId)!.add(socketId);

        try {
            if (!ioInstance) return;
            const sockets = await ioInstance.in(`user:${userId}`).fetchSockets();
            
            if (sockets.length === 1) {
                ioInstance.to('admin:dashboard').emit('presence_update', {
                    userId,
                    isOnline: true
                });
            }

            console.log(`[Presence] (Adapter) Aggiunto Socket ${socketId} per User ${userId}, Sockets attivi: ${sockets.length}`);
        } catch (error) {
            console.error(`[Presence Error] (Adapter) Fallita addConnection:`, error);
        }
    },

    async removeConnection(userId: string, socketId: string): Promise<void> {
        if (isShuttingDown) return;

        const userSockets = localUserSessions.get(userId);
        if (userSockets) {
            userSockets.delete(socketId);
            if (userSockets.size === 0) {
                localUserSessions.delete(userId);
            }
        }

        try {
            setTimeout(async () => {
                try {
                    if (!ioInstance) return;
                    const sockets = await ioInstance.in(`user:${userId}`).fetchSockets();

                    if (sockets.length === 0) {
                        const now = new Date();
                        await UserModel.findByIdAndUpdate(userId, { lastSeen: now });

                        ioInstance.to('admin:dashboard').emit('presence_update', {
                            userId,
                            isOnline: false,
                            lastSeen: now.toISOString()
                        });
                        console.log(`[Presence] Utente ${userId} è definitivamente offline.`);
                    } else {
                        console.log(`[Presence] Disconnessione annullata per ${userId} (Network Flap gestito o multi-device). Sockets rimasti: ${sockets.length}`);
                    }
                } catch (err) {
                    console.error(`[Presence] Errore nel Grace Period per ${userId}:`, err);
                }
            }, 3000);

        } catch (error) {
            console.error(`[Presence] Adapter Error:`, error);
        }
    },

    async flushPresenceOnShutdown(): Promise<void> {
        console.log(`[Shutdown - Presence] Flushing di ${localUserSessions.size} utenti dalla RAM al DB...`);

        if (localUserSessions.size === 0) return;

        try {
            const now = new Date();
            const userIdsArray = Array.from(localUserSessions.keys());

            await UserModel.updateMany(
                { _id: { $in: userIdsArray } },
                { lastSeen: now }
            );

            console.log(`[Shutdown - Presence] Stato di ${userIdsArray.length} utenti salvato.`);
            localUserSessions.clear();
        } catch (error) {
            console.error("[Shutdown - Errore Presence] Impossibile completare il flush:", error);
        }
    },

    async isUserOnline(userId: string): Promise<boolean> {
        try {
            if (!ioInstance) return false;
            const sockets = await ioInstance.in(`user:${userId}`).fetchSockets();
            return sockets.length > 0;
        } catch (error) {
            console.error(`[Presence Error] (Adapter) Fallita isUserOnline:`, error);
            return false;
        }
    },

    async getOnlineUsers(userIds: string[]): Promise<Set<string>> {
        try {
            if (!ioInstance || userIds.length === 0) return new Set();
            const rooms = userIds.map(id => `user:${id}`);
            const sockets = await ioInstance.in(rooms).fetchSockets();
            
            const onlineUsers = new Set<string>();
            for (const socket of sockets) {
                for (const room of socket.rooms) {
                    if (room.startsWith('user:')) {
                        onlineUsers.add(room.substring(5));
                    }
                }
            }
            return onlineUsers;
        } catch (error) {
            console.error(`[Presence Error] (Adapter) Fallita getOnlineUsers:`, error);
            return new Set();
        }
    }
};