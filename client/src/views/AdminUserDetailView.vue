<script setup lang="ts">
import {ref, onMounted, onUnmounted} from 'vue';
import {useRoute} from 'vue-router';
import AdminUserInfoCard from '../components/admin/AdminUserInfoCard.vue';
import AdminAccessLogsDrawer from '../components/admin/AdminAccessLogsDrawer.vue';
import AdminItemDetailsDrawer from '../components/admin/AdminItemDetailsDrawer.vue';
import {socketService} from "../services/socket.service.ts";
import type {AdminUserDetail} from "../types/admin.types.ts";
import {AdminService} from "../services/admin.service.ts";

const route = useRoute();
const userId = route.params.id as string;

const isLeftDrawerOpen = ref(false);
const isRightDrawerOpen = ref(false);

const userDetail = ref<AdminUserDetail | null>(null);
const selectedItem = ref<any>(null); //TODO
const errorMessage = ref<string | null>(null);

const fetchUserDetail = async () => {
  try {
    userDetail.value = await AdminService.getUserDetail(userId);
  } catch (error) {
    errorMessage.value = "Impossibile recuperare i dati dell'utente.";
  }
};

onMounted(() => {
  const socket = socketService.getSocket();

  if (socket && socket.connected) {
    bootstrapView(socket);
  } else if (socket) {
    socket.on('connect', () => bootstrapView(socket));
  } else {
    fetchUserDetail();
  }
});

const bootstrapView = (socket: any) => {
  socket.emit('join_admin_dashboard', () => {
    fetchUserDetail();
  });

  socket.on('presence_update', (data: { userId: string, isOnline: boolean, lastSeen?: string }) => {
    if (userDetail.value && data.userId === userId) {
      userDetail.value.isOnline = data.isOnline;
      if (data.lastSeen) userDetail.value.lastSeen = data.lastSeen;
    }
  });

  socket.on('user_metrics_update', (data: { userId: string, metrics: Partial<AdminUserDetail> }) => {
    if (userDetail.value && data.userId === userId) {
      Object.assign(userDetail.value, data.metrics);
    }
  });
};

onUnmounted(() => {
  const socket = socketService.getSocket();
  if (socket) {
    socket.emit('leave_admin_dashboard');
    socket.off('presence_update');
    socket.off('user_metrics_update');
  }
});
</script>

<template>
  <div class="admin-detail-layout">
    <div v-if="errorMessage" class="error-msg">{{ errorMessage }}</div>

    <AdminUserInfoCard v-else :user="userDetail" />

    <div class="actions-bar">
      <button @click="isLeftDrawerOpen = true" class="action-btn">
        <span class="icon">📜</span> Vedi Log Accessi
      </button>
      <button @click="isRightDrawerOpen = true" class="action-btn">
        <span class="icon">ℹ️</span> Simula Click Elemento
      </button>
    </div>

    <div class="tree-container shadow-md">
      <h3>Virtual File System</h3>
      <p class="placeholder-text">L'albero dei documenti e delle cartelle verrà renderizzato qui.</p>
    </div>

    <AdminAccessLogsDrawer
        :is-open="isLeftDrawerOpen"
        @close="isLeftDrawerOpen = false"
    />

    <AdminItemDetailsDrawer
        :is-open="isRightDrawerOpen"
        :item-details="selectedItem"
        @close="isRightDrawerOpen = false"
    />
  </div>
</template>

<style scoped>
.admin-detail-layout {
  min-height: 100vh;
  background-color: #1e1f22;
  padding: 20px;
  position: relative;
  overflow-x: hidden;
}

.actions-bar {
  display: flex; gap: 15px; margin-bottom: 20px;
}

.action-btn {
  background-color: #5865F2; color: white; border: none;
  padding: 10px 15px; border-radius: 4px; cursor: pointer;
  display: flex; align-items: center; gap: 8px; font-weight: 500;
}

.action-btn:hover { background-color: #4752c4; }

.tree-container {
  background-color: #2b2d31; border-radius: 8px; padding: 20px;
  color: #dbdee1; min-height: 400px;
}

.placeholder-text { color: #949ba4; font-style: italic; }
</style>