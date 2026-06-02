<script setup lang="ts">
import AdminUserRow from './AdminUserRow.vue';
import type { AdminDashboardUser } from '../../services/admin.service';

const props = defineProps<{
  users: AdminDashboardUser[];
  currentSortKey: 'status' | 'name' | 'email' | 'lastSeen' | null;
  currentSortOrder: 'asc' | 'desc';
}>();

const emit = defineEmits<{
  (e: 'sort', key: 'status' | 'name' | 'email' | 'lastSeen'): void;
}>();

const getAriaSort = (key: string) => {
  if (props.currentSortKey !== key) return 'none';
  return props.currentSortOrder === 'asc' ? 'ascending' : 'descending';
};
</script>

<template>
  <div class="table-container shadow-md">
    <table class="users-table">
      <thead>
      <tr>
        <th scope="col" @click="emit('sort', 'status')" :aria-sort="getAriaSort('status')" class="sortable">
          Stato
          <span class="sort-icon" v-show="currentSortKey === 'status'">
              <span v-if="currentSortOrder === 'asc'">&#9650;</span>
              <span v-else>&#9660;</span>
            </span>
        </th>
        <th scope="col">Avatar</th>
        <th scope="col" @click="emit('sort', 'name')" :aria-sort="getAriaSort('name')" class="sortable">
          Utente
          <span class="sort-icon" v-show="currentSortKey === 'name'">
              <span v-if="currentSortOrder === 'asc'">&#9650;</span>
              <span v-else>&#9660;</span>
            </span>
        </th>
        <th scope="col" @click="emit('sort', 'email')" :aria-sort="getAriaSort('email')" class="sortable">
          Email
          <span class="sort-icon" v-show="currentSortKey === 'email'">
              <span v-if="currentSortOrder === 'asc'">&#9650;</span>
              <span v-else>&#9660;</span>
            </span>
        </th>
        <th scope="col" @click="emit('sort', 'lastSeen')" :aria-sort="getAriaSort('lastSeen')" class="sortable">
          Ultimo Accesso
          <span class="sort-icon" v-show="currentSortKey === 'lastSeen'">
              <span v-if="currentSortOrder === 'asc'">&#9650;</span>
              <span v-else>&#9660;</span>
            </span>
        </th>
        <th scope="col">Info</th>
      </tr>
      </thead>
      <tbody>
      <AdminUserRow
          v-for="user in users"
          :key="user.id"
          :user="user"
      />
      <tr v-if="users.length === 0">
        <td colspan="6" class="no-results">Nessun utente corrisponde ai criteri di ricerca.</td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-container {
  background-color: #2b2d31;
  border-radius: 8px;
  border: 1px solid #3f3f3f;
  flex-grow: 1;
  overflow: hidden;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  color: #dbdee1;
}

.users-table th {
  background-color: #232428;
  padding: 15px;
  color: #949BA4;
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #1e1f22;
}

.users-table :deep(td) {
  padding: 15px;
  color: #dbdee1;
}

th.sortable {
  cursor: pointer;
  user-select: none;
  transition: color 0.2s;
}

th.sortable:hover {
  color: #ffffff;
}

.sort-icon {
  display: inline-block;
  margin-left: 5px;
  font-weight: bold;
  color: #5865F2;
  font-size: 0.7rem;
}

.no-results {
  text-align: center;
  padding: 30px;
  color: #949BA4;
  font-style: italic;
}

@media (max-width: 768px) {
  .users-table :deep(th:nth-child(4)),
  .users-table :deep(td:nth-child(4)) {
    display: none;
  }
  .table-container {
    overflow-x: auto;
  }
}
</style>