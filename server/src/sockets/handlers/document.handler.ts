import { Server, Socket } from 'socket.io';
import * as Y from 'yjs';
import { TiptapTransformer } from '@hocuspocus/transformer';
import Document from '../../models/Document.js';
import { activeDocuments } from '../sync.types.js';

const handleClientLeave = async (documentId: string) => {
    const state = activeDocuments.get(documentId);
    if (!state) return;

    state.clientsCount -= 1;

    if (state.clientsCount <= 0) {
        console.log(`[GC] Nessun client in ${documentId}. Pulizia memoria...`);
        if (state.saveTimeout) clearTimeout(state.saveTimeout);

        try {
            const finalBinaryState = Y.encodeStateAsUpdate(state.ydoc);
            const tiptapJson = TiptapTransformer.fromYdoc(state.ydoc, 'default');
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

export const registerDocumentHandlers = (io: Server, socket: Socket) => {
    socket.on('join-document', async (documentId: string) => {
        socket.join(documentId);

        if (!activeDocuments.has(documentId)) {
            const docFromDb = await Document.findById(documentId);
            const ydoc = new Y.Doc();
            if (docFromDb?.yjsState) {
                Y.applyUpdate(ydoc, new Uint8Array(docFromDb.yjsState));
            }
            activeDocuments.set(documentId, { ydoc, clientsCount: 0 });
        }

        const state = activeDocuments.get(documentId)!;
        state.clientsCount += 1;

        const currentUpdate = Y.encodeStateAsUpdate(state.ydoc);
        socket.emit('document-init', currentUpdate);
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
            } catch (error) {
                console.error("Errore salvataggio asincrono:", error);
            }
        }, 3000);
    });

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
            if (documentId.length > 15) {
                await handleClientLeave(documentId);
            }
        }
    });
};