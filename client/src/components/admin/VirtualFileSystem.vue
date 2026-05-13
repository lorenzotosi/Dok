<script setup lang="ts">
import { ref } from 'vue';
import FileSystemNode, { type FSNode } from './FileSystemNode.vue';

const emit = defineEmits(['item-selected']);

// TODO Struttura ad albero nidificata thisisamock
const mockTree = ref<FSNode[]>([
  {
    id: 'f-1',
    name: 'Progetti 2026',
    type: 'folder',
    visibility: 'private',
    createdAt: '2026-01-15T10:30:00Z',
    docsCount: 14,
    subfoldersCount: 2,
    children: [
      {
        id: 'f-2',
        name: 'Design System',
        type: 'folder',
        visibility: 'private',
        children: [
          { id: 'd-1', name: 'Doc_Criptato_88A.doc', type: 'document', visibility: 'private', sharedWithCount: 2 },
          { id: 'd-2', name: 'Doc_Criptato_91B.doc', type: 'document', visibility: 'private' }
        ]
      },
      { id: 'd-3', name: 'Doc_Criptato_00F.doc', type: 'document', visibility: 'public' }
    ]
  },
  {
    id: 'f-3',
    name: 'Cartella Personale (Vuota)',
    type: 'folder',
    visibility: 'private',
    children: []
  },
  {
    id: 'd-4',
    name: 'Doc_Criptato_Root.doc',
    type: 'document',
    visibility: 'private',
    sharedWithCount: 5
  }
]);

const handleItemClick = (node: FSNode) => {
  emit('item-selected', node);
};
</script>

<template>
  <div class="vfs-container">
    <div v-if="mockTree.length === 0" class="empty-state">
      L'utente non ha file o cartelle.
    </div>

    <FileSystemNode
        v-for="rootNode in mockTree"
        :key="rootNode.id"
        :node="rootNode"
        @node-click="handleItemClick"
    />
  </div>
</template>

<style scoped>
.vfs-container {
  background-color: #1e1f22;
  border-radius: 6px;
  padding: 10px;
  border: 1px solid #3f3f3f;
  min-height: 250px;
  max-height: 500px;
  overflow-y: auto;
}

.empty-state {
  color: #949ba4;
  text-align: center;
  padding: 40px 0;
  font-style: italic;
}
</style>