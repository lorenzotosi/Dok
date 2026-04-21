import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '../services/api';

// come quella di mongoose
export interface IFolder {
  _id: string;
  name: string;
  ownerId: string;
  parentId: string | null;
  visibility: 'private' | 'public';
}

export const useFolderStore = defineStore('folder', () => {
  // STATO (I dati)
  const folders = ref<IFolder[]>([]);

  // AZIONI (Le funzioni che modificano i dati chiamando le API)
  const fetchFolders = async (parentId: string | null = null) => {
    try {
      const response = await api.get('/folders', { params: { parentId } });
      folders.value = response.data;
    } catch (error) {
      console.error('Errore nel caricamento cartelle', error);
    }
  };

  const createFolder = async (name: string, parentId: string | null = null, 
    visibility: 'private' | 'public' = 'private') => {
    try {
      await api.post('/folders', { name, parentId, visibility });
      await fetchFolders(parentId);
    } catch (error) {
      console.error('Errore nella creazione', error);
    }
  };

  const deleteFolder = async (folderId: string) => {
    try {
      console.log('Cancellazione cartella', folderId);
      await api.delete(`/folders/${folderId}`);
      await fetchFolders();
    } catch (error) {
      console.error('Errore nella cancellazione', error);
    }
  };

  return { folders, fetchFolders, createFolder, deleteFolder };
});