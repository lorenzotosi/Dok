<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useFolderStore } from '../stores/folder.store';
import { useDocumentStore } from '../stores/document.stores';
import TopBar from '../components/dashboard/TopBar.vue';
import SideBar from '../components/dashboard/SideBar.vue';
import MainWorkspace from '../components/dashboard/MainWorkspace.vue';

const folderStore = useFolderStore();
const documentStore = useDocumentStore();
const currentSection = ref<'private' | 'public'>('private');
const currentFolderId = ref<string | null>(null);
const searchQuery = ref('');

// Stack dei folder per tornare indietro (con nome per il titolo)
const folderStack = ref<{id: string | null, name: string}[]>([
  { id: null, name: 'Il Mio Dok' }
]);

onMounted(() => {
  refreshData();
});

const refreshData = () => {
  folderStore.fetchFolders(currentFolderId.value);
  documentStore.fetchDocuments(currentFolderId.value);
};

const handleSectionChange = (section: 'private' | 'public') => {
  currentSection.value = section;
  currentFolderId.value = null;
  const name = section === 'private' ? 'Il Mio Dok' : 'Dok globali';
  folderStack.value = [{ id: null, name }]; 
  refreshData();
};

const handleEnterFolder = (id: string) => {
  const folder = folderStore.folders.find(f => f._id === id);
  const name = folder ? folder.name : 'Cartella';
  
  currentFolderId.value = id;
  folderStack.value.push({ id, name });
  refreshData();
};

const handleBack = () => {
  if (folderStack.value.length > 1) {
    folderStack.value.pop(); 
    const previous = folderStack.value[folderStack.value.length - 1];
    currentFolderId.value = previous.id;
    refreshData();
  }
};

const handleCreateDocument = async (name: string) => {
  await documentStore.createDocument(name, currentSection.value, currentFolderId.value);
};

const handleCreateFolder = async (name: string) => {
  await folderStore.createFolder(name, currentFolderId.value);
};

const handleDeleteFolder = async (id: string) => {
  await folderStore.deleteFolder(id);
  refreshData();
};

const handleDeleteDocument = async (id: string) => {
  await documentStore.deleteDocument(id);
  refreshData();
};

const filteredDocuments = computed(() => {
  return documentStore.documents.filter(doc => {
    const matchesVisibility = doc.visibility === currentSection.value;
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.value.toLowerCase());
    return matchesVisibility && matchesSearch;
  });
});

const filteredFolders = computed(() => {
  const folders = currentSection.value === 'public' ? [] : folderStore.folders;
  return folders.filter(folder => 
    folder.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// Calcola il titolo dinamico prendendolo dall'ultimo elemento dello stack
const currentTitle = computed(() => {
  return folderStack.value[folderStack.value.length - 1].name;
});
</script>

<template>
  <div class="dashboard-layout">
    <TopBar @search="val => searchQuery = val"/>
    <div class="dashboard-body">
      <SideBar 
        @create-document="handleCreateDocument"
        @create-folder="handleCreateFolder"
        @section-change="handleSectionChange"
      />
      <MainWorkspace 
        :title="currentTitle"
        :show-back="currentFolderId !== null"
        :folders="filteredFolders"
        :documents="filteredDocuments"
        @delete-folder="handleDeleteFolder"
        @delete-document="handleDeleteDocument"
        @enter-folder="handleEnterFolder"
        @back="handleBack"
      />
    </div>
  </div>
</template>

<style scoped>
.dashboard-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #3c4043;
}

.dashboard-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}
</style>