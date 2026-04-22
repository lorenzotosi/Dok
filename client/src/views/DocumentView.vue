<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../services/api';
import Editor from '../components/editor/Editor.vue';
import ShareDropdown from '../components/share/ShareDropdown.vue';
import { useAuthStore } from '../stores/auth.store';

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const documentId = route.params.id as string;

const documentData = ref<any>(null);
const isLoading = ref(true);
const editorRef = ref<any>(null);
const viewersWrapperRef = ref<HTMLElement | null>(null);
const showViewersDropdown = ref(false);

const activeUsers = computed<string[]>(() => editorRef.value?.activeUsers ?? []);

const fetchDocumentData = async () => {
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
};

const handleOutsideClick = (e: MouseEvent) => {
  if (viewersWrapperRef.value && !viewersWrapperRef.value.contains(e.target as Node)) {
    showViewersDropdown.value = false;
  }
};

onMounted(async () => {
  document.addEventListener('click', handleOutsideClick);
  await fetchDocumentData();
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick);
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
          <input v-if="authStore.isAuthenticated() && authStore.user?.id === (documentData.ownerId?._id || documentData.ownerId)"
            type="text" 
            class="doc-title-input" 
            v-model="documentData.title" 
            @change="handleRename"
          />
          <span v-else
            v-text="documentData.title"
          ></span>
        </div>
      </div>
      <div class="actions">
        <!-- Viewers badge -->
        <div class="viewers-wrapper" ref="viewersWrapperRef" @click.stop="showViewersDropdown = !showViewersDropdown">
          <button class="viewers-btn" :title="activeUsers.length + ' persone stanno visualizzando'">
            <svg class="viewers-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
            <span class="viewers-count-badge">{{ activeUsers.length }}</span>
          </button>
          <transition name="dropdown">
            <div class="viewers-dropdown" v-if="showViewersDropdown">
              <div class="viewers-dropdown-header">Persone nel documento</div>
              <div v-if="activeUsers.length === 0" class="viewers-empty">Nessun altro utente</div>
              <ul v-else class="viewers-list">
                <li v-for="name in activeUsers" :key="name" class="viewers-item">
                  <span class="viewers-avatar">{{ name[0]?.toUpperCase() }}</span>
                  <span class="viewers-name">{{ name }}</span>
                </li>
              </ul>
            </div>
          </transition>
        </div>

        <!-- Il nuovo componente di condivisione -->
        <ShareDropdown 
          v-if="documentData"
          :document-id="documentId"
          :shared-with="documentData.sharedWith || []"
          :is-owner="authStore.user?.id === (documentData.ownerId?._id || documentData.ownerId)"
          :owner-data="documentData || null"
          :my-user-id="authStore.user?.id as string"
          @refresh="fetchDocumentData"
        />

        <div class="avatar" title="Account Google fittizio">U</div>
      </div>
    </header>

    <div v-if="isLoading" class="loading">
      Caricamento editor in corso...
    </div>

    <div v-else-if="documentData" class="editor-area">
      <Editor ref="editorRef" :documentId="documentId" :ownerId="documentData.ownerId?._id || documentData.ownerId" :sharedWith="documentData.sharedWith" />
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

/* ── Viewers badge ── */
.viewers-wrapper {
  position: relative;
}

.viewers-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background: transparent;
  border: 1px solid #dadce0;
  border-radius: 20px;
  padding: 5px 12px;
  font-size: 13px;
  font-weight: 500;
  color: #3c4043;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
  height: 36px;
}

.viewers-btn:hover {
  background-color: rgba(0,0,0,0.04);
  border-color: #bdc1c6;
}

.viewers-icon {
  width: 18px;
  height: 18px;
  color: #5f6368;
}

.viewers-count {
  min-width: 10px;
  text-align: center;
}

.viewers-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
  min-width: 220px;
  z-index: 1000;
  overflow: hidden;
}

.viewers-dropdown-header {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #80868b;
  padding: 12px 16px 8px;
  border-bottom: 1px solid #f1f3f4;
}

.viewers-empty {
  padding: 12px 16px;
  font-size: 13px;
  color: #80868b;
}

.viewers-list {
  list-style: none;
  margin: 0;
  padding: 6px 0;
}

.viewers-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  transition: background-color 0.15s;
}

.viewers-item:hover {
  background-color: #f8f9fa;
}

.viewers-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4285f4, #34a853);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.viewers-name {
  font-size: 13px;
  color: #202124;
  font-weight: 400;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

</style>