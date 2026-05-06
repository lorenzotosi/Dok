import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '../services/api';

export interface IDocument {
    _id: string;
    title: string;
    folderId: string | null;
    ownerId: any; 
    visibility: 'private' | 'public';
    myRole?: 'editor' | 'viewer' | null;
    yjsState: any;
    tiptapJson: Record<string, any>;
    createdAt?: string;
    updatedAt?: string;
}

export const useDocumentStore = defineStore('document', () => {
    const documents = ref<IDocument[]>([]);

    const fetchDocuments = async (parentId: string | null = null) => {
        try {
            const response = await api.get('/documents', { params: { parentId } });
            documents.value = response.data;
        } catch (error) {
            console.error('Errore nel caricamento documenti', error);
        }
    };

    const createDocument = async (name: string, visibility: 'private' | 'public' = 'private', parentId: string | null = null) => {
        try {
            await api.post('/documents', { title: name, folderId: parentId, visibility });
            await fetchDocuments(parentId);
        } catch (error) {
            console.error('Errore nella creazione', error);
        }
    };

    const deleteDocument = async (documentId: string, parentId: string | null = null) => {
        try {
            console.log('Cancellazione documento', documentId);
            await api.delete(`/documents/${documentId}`);
            await fetchDocuments(parentId);
        } catch (error) {
            console.error('Errore nella cancellazione', error);
        }
    };

    const fetchSharedDocuments = async () => {
        try {
            const response = await api.get('/documents/shared');
            documents.value = response.data;
        } catch (error) {
            console.error('Errore nel caricamento documenti condivisi', error);
        }
    };

    const shareDocument = async (documentId: string, email: string, role: 'editor' | 'viewer') => {
        try {
            const response = await api.put('/documents/share', { id: documentId, email, role });
            const updatedDoc = response.data;
            const index = documents.value.findIndex(d => d._id === documentId);
            if (index !== -1) {
                documents.value[index] = { ...updatedDoc, myRole: documents.value[index].myRole };
            }
        } catch (error) {
            console.error('Errore nella condivisione', error);
        }
    };

    const unshareDocument = async (documentId: string, userId: string) => {
        try {
            const response = await api.put('/documents/unshare', { id: documentId, userId });
            const updatedDoc = response.data;
            const index = documents.value.findIndex(d => d._id === documentId);
            if (index !== -1) {
                documents.value[index] = { ...updatedDoc, myRole: documents.value[index].myRole };
            }
        } catch (error) {
            console.error('Errore nella rimozione condivisione', error);
        }
    };

    return { documents, fetchDocuments, createDocument, deleteDocument, fetchSharedDocuments, shareDocument, unshareDocument };
});