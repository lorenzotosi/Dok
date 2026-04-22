<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../../stores/auth.store';
import AuthModal from '../auth/AuthModal.vue';

const authStore = useAuthStore();
const isModalOpen = ref(false);

const handleLogout = () => {
  if(confirm("Vuoi uscire?")) authStore.logout();
};

const emit = defineEmits<{
  (e: 'search', query: string): void;
}>();

const searchQuery = ref('');
let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

const handleSearch = () => {
  if (debounceTimeout) clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    emit('search', searchQuery.value);
  }, 300);
};
</script>

<template>
  <header class="topbar">
    <div class="logo">
      <span class="dok-icon">📄</span>
      <h2>Dok</h2>
    </div>
    <div class="search-container">
      <div class="search-bar">
        <span class="search-icon">🔍</span>
        <input v-model="searchQuery" type="text" placeholder="Cerca in Dok" @input="handleSearch"/>
      </div>
    </div>
    <div class="actions">
      <button class="icon-btn" title="Impostazioni">⚙️</button>
    </div>
    <div class="user-section">
      <div v-if="authStore.isAuthenticated()" class="avatar" @click="handleLogout">
        <img src="/icons.svg#user" alt="User" />
      </div>
      <button v-else class="login-trigger" @click="isModalOpen = true">
        Accedi
      </button>
    </div>

    <AuthModal :is-open="isModalOpen" @close="isModalOpen = false" />

  </header>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background-color: transparent; /* Si adatta alla root */
  border-bottom: 1px solid rgba(0,0,0,0.05);
  height: 64px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 250px;
  cursor: pointer;
}

.logo h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 500;
  color: #5f6368;
}

.dok-icon {
  font-size: 28px;
  color: #1a73e8;
}

.search-container {
  flex: 1;
  display: flex;
  justify-content: center;
  max-width: 720px;
  margin: 0 20px;
}

.search-bar {
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 24px;
  padding: 0 16px;
  width: 100%;
  height: 48px;
  transition: background-color 0.2s, box-shadow 0.2s;
}

.search-bar:focus-within {
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.12);
}

.search-bar input {
  border: none;
  background: transparent;
  width: 100%;
  height: 100%;
  padding-left: 12px;
  font-size: 16px;
  color: #3c4043;
}

.search-bar input:focus {
  outline: none;
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 250px;
  justify-content: flex-end;
}

.icon-btn {
  background: transparent;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 18px;
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
  margin-left: 12px;
}

.login-trigger {
  background: #4f46e5; color: white; border: none;
  padding: 0.5rem 1.2rem; border-radius: 20px;
  font-weight: 500; cursor: pointer; transition: 0.2s;
}

.login-trigger:hover { background: #4338ca; }
</style>
