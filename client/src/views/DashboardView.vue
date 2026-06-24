<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useFolderStore } from '../stores/folder.store';
import { useDocumentStore } from '../stores/document.stores';
import { useAuthStore } from '../stores/auth.store';
import TopBar from '../components/dashboard/TopBar.vue';
import SideBar from '../components/dashboard/SideBar.vue';
import MainWorkspace from '../components/dashboard/MainWorkspace.vue';
import { useFolderNavigation } from '../composables/useFolderNavigation';
import { useDashboardSockets } from '../composables/useDashboardSockets';

const folderStore = useFolderStore();
const documentStore = useDocumentStore();
const authStore = useAuthStore();
const currentSection = ref<'private' | 'public' | 'shared'>('private');
const searchQuery = ref('');

useDashboardSockets(currentSection);

const refreshData = () => {
  if (currentSection.value === 'shared') {
    documentStore.fetchSharedDocuments();
    folderStore.folders = [];
  } else {
    folderStore.fetchFolders(currentFolderId.value);
    documentStore.fetchDocuments(currentFolderId.value);
  }
};

const { 
  currentFolderId, 
  handleSectionChange, 
  handleEnterFolder, 
  handleBack, 
  currentTitle 
} = useFolderNavigation(currentSection, authStore, refreshData, folderStore);

watch(() => authStore.token, (newToken) => {
  if (newToken) {
    handleSectionChange('private');
  } else if (!newToken && (currentSection.value === 'private' || currentSection.value === 'shared')) {
    handleSectionChange('public');
  } else {
    refreshData();
  }
});

const handleCreateDocument = async (name: string) => {
  const visibility = currentSection.value === 'public' ? 'public' : 'private';
  await documentStore.createDocument(name, visibility, currentFolderId.value);
};

const handleCreateFolder = async (name: string) => {
  const visibility = currentSection.value === 'public' ? 'public' : 'private';
  await folderStore.createFolder(name, currentFolderId.value, visibility);
};

const handleDeleteFolder = async (id: string) => {
  await folderStore.deleteFolder(id, currentFolderId.value);
};

const handleDeleteDocument = async (id: string) => {
  await documentStore.deleteDocument(id, currentFolderId.value);
};

const filteredDocuments = computed(() => {
  return documentStore.documents.filter(doc => {
    const matchesVisibility = currentSection.value === 'shared' || doc.visibility === currentSection.value;
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.value.toLowerCase());
    return matchesVisibility && matchesSearch;
  });
});

const filteredFolders = computed(() => {
  return folderStore.folders.filter(folder => {
    const matchesVisibility = folder.visibility === currentSection.value;
    const matchesSearch = folder.name.toLowerCase().includes(searchQuery.value.toLowerCase());
    return matchesVisibility && matchesSearch;
  });
});
</script>

<template>
  <div class="dashboard-layout">
    <TopBar @search="val => searchQuery = val"/>
    <div class="dashboard-body">
      <SideBar 
        :active-section="currentSection"
        @create-document="handleCreateDocument"
        @create-folder="handleCreateFolder"
        @section-change="handleSectionChange"
      />
      <MainWorkspace 
        :title="currentTitle"
        :show-back="currentFolderId !== null"
        :folders="filteredFolders"
        :documents="filteredDocuments"
        :is-public="currentSection === 'public'"
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