import { Server, Socket } from 'socket.io';
import * as Y from 'yjs';
import { TiptapTransformer } from '@hocuspocus/transformer';
import Document from '../../models/Document.js';
import AuditLog from '../../models/AuditLog.js';
import { activeDocuments, type ActiveDocState } from '../sync.types.js';

const pendingDocumentLoads = new Map<string, Promise<void>>();

const flushAuditLogs = async (documentId: string, state: ActiveDocState, io: Server) => {
    if (!state.pendingUserChars) return;

    for (const [userId, chars] of state.pendingUserChars.entries()) {
        if (chars.inserted > 0 || chars.deleted > 0) {
            try {
                const modLog = await AuditLog.create({
                    documentId,
                    userId,
                    type: 'modification',
                    charactersInserted: chars.inserted,
                    charactersDeleted: chars.deleted,
                });

                const populatedModLog = await modLog.populate('userId', 'firstName lastName email _id');
                const safeLog = JSON.parse(JSON.stringify(populatedModLog.toObject({ virtuals: true })));
                io.to(`admin_logs:${documentId}`).emit('new_audit_log', safeLog);
            } catch (err) {
                console.error("[Log Flush] Errore salvataggio log aggregati:", err);
            }
        }
    }
    state.pendingUserChars.clear();
};

export const flushAllDocumentsOnShutdown = async () => {
    console.log(`[Shutdown - CRDT] Avviato flush di ${activeDocuments.size} documenti in RAM...`);
    const promises = Array.from(activeDocuments.entries()).map(async ([documentId, state]) => {
        if (state.saveTimeout) clearTimeout(state.saveTimeout);
        try {
            const finalBinaryState = Y.encodeStateAsUpdate(state.ydoc);
            const tiptapJson = TiptapTransformer.fromYdoc(state.ydoc, 'default');

            await Document.findByIdAndUpdate(documentId, {
                yjsState: Buffer.from(finalBinaryState),
                tiptapJson: tiptapJson
            });
            console.log(`[Shutdown - CRDT] Documento ${documentId} persistito.`);
        } catch (error) {
            console.error(`[Shutdown - Errore CRDT] Fallito salvataggio per ${documentId}:`, error);
        } finally {
            state.ydoc.destroy();
        }
    });
    await Promise.all(promises);
    activeDocuments.clear();
};

const getDocTotalLength = (node: any): number => {
    let len = 0;
    if (node instanceof Y.XmlText || node instanceof Y.Text) {
        return node.length;
    } else if (node instanceof Y.XmlElement) {
        len += 1;
        if (typeof node.toArray === 'function') {
            node.toArray().forEach((child: any) => {
                len += getDocTotalLength(child);
            });
        }
    } else if (node instanceof Y.XmlFragment) {
        if (typeof node.toArray === 'function') {
            node.toArray().forEach((child: any) => {
                len += getDocTotalLength(child);
            });
        }
    } else {
        return 1;
    }
    return len;
};

const handleClientLeave = async (documentId: string, io: Server) => {
    const state = activeDocuments.get(documentId);
    if (!state) return;

    state.clientsCount -= 1;

    if (state.clientsCount <= 0) {
        console.log(`[GC] Nessun client in ${documentId}. Pulizia memoria...`);
        if (state.saveTimeout) clearTimeout(state.saveTimeout);

        if (state.isDirty) {
            if (state.isDirty) {
                const finalBinaryState = Y.encodeStateAsUpdate(state.ydoc);
                const tiptapJson = TiptapTransformer.fromYdoc(state.ydoc, 'default');

                Document.findByIdAndUpdate(documentId, {
                    yjsState: Buffer.from(finalBinaryState),
                    tiptapJson: tiptapJson
                }).then(() => {
                    return flushAuditLogs(documentId, state, io);
                }).then(() => {
                    console.log(`[DB] Stato finale e log di ${documentId} salvati.`);
                }).catch(error => {
                    console.error(`[DB Errore] Salvataggio fallito per ${documentId}:`, error);
                });
            } else {
                console.log(`[DB] Nessuna modifica locale per ${documentId}. Salvataggio ignorato.`);
            }

            state.destroyTimer = setTimeout(() => {
                const currentState = activeDocuments.get(documentId);
                if (currentState && currentState.clientsCount <= 0) {
                    console.log(`[GC] Grace period scaduto per ${documentId}. Pulizia definitiva della memoria.`);
                    currentState.ydoc.destroy();
                    activeDocuments.delete(documentId);
                }
            }, 10000);
        }
    }
};

const createDokAccessLog = async (userId: any, documentId: string, io: Server ) => {
    if (userId) {
        try {
            const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
            const recentLog = await AuditLog.findOne({
                documentId,
                userId,
                type: 'access',
                createdAt: { $gte: fiveMinsAgo }
            });

            if (!recentLog) {
                const log = await AuditLog.create({ documentId, userId, type: 'access' });
                const populatedLog = await log.populate('userId', 'firstName lastName email _id');

                const safeLog = JSON.parse(JSON.stringify(populatedLog.toObject({ virtuals: true })));
                io.to(`admin_logs:${documentId}`).emit('new_audit_log', safeLog);
            }
        } catch (err) {
            console.error("[Join] Errore salvataggio log di accesso:", err);
        }
    }
}

export const registerDocumentHandlers = (io: Server, socket: Socket) => {
    socket.on('join-document', async (documentId: string) => {
        if (socket.rooms.has(documentId)) return;
        socket.join(documentId);

        const userId = socket.data?.user?.id;
        await createDokAccessLog(userId, documentId, io)

        if (!activeDocuments.has(documentId)) {
            if (pendingDocumentLoads.has(documentId)) {
                await pendingDocumentLoads.get(documentId);
            } else {
                const loadPromise = (async () => {
                    const docFromDb = await Document.findById(documentId);
                    if (!docFromDb) {
                        throw new Error('Documento non trovato');
                    }
                    const ydoc = new Y.Doc();
                    if (docFromDb.yjsState && docFromDb.yjsState.length > 0) {
                        Y.applyUpdate(ydoc, new Uint8Array(docFromDb.yjsState));
                    }

                    activeDocuments.set(documentId, {
                        ydoc,
                        clientsCount: 0,
                        saveTimeout: null,
                        hasLogObserver: false,
                        pendingUserChars: new Map<string, { inserted: number, deleted: number }>(),
                        isDirty: false,
                    });
                })();
                pendingDocumentLoads.set(documentId, loadPromise);

                try {
                    await loadPromise;
                } catch (error) {
                    socket.emit('error', { message: (error as Error).message });
                    pendingDocumentLoads.delete(documentId);
                    return;
                }
                pendingDocumentLoads.delete(documentId);
            }
        }

        const state = activeDocuments.get(documentId)!;
        if (state.destroyTimer) {
            clearTimeout(state.destroyTimer);
            state.destroyTimer = null;
            console.log(`[GC] Failover mascherato, timer di distruzione annullato per ${documentId}`);
        }
        state.clientsCount += 1;

        if (!state.hasLogObserver) {
            state.hasLogObserver = true;
            if (!state.pendingUserChars) state.pendingUserChars = new Map<string, { inserted: number, deleted: number }>;

            const xmlFragment = state.ydoc.getXmlFragment('default');

            const countAdded = (insertOp: any): number => {
                if (typeof insertOp === 'string') return insertOp.length;
                if (Array.isArray(insertOp)) {
                    let count = 0;
                    insertOp.forEach((node: any) => {
                        if (node instanceof Y.XmlText || node instanceof Y.Text) {
                            count += node.length;
                        } else if (node instanceof Y.XmlElement) {
                            count += 1;
                            if (typeof node.toArray === 'function') {
                                count += countAdded(node.toArray());
                            }
                        } else {
                            count += 1;
                        }
                    });
                    return count;
                }
                if (typeof insertOp === 'object' && insertOp !== null) return 1;
                return 0;
            };

            xmlFragment.observeDeep((events, transaction) => {
                try {
                    const originUserId = transaction.origin;

                    if (typeof originUserId === 'string') {
                        let insertedChars = 0;

                        events.forEach(event => {
                            event.delta.forEach(op => {
                                if (op.insert) {
                                    insertedChars += countAdded(op.insert);
                                }
                            });
                        });

                        if (insertedChars > 0) {
                            const current = state.pendingUserChars!.get(originUserId) || { inserted: 0, deleted: 0 };
                            state.pendingUserChars!.set(originUserId, {
                                inserted: current.inserted + insertedChars,
                                deleted: current.deleted,
                            });
                        }
                    }
                } catch (obsError) {
                    console.error("[Observer Warning] Errore innocuo ignorato nel conteggio log:", obsError);
                }
            });
        }

        socket.emit('sync-document', Y.encodeStateAsUpdate(state.ydoc));
    });

    socket.on('crdt-update', ({ documentId, update }: { documentId: string, update: Uint8Array }) => {
        const state = activeDocuments.get(documentId);
        const userId = socket.data?.user?.id;

        if (state) {
            state.isDirty = true;
            let lenBefore = 0;
            let insertedBefore = 0;

            if (userId) {
                const fragment = state.ydoc.getXmlFragment('default');
                lenBefore = getDocTotalLength(fragment);
                const currentStats = state.pendingUserChars!.get(userId) || { inserted: 0, deleted: 0 };
                insertedBefore = currentStats.inserted;
            }

            try {
                Y.applyUpdate(state.ydoc, new Uint8Array(update), userId || 'unknown');
            } catch (err) {
                console.error(`[CRDT Fatal] Impossibile applicare l'update per ${documentId}:`, err);
                return;
            }

            if (userId) {
                const fragment = state.ydoc.getXmlFragment('default');
                const lenAfter = getDocTotalLength(fragment);
                const currentStatsAfter = state.pendingUserChars!.get(userId) || { inserted: 0, deleted: 0 };
                const insertedAfter = currentStatsAfter.inserted;

                const newlyInserted = insertedAfter - insertedBefore;
                const newlyDeleted = lenBefore + newlyInserted - lenAfter;

                if (newlyDeleted > 0) {
                    state.pendingUserChars!.set(userId, {
                        inserted: currentStatsAfter.inserted,
                        deleted: currentStatsAfter.deleted + newlyDeleted
                    });
                }
            }

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

                    await flushAuditLogs(documentId, state, io);
                    state.isDirty = false;
                    console.log(`💾 Documento ${documentId} persistito su DB dopo inattività.`);
                } catch (error) {
                    console.error("[Salvataggio DB] Errore nel salvataggio debounced:", error);
                }
            }, 3000);
        }
    });

    socket.on('awareness-update', ({ documentId, update }: { documentId: string, update: any }) => {
        socket.to(documentId).emit('awareness-update', update);
    });

    socket.on('leave-document', async (documentId: string) => {
        if (!socket.rooms.has(documentId)) return;
        await handleClientLeave(documentId, io);
        socket.leave(documentId);
    });

    socket.on('disconnecting', async () => {
        const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
        for (const documentId of rooms) {
            await handleClientLeave(documentId, io);
        }
    });

    socket.on('join-public-dashboard', () => {
        socket.join('global-dashboard');
    });

    socket.on('join-shared-dashboard', () => {
        socket.join('shared-dashboard');
    });
};