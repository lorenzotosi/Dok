import { watch, onUnmounted, type Ref } from 'vue';
import { socketService } from '../services/socket.service';
import { useDocumentStore } from '../stores/document.stores';
import { useFolderStore } from '../stores/folder.store';
import { useAuthStore } from '../stores/auth.store';
import { useNotificationStore } from '../stores/notification.store';

export function useDashboardSockets(currentSection: Ref<'private' | 'public' | 'shared'>) {
  const documentStore = useDocumentStore();
  const folderStore = useFolderStore();
  const authStore = useAuthStore();
  const notificationStore = useNotificationStore();

  socketService.getSocket()?.on('role-changed', (newRole: 'USER' | 'ADMIN') => {
    const authStore = useAuthStore();
    if (authStore.user) {
      authStore.user.role = newRole;
      localStorage.setItem('user', JSON.stringify(authStore.user));

      alert(`Attenzione: Il tuo ruolo è stato modificato in ${newRole} da un Amministratore.`);

      if (newRole === 'USER' && window.location.pathname.startsWith('/admin')) {
        window.location.href = '/';
      }
    }
  });

  const handleGlobalDocumentCreated = (doc: any) => {
    if (!documentStore.documents.find(d => d._id === doc._id)) {
      documentStore.documents.unshift(doc);
    }
  };

  const handleGlobalDocumentDeleted = (deletedId: string) => {
    documentStore.documents = documentStore.documents.filter(d => d._id !== deletedId);
  };

  const handleGlobalDocumentRenamed = (updatedDoc: any) => {
    documentStore.documents = documentStore.documents.map(d =>
      d._id === updatedDoc._id ? { ...updatedDoc, myRole: d.myRole } : d
    );
  };

  const handleGlobalFolderCreated = (newFolder: any) => {
    if (!folderStore.folders.find(f => f._id === newFolder._id)) {
      folderStore.folders.unshift(newFolder);
    }
  };

  const handleGlobalFolderDeleted = (deletedId: string) => {
    folderStore.folders = folderStore.folders.filter(f => f._id !== deletedId);
  };

  const handleDocumentShared = (doc: any) => {
    const index = documentStore.documents.findIndex(d => d._id === doc._id);

    if (index !== -1) {
      documentStore.documents[index] = { ...doc };
    } else {
      if (currentSection.value === 'shared') {
        documentStore.documents.unshift(doc);
      }
    }
    console.log("SHare ricevuto!");
  };

  const handleDocumentUnshared = (documentId: string) => {
    const doc = documentStore.documents.find(d => d._id === documentId);

    if (currentSection.value === 'public' && doc?.visibility === 'public') {
      documentStore.documents = documentStore.documents.map(d =>
        d._id === documentId ? { ...d, myRole: null } : d
      );
    } else {
      documentStore.documents = documentStore.documents.filter(d => d._id !== documentId);
    }
  };

  const handleDocumentDeleted = (deletedId: string) => {
    documentStore.documents = documentStore.documents.filter(d => d._id !== deletedId);
  };

  const handleDocumentRenamed = (updatedDoc: any) => {
    documentStore.documents = documentStore.documents.map(d =>
      d._id === updatedDoc._id ? updatedDoc : d
    );
  };

  const handlePrivateDocumentCreated = (doc: any) => {
    documentStore.documents.unshift(doc);
  };

  const handlePrivateDocumentDeleted = (documentId: string) => {
    documentStore.documents = documentStore.documents.filter(d => d._id !== documentId);
  };

  const clearAllListeners = (socket: any) => {
    if (!socket) return;
    socket.off('global-document-created');
    socket.off('document-created');
    socket.off('global-document-deleted');
    socket.off('global-document-renamed');
    socket.off('global-folder-created');
    socket.off('global-folder-deleted');
    socket.off('document-shared');
    socket.off('document-unshared');
    socket.off('document-deleted');
    socket.off('document-renamed');
    socket.off('private-document-created');
    socket.off('private-document-deleted');
    socket.off('new-notification');
  };

  const registerListeners = (socket: any) => {
    if (currentSection.value === 'public') {
      socket.emit('join-public-dashboard');
      socket.on('global-document-created', handleGlobalDocumentCreated);
    }

    socket.on('global-document-deleted', handleGlobalDocumentDeleted);
    socket.on('global-document-renamed', handleGlobalDocumentRenamed);
    socket.on('global-folder-created', handleGlobalFolderCreated);
    socket.on('global-folder-deleted', handleGlobalFolderDeleted);

    socket.on('document-shared', handleDocumentShared);
    socket.on('document-unshared', handleDocumentUnshared);
    socket.on('document-deleted', handleDocumentDeleted);
    socket.on('document-renamed', handleDocumentRenamed);
    socket.on('private-document-created', handlePrivateDocumentCreated);
    socket.on('private-document-deleted', handlePrivateDocumentDeleted);

    socket.on('new-notification', (notif: any) => {
        notificationStore.addNotification(notif);
    });
  };

  const setupSocketSync = () => {
    socketService.connect(authStore.token || null);

    const socket = socketService.getSocket();
    if (!socket) return;

    clearAllListeners(socket);
    registerListeners(socket);
  };

  watch([currentSection, () => authStore.token], () => {
    setupSocketSync();
  }, { immediate: true });

  onUnmounted(() => {
    const socket = socketService.getSocket();
    clearAllListeners(socket);
  });
}
