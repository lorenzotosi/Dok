<script setup lang="ts">
import {ref, onMounted, onUnmounted} from 'vue';
import { AdminService } from '../../services/admin.service';
import type {FSNode, VFSResponse} from "../../types/admin.types.ts";
import FileSystemNode from "./FileSystemNode.vue";
import {socketService} from "../../services/socket.service.ts";

const props = defineProps<{
  userId: string,
  selectedItemId?: string
}>();
const emit = defineEmits(['item-selected']);

const vfsData = ref<VFSResponse>({ privateTree: [], publicTree: [], sharedDocs: [] });
const isLoading = ref(true);
const activeTab = ref<'private' | 'public' | 'shared'>('private');
const expandedFolders = ref<Record<string, boolean>>({});


const findNodeById = (nodes: FSNode[], id: string): FSNode | null => {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

const loadFileSystem = async () => {
  try {
    if (vfsData.value.privateTree.length === 0) isLoading.value = true;

    vfsData.value = await AdminService.getUserFileSystem(props.userId);
    if (props.selectedItemId) {
      const updatedNode =
          findNodeById(vfsData.value.privateTree, props.selectedItemId) ||
          findNodeById(vfsData.value.publicTree, props.selectedItemId) ||
          findNodeById(vfsData.value.sharedDocs, props.selectedItemId);
      emit('item-selected', updatedNode || null);
    }
  } catch (error) {
    console.error("Errore caricamento FS:", error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadFileSystem();
  const socket = socketService.getSocket();
  if (socket) {
    socket.on('user_metrics_update', (payload) => {
      if (payload.userId === props.userId) {
        loadFileSystem();
      }
    });
  }
});

onUnmounted(() => {
  const socket = socketService.getSocket();
  if (socket) socket.off('user_metrics_update');
});

const handleItemClick = (node: FSNode) => {
  emit('item-selected', node);
};
</script>

<template>
  <div class="vfs-container">
    <div class="vfs-tabs">
      <button :class="{ active: activeTab === 'private' }" @click="activeTab = 'private'">🔒 Spazio Privato</button>
      <button :class="{ active: activeTab === 'public' }" @click="activeTab = 'public'">🌍 Spazio Globale</button>
      <button :class="{ active: activeTab === 'shared' }" @click="activeTab = 'shared'">👥 Condivisi con l'utente</button>
    </div>

    <div v-if="isLoading" class="loading-text">Sincronizzazione File System...</div>

    <div v-else class="vfs-content">
      <div v-show="activeTab === 'private'">
        <p class="tab-desc">File privati dell'utente. I nomi sono offuscati per privacy.</p>
        <div v-if="vfsData.privateTree.length === 0" class="empty-state">Nessun file privato.</div>
        <FileSystemNode v-for="node in vfsData.privateTree" :key="node.id" :node="node" :expanded-folders="expandedFolders" @node-click="handleItemClick" />
      </div>

      <div v-show="activeTab === 'public'">
        <p class="tab-desc">Albero di rete globale. Mostra la gerarchia fino ai file creati da questo utente.</p>
        <div v-if="vfsData.publicTree.length === 0" class="empty-state">Nessun file nel Drive Globale.</div>
        <FileSystemNode v-for="node in vfsData.publicTree" :key="node.id" :node="node" :expanded-folders="expandedFolders" @node-click="handleItemClick" />
      </div>

      <div v-show="activeTab === 'shared'">
        <p class="tab-desc">Documenti di altri utenti condivisi con questo utente. I nomi sono offuscati per privacy.</p>
        <div v-if="vfsData.sharedDocs.length === 0" class="empty-state">Nessun documento ricevuto.</div>
        <FileSystemNode v-for="node in vfsData.sharedDocs" :key="node.id" :node="node" :expanded-folders="expandedFolders" @node-click="handleItemClick" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.vfs-container { display: flex; flex-direction: column; height: 100%; }
.vfs-tabs { display: flex; border-bottom: 1px solid #3f3f3f; margin-bottom: 15px; }
.vfs-tabs button {
  background: none; border: none; color: #949ba4; padding: 10px 15px;
  cursor: pointer; font-weight: bold; font-size: 0.9rem; transition: all 0.2s;
}
.vfs-tabs button:hover { color: #dbdee1; }
.vfs-tabs button.active { color: #5865F2; border-bottom: 2px solid #5865F2; }
.vfs-content { flex-grow: 1; overflow-y: auto; padding-right: 10px; }
.tab-desc { font-size: 0.8rem; color: #949ba4; margin-bottom: 15px; font-style: italic; }
.empty-state { text-align: center; color: #747f8d; padding: 20px; font-style: italic; }
.loading-text { padding: 20px; color: #dbdee1; }
</style>