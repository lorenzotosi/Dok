<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../services/api';
import Editor from '../components/editor/Editor.vue';

const route = useRoute();
const router = useRouter();
const documentId = route.params.id as string;

const documentData = ref<any>(null);
const isLoading = ref(true);

onMounted(async () => {
  try {
    const response = await api.get(`/documents/${documentId}`);
    documentData.value = response.data;
  } catch (error) {
    console.error("Errore nel caricamento del documento", error);
    alert("Documento non trovato!");
    router.push('/');
  } finally {
    isLoading.value = false;
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
</script>

<template>
  <div class="view-container">
    <header class="doc-header">
      <div class="logo-area">
        <button class="icon-btn back-btn" @click="router.push('/')" title="Torna alla Home">
          ←
        </button>
        <span class="dok-icon">📄</span>
        <div class="doc-title-container" v-if="documentData">
          <input 
            type="text" 
            class="doc-title-input" 
            v-model="documentData.title" 
            @change="handleRename"
          />
        </div>
      </div>
      <div class="actions">
        <button class="share-btn">Condividi</button>
        <div class="avatar" title="Account Google fittizio">U</div>
      </div>
    </header>

    <div v-if="isLoading" class="loading">
      Caricamento editor in corso...
    </div>

    <div v-else-if="documentData" class="editor-area">
      <Editor :documentId="documentId" />
    </div>
  </div>
</template>

<style scoped>
.view-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background-color: #f8f9fa;
  font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  overflow: hidden;
}

.doc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background-color: #f1f3f4;
  height: 64px;
  flex-shrink: 0;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dok-icon {
  font-size: 36px;
  color: #1a73e8;
}

.doc-title-container {
  display: flex;
  align-items: center;
}

.doc-title-input {
  font-size: 18px;
  font-weight: 400;
  color: #1f1f1f;
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 2px 8px;
  background: transparent;
  outline: none;
  font-family: inherit;
  width: 300px;
}

.doc-title-input:hover {
  border-color: #dadce0;
}

.doc-title-input:focus {
  border-color: #1a73e8;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.icon-btn {
  background: transparent;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 20px;
  cursor: pointer;
  color: #5f6368;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.icon-btn:hover {
  background-color: rgba(0,0,0,0.05);
}

.share-btn {
  background-color: #c2e7ff;
  color: #001d35;
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.share-btn:hover {
  background-color: #b3dcf4;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #1a73e8;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  cursor: pointer;
}

.editor-area {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.loading {
  text-align: center;
  margin-top: 3rem;
  color: #5f6368;
  font-size: 16px;
}
</style>