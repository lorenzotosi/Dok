<script setup lang="ts">
import type { AuditLogItem } from '../../../types/admin.types';
import UserAvatar from '../../common/UserAvatar.vue';

defineProps<{ logs: AuditLogItem[] }>();

const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
};
</script>

<template>
  <section class="table-card">
    <h2>Attività Modifiche</h2>
    <div class="responsive-table-wrapper">
      <table class="audit-table">
        <thead>
        <tr>
          <th>Utente</th>
          <th>Data e Ora</th>
          <th>Volume Inserimenti</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="log in logs" :key="log._id">
          <td class="user-cell">
            <UserAvatar :user="log.userId" size="sm" />
            <div class="user-info">
              <span class="name">{{ log.userId.firstName }} {{ log.userId.lastName }}</span>
              <span class="email">{{ log.userId.email }}</span>
            </div>
          </td>
          <td class="date-cell">{{ formatDateTime(log.createdAt) }}</td>
          <td class="diff-cell">
            <span class="badge-plus">+{{ log.charactersInserted || 0 }} caratteri</span>
          </td>
        </tr>
        <tr v-if="logs.length === 0">
          <td colspan="3" class="empty-cell">Nessuna modifica rilevata.</td>
        </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.table-card {
  background-color: #2b2d31;
  border-radius: 8px;
  border: 1px solid #3f3f3f;
  padding: 20px;
  height: 100%;
}

.table-card h2 {
  font-size: 1.2rem;
  margin-top: 0;
  margin-bottom: 16px;
  color: #f2f3f5;
}

.responsive-table-wrapper {
  width: 100%;
  max-height: 400px;
  overflow-y: auto;
  overflow-x: auto;
}

.responsive-table-wrapper::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.responsive-table-wrapper::-webkit-scrollbar-track {
  background: #2b2d31;
  border-radius: 4px;
}
.responsive-table-wrapper::-webkit-scrollbar-thumb {
  background: #1a1b1e;
  border-radius: 4px;
}
.responsive-table-wrapper::-webkit-scrollbar-thumb:hover {
  background: #111214;
}


.audit-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.audit-table th {
  background-color: #232428;
  padding: 12px;
  color: #949ba4;
  font-size: 0.8rem;
  text-transform: uppercase;
  border-bottom: 2px solid #1e1f22;
  white-space: nowrap;

  position: sticky;
  top: 0;
  z-index: 10;
}

.audit-table td {
  padding: 12px;
  border-bottom: 1px solid #3f3f3f;
  font-size: 0.9rem;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 200px;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-info .name {
  font-weight: 500;
  color: #f2f3f5;
}

.user-info .email {
  font-size: 0.75rem;
  color: #949ba4;
}

.date-cell {
  color: #b5bac1;
  white-space: nowrap;
}

.diff-cell {
  text-align: right;
}

.badge-plus {
  background-color: #233d2a;
  color: #23a55a;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.8rem;
  white-space: nowrap;
  display: inline-block;
}

.empty-cell {
  text-align: center;
  color: #949ba4;
  padding: 32px 12px !important;
  font-style: italic;
}
</style>