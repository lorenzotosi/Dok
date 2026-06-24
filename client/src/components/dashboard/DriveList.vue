<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth.store';
import BaseIcon from '../common/BaseIcon.vue';

const router = useRouter();
const authStore = useAuthStore();

const props = defineProps<{
  folders: any[];
  documents: any[];
  isPublic?: boolean;
}>();

const emit = defineEmits<{
  (e: 'delete-folder', id: string): void;
  (e: 'delete-document', id: string): void;
  (e: 'enter-folder', id: string): void;
}>();

const formatDate = (dateString?: string) => {
  if (!dateString) return '---';
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(dateString));
};

const getOwnerName = (owner: any) => {
  if (!owner) return 'Sconosciuto';
  const id = typeof owner === 'string' ? owner : owner._id;
  if (id === authStore.user?.id) return `${authStore.user?.firstName} ${authStore.user?.lastName}`;
  
  if (typeof owner === 'object' && owner.firstName) {
    return `${owner.firstName} ${owner.lastName}`;
  }
  return 'Altro';
};

const isOwner = (item: any) => {
  const ownerId = item.ownerId?._id || item.ownerId;
  return authStore.user?.id === ownerId;
};
</script>

<template>
  <div class="list-view">
    <div class="list-header" role="row">
      <div class="col col-name" role="columnheader">Nome</div>
      <div class="col col-owner" role="columnheader">Proprietario</div>
      <div class="col col-date" role="columnheader">Ultima modifica</div>
      <div class="col col-actions" role="columnheader"></div>
    </div>

    <ul class="list-body">
      <li 
        v-for="folder in folders" 
        :key="folder._id" 
        class="list-row folder-row"
        @click="emit('enter-folder', folder._id)"
        role="row"
      >
        <div class="col col-name">
          <BaseIcon name="folder" class="icon-folder" />
          <span class="name">{{ folder.name }}</span>
          <span v-if="isPublic && isOwner(folder)" class="owner-tag">owner</span>
        </div>
        <div class="col col-owner">{{ getOwnerName(folder.ownerId) }}</div>
        <div class="col col-date">{{ formatDate(folder.updatedAt) }}</div>
        <div class="col col-actions">
          <button 
            v-if="authStore.isAuthenticated() && (isOwner(folder) || authStore.isAdmin())"
            class="action-btn delete-btn" 
            @click.stop="emit('delete-folder', folder._id)" 
            title="Elimina cartella"
          >
            <BaseIcon name="trash" size="16" />
          </button>
        </div>
      </li>

      <li 
        v-for="document in documents" 
        :key="document._id" 
        class="list-row document-row"
        @click="router.push(`/document/${document._id}`)"
        role="row"
      >
        <div class="col col-name">
          <BaseIcon name="file" class="icon-file" />
          <span class="name">{{ document.title }}</span>
          <span v-if="isPublic && isOwner(document)" class="owner-tag">owner</span>
          <span v-if="document.myRole && !(isPublic && document.myRole === 'viewer')" class="role-tag" :class="document.myRole">
            {{ document.myRole }}
          </span>
        </div>
        <div class="col col-owner">{{ getOwnerName(document.ownerId) }}</div>
        <div class="col col-date">{{ formatDate(document.updatedAt) }}</div>
        <div class="col col-actions">
          <button 
            v-if="authStore.isAuthenticated() && (isOwner(document) || authStore.isAdmin())"
            class="action-btn delete-btn" 
            @click.stop="emit('delete-document', document._id)" 
            title="Elimina documento"
          >
            <BaseIcon name="trash" size="16" />
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.list-view {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.list-header {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid #dadce0;
  color: #5f6368;
  font-size: 14px;
  font-weight: 500;
}

.list-body {
  list-style: none;
  padding: 0;
  margin: 0;
}

.list-row {
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 48px;
  border-bottom: 1px solid #f1f3f4;
  cursor: pointer;
  transition: background-color 0.2s;
  color: #3c4043;
  font-size: 13px;
}

.list-row:hover {
  background-color: #f8f9fa;
}

.col {
  display: flex;
  align-items: center;
}

.col-name {
  flex: 2;
  gap: 16px;
  font-weight: 500;
  overflow: hidden;
}

.name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.col-owner {
  flex: 1;
}

.col-date {
  flex: 1;
}

.col-actions {
  width: 48px;
  justify-content: flex-end;
}

.icon-folder { color: #5f6368; }
.icon-file { color: #4285f4; }

.action-btn {
  background: transparent;
  border: none;
  color: #5f6368;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s, color 0.2s;
  padding: 8px;
  border-radius: 50%;
  display: flex;
}

.action-btn:hover {
  background-color: rgba(0,0,0,0.05);
  color: #d93025;
}

.list-row:hover .action-btn {
  opacity: 1;
}

.owner-tag {
  background-color: #e8f0fe;
  color: #1967d2;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  margin-left: 8px;
  flex-shrink: 0;
}

.role-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 12px;
  margin-left: 8px;
  text-transform: capitalize;
  font-weight: 600;
  flex-shrink: 0;
}

.role-tag.editor {
  background-color: #e1f5fe;
  color: #0288d1;
}

.role-tag.commenter {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.role-tag.viewer {
  background-color: #f5f5f5;
  color: #616161;
}
</style>
