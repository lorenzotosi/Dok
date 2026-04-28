<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth.store';
import UserAvatar from '../../components/common/UserAvatar.vue';
import  {useClickOutside } from '../../composables/useClickOutside';

const authStore = useAuthStore();
const router = useRouter();
const isOpen = ref(false);
const menuRef = ref<HTMLElement | null>(null);

useClickOutside(menuRef, () => {
  isOpen.value = false;
});

const toggleMenu = () => {
  isOpen.value = !isOpen.value;
};

const handleLogout = async () => {
  authStore.logout();
  await router.push('/');
  isOpen.value = false;
};

const navigateTo = (path: string) => {
  router.push(path);
  isOpen.value = false;
};
</script>

<template>
  <div class="user-menu-container" ref="menuRef">
    <div class="avatar-trigger" @click="toggleMenu">
      <UserAvatar :user="authStore.user" size="md" />
    </div>

    <Transition name="fade">
      <div v-if="isOpen" class="dropdown-menu shadow-lg">
        <div class="user-info">
          <p class="name">{{ authStore.user?.firstName }} {{ authStore.user?.lastName }}</p>
          <p class="email">{{ authStore.user?.email }}</p>
        </div>

        <hr />

        <nav class="menu-items">
          <button @click="navigateTo('/settings')">
            <span class="icon">⚙️</span> Impostazioni
          </button>

          <button
              v-if="authStore.user?.role === 'ADMIN'"
              @click="navigateTo('/admin')"
              class="admin-link"
          >
            <span class="icon">🛡️</span> Admin Panel
          </button>

          <hr />

          <button @click="handleLogout" class="logout-btn">
            <span class="icon">🚪</span> Esci
          </button>
        </nav>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.user-menu-container {
  position: relative;
  display: inline-block;
}

.avatar-trigger {
  cursor: pointer;
  transition: opacity 0.2s;
}

.avatar-trigger:hover {
  opacity: 0.8;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 220px;
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  z-index: 1000;
  padding: 8px 0;
}

.user-info {
  padding: 12px 16px;
}

.user-info .name {
  font-weight: 600;
  font-size: 0.95rem;
  color: #333;
  margin: 0;
}

.user-info .email {
  font-size: 0.8rem;
  color: #666;
  margin: 0;
}

hr {
  border: 0;
  border-top: 1px solid #eee;
  margin: 8px 0;
}

.menu-items {
  display: flex;
  flex-direction: column;
}

.menu-items button {
  background: none;
  border: none;
  padding: 10px 16px;
  text-align: left;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #444;
  transition: background 0.2s;
}

.menu-items button:hover {
  background-color: #f5f5f5;
}

.admin-link {
  color: #1a73e8 !important;
  font-weight: 500;
}

.logout-btn {
  color: #d93025 !important;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>