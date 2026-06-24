<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth.store';
import BaseIcon from '../common/BaseIcon.vue';

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

const isOwner = (item: any) => {
  const ownerId = item.ownerId?._id || item.ownerId;
  return authStore.user?.id === ownerId;
};
</script>

<template>
  <div class="grid-view">
    <section v-if="folders.length > 0" class="grid-section">
      <h3 class="section-title">Cartelle</h3>
      <div class="grid">
        <div 
          v-for="folder in folders" 
          :key="folder._id" 
          class="grid-card folder-card"
          @click="emit('enter-folder', folder._id)"
          role="button"
          tabindex="0"
        >
          <div class="card-header">
            <BaseIcon name="folder" class="icon-folder" />
            <span class="name">{{ folder.name }}</span>
            <span v-if="isPublic && isOwner(folder)" class="owner-tag">owner</span>
          </div>
          <button 
            v-if="authStore.isAuthenticated() && (isOwner(folder) || authStore.isAdmin())"
            class="action-btn" 
            @click.stop="emit('delete-folder', folder._id)" 
            title="Elimina cartella"
          >
            <BaseIcon name="trash" size="14" />
          </button>
        </div>
      </div>
    </section>

    <section v-if="documents.length > 0" class="grid-section">
      <h3 class="section-title">File</h3>
      <div class="grid doc-grid">
        <div 
          v-for="document in documents" 
          :key="document._id" 
          class="grid-card document-card" 
          @click="router.push(`/document/${document._id}`)"
          role="button"
          tabindex="0"
        >
          <div class="doc-preview">
             <div class="preview-line"></div>
             <div class="preview-line"></div>
             <div class="preview-line short"></div>
          </div>
          <div class="doc-footer">
            <div class="doc-info">
              <BaseIcon name="file" class="icon-file" size="18" />
              <span class="name">{{ document.title }}</span>
              <span v-if="isPublic && isOwner(document)" class="owner-tag">owner</span>
              <span v-if="document.myRole && !(isPublic && document.myRole === 'viewer')" class="role-tag" :class="document.myRole">
                {{ document.myRole }}
              </span>
            </div>
            <button 
              v-if="authStore.isAuthenticated() && (isOwner(document) || authStore.isAdmin())"
              class="action-btn" 
              @click.stop="emit('delete-document', document._id)" 
              title="Elimina documento"
            >
              <BaseIcon name="trash" size="14" />
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.grid-view {
  display: flex;
  flex-direction: column;
  gap: 32px;
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

.grid-card {
  background-color: #f1f3f4;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  overflow: hidden;
}

.grid-card:hover {
  background-color: #e8eaed;
}

.grid-card:focus-visible {
  outline: 2px solid #1a73e8;
  outline-offset: 2px;
}

.folder-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  height: 48px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
}

.icon-folder { color: #5f6368; }
.icon-file { color: #4285f4; }

.document-card {
  display: flex;
  flex-direction: column;
  height: 200px;
}

.doc-preview {
  flex: 1;
  background-color: #fff;
  border-bottom: 1px solid #dadce0;
  padding: 20px;
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

.role-tag.commenter {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.role-tag.viewer {
  background-color: #f5f5f5;
  color: #616161;
}

.action-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  opacity: 0;
  padding: 6px;
  border-radius: 50%;
  display: flex;
  transition: all 0.2s;
  color: #5f6368;
}

.grid-card:hover .action-btn {
  opacity: 1;
}

.action-btn:hover {
  background-color: rgba(0,0,0,0.05);
  color: #d93025;
}
</style>
