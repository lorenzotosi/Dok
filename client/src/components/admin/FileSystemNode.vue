<script setup lang="ts">
import { ref, computed } from 'vue';
import type {FSNode} from "../../types/admin.types.ts";

const props = defineProps<{
  node: FSNode;
  depth?: number;
}>();

const emit = defineEmits(['node-click']);

const isOpen = ref(false);

const isFolder = computed(() => props.node.type === 'folder');
const currentDepth = computed(() => props.depth || 0);

const toggleOrSelect = () => {
  if (isFolder.value) {
    isOpen.value = !isOpen.value;
  }
  emit('node-click', props.node);
};

const handleChildClick = (childNode: FSNode) => {
  emit('node-click', childNode);
};
</script>

<template>
  <div class="fs-node">
    <div
        class="node-row"
        :style="{ paddingLeft: `${currentDepth * 20}px` }"
        @click="toggleOrSelect"
    >
      <span class="chevron" :class="{ invisible: !isFolder, open: isOpen }">
        ▶
      </span>
      <span class="icon">
        {{ isFolder ? (isOpen ? '📂' : '📁') : '📄' }}
      </span>
      <span class="name" :class="{ document: !isFolder }">
        {{ node.name }}
      </span>
      <span v-if="node.visibility === 'public'" class="badge public" title="Pubblico">🌍</span>
      <span v-if="node.sharedWithCount && node.sharedWithCount > 0" class="badge shared" title="Condiviso">👥 {{ node.sharedWithCount }}</span>
    </div>

    <div v-if="isFolder && isOpen" class="children-container">
      <FileSystemNode
          v-for="child in node.children"
          :key="child.id"
          :node="child"
          :depth="currentDepth + 1"
          @node-click="handleChildClick"
      />
      <div v-if="!node.children || node.children.length === 0" class="empty-folder" :style="{ paddingLeft: `${(currentDepth + 1) * 20 + 24}px` }">
        Cartella vuota
      </div>
    </div>
  </div>
</template>

<style scoped>
.node-row {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  cursor: pointer;
  border-radius: 4px;
  user-select: none;
  transition: background-color 0.2s;
  color: #dbdee1;
}

.node-row:hover {
  background-color: #3f4147;
}

.chevron {
  font-size: 0.7rem;
  margin-right: 8px;
  transition: transform 0.2s;
  color: #949ba4;
  display: inline-block;
  width: 12px;
}
.chevron.invisible { visibility: hidden; }
.chevron.open { transform: rotate(90deg); }

.icon { margin-right: 8px; font-size: 1.1rem; }
.name { font-size: 0.95rem; }
.name.document { color: #949ba4; } /* Colore leggermente diverso per i file */

.badge {
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 8px;
  background-color: #2b2d31;
}
.badge.public { background-color: #23a559; color: white; }
.badge.shared { background-color: #5865F2; color: white; }

.empty-folder {
  font-size: 0.85rem;
  color: #747f8d;
  font-style: italic;
  padding: 4px 0;
}
</style>