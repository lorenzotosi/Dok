<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { socketService } from '../services/socket.service.ts';
import { AdminService } from '../services/admin.service.ts';
import type { AuditLogItem } from '../types/admin.types.ts';
import AdminAccessLogTable from '../components/admin/audit/AdminAccessLogTable.vue';
import AdminModificationLogTable from '../components/admin/audit/AdminModificationLogTable.vue';

const route = useRoute();
const router = useRouter();
const documentId = route.params.id as string;

const logs = ref<AuditLogItem[]>([]);
const searchQuery = ref('');
const isLoading = ref(true);
const documentTitle = ref('Caricamento...');

const fetchData = async () => {
  try {
    const docInfo = await AdminService.getDocumentBasicInfo(documentId);
    documentTitle.value = docInfo.title;
    logs.value = await AdminService.getDocumentLogs(documentId);
  } catch (error) {
    console.error("Errore nel caricamento:", error);
  } finally {
    isLoading.value = false;
  }
};

const setupSockets = () => {
  const socket = socketService.getSocket();
  if (!socket) return;
  socket.emit('join_admin_document_logs', { documentId });
  socket.on('new_audit_log', (newLog: AuditLogItem) => {
    logs.value.unshift(newLog);
  });
};

onMounted(() => {
  fetchData();
  setupSockets();
});

onUnmounted(() => {
  const socket = socketService.getSocket();
  if (socket) {
    socket.emit('leave_admin_document_logs', { documentId });
    socket.off('new_audit_log');
  }
});

const filteredLogs = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return logs.value;
  return logs.value.filter(log => {
    const fullName = `${log.userId?.firstName} ${log.userId?.lastName}`.toLowerCase();
    return fullName.includes(q) || (log.userId?.email || '').toLowerCase().includes(q);
  });
});

const accessLogs = computed(() => filteredLogs.value.filter(l => l.type === 'access'));
const modificationLogs = computed(() => filteredLogs.value.filter(l => l.type === 'modification'));
</script>

<template>
  <div class="admin-logs-container">
    <header class="logs-header">
      <button @click="router.back()" class="back-btn">
        &#8592; Torna Indietro
      </button>
      <div class="title-section">
        <h1>Log del Dok</h1>
        <p class="subtitle"><span>{{ documentTitle }}</span></p>
      </div>
    </header>

    <div class="search-section">
      <input v-model="searchQuery" type="text" placeholder="Cerca collaboratore..." class="search-input" />
    </div>

    <div v-if="isLoading" class="loading-state">Caricamento tracciamenti...</div>
    <div v-else class="tables-grid">
      <AdminAccessLogTable :logs="accessLogs" />
      <AdminModificationLogTable :logs="modificationLogs" />
    </div>
  </div>
</template>

<style scoped>
.admin-logs-container {
  width: 100%;
  min-height: 100vh;
  background-color: #313338;
  color: #dbdee1;
  padding: 24px;
  box-sizing: border-box;
}

.logs-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.back-btn {
  align-self: flex-start;
  background-color: #4e5058;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s ease;
}

.back-btn:hover {
  background-color: #6d6f78;
}

.title-section h1 {
  font-size: 1.75rem;
  margin: 0;
  color: #fff;
}

.subtitle {
  color: #949ba4;
  margin-top: 4px;
}

.subtitle span {
  color: #5865f2;
  font-weight: 600;
}

.search-section {
  margin-bottom: 24px;
}

.search-input {
  width: 100%;
  max-width: 400px;
  padding: 12px 16px;
  border-radius: 6px;
  border: 1px solid #1e1f22;
  background-color: #1e1f22;
  color: #dbdee1;
  font-size: 0.95rem;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #5865f2;
}

.tables-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

@media (min-width: 1024px) {
  .tables-grid {
    flex-direction: row;
    align-items: flex-start;
  }
  .tables-grid > * {
    flex: 1;
    min-width: 0;
  }
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: #949ba4;
  font-size: 1.1rem;
}
</style>