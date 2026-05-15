<script setup lang="ts">
import { useRouter } from 'vue-router';
import type {AdminUserDetail} from "../../types/admin.types.ts";
import UserAvatar from "../common/UserAvatar.vue";
import { useAuthStore } from '../../stores/auth.store';

defineProps<{ user: AdminUserDetail | null }>();
const emit = defineEmits(['toggle-role']);

const router = useRouter();
const authStore = useAuthStore();
</script>

<template>
  <div class="user-info-card shadow-md">
    <button @click="router.back()" class="back-btn">
      ← Torna alla Dashboard
    </button>

    <div v-if="user" class="info-grid">
      <div class="profile-section">
        <UserAvatar :user="user" size="lg"/>
        <div class="details">
          <h2>{{ user.firstName }} {{ user.lastName }}</h2>
          <p class="email">{{ user.email }}</p>
          <div class="role-row">
            <span class="badge" :class="user.role.toLowerCase()">{{ user.role }}</span>

            <button
                v-if="user.id !== authStore.user?.id"
                @click="emit('toggle-role')"
                class="role-btn"
                :class="{ 'demote': user.role === 'ADMIN' }"
            >
              {{ user.role === 'ADMIN' ? '↓ Revoca Admin' : '↑ Promuovi ad Admin' }}
            </button>
          </div>
          <span class="status" :class="{ online: user.isOnline }">
            {{ user.isOnline ? 'Online' : 'Offline' }}
          </span>
        </div>
      </div>

      <div class="metrics-section">
        <div class="metric">
          <span class="value">{{ user.docsCreated }}</span>
          <span class="label">Creati</span>
        </div>
        <div class="metric">
          <span class="value">{{ user.docsSharedByMe }}</span>
          <span class="label">Condivisi</span>
        </div>
        <div class="metric">
          <span class="value">{{ user.docsSharedWithMe }}</span>
          <span class="label">Ricevuti</span>
        </div>
      </div>
    </div>
    <div v-else class="loading">Caricamento dati utente...</div>
  </div>
</template>

<style scoped>
.user-info-card {
  background-color: #2b2d31;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  color: #dbdee1;
}

.back-btn {
  background: none;
  border: 1px solid #3f3f3f;
  color: #dbdee1;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 20px;
  font-size: 0.9rem;
}

.back-btn:hover { background-color: #3f4147; }

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

@media (min-width: 768px) {
  .info-grid { flex-direction: row; justify-content: space-between; align-items: center; }
}

.profile-section { display: flex; align-items: center; gap: 15px; }

.role-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.role-btn {
  background-color: #23a559;
  color: white;
  border: none;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}

.role-btn:hover { background-color: #1e8c4b; }

.role-btn.demote {
  background-color: #4f545c;
}

.role-btn.demote:hover { background-color: #f23f42; }

.details h2 { margin: 0 0 5px 0; font-size: 1.5rem; color: #4338ca}
.email { margin: 0 0 10px 0; color: #949ba4; font-size: 0.9rem; }
.badge { padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; margin-right: 10px; }
.badge.admin { background-color: #f23f42; color: white; }
.badge.user { background-color: #23a559; color: white; }
.status.online { color: #23a559; }

.metrics-section { display: flex; gap: 20px; }
.metric { display: flex; flex-direction: column; align-items: center; background-color: #1e1f22; padding: 10px 20px; border-radius: 6px; }
.metric .value { font-size: 1.5rem; font-weight: bold; color: #5865F2; }
.metric .label { font-size: 0.8rem; color: #949ba4; text-transform: uppercase; }
</style>