<script setup lang="ts">
defineProps<{
  title: string;
  value: number | string;
  colorClass: string;
  details?: { label: string; value?: number | string }[];
}>();
</script>

<template>
  <div class="stat-card">
    <div class="stat-title">{{ title }}</div>
    <div class="stat-value" :class="colorClass">{{ value }}</div>

    <div v-if="details && details.length > 0" class="stat-details">
      <div v-for="(detail, index) in details" :key="index" class="detail-row">
        <span>{{ detail.label }}</span>
        <strong v-if="detail.value !== undefined">{{ detail.value }}</strong>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  background-color: #2b2d31;
  border: 1px solid #3f3f3f;
  border-radius: 8px;
  padding: 30px 20px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0,0,0,0.2);
  transition: transform 0.2s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-title {
  color: #949BA4;
  font-size: 1.1rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 15px;
}

.stat-value {
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1;
}

.text-blue { color: #5865F2; }
.text-green { color: #23a55a; }
.text-yellow { color: #FEE75C; }
.text-purple { color: #EB459E; }

.stat-details {
  margin-top: 0;
  max-height: 0;
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-top: 1px solid transparent;
}

.stat-card:hover .stat-details {
  margin-top: 20px;
  max-height: 100px;
  opacity: 1;
  padding-top: 15px;
  border-top-color: #3f3f3f;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #949BA4;
}
.detail-row strong {
  color: #dbdee1;
}
</style>