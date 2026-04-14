import { Server, Socket } from 'socket.io';
import * as Y from 'yjs';
import Document from '../models/Document.js'; // Il nostro modello Mongoose

// PATTERN: In-Memory Cache
// Manteniamo i documenti attivi in RAM per non interrogare MongoDB ad ogni lettera digitata
const activeDocuments = new Map<string, Y.Doc>();

// Manteniamo traccia dei timer di salvataggio per il Debouncing
const saveTimers = new Map<string, NodeJS.Timeout>();

export const setupSockets = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`🟢 Nuovo client connesso: ${socket.id}`);

    // 1. IL CLIENT ENTRA NELLA STANZA
    socket.on('join-document', async (documentId: string) => {
      socket.join(documentId);
      
      // Controlliamo se il documento è già "sveglio" nella RAM del server
      let ydoc = activeDocuments.get(documentId);

      // Se non è in RAM, lo carichiamo da MongoDB
      if (!ydoc) {
        ydoc = new Y.Doc();
        try {
          const dbDoc = await Document.findById(documentId);
          // Se nel DB c'è uno stato binario precedente, lo applichiamo al nostro Y.Doc
          if (dbDoc && dbDoc.yjsState && dbDoc.yjsState.length > 0) {
            Y.applyUpdate(ydoc, new Uint8Array(dbDoc.yjsState));
          }
          activeDocuments.set(documentId, ydoc);
          console.log(`📄 Documento ${documentId} caricato in RAM.`);
        } catch (error) {
          console.error("Errore nel caricamento del documento dal DB:", error);
        }
      }

      // STATE SYNC: Inviamo tutto il documento aggiornato al client appena arrivato!
      // Questo risolve il problema della pagina vuota.
      const stateVector = Y.encodeStateAsUpdate(ydoc);
      socket.emit('sync-document', stateVector);
    });

    // 2. IL CLIENT INVIA UNA MODIFICA (CRDT)
    socket.on('crdt-update', ({ documentId, update }: { documentId: string, update: ArrayBuffer }) => {
      // A. Broadcaster: Inoltriamo istantaneamente agli altri per la bassa latenza
      socket.broadcast.to(documentId).emit('crdt-update', update);

      // B. Aggiorniamo la RAM del server
      const ydoc = activeDocuments.get(documentId);
      if (ydoc) {
        Y.applyUpdate(ydoc, new Uint8Array(update));

        // C. PATTERN: Debouncing (Write-Behind Cache)
        // Cancelliamo il salvataggio precedente se l'utente sta ancora scrivendo
        clearTimeout(saveTimers.get(documentId));
        
        // Impostiamo un nuovo timer di 3 secondi (3000ms)
        const timer = setTimeout(async () => {
          try {
            const binaryState = Y.encodeStateAsUpdate(ydoc);
            // Salviamo lo stato binario su MongoDB
            await Document.findByIdAndUpdate(documentId, {
              yjsState: Buffer.from(binaryState)
            });
            console.log(`💾 Documento ${documentId} persistito su DB dopo inattività.`);
          } catch (error) {
            console.error("Errore salvataggio DB:", error);
          }
        }, 3000);
        
        saveTimers.set(documentId, timer);
      }
    });

    // 3. AWARENESS SYNC (MULTI-CURSORI)
    socket.on('awareness-update', ({ documentId, update }: { documentId: string, update: ArrayBuffer }) => {
      socket.broadcast.to(documentId).emit('awareness-update', update);
    });

    // 4. IL CLIENT ESCE DALLA STANZA
    socket.on('leave-document', (documentId: string) => {
      socket.leave(documentId);
    });

    socket.on('disconnect', () => {
      console.log(`🔴 Client disconnesso: ${socket.id}`);
    });
  });
};