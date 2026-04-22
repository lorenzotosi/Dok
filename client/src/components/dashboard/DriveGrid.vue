<script setup lang="ts">
import { useRouter } from 'vue-router';

import { useAuthStore } from '../../stores/auth.store';

const router = useRouter();
const authStore = useAuthStore();

const props = defineProps<{
  folders: any[];
  documents: any[];
  isPublic?: boolean;
}>();

const emit = defineEmits<{
  (e: 'delete-folder', id: string): void;
  (e: 'delete-document', id: string): void;
  (e: 'enter-folder', id: string): void;
}>();
</script>

<template>
  <div class="grid-view">
    <div v-if="folders.length > 0" class="section">
      <h3 class="section-title">Cartelle</h3>
      <div class="grid">
        <div 
          v-for="folder in folders" 
          :key="folder._id" 
          class="grid-card folder-card"
          @click="emit('enter-folder', folder._id)"
        >
          <div class="card-content">
            <span class="icon">🗂️</span>
            <span class="name">{{ folder.name }}</span>
            <span v-if="isPublic && (folder.ownerId._id || folder.ownerId) === authStore.user?.id" class="owner-tag">owner</span>
          </div>
          <button v-if="authStore.isAuthenticated() && authStore.user?.id === (folder.ownerId?._id || folder.ownerId)" class="delete-btn" @click.stop="emit('delete-folder', folder._id)" title="Elimina cartella">🗑️</button>
        </div>
      </div>
    </div>

    <div v-if="documents.length > 0" class="section">
      <h3 class="section-title">File</h3>
      <div class="grid doc-grid">
        <div 
          v-for="document in documents" 
          :key="document._id" 
          class="grid-card document-card" 
          @click="router.push(`/document/${document._id}`)"
        >
          <div class="doc-preview">
             <div class="preview-line"></div>
             <div class="preview-line"></div>
             <div class="preview-line short"></div>
          </div>
          <div class="doc-footer">
            <div class="doc-info">
              <span class="icon">📄</span>
              <span class="name">{{ document.title }}</span>
              <span v-if="isPublic && (document.ownerId._id || document.ownerId) === authStore.user?.id" class="owner-tag">owner</span>
              <span v-if="document.myRole && !(isPublic && document.myRole === 'viewer')" class="role-tag" :class="document.myRole">
                {{ document.myRole }}
              </span>
            </div>
            <button v-if="authStore.isAuthenticated() && authStore.user?.id === (document.ownerId?._id || document.ownerId)" class="delete-btn" @click.stop="emit('delete-document', document._id)" title="Elimina documento">🗑️</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  color: #3c4043;
  margin: 0 0 16px 0;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

/* Card base */
.grid-card {
  background-color: #f1f3f4; /* Grigio Drive classico */
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  transition: background-color 0.2s;
  overflow: hidden;
}

.grid-card:hover {
  background-color: #e8eaed;
}

/* Folders */
.folder-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  height: 48px;
}

.card-content {
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
}

/* Documents */
.document-card {
  display: flex;
  flex-direction: column;
  height: 200px;
}

.doc-preview {
  flex: 1;
  background-color: #fff;
  border-bottom: 1px solid #dadce0;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-line {
  height: 8px;
  background-color: #f1f3f4;
  border-radius: 4px;
  width: 100%;
}

.preview-line.short {
  width: 60%;
}

.doc-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  height: 56px;
  background-color: #fff;
}

.doc-info {
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
}

/* Comuni */
.name {
  font-size: 13px;
  font-weight: 500;
  color: #3c4043;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.owner-tag {
  background-color: #e8f0fe;
  color: #1967d2;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  margin-left: 4px;
}

.role-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 12px;
  margin-left: 8px;
  text-transform: capitalize;
  font-weight: 600;
  flex-shrink: 0;
}

.role-tag.editor {
  background-color: #e1f5fe;
  color: #0288d1;
}

.role-tag.viewer {
  background-color: #f5f5f5;
  color: #616161;
}

.delete-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  opacity: 0;
  font-size: 16px;
  transition: opacity 0.2s;
}

.grid-card:hover .delete-btn {
  opacity: 1;
}
</style>
