import { ref, onBeforeUnmount } from 'vue';
import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';
import * as awarenessProtocol from 'y-protocols/awareness';
import { io } from 'socket.io-client';

export function useCollaboration(documentId: string, token?: string) {
  const ydoc = new Y.Doc();

  const socket = io('http://localhost:3000', {
      auth: { token: token || null },
      query: { documentId },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
  });

  socket.emit('join-document', documentId);

  const handleSyncDocument = (fullState: ArrayBuffer) => {
    Y.applyUpdate(ydoc, new Uint8Array(fullState));
  };
  socket.on('sync-document', handleSyncDocument);

  ydoc.on('update', (update: Uint8Array) => {
    socket.emit('crdt-update', { 
      documentId, 
      update 
    });
  });

  const handleCrdtUpdate = (update: ArrayBuffer) => {
    Y.applyUpdate(ydoc, new Uint8Array(update));
  };
  socket.on('crdt-update', handleCrdtUpdate);

  const getRandomColor = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  const awareness = new Awareness(ydoc);
  const provider = { awareness };

  const handleAwarenessUpdate = (update: ArrayBuffer) => {
    awarenessProtocol.applyAwarenessUpdate(awareness, new Uint8Array(update), socket);
  };
  socket.on('awareness-update', handleAwarenessUpdate);

  const activeUsers = ref<string[]>([]);

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

  awareness.on('update', ({ added, updated, removed }: any) => {
    const changedClients = added.concat(updated, removed);
    const update = awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients);
    socket.emit('awareness-update', { documentId, update });
    updateActiveUsers();
  });

  onBeforeUnmount(() => {
    if (socket) {
      socket.emit('leave-document', documentId);
      socket.off('sync-document', handleSyncDocument);
      socket.off('crdt-update', handleCrdtUpdate);
      socket.off('awareness-update', handleAwarenessUpdate);
      socket.disconnect();
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
