<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useDocumentStore } from '../../stores/document.stores';

const props = defineProps<{
  documentId: string;
  sharedWith: any[];
  isOwner: boolean;
  ownerData: any;
  myUserId: string;
}>();

const emit = defineEmits(['refresh']);

const documentStore = useDocumentStore();
const emailInput = ref('');
const roleSelected = ref<'viewer' | 'editor'>('viewer');
const isDropdownVisible = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const toggleDropdown = () => {
  isDropdownVisible.value = !isDropdownVisible.value;
};

const handleAddShare = async () => {
  if (!emailInput.value) return;
  await documentStore.shareDocument(props.documentId, emailInput.value, roleSelected.value);
  emailInput.value = '';
  emit('refresh');
};

const handleRemoveShare = async (userId: string) => {
  await documentStore.unshareDocument(props.documentId, userId);
  emit('refresh');
};

const handleUpdateRole = async (email: string, newRole: 'viewer' | 'editor') => {
  console.log('update role', email, newRole);
  await documentStore.shareDocument(props.documentId, email, newRole);
  emit('refresh');
};

// Chiudi dropdown se clicchi fuori
const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isDropdownVisible.value = false;
  }
};

onMounted(() => document.addEventListener('mousedown', handleClickOutside));
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside));
</script>

<template>
  <div class="share-container" ref="dropdownRef">
    <button class="share-btn" @click="toggleDropdown">
      <span class="share-icon">👤+</span>
      Condividi
    </button>

    <transition name="fade">
      <div v-if="isDropdownVisible" class="share-dropdown">
        <div class="dropdown-header">Condividi documento</div>
        
        <!-- Sezione 1: Aggiungi (Solo se Owner) -->
        <div v-if="isOwner" class="add-share-section">
          <div class="input-group">
            <input 
              v-model="emailInput" 
              type="email" 
              placeholder="Aggiungi persone (email)" 
              @keyup.enter="handleAddShare"
            />
            <select v-model="roleSelected">
              <option value="viewer">Visualizzatore</option>
              <option value="editor">Editor</option>
            </select>
            <button class="add-btn" @click="handleAddShare" :disabled="!emailInput">
              Invia
            </button>
          </div>
        </div>

        <!-- Info owner solo per i collaborators -->
        <div v-if="!isOwner" class="owner-informations">
          <div class="collab-info">
            <div class="collab-avatar">{{ props.ownerData.ownerId.firstName[0] }}</div>
            <div class="collab-details">
              <span class="collab-name">{{ props.ownerData.ownerId.firstName }} {{ props.ownerData.ownerId.lastName }}</span>
              <span class="collab-email">{{ props.ownerData.ownerId.email }}</span>
            </div>
            <span class="owner-badge"> Owner</span>
          </div>
        </div>

        <!-- Sezione 2: Lista Collaboratori -->
        <div class="collaborators-section">
          <div class="section-label">Persone con accesso</div>
          <div v-if="sharedWith.length === 0" class="empty-list">
            Nessun collaboratore esterno
          </div>
          <ul class="collaborators-list">
            <li v-for="item in sharedWith" :key="item.userId._id" class="collaborator-item">
              <div class="collab-info">
                <div class="collab-avatar">{{ item.userId.firstName?.[0] || '?' }}</div>
                <div class="collab-details">
                  <span class="collab-name">{{ item.userId.firstName }} {{ item.userId.lastName }}</span>
                  <span class="collab-email">{{ item.userId.email }}</span>
                </div>
                <span v-if="item.userId._id === props.myUserId" class="owner-badge"> You</span>
              </div>
              
              <div v-if="isOwner" class="collab-actions">
                <select 
                  :value="item.role" 
                  @change="(e) => handleUpdateRole(item.userId.email, (e.target as HTMLSelectElement).value as any)"
                  class="role-select"
                >
                  <option value="viewer">Visualizzatore</option>
                  <option value="editor">Editor</option>
                </select>
                <button class="remove-btn" @click="handleRemoveShare(item.userId._id)" title="Rimuovi accesso">
                  ✕
                </button>
              </div>
              <div v-else class="collab-role-badge">
                {{ item.role }}
              </div>
            </li>
          </ul>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.share-container {
  position: relative;
  display: inline-block;
}

.share-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #c2e7ff;
  color: #001d35;
  border: none;
  padding: 8px 16px;
  border-radius: 24px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s, box-shadow 0.2s;
}

.share-btn:hover {
  background-color: #b3d7ef;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.share-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 400px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  z-index: 1000;
  padding: 16px;
  border: 1px solid #dadce0;
}

.dropdown-header {
  font-size: 18px;
  color: #1f1f1f;
  margin-bottom: 16px;
}

.input-group {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  background: #f1f3f4;
  padding: 8px;
  border-radius: 8px;
}

input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  padding: 4px 8px;
  font-size: 14px;
}

select {
  background: white;
  border: 1px solid #dadce0;
  border-radius: 4px;
  padding: 2px 4px;
  font-size: 12px;
  cursor: pointer;
}

.add-btn {
  background-color: #1a73e8;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
}

.add-btn:disabled {
  background-color: #dadce0;
  cursor: not-allowed;
}

.section-label {
  font-size: 14px;
  color: #5f6368;
  margin-bottom: 12px;
  font-weight: 500;
}

.collaborators-list {
  list-style: none;
  padding: 0;
  max-height: 250px;
  overflow-y: auto;
}

.collaborator-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f1f3f4;
}

.collab-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.collab-avatar {
  width: 32px;
  height: 32px;
  background-color: #1a73e8;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.collab-details {
  display: flex;
  flex-direction: column;
}

.collab-name {
  font-size: 14px;
  color: #1f1f1f;
  font-weight: 500;
}

.collab-email {
  font-size: 12px;
  color: #5f6368;
}

.collab-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.remove-btn {
  background: transparent;
  border: none;
  color: #5f6368;
  cursor: pointer;
  padding: 4px;
  font-size: 16px;
  border-radius: 50%;
}

.remove-btn:hover {
  background-color: #f1f3f4;
  color: #d93025;
}

.collab-role-badge {
  font-size: 12px;
  color: #5f6368;
  background: #f1f3f4;
  padding: 2px 8px;
  border-radius: 12px;
  text-transform: capitalize;
}

.owner-badge {
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

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>