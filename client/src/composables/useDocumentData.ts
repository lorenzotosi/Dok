import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../services/api';
import { socketService } from '../services/socket.service';

export function useDocumentData(documentId: string) {
  const router = useRouter();
  const documentData = ref<any>(null);
  const isLoading = ref(true);

  const fetchDocumentData = async () => {
    try {
      const response = await api.get(`/documents/${documentId}`);
      if (JSON.stringify(documentData.value) !== JSON.stringify(response.data)) {
        documentData.value = response.data;
      }
    } catch (error) {
      console.error("Errore nel caricamento del documento", error);
      alert("Documento non trovato!");
      router.push('/');
    } finally {
      isLoading.value = false;
    }
  };

  const handleDocumentUpdate = (doc: any) => {
    if ((doc._id === documentId || doc.id === documentId) && documentData.value) {
      let changed = false;
      for (const key in doc) {
        if (doc[key] !== documentData.value[key]) {
          changed = true;
          break;
        }
      }
      if (changed) {
        documentData.value = { ...documentData.value, ...doc };
      }
    }
  };

  const handleDocumentUnshared = (id: string) => {
    const incomingId = typeof id === 'object' ? (id as any).id || (id as any)._id : id;
    console.log("[Socket] Ricevuto document-unshared per ID:", incomingId, "Documento corrente:", documentId);

    if (incomingId === documentId && documentData.value.visibility === 'private') {
      documentData.value = null;

      alert("I permessi di accesso a questo documento ti sono stati revocati.");

      router.replace('/').then(() => {
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
      }).catch(() => {
        window.location.href = '/';
      });
    }
  };

  const handleCommentAdded = (comment: any) => {
    if (documentData.value) {
      if (!documentData.value.comments) {
        documentData.value.comments = [];
      }
      if (!documentData.value.comments.some((c: any) => c._id === comment._id)) {
        documentData.value.comments.push(comment);
      }
    }
  };

  const handleCommentDeleted = (commentId: string) => {
    if (documentData.value && documentData.value.comments) {
      documentData.value.comments = documentData.value.comments.filter((c: any) => c._id !== commentId);
    }
  };

  onMounted(() => {
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('join-document', documentId);
      socket.on('document-shared', handleDocumentUpdate);
      socket.on('document-renamed', handleDocumentUpdate);
      socket.on('document-unshared', handleDocumentUnshared);
      socket.on('comment-added', handleCommentAdded);
      socket.on('comment-deleted', handleCommentDeleted);
    }
  });

  onBeforeUnmount(() => {
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('leave-document', documentId);
      socket.off('document-shared', handleDocumentUpdate);
      socket.off('document-renamed', handleDocumentUpdate);
      socket.off('document-unshared', handleDocumentUnshared);
      socket.off('comment-added', handleCommentAdded);
      socket.off('comment-deleted', handleCommentDeleted);
    }
  });

  const handleRename = async () => {
    if (!documentData.value || !documentData.value.title.trim()) return;

    try {
      await api.put('/documents/rename', {
        id: documentId,
        newTitle: documentData.value.title
      });
    } catch (error) {
      console.error("Errore durante la rinomina del documento", error);
    }
  };

  return {
    documentData,
    isLoading,
    fetchDocumentData,
    handleRename
  };
}
