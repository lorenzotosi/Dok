<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { AdminService } from '../services/admin.service';

const router = useRouter();
const logs = ref<any[]>([]);
const isLoading = ref(true);
const searchQuery = ref('');
const sortOrder = ref<'desc' | 'asc'>('desc');

const fetchLogs = async () => {
  try {
    logs.value = await AdminService.getGlobalAccessLogs();
  } catch (error) {
    console.error("Errore recupero log accessi:", error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchLogs();
});

const formatDateTime = (dateStr: string | null) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
};

const toggleSort = () => {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc';
};

const filteredAndSortedLogs = computed(() => {
  let result = logs.value;

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim();
    result = result.filter(log => {
      const fullName = `${log.userId?.firstName} ${log.userId?.lastName}`.toLowerCase();
      const email = (log.userId?.email || '').toLowerCase();
      return fullName.includes(q) || email.includes(q);
    });
  }

  result = [...result].sort((a, b) => {
    const timeA = new Date(a.loginAt).getTime();
    const timeB = new Date(b.loginAt).getTime();
    return sortOrder.value === 'desc' ? timeB - timeA : timeA - timeB;
  });

  return result;
});

const exportToCSV = () => {
  if (filteredAndSortedLogs.value.length === 0) {
    alert("Nessun dato da esportare");
    return;
  }

  const headers = ['Nome', 'Cognome', 'Email', 'Login At', 'Logout At', 'Indirizzo IP'];

  const rows = filteredAndSortedLogs.value.map(log => [
    log.userId?.firstName || '',
    log.userId?.lastName || '',
    log.userId?.email || '',
    formatDateTime(log.loginAt),
    log.logoutAt ? formatDateTime(log.logoutAt) : 'Sessione non chiusa',
    log.ipAddress || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(field => `"${field}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `log_accessi_dok_${new Date().toISOString().split('T')[0]}.csv`);

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>

<template>
  <div class="access-logs-container">
    <div class="top-actions-row">
      <button @click="router.back()" class="back-button">
        <span class="icon">&#8592;</span> Torna Indietro
      </button>
    </div>

    <div class="header-titles">
      <h1>Log Accessi</h1>
      <p class="subtitle">Tracciamento sessioni e connessioni</p>
    </div>

    <div class="search-row">
      <button @click="exportToCSV" class="export-button">
        <span class="icon">⬇️</span> Esporta in CSV
      </button>

      <div class="search-container">
        <label for="userSearch" class="sr-only">Cerca utente per nome o email</label>
        <input
            id="userSearch"
            v-model="searchQuery"
            type="text"
            placeholder="Cerca per nome o email..."
            class="search-input"
        />
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">Recupero log in corso...</div>

    <div v-else class="table-card">
      <div class="responsive-table-wrapper">
        <table class="logs-table">
          <thead>
          <tr>
            <th>Utente</th>
            <th class="sortable" @click="toggleSort">
              Login At
              <span v-if="sortOrder === 'desc'">▼</span>
              <span v-else>▲</span>
            </th>
            <th>Logout At</th>
            <th>Indirizzo IP</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="log in filteredAndSortedLogs" :key="log._id">
            <td class="user-cell">
              <div class="user-info">
                <span class="name">{{ log.userId?.firstName }} {{ log.userId?.lastName }}</span>
                <span class="email">{{ log.userId?.email }}</span>
              </div>
            </td>
            <td>{{ formatDateTime(log.loginAt) }}</td>
            <td :class="{ 'text-muted': !log.logoutAt }">
              {{ log.logoutAt ? formatDateTime(log.logoutAt) : 'Sessione non chiusa' }}
            </td>
            <td class="ip-cell">{{ log.ipAddress }}</td>
          </tr>
          <tr v-if="filteredAndSortedLogs.length === 0">
            <td colspan="4" class="empty-cell">Nessun log trovato.</td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.access-logs-container {
  width: 100%;
  min-height: 100vh;
  background-color: #1e1f22;
  padding: 24px;
  box-sizing: border-box;
}

.top-actions-row {
  display: flex;
  justify-content: flex-start;
  width: 100%;
  margin-bottom: 20px;
}

.back-button {
  background: #2b2d31;
  border: 1px solid #3f3f3f;
  color: #dbdee1;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.back-button:hover {
  background-color: #3f4147;
  color: #ffffff;
}

.header-titles {
  text-align: center;
  margin-bottom: 20px;
}

.header-titles h1 {
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
  color: #dbdee1;
}

.header-titles .subtitle {
  color: #949BA4;
  font-size: 1rem;
  margin-top: 8px;
}

.search-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 20px;
}

.export-button {
  background-color: #23a55a;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.export-button:hover {
  background-color: #1a7c43;
}

.search-container {
  width: 100%;
  max-width: 300px;
}

.search-input {
  width: 100%;
  padding: 10px 15px;
  border-radius: 6px;
  border: 1px solid #3f3f3f;
  background-color: #1e1f22;
  color: #dbdee1;
  font-size: 0.95rem;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.search-input:focus {
  outline: none;
  border-color: #5865F2;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.table-card {
  background-color: #2b2d31;
  border-radius: 8px;
  border: 1px solid #3f3f3f;
  overflow: hidden;
}

.responsive-table-wrapper {
  width: 100%;
  max-height: 70vh;
  overflow-y: auto;
}

.logs-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.logs-table th {
  background-color: #232428;
  padding: 12px;
  color: #949ba4;
  font-size: 0.85rem;
  text-transform: uppercase;
  border-bottom: 2px solid #1e1f22;
  position: sticky;
  top: 0;
  z-index: 10;
}

.logs-table .sortable {
  cursor: pointer;
  user-select: none;
}

.logs-table .sortable:hover {
  color: #dbdee1;
}

.logs-table td {
  padding: 12px;
  border-bottom: 1px solid #3f3f3f;
  font-size: 0.9rem;
  color: #dbdee1;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-info .name {
  font-weight: 500;
}

.user-info .email {
  font-size: 0.75rem;
  color: #949ba4;
}

.ip-cell {
  font-family: monospace;
  color: #949ba4;
}

.text-muted {
  color: #949ba4;
  font-style: italic;
}

.empty-cell {
  text-align: center;
  color: #949ba4;
  padding: 32px 12px !important;
}

.responsive-table-wrapper::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.responsive-table-wrapper::-webkit-scrollbar-track {
  background: #2b2d31;
}

.responsive-table-wrapper::-webkit-scrollbar-thumb {
  background: #1a1b1e;
  border-radius: 4px;
}

.loading-state {
  color: #dbdee1;
  text-align: center;
  padding: 40px;
}
</style>

```