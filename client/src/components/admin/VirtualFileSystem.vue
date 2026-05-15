<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { AdminService } from '../../services/admin.service';
import type {FSNode} from "../../types/admin.types.ts";
import FileSystemNode from "./FileSystemNode.vue";

const props = defineProps<{ userId: string }>();
const emit = defineEmits(['item-selected']);

const tree = ref<FSNode[]>([]);
const isLoading = ref(true);

const loadFileSystem = async () => {
  try {
    isLoading.value = true;
    tree.value = await AdminService.getUserFileSystem(props.userId);
  } catch (error) {
    console.error("Errore caricamento FS:", error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(loadFileSystem);

const handleItemClick = (node: FSNode) => {
  emit('item-selected', node);
};
</script>

<template>
  <div class="vfs-container">
    <div v-if="isLoading" class="loading-text">Costruzione albero virtuale...</div>
    <div v-else-if="tree.length === 0" class="empty-state">L'utente non ha file.</div>

    <FileSystemNode
        v-for="rootNode in tree"
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