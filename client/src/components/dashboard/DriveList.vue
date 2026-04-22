<script setup lang="ts">
import { useRouter } from 'vue-router';

import { useAuthStore } from '../../stores/auth.store';

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
  if (id === authStore.user?.id) return authStore.user?.firstName + ' ' + authStore.user?.lastName;
  
  if (typeof owner === 'object' && owner.firstName) {
    return `${owner.firstName} ${owner.lastName}`;
  }
  return 'Altro';
};
</script>

<template>
  <div class="list-view">
    <div class="list-header">
      <div class="col-name">Nome</div>
      <div class="col-owner">Proprietario</div>
      <div class="col-date">Ultima modifica</div>
      <div class="col-actions"></div>
    </div>

    <div class="list-body">
      <!-- Sezione Cartelle -->
      <template v-if="folders.length > 0">
        <div 
          v-for="folder in folders" 
          :key="folder._id" 
          class="list-row folder-row"
          @click="emit('enter-folder', folder._id)"
        >
          <div class="col-name">
            <span class="icon">🗂️</span>
            <span class="name">{{ folder.name }}</span>
            <span v-if="isPublic && (folder.ownerId._id || folder.ownerId) === authStore.user?.id" class="owner-tag">owner</span>
          </div>
          <div class="col-owner">{{ getOwnerName(folder.ownerId) }}</div>
          <div class="col-date">{{ formatDate(folder.updatedAt) }}</div>
          <div class="col-actions">
            <button v-if="authStore.isAuthenticated() && authStore.user?.id === (folder.ownerId?._id || folder.ownerId)" class="icon-btn delete-btn" @click.stop="emit('delete-folder', folder._id)" title="Elimina cartella">🗑️</button>
          </div>
        </div>
      </template>

      <!-- Sezione Documenti -->
      <template v-if="documents.length > 0">
        <div 
          v-for="document in documents" 
          :key="document._id" 
          class="list-row document-row"
          @click="router.push(`/document/${document._id}`)"
        >
          <div class="col-name">
            <span class="icon">📄</span>
            <span class="name">{{ document.title }}</span>
            <span v-if="isPublic && (document.ownerId._id || document.ownerId) === authStore.user?.id" class="owner-tag">owner</span>
            <span v-if="document.myRole && !(isPublic && document.myRole === 'viewer')" class="role-tag" :class="document.myRole">
              {{ document.myRole }}
            </span>
          </div>
          <div class="col-owner">{{ getOwnerName(document.ownerId) }}</div>
          <div class="col-date">{{ formatDate(document.updatedAt) }}</div>
          <div class="col-actions">
             <button v-if="authStore.isAuthenticated() && authStore.user?.id === (document.ownerId?._id || document.ownerId)" class="icon-btn delete-btn" @click.stop="emit('delete-document', document._id)" title="Elimina documento">🗑️</button>
          </div>
        </div>
      </template>
    </div>
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

.col-name {
  flex: 2;
  display: flex;
  align-items: center;
  gap: 16px;
  font-weight: 500;
}

.col-owner {
  flex: 1;
}

.col-date {
  flex: 1;
}

.col-actions {
  width: 48px;
  display: flex;
  justify-content: flex-end;
}

.icon {
  font-size: 20px;
}

.icon-btn {
  background: transparent;
  border: none;
  font-size: 16px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
}

.list-row:hover .icon-btn {
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

.role-tag.viewer {
  background-color: #f5f5f5;
  color: #616161;
}
</style>
