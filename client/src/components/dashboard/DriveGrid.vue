<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

defineProps<{
  folders: any[];
  documents: any[];
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
          </div>
          <button class="delete-btn" @click.stop="emit('delete-folder', folder._id)" title="Elimina cartella">🗑️</button>
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
            </div>
            <button class="delete-btn" @click.stop="emit('delete-document', document._id)" title="Elimina documento">🗑️</button>
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
