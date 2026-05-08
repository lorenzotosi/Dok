<script setup lang="ts">
defineProps<{ isOpen: boolean }>();
const emit = defineEmits(['close']);
</script>

<template>
  <div class="drawer left-drawer" :class="{ 'is-open': isOpen }">
    <div class="drawer-header">
      <h3>Log Accessi</h3>
      <button @click="emit('close')" class="close-btn">×</button>
    </div>
    <div class="drawer-content">
      <p class="placeholder-text">I log di accesso appariranno qui (Audit Trail).</p>
      <!-- TODO mappare un array di log -->
    </div>
  </div>
  <div v-if="isOpen" class="backdrop" @click="emit('close')"></div>
</template>

<style scoped>
.drawer {
  position: fixed; top: 0; bottom: 0;
  width: 300px; max-width: 80vw;
  background-color: #2b2d31;
  color: #dbdee1; z-index: 1000;
  box-shadow: 2px 0 10px rgba(0,0,0,0.5);
  transition: transform 0.3s ease;
  display: flex; flex-direction: column;
}

.left-drawer { left: 0; transform: translateX(-100%); }
.left-drawer.is-open { transform: translateX(0); }

.drawer-header {
  padding: 20px; border-bottom: 1px solid #1e1f22;
  display: flex; justify-content: space-between; align-items: center;
}

.drawer-header h3 { margin: 0; }
.close-btn { background: none; border: none; color: #dbdee1; font-size: 1.5rem; cursor: pointer; }
.drawer-content { padding: 20px; overflow-y: auto; flex-grow: 1; }
.placeholder-text { color: #949ba4; font-style: italic; }

.backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 999;
}
</style>