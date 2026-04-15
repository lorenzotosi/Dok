<script setup lang="ts">
import { ref } from 'vue';
import DriveGrid from './DriveGrid.vue';
import DriveList from './DriveList.vue';

defineProps<{
  title: string;
  folders: any[];
  documents: any[];
  showBack?: boolean;
}>();

const emit = defineEmits<{
  (e: 'delete-folder', id: string): void;
  (e: 'delete-document', id: string): void;
  (e: 'enter-folder', id: string): void;
  (e: 'back'): void;
}>();

const isGridView = ref(true);
</script>

<template>
  <main class="workspace">
    <div class="workspace-header">
      <div class="title-container">
        <button v-if="showBack" class="back-btn" @click="emit('back')" title="Torna indietro">
          ←
        </button>
        <h1 class="title">{{ title }}</h1>
      </div>
      <div class="view-toggle">
        <button 
          class="toggle-btn" 
          :class="{ active: isGridView }" 
          @click="isGridView = true"
          title="Vista a griglia"
        >
          <span style="font-size: 18px">☷</span>
        </button>
        <button 
          class="toggle-btn" 
          :class="{ active: !isGridView }" 
          @click="isGridView = false"
          title="Vista a elenco"
        >
          <span style="font-size: 18px">𝌆</span>
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="folders.length === 0 && documents.length === 0" class="empty-state">
      <div class="empty-icon">📂</div>
      <p class="empty-title">Nessun file presente</p>
      <p class="empty-subtitle">Questa cartella è vuota. Clicca su "Nuovo" per iniziare a lavorare.</p>
    </div>

    <!-- Content -->
    <div v-else class="workspace-content">
      <DriveGrid 
        v-if="isGridView"
        :folders="folders"
        :documents="documents"
        @delete-folder="id => emit('delete-folder', id)"
        @delete-document="id => emit('delete-document', id)"
        @enter-folder="id => emit('enter-folder', id)"
      />
      <DriveList 
        v-else
        :folders="folders"
        :documents="documents"
        @delete-folder="id => emit('delete-folder', id)"
        @delete-document="id => emit('delete-document', id)"
        @enter-folder="id => emit('enter-folder', id)"
      />
    </div>
  </main>
</template>

<style scoped>
.workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #fff; /* Workspace bianco come in drive */
  border-radius: 16px;
  margin: 16px 16px 16px 0;
  padding: 16px 24px;
  box-shadow: 0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15);
  overflow-y: auto;
}

.workspace-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  height: 48px;
}

.title-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  background: transparent;
  border: none;
  font-size: 24px;
  color: #5f6368;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.back-btn:hover {
  background-color: rgba(0,0,0,0.05);
  color: #1a73e8;
}

.title {
  font-size: 24px;
  font-weight: 400;
  color: #1f1f1f;
  margin: 0;
}

.view-toggle {
  display: flex;
  align-items: center;
  background-color: #f1f3f4;
  border-radius: 20px;
  padding: 2px;
}

.toggle-btn {
  background: transparent;
  border: none;
  border-radius: 18px;
  width: 40px;
  height: 36px;
  cursor: pointer;
  color: #5f6368;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s, color 0.2s;
}

.toggle-btn:hover {
  background-color: rgba(0,0,0,0.04);
}

.toggle-btn.active {
  background-color: #fff;
  color: #1a73e8;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: #5f6368;
}

.empty-icon {
  font-size: 100px;
  margin-bottom: 16px;
  opacity: 0.8;
}

.empty-title {
  font-size: 18px;
  font-weight: 500;
  color: #3c4043;
  margin: 0 0 8px 0;
}

.empty-subtitle {
  font-size: 14px;
  margin: 0;
}

.workspace-content {
  flex: 1;
}
</style>
