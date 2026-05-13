<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  item: any | null
}>();

const emit = defineEmits(['close']);

const isFolder = computed(() => props.item?.type === 'folder');
const isDocument = computed(() => props.item?.type === 'document');

// Formattazione data mock
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
          <span class="label">Tipo</span>
          <span class="value">Documento di Testo</span>
        </div>
        <div class="stat-box">
          <span class="label">Spazio per futuri dati...</span>
          <span class="value">...</span>
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

.stat-box .value.highlight { color: #5865F2; font-weight: bold; }
.capitalize { text-transform: capitalize; }
.value.public { color: #23a559; }
</style>