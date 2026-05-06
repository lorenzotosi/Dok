<script setup lang="ts">
import { useNotificationStore } from '../../stores/notification.store';

const notificationStore = useNotificationStore();
</script>

<template>
  <div class="notification-wrapper">
    <button class="notification-btn" title="Notifiche">
      Notifiche
    </button>
  </div>
</template>

<style scoped>
</style>
