<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { AdminService, type AdminDashboardUser } from '../services/admin.service';
import { socketService } from "../services/socket.service.ts";
import AdminUsersTable from '../components/admin/AdminUsersTable.vue';

const router = useRouter();

const users = ref<AdminDashboardUser[]>([]);
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);

const searchQuery = ref('');
const sortKey = ref<'status' | 'name' | 'email' | 'lastSeen' | null>(null);
const sortOrder = ref<'asc' | 'desc'>('asc');

const navigateBack = () => router.push('/');

const fetchUsers = async () => {
  try {
    errorMessage.value = null;
    users.value = await AdminService.getAllUsers();
  } catch (error: any) {
    errorMessage.value = error.response?.data?.error || 'Errore durante il recupero degli utenti.';
    console.error('[AdminDashboard] Fetch error:', error);
  } finally {
    isLoading.value = false;
  }
};

const bootstrapDashboard = (socket: any) => {
  fetchUsers().then(() => {
    socket.emit('join_admin_dashboard');
    socket.on('presence_update', ({ userId, isOnline }: { userId: string, isOnline: boolean }) => {
      const user = users.value.find(u => u.id === userId);
      if (user) {
        user.isOnline = isOnline;
        if (!isOnline) {
          user.lastSeen = new Date().toISOString();
        }
      }
    });
  });
};

onMounted(() => {
  const socket = socketService.getSocket();
  if (socket && socket.connected) {
    bootstrapDashboard(socket);
  } else if (socket) {
    socket.on('connect', () => bootstrapDashboard(socket));
  } else {
    fetchUsers();
  }
});

onUnmounted(() => {
  const socket = socketService.getSocket();
  if (socket) {
    socket.emit('leave_admin_dashboard');
    socket.off('presence_update');
  }
});

const handleSort = (key: 'status' | 'name' | 'email' | 'lastSeen') => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
};

const filteredAndSortedUsers = computed(() => {
  let result = users.value;

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(u =>
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }

  if (sortKey.value) {
    result = [...result].sort((a, b) => {
      let valA: any, valB: any;
      switch (sortKey.value) {
        case 'status':
          valA = a.isOnline ? 1 : 0;
          valB = b.isOnline ? 1 : 0;
          break;
        case 'name':
          valA = `${a.firstName} ${a.lastName}`.toLowerCase();
          valB = `${b.firstName} ${b.lastName}`.toLowerCase();
          break;
        case 'email':
          valA = a.email.toLowerCase();
          valB = b.email.toLowerCase();
          break;
        case 'lastSeen':
          valA = a.isOnline ? Infinity : (a.lastSeen ? new Date(a.lastSeen).getTime() : 0);
          valB = b.isOnline ? Infinity : (b.lastSeen ? new Date(b.lastSeen).getTime() : 0);
          break;
      }
      if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1;
      return 0;
    });
  }

  return result;
});
</script>

<template>
  <div class="admin-dashboard-container">
    <div class="top-actions-row">
      <button @click="navigateBack" class="back-button">
        <span class="icon">&#8592;</span> Torna alla Home
      </button>
      <button @click="router.push({name:'AdminStats'})" class="stats-button">
        Statistiche Sistema <span class="icon">&#8594;</span>
      </button>
    </div>

    <div class="header-titles">
      <h1>Gestione Utenti</h1>
      <p class="subtitle">Monitoraggio accessi e permessi di sistema</p>
    </div>

    <div class="search-row">
      <div class="search-container">
        <label for="userSearch" class="sr-only">Cerca utente per nome o email</label>
        <input
            id="userSearch"
            type="text"
            v-model="searchQuery"
            placeholder="Cerca nome o email..."
            class="search-input"
        />
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">
      Caricamento utenti in corso...
    </div>

    <div v-else-if="errorMessage" class="error-state">
      {{ errorMessage }}
      <button @click="fetchUsers" class="retry-btn">Riprova</button>
    </div>

    <AdminUsersTable
        v-else
        :users="filteredAndSortedUsers"
        :current-sort-key="sortKey"
        :current-sort-order="sortOrder"
        @sort="handleSort"
    />
  </div>
</template>

<style scoped>
.admin-dashboard-container {
  width: 100%;
  min-height: 100vh;
  background-color: #1e1f22;
  padding: 20px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.top-actions-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  width: 100%;
}


.back-button {
  align-self: flex-start;
  border: 1px solid #3f3f3f;
  background: #2b2d31;
  color: #dbdee1;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  margin-bottom: 0;
}

.back-button:hover {
  background-color: #3f4147;
  color: #ffffff;
  border-color: #5865F2;
}

.stats-button {
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

.stats-button:hover {
  background-color: #1a7c43;
}

.header-titles {
  text-align: center;
  margin-bottom: 20px;
}

.header-titles h1 {
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.5px;
  color: #dbdee1;
}

.header-titles .subtitle {
  color: #949BA4;
  font-size: 1rem;
  margin-top: 8px;
}

.search-row {
  display: flex;
  justify-content: flex-end;
  width: 100%;
  margin-bottom: 20px;
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
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0;
}

.loading-state, .error-state {
  text-align: center;
  padding: 50px;
  background-color: #2b2d31;
  border-radius: 8px;
  color: #dbdee1;
  font-size: 1.1rem;
}

.error-state {
  color: #f23f42;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.retry-btn {
  background-color: #5865F2;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}
</style>