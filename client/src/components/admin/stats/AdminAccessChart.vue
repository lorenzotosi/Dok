<script setup lang="ts">
import { computed } from 'vue';
import VueApexCharts from 'vue3-apexcharts';

const props = defineProps<{
  categories: string[];
  seriesData: number[];
  currentRange: string;
  isLoading: boolean;
}>();

const emit = defineEmits<{
  (e: 'updateRange', range: string): void;
}>();

const chartOptions = computed(() => {
  const now = new Date().getTime();
  let minRange;

  if (props.currentRange === '24h') {
    minRange = now - (24 * 60 * 60 * 1000);
  } else if (props.currentRange === '30d') {
    minRange = now - (30 * 24 * 60 * 60 * 1000);
  } else {
    minRange = now - (7 * 24 * 60 * 60 * 1000);
  }

  return {
    chart: {
      type: 'bar',
      foreColor: '#949BA4',
      toolbar: { show: false },
      animations: { enabled: false }
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '15%',
      }
    },
    colors: ['#5865F2'],
    xaxis: {
      categories: props.categories,
      type: 'datetime',
      min: minRange,
      max: now,
      labels: {
        datetimeUTC: false,
        datetimeFormatter: {
          year: 'yyyy',
          month: "MMM 'yy",
          day: 'dd MMM',
          hour: 'HH:mm'
        }
      }
    },
    yaxis: {
      min: 0,
      forceNiceScale: true,
      decimalsInFloat: 0,
      labels: {
        formatter: (val: number) => Math.floor(val).toString()
      }
    },
    tooltip: { theme: 'dark' }
  };
});

const chartSeries = computed(() => [{
  name: 'Accessi Effettuati',
  data: props.seriesData
}]);
</script>

<template>
  <div class="chart-section" :class="{ 'is-soft-loading': isLoading }">
    <div class="chart-header">
      <h2>Andamento Accessi</h2>
      <div class="chart-filters">
        <button :class="{ active: currentRange === '24h' }" @click="emit('updateRange', '24h')">24 Ore</button>
        <button :class="{ active: currentRange === '7d' }" @click="emit('updateRange', '7d')">7 Giorni</button>
        <button :class="{ active: currentRange === '30d' }" @click="emit('updateRange', '30d')">30 Giorni</button>
      </div>
    </div>
    <div class="chart-container">
      <VueApexCharts type="bar" height="320" :options="chartOptions" :series="chartSeries" />
    </div>
  </div>
</template>

<style scoped>
.chart-section {
  margin-top: 40px;
  background-color: #2b2d31;
  border: 1px solid #3f3f3f;
  border-radius: 8px;
  padding: 24px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  box-shadow: 0 4px 6px rgba(0,0,0,0.2);
  transition: opacity 0.3s ease;
}

.chart-section.is-soft-loading {
  opacity: 0.5;
  pointer-events: none;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.chart-header h2 {
  color: #f2f3f5;
  font-size: 1.2rem;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.chart-filters {
  display: flex;
  background-color: #1e1f22;
  border-radius: 6px;
  padding: 4px;
  border: 1px solid #3f3f3f;
}
.chart-filters button {
  background: transparent;
  border: none;
  color: #949BA4;
  padding: 6px 16px;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
}
.chart-filters button:hover { color: #dbdee1; }
.chart-filters button.active {
  background-color: #5865F2;
  color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
.chart-container { width: 100%; }
</style>