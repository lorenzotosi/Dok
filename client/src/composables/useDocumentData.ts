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
      // Evitiamo aggiornamenti se i dati sono identici per prevenire re-render inutili
      // che possono causare errori nel DOM di Tiptap (insertBefore null)
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

    if (incomingId === documentId) {
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

  onMounted(() => {
    const socket = socketService.getSocket();
    if (socket) {
      socket.on('document-shared', handleDocumentUpdate);
      socket.on('document-renamed', handleDocumentUpdate);
      socket.on('document-unshared', handleDocumentUnshared);
    }
  });

  onBeforeUnmount(() => {
    const socket = socketService.getSocket();
    if (socket) {
      socket.off('document-shared', handleDocumentUpdate);
      socket.off('document-renamed', handleDocumentUpdate);
      socket.off('document-unshared', handleDocumentUnshared);
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
