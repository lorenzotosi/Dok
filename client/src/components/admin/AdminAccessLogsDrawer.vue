<script setup lang="ts">
import {ref, watch} from 'vue';
import {AdminService} from '../../services/admin.service';

const props = defineProps<{ isOpen: boolean, userId: string }>();
const emit = defineEmits(['close']);

const logs = ref<any[]>([]);
const isLoading = ref(false);

const fetchLogs = async () => {
  if (!props.userId) return;
  isLoading.value = true;
  try {
    logs.value = await AdminService.getUserAccessLogs(props.userId);
  } catch (error) {
    console.error("Errore recupero log personali:", error);
  } finally {
    isLoading.value = false;
  }
};

watch(() => props.isOpen, (newVal) => {
  if (newVal) fetchLogs();
});

const formatDateTime = (dateStr: string | null) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};
</script>

<template>
  <div class="drawer left-drawer" :class="{ 'is-open': isOpen }">
    <div class="drawer-header">
      <h3>Log Accessi Utente</h3>
      <button @click="emit('close')" class="close-btn">×</button>
    </div>

    <div class="drawer-content">
      <div v-if="isLoading" class="loading-state">Recupero dati...</div>

      <div v-else-if="logs.length === 0" class="empty-state">
        <p class="placeholder-text">Nessun accesso registrato per questo utente.</p>
      </div>

      <ul v-else class="log-list">
        <li v-for="log in logs" :key="log._id" class="log-item">
          <div class="log-row">
            <span class="label">Login:</span>
            <span class="value text-green">{{ formatDateTime(log.loginAt) }}</span>
          </div>
          <div class="log-row">
            <span class="label">Logout:</span>
            <span class="value" :class="{ 'text-muted': !log.logoutAt }">
              {{ log.logoutAt ? formatDateTime(log.logoutAt) : 'In corso / Crash' }}
            </span>
          </div>
          <div class="log-row ip-row">
            <span class="label">IP:</span>
            <span class="value monospace">{{ log.ipAddress }}</span>
          </div>
        </li>
      </ul>
    </div>
  </div>
  <div v-if="isOpen" class="backdrop" @click="emit('close')"></div>
</template>

<style scoped>
.drawer {
  position: fixed;
  top: 0;
  bottom: 0;
  width: 350px;
  max-width: 80vw;
  background-color: #2b2d31;
  color: #dbdee1;
  z-index: 1000;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.5);
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
}

.left-drawer {
  left: 0;
  transform: translateX(-100%);
}

.left-drawer.is-open {
  transform: translateX(0);
}

.drawer-header {
  padding: 20px;
  border-bottom: 1px solid #1e1f22;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.drawer-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.close-btn {
  background: none;
  border: none;
  color: #949ba4;
  font-size: 1.5rem;
  cursor: pointer;
}

.close-btn:hover {
  color: #fff;
}

.drawer-content {
  padding: 20px;
  overflow-y: auto;
  flex-grow: 1;
}

.placeholder-text {
  color: #949ba4;
  font-style: italic;
}

.loading-state {
  color: #949ba4;
  text-align: center;
  margin-top: 20px;
}

.log-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.log-item {
  background-color: #1e1f22;
  border: 1px solid #3f3f3f;
  border-radius: 6px;
  padding: 12px;
}

.log-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  margin-bottom: 4px;
}

.log-row:last-child {
  margin-bottom: 0;
}

.label {
  color: #949ba4;
  font-weight: 600;
}

.value {
  color: #dbdee1;
}

.text-green {
  color: #23a55a;
  font-weight: bold;
}

.text-muted {
  color: #949ba4;
  font-style: italic;
}

.ip-row {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #2b2d31;
}

.monospace {
  font-family: monospace;
  color: #5865F2;
}

.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 999;
}

.drawer-content::-webkit-scrollbar {
  width: 6px;
}

.drawer-content::-webkit-scrollbar-track {
  background: transparent;
}

.drawer-content::-webkit-scrollbar-thumb {
  background: #1a1b1e;
  border-radius: 4px;
}
</style>