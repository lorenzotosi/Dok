<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../../stores/auth.store';
import AuthModal from '../auth/AuthModal.vue';
import { useClickOutside } from '../../composables/useClickOutside';

const authStore = useAuthStore();
const isModalOpen = ref(false);

const props = defineProps<{
  activeSection: 'private' | 'public' | 'shared';
}>();

const emit = defineEmits<{
  (e: 'create-document', name: string): void;
  (e: 'create-folder', name: string): void;
  (e: 'section-change', section: 'private' | 'public' | 'shared'): void;
}>();

const setSection = (section: 'private' | 'public' | 'shared') => {
  emit('section-change', section);
};

const showMenu = ref(false);
const showFolderInput = ref(false);
const showDocInput = ref(false);
const newFolderName = ref('');
const newDocName = ref('');
const menuRef = ref<HTMLElement | null>(null);

useClickOutside(menuRef, () => {
  showMenu.value = false;
  showFolderInput.value = false;
  showDocInput.value = false;
});

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
    <div v-if="authStore.isAuthenticated()" class="new-btn-wrapper" ref="menuRef">
      <button class="btn-nuovo" @click="showMenu = !showMenu" :disabled="activeSection === 'shared'">
        <span class="plus-icon">➕</span> Nuovo
      </button>

      <transition name="fade">
        <div v-if="showMenu" class="dropdown-menu">
          <button v-if="!showFolderInput" class="dropdown-item" @click="showFolderInput = true; showDocInput = false">
            <span class="icon">🗂️</span> Nuova cartella
          </button>
          <div v-else class="input-wrapper">
            <input 
              v-model="newFolderName" 
              type="text" 
              placeholder="Titolo cartella" 
              @keyup.enter="handleCreateFolder"
              class="sidebar-input"
              autoFocus
            />
            <button @click="handleCreateFolder" class="confirm-btn">Crea</button>
          </div>
          
          <div class="divider"></div>
          
          <button v-if="!showDocInput" class="dropdown-item" @click="showDocInput = true; showFolderInput = false">
            <span class="icon">📄</span> Documento Dok
          </button>
          <div v-else class="input-wrapper">
            <input 
              v-model="newDocName" 
              type="text" 
              placeholder="Titolo documento" 
              @keyup.enter="handleCreateDoc"
              class="sidebar-input"
              autoFocus
            />
            <button @click="handleCreateDoc" class="confirm-btn">Crea</button>
          </div>
        </div>
      </transition>
    </div>

    <nav class="nav-list">
      <button 
        class="nav-item" 
        :class="{ 'is-active': activeSection === 'private' }"
        @click="authStore.isAuthenticated() ? setSection('private') : isModalOpen = true"
      >
        <span class="icon">🏠</span>
        <span class="label">Il Mio Dok</span>
      </button>

      <button 
        class="nav-item"
        :class="{ 'is-active': activeSection === 'shared' }"
        @click="authStore.isAuthenticated() ? setSection('shared') : isModalOpen = true"
      >
        <span class="icon">👥</span>
        <span class="label">Condivisi con me</span>
      </button>

      <button 
        class="nav-item"
        :class="{ 'is-active': activeSection === 'public' }"
        @click="setSection('public')"
      >
        <span class="icon">🌍</span>
        <span class="label">Dok globali</span>
      </button>
    </nav>

    <AuthModal :is-open="isModalOpen" @close="isModalOpen = false" />
  </aside>
</template>

<style scoped>
.sidebar {
  width: 256px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  background-color: transparent;
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
  padding: 18px 24px 18px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #3c4043;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  transition: all 0.2s ease;
}

.btn-nuovo:hover:not(:disabled) {
  background-color: #f8f9fa;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}

.btn-nuovo:disabled {
  background-color: #f1f3f4;
  color: #9aa0a6;
  cursor: not-allowed;
  opacity: 0.8;
}

.dropdown-menu {
  position: absolute;
  top: 60px;
  left: 0;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  padding: 8px 0;
  width: 220px;
  z-index: 100;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  color: #3c4043;
  font-size: 14px;
}

.dropdown-item:hover {
  background-color: #f1f3f4;
}

.input-wrapper {
  padding: 8px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #1a73e8;
  border-radius: 4px;
  font-size: 13px;
  outline: none;
}

.confirm-btn {
  background-color: #1a73e8;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px;
  font-size: 12px;
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
  border: none;
  background: transparent;
  text-align: left;
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

.fade-enter-active, 
.fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.fade-enter-from, 
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
