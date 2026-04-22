<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue';
import { useFolderStore } from '../stores/folder.store';
import { useDocumentStore } from '../stores/document.stores';
import { useAuthStore } from '../stores/auth.store';
import TopBar from '../components/dashboard/TopBar.vue';
import SideBar from '../components/dashboard/SideBar.vue';
import MainWorkspace from '../components/dashboard/MainWorkspace.vue';
const folderStore = useFolderStore();
const documentStore = useDocumentStore();
const authStore = useAuthStore();
const currentSection = ref<'private' | 'public' | 'shared'>('private');
const currentFolderId = ref<string | null>(null);
const searchQuery = ref('');

watch(() => authStore.token, (newToken) => {
  if (newToken) {
    // Al login vai in automatico su private
    handleSectionChange('private');
  } else if (!newToken && (currentSection.value === 'private' || currentSection.value === 'shared')) {
    // Al logout vai in public sempre
    handleSectionChange('public');
  } else {
    refreshData();
  }
});

// Stack dei folder per tornare indietro (con nome per il titolo)
const folderStack = ref<{id: string | null, name: string}[]>([
  { id: null, name: 'Il Mio Dok' }
]);

watch([currentSection, folderStack], ([newSection, newStack]) => {
  sessionStorage.setItem('dok_last_section', newSection);
  sessionStorage.setItem('dok_last_stack', JSON.stringify(newStack));
  sessionStorage.setItem('dok_last_folder_id', currentFolderId.value || '');
}, { deep: true });

onMounted(() => {
  const savedSection = sessionStorage.getItem('dok_last_section') as 'private' | 'public';
  const savedStack = sessionStorage.getItem('dok_last_stack');
  const savedFolderId = sessionStorage.getItem('dok_last_folder_id');

  if (savedSection) {
    currentSection.value = savedSection;
  } else if (!authStore.token) {
    currentSection.value = 'public';
  }

  if (savedStack) {
    try {
      folderStack.value = JSON.parse(savedStack);
      currentFolderId.value = savedFolderId || null;
    } catch (e) {
      console.error("Errore nel ripristino del percorso salvato", e);
    }
  }

  refreshData();
});

const refreshData = () => {
  if (currentSection.value === 'shared') {
    documentStore.fetchSharedDocuments();
    folderStore.folders = [];
  } else {
    folderStore.fetchFolders(currentFolderId.value);
    documentStore.fetchDocuments(currentFolderId.value);
  }
};

const handleSectionChange = (section: 'private' | 'public' | 'shared') => {
  currentSection.value = section;
  currentFolderId.value = null;
  
  let name = 'Il Mio Dok';
  if (section === 'public') name = 'Dok globali';
  else if (section === 'shared') name = 'Condivisi con me';

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