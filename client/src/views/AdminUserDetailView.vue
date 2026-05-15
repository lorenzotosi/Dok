<script setup lang="ts">
import {ref, onMounted, onUnmounted} from 'vue';
import {useRoute} from 'vue-router';
import AdminUserInfoCard from '../components/admin/AdminUserInfoCard.vue';
import AdminAccessLogsDrawer from '../components/admin/AdminAccessLogsDrawer.vue';
import AdminItemDetailsPanel from '../components/admin/AdminItemDetailsPanel.vue';
import {socketService} from "../services/socket.service.ts";
import type {AdminUserDetail, FSNode} from "../types/admin.types.ts";
import {AdminService} from "../services/admin.service.ts";
import VirtualFileSystem from '../components/admin/VirtualFileSystem.vue';

const route = useRoute();
const userId = route.params.id as string;

const isLeftDrawerOpen = ref(false);

const userDetail = ref<AdminUserDetail | null>(null);
const selectedItem = ref<any>(null); //apre il pannello di destra
const errorMessage = ref<string | null>(null);

const fetchUserDetail = async () => {
  try {
    userDetail.value = await AdminService.getUserDetail(userId);
  } catch (error) {
    errorMessage.value = "Impossibile recuperare i dati dell'utente.";
  }
};

const onFileSystemItemSelected = (node: FSNode) => {
  selectedItem.value = node;
};

const closeItemDetails = () => {
  selectedItem.value = null;
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

    <div v-else class="split-layout">

      <div class="main-column">
        <AdminUserInfoCard :user="userDetail" />

        <div class="actions-bar">
          <button @click="isLeftDrawerOpen = true" class="action-btn">
            <span class="icon">📜</span> Vedi Log Accessi
          </button>
        </div>

        <div class="tree-container shadow-md">
          <h3>Virtual File System (Admin View)</h3>
          <p class="privacy-notice">Nota: I titoli dei documenti sono offuscati per privacy.</p>

          <VirtualFileSystem @item-selected="onFileSystemItemSelected" :userId="userId" />
        </div>
      </div>

      <aside v-if="selectedItem" class="details-sidebar">
        <AdminItemDetailsPanel
            :item="selectedItem"
            @close="closeItemDetails"
        />
      </aside>

    </div>

    <AdminAccessLogsDrawer
        :is-open="isLeftDrawerOpen"
        @close="isLeftDrawerOpen = false"
    />
  </div>
</template>

<style scoped>
.admin-detail-layout {
  min-height: 100vh;
  background-color: #1e1f22;
  padding: 20px;
  overflow-x: hidden;
}

.split-layout {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  max-width: 1600px;
  margin: 0 auto;
}

.main-column {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.details-sidebar {
  width: 350px;
  flex-shrink: 0;
  height: calc(100vh - 40px);
  position: sticky;
  top: 20px;
}

@media (max-width: 1024px) {
  .split-layout {
    flex-direction: column;
  }
  .details-sidebar {
    width: 100%;
    height: auto;
    position: static;
  }
}

.actions-bar {
  display: flex; gap: 15px;
}

.action-btn {
  background-color: #5865F2; color: white; border: none;
  padding: 10px 15px; border-radius: 4px; cursor: pointer;
  display: flex; align-items: center; gap: 8px; font-weight: 500;
}

.action-btn:hover { background-color: #4752c4; }

.tree-container {
  background-color: #2b2d31; border-radius: 8px; padding: 20px;
  color: #dbdee1;
}

.privacy-notice {
  font-size: 0.8rem;
  color: #e3a008;
  margin-bottom: 15px;
  font-style: italic;
}
</style>

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

.privacy-notice {
  font-size: 0.8rem;
  color: #e3a008;
  margin-bottom: 15px;
  font-style: italic;
}

</style>