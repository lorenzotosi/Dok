<script setup lang="ts">
import { computed } from 'vue';
import type {FSNode} from "../../types/admin.types.ts";
import UserAvatar from "../common/UserAvatar.vue";

const props = defineProps<{
  item: FSNode | null
}>();

const emit = defineEmits(['close']);

const isFolder = computed(() => props.item?.type === 'folder');
const isDocument = computed(() => props.item?.type === 'document');

const formattedDate = computed(() => {
  if (!props.item?.createdAt) return 'Data sconosciuta';
  return new Date(props.item.createdAt).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
});
</script>

<template>
  <div class="details-panel shadow-md">
    <div class="panel-header">
      <div class="header-title">
        <span class="icon">{{ isFolder ? '📁' : '📄' }}</span>
        <h3>Dettagli Elemento</h3>
      </div>
      <button @click="emit('close')" class="close-btn" title="Chiudi pannello">×</button>
    </div>

    <div class="panel-content" v-if="item">
      <h4 class="item-name">{{ item.name }}</h4>

      <div v-if="isFolder" class="stats-grid">
        <div class="stat-box">
          <span class="label">Creata il</span>
          <span class="value">{{ formattedDate }}</span>
        </div>
        <div class="stat-box">
          <span class="label">Documenti interni</span>
          <span class="value highlight">{{ item.docsCount || 0 }}</span>
        </div>
        <div class="stat-box">
          <span class="label">Sottocartelle</span>
          <span class="value">{{ item.subfoldersCount || 0 }}</span>
        </div>
        <div class="stat-box">
          <span class="label">Visibilità</span>
          <span class="value capitalize" :class="item.visibility">{{ item.visibility }}</span>
        </div>
      </div>

      <div v-else-if="isDocument" class="stats-grid">
        <div class="stat-box">
          <span class="label">Creata il</span>
          <span class="value">{{ formattedDate }}</span>
        </div>
        <div class="stat-box">
          <span class="label">Visibilità</span>
          <span class="value capitalize" :class="item.visibility">{{ item.visibility }}</span>
        </div>

        <div class="sharing-section">
          <span class="label">Condiviso con ({{ item.sharedWith?.length || 0 }})</span>

          <div v-if="item.sharedWith && item.sharedWith.length > 0" class="collaborators-list">
            <div v-for="share in item.sharedWith" :key="share.userId._id || share.userId.email" class="collaborator-item">
              <UserAvatar :user="share.userId" size="sm" />
              <div class="collab-info">
                <span class="collab-name">{{ share.userId.firstName }} {{ share.userId.lastName }}</span>
                <span class="collab-role" :class="share.role">{{ share.role }}</span>
              </div>
            </div>
          </div>
          <p v-else class="no-collabs">Nessun collaboratore esterno.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.details-panel {
  background-color: #2b2d31;
  border-radius: 8px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #3f3f3f;
  color: #dbdee1;
}

.panel-header {
  padding: 15px 20px;
  background-color: #232428;
  border-bottom: 1px solid #3f3f3f;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-title h3 { margin: 0; font-size: 1.1rem; }
.close-btn { background: none; border: none; color: #dbdee1; font-size: 1.5rem; cursor: pointer; transition: color 0.2s; }
.close-btn:hover { color: #f23f42; }

.panel-content {
  padding: 20px;
  flex-grow: 1;
  overflow-y: auto;
}

.item-name {
  font-size: 1.3rem;
  margin: 0 0 20px 0;
  word-break: break-all;
}

.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.stat-box {
  background-color: #1e1f22;
  padding: 12px 15px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-box .label {
  font-size: 0.75rem;
  color: #949ba4;
  text-transform: uppercase;
  font-weight: 600;
}

.stat-box .value {
  font-size: 1rem;
  color: #ffffff;
}

.details-panel {
  background-color: #2b2d31; border-radius: 8px; height: 100%;
  display: flex; flex-direction: column; overflow: hidden;
  border: 1px solid #3f3f3f; color: #dbdee1;
}

.panel-header {
  padding: 15px 20px; background-color: #232428; border-bottom: 1px solid #3f3f3f;
  display: flex; justify-content: space-between; align-items: center;
}

.panel-content { padding: 20px; flex-grow: 1; overflow-y: auto; }

.item-name { font-size: 1.2rem; margin-bottom: 20px; color: #fff; }

.stats-grid { display: flex; flex-direction: column; gap: 12px; }

.stat-box {
  background-color: #1e1f22; padding: 12px; border-radius: 6px;
  display: flex; flex-direction: column; gap: 4px;
}

.label { font-size: 0.7rem; color: #949ba4; text-transform: uppercase; font-weight: 700; }
.value { font-size: 0.95rem; }
.value.highlight { color: #5865f2; font-weight: bold; }

.sharing-section {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.collaborators-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.collaborator-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: #232428;
  padding: 8px;
  border-radius: 6px;
}

.collab-info {
  display: flex;
  flex-direction: column;
}

.collab-name { font-size: 0.85rem; font-weight: 500; }

.collab-role {
  font-size: 0.7rem;
  text-transform: uppercase;
  font-weight: 700;
}

.collab-role.editor { color: #f23f42; }
.collab-role.viewer { color: #b5bac1; }

.no-collabs { font-size: 0.85rem; color: #949ba4; font-style: italic; }

.capitalize { text-transform: capitalize; }
.value.private { color: #f23f42 !important; font-weight: bold; }
.value.public { color: #23a559 !important; font-weight: bold; }

.stat-box .value.highlight { color: #5865F2; font-weight: bold; }
.capitalize { text-transform: capitalize; }
.value.public { color: #23a559; }
</style>