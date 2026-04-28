<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Editor from '../components/editor/Editor.vue';
import ShareDropdown from '../components/share/ShareDropdown.vue';
import ActiveViewers from '../components/editor/ActiveViewers.vue';
import { useAuthStore } from '../stores/auth.store';
import { useDocumentData } from '../composables/useDocumentData';

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const documentId = route.params.id as string;

const editorRef = ref<any>(null);
const activeUsers = computed<string[]>(() => editorRef.value?.activeUsers ?? []);

const { documentData, isLoading, fetchDocumentData, handleRename } = useDocumentData(documentId);

onMounted(async () => {
  await fetchDocumentData();
});
</script>

<template>
  <div class="view-container">
    <header class="doc-header">
      <div class="logo-area">
        <button class="icon-btn back-btn" @click="router.push('/')" title="Torna alla Home">←</button>
        <span class="dok-icon">📄</span>
        <div class="doc-title-container" v-if="documentData">
          <input v-if="authStore.isAuthenticated() && authStore.user?.id === (documentData.ownerId?._id || documentData.ownerId)"
            type="text" 
            class="doc-title-input" 
            v-model="documentData.title" 
            @change="handleRename"
            @blur="handleRename"
          />
          <span v-else v-text="documentData.title"></span>
        </div>
      </div>

      <div class="actions">
        <ActiveViewers :active-users="activeUsers" />

        <ShareDropdown 
          v-if="documentData"
          :document-id="documentId"
          :shared-with="documentData.sharedWith || []"
          :is-owner="authStore.user?.id === (documentData.ownerId?._id || documentData.ownerId)"
          :owner-data="documentData || null"
          :my-user-id="authStore.user?.id as string"
          @refresh="fetchDocumentData"
        />

        <div class="avatar" title="Account User">
          {{ authStore.user?.firstName?.[0] || 'U' }}
        </div>
      </div>
    </header>

    <div v-if="isLoading" class="loading">Caricamento editor in corso...</div>

    <div v-else-if="documentData" class="editor-area">
      <Editor 
        ref="editorRef" 
        :documentId="documentId" 
        :ownerId="documentData.ownerId?._id || documentData.ownerId" 
        :sharedWith="documentData.sharedWith" 
      />
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