import { ref, onBeforeUnmount, onMounted } from 'vue';
import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';
import * as awarenessProtocol from 'y-protocols/awareness';
import { io, Socket } from 'socket.io-client';

export function useCollaboration(documentId: string, token?: string) {
  const ydoc = new Y.Doc();
  const awareness = new Awareness(ydoc);
  const provider = { awareness };
  const activeUsers = ref<string[]>([]);

  const socket: Socket = io('http://localhost:3000', {
    auth: { token: token || null },
    query: { documentId },
    transports: ['websocket'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });

  const handleReconnection = () => {
    console.log(`[Network] Riconnessione rilevata. Ripristino del Contesto Computazionale per ${documentId}`);
    socket.emit('join-document', documentId);
  };

  const handleSyncDocument = (fullState: ArrayBuffer) => {
    Y.applyUpdate(ydoc, new Uint8Array(fullState));

    const localState = Y.encodeStateAsUpdate(ydoc);
    socket.emit('crdt-update', {
      documentId: documentId,
      update: localState
    });
  };

  const handleCrdtUpdate = (update: ArrayBuffer) => {
    Y.applyUpdate(ydoc, new Uint8Array(update));
  };

  const handleAwarenessUpdate = (update: ArrayBuffer) => {
    awarenessProtocol.applyAwarenessUpdate(awareness, new Uint8Array(update), socket);
  };

  const updateActiveUsers = () => {
    const states = awareness.getStates();
    const names: string[] = [];
    states.forEach((state, clientId) => {
      if (clientId !== awareness.clientID && state?.user?.name) {
        const name = state.user.name as string;
        if (!names.includes(name)) {
          names.push(name);
        }
      }
    });
    activeUsers.value = names;
  };

  const getRandomColor = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');

  ydoc.on('update', (update: Uint8Array) => {
    socket.emit('crdt-update', { documentId, update });
  });

  awareness.on('update', ({ added, updated, removed }: any) => {
    const changedClients = added.concat(updated, removed);
    const update = awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients);
    socket.emit('awareness-update', { documentId, update });
    updateActiveUsers();
  });

  onMounted(() => {
    socket.on('connect', handleReconnection);
    socket.on('sync-document', handleSyncDocument);
    socket.on('crdt-update', handleCrdtUpdate);
    socket.on('awareness-update', handleAwarenessUpdate);

    socket.emit('join-document', documentId);

    if (socket.connected) {
      handleReconnection();
    }
  });

  onBeforeUnmount(() => {
    if (socket) {
      socket.emit('leave-document', documentId);
      socket.off('connect', handleReconnection);
      socket.off('sync-document', handleSyncDocument);
      socket.off('crdt-update', handleCrdtUpdate);
      socket.off('awareness-update', handleAwarenessUpdate);
      socket.disconnect();
    }

    if (awareness) {
      awareness.destroy();
    }
    if (ydoc) {
      ydoc.destroy();
    }
  });

  return {
    ydoc,
    provider,
    activeUsers,
    getRandomColor
  };
}