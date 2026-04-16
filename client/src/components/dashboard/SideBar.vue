<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../../stores/auth.store';

const authStore = useAuthStore();

const props = defineProps<{
  activeSection: 'private' | 'public';
}>();

const emit = defineEmits<{
  (e: 'create-document', name: string): void;
  (e: 'create-folder', name: string): void;
  (e: 'section-change', section: 'private' | 'public'): void;
}>();

const setSection = (section: 'private' | 'public') => {
  emit('section-change', section);
};

const showMenu = ref(false);
const showFolderInput = ref(false);
const showDocInput = ref(false);
const newFolderName = ref('');
const newDocName = ref('');

const handleCreateDoc = () => {
  if (newDocName.value.trim()) {
    emit('create-document', newDocName.value);
    newDocName.value = '';
    showDocInput.value = false;
    showMenu.value = false;
  }
};

const handleCreateFolder = () => {
  if (newFolderName.value.trim()) {
    emit('create-folder', newFolderName.value);
    newFolderName.value = '';
    showFolderInput.value = false;
    showMenu.value = false;
  }
};
</script>

<template>
  <aside class="sidebar">
    <div v-if="authStore.isAuthenticated()" class="new-btn-wrapper">
      <button class="btn-nuovo" @click="showMenu = !showMenu">
        <span class="plus-icon">➕</span> Nuovo
      </button>

      <!-- Dropdown menu per la creazione -->
      <div v-if="showMenu" class="dropdown-menu">
        <button v-if="!showFolderInput" class="dropdown-item" @click="showFolderInput = true; showDocInput = false">
          <span class="icon">🗂️</span> Nuova cartella
        </button>
        <div v-else class="folder-input-wrapper">
          <input 
            v-model="newFolderName" 
            type="text" 
            placeholder="Titolo cartella" 
            @keyup.enter="handleCreateFolder"
            class="folder-input"
          />
          <button @click="handleCreateFolder" class="folder-confirm-btn">Crea</button>
        </div>
        
        <div class="divider"></div>
        
        <button v-if="!showDocInput" class="dropdown-item" @click="showDocInput = true; showFolderInput = false">
          <span class="icon">📄</span> Documento Dok
        </button>
        <div v-else class="folder-input-wrapper">
          <input 
            v-model="newDocName" 
            type="text" 
            placeholder="Titolo documento" 
            @keyup.enter="handleCreateDoc"
            class="folder-input"
          />
          <button @click="handleCreateDoc" class="folder-confirm-btn">Crea</button>
        </div>
      </div>
    </div>

    <nav class="nav-list">
      <div 
        class="nav-item" 
        :class="{ 'is-active': activeSection === 'private' }"
        @click="setSection('private')"
      >
        <span class="icon">🏠</span>
        <span class="label">Il Mio Dok</span>
      </div>
      <!-- TODO: Da implementare in futuro -->
      <div class="nav-item is-disabled">
        <span class="icon">👥</span>
        <span class="label">Condivisi con me</span>
      </div>
      <div 
        class="nav-item"
        :class="{ 'is-active': activeSection === 'public' }"
        @click="setSection('public')"
      >
        <span class="icon">🌍</span>
        <span class="label">Dok globali</span>
      </div>
      <!-- TODO: Da implementare in futuro -->
      <div class="nav-item is-disabled">
        <span class="icon">🗑️</span>
        <span class="label">Cestino</span>
      </div>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 256px;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.new-btn-wrapper {
  position: relative;
  margin-bottom: 24px;
}

.btn-nuovo {
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: #fff;
  border: none;
  border-radius: 16px;
  padding: 18px 24px 18px 16px; /* Spazio extra a destra */
  font-size: 14px;
  font-weight: 500;
  color: #3c4043;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  transition: box-shadow 0.2s, background-color 0.2s;
  width: auto;
}

.btn-nuovo:hover {
  background-color: #f8f9fa;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}

.plus-icon {
  font-size: 20px;
}

.dropdown-menu {
  position: absolute;
  top: 60px;
  left: 0;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  padding: 8px 0;
  width: 200px;
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  color: #3c4043;
  font-size: 14px;
  font-family: inherit;
}

.dropdown-item:hover {
  background-color: #f1f3f4;
}

.folder-input-wrapper {
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.folder-input {
  width: 100%;
  padding: 4px 8px;
  border: 1px solid #1a73e8;
  border-radius: 4px;
  font-size: 13px;
  outline: none;
}

.folder-confirm-btn {
  background-color: #1a73e8;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 8px;
  cursor: pointer;
}

.divider {
  height: 1px;
  background-color: #e0e0e0;
  margin: 8px 0;
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 16px;
  border-radius: 0 24px 24px 0;
  cursor: pointer;
  color: #3c4043;
  font-size: 14px;
  font-weight: 500;
  margin-right: 16px;
  transition: background-color 0.2s;
}

.nav-item:hover:not(.is-disabled) {
  background-color: rgba(0,0,0,0.04);
}

.nav-item.is-active {
  background-color: #c2e7ff;
  color: #001d35;
}

.nav-item.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
