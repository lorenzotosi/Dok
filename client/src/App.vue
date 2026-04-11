<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useFolderStore } from './stores/folder.store';

// Inizializziamo lo store
const folderStore = useFolderStore();

// Variabile reattiva (v-model) per l'input testuale
const newFolderName = ref('');

// Hook del ciclo di vita: Appena il componente viene montato, chiama le API
onMounted(() => {
  folderStore.fetchFolders();
});

// Funzione chiamata dal bottone
const handleCreate = async () => {
  if (newFolderName.value.trim() === '') return;
  await folderStore.createFolder(newFolderName.value);
  newFolderName.value = ''; // Svuota l'input dopo la creazione
};

const handleDelete = async (folderId: string) => {
  await folderStore.deleteFolder(folderId);
};
</script>

<template>
  <main class="drive-container">
    <h1>Dok</h1>

    <div class="toolbar">
      <input 
        v-model="newFolderName" 
        type="text" 
        placeholder="Nome nuova cartella..." 
        @keyup.enter="handleCreate"
      />
      <button @click="handleCreate" :disabled="!newFolderName">
        + Crea Cartella
      </button>
    </div>

    <hr />

    <div v-if="folderStore.folders.length === 0" class="empty-state">
      La tua area di lavoro è vuota. Crea una cartella per iniziare!
    </div>

    <div v-else class="grid">
      <div v-for="folder in folderStore.folders" :key="folder._id" class="folder-card">
        <span class="folder-icon">🗂️</span>
        <span class="folder-name">{{ folder.name }}</span>
        <button @click="handleDelete(folder._id)">Elimina</button>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* Stili CSS base per avere un aspetto pulito e Mobile First */
.drive-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #333;
}

.toolbar {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.toolbar input {
  padding: 0.8rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  flex: 1; /* Su mobile prenderà tutto lo spazio */
  max-width: 300px;
}

.toolbar button {
  padding: 0.8rem 1.5rem;
  background-color: #0b57d0; /* Blu stile Google */
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
}

.toolbar button:disabled {
  background-color: #a0c1fc;
  cursor: not-allowed;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.folder-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 1rem;
  border: 1px solid #dadce0;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.folder-card:hover {
  background-color: #f8f9fa;
}

.folder-icon {
  font-size: 1.5rem;
}

.empty-state {
  color: #5f6368;
  font-style: italic;
  margin-top: 2rem;
}
</style>