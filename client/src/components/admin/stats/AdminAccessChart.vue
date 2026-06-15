<script setup lang="ts">
import { ref, computed } from 'vue';
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

const viewMode = ref<'history' | 'trend'>('history');
const customDate = ref('');
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const setViewMode = (mode: 'history' | 'trend') => {
  viewMode.value = mode;
  customDate.value = '';
  if (mode === 'history') {
    emit('updateRange', '7d');
  } else {
    emit('updateRange', 'trend-hour');
  }
};

const selectPreset = (range: string) => {
  customDate.value = '';
  emit('updateRange', range);
};

const onDateChange = () => {
  if (customDate.value) {
    viewMode.value = 'history';
    emit('updateRange', customDate.value);
  }
};

const chartOptions = computed(() => {
  const isTrend = props.currentRange.startsWith('trend-');

  const now = new Date().getTime();
  let minRange: number | undefined = undefined;
  let maxRange: number | undefined = undefined;

  if (!isTrend) {
    maxRange = now;
    if (props.currentRange === '24h') {
      minRange = now - (24 * 60 * 60 * 1000);
    } else if (props.currentRange === '30d') {
      minRange = now - (30 * 24 * 60 * 60 * 1000);
    } else if (dateRegex.test(props.currentRange)) {
      const startOfDay = new Date(props.currentRange);
      startOfDay.setHours(0, 0, 0, 0);
      minRange = startOfDay.getTime();
      const endOfDay = new Date(props.currentRange);
      endOfDay.setHours(23, 59, 59, 999);
      maxRange = endOfDay.getTime();
    } else {
      minRange = now - (7 * 24 * 60 * 60 * 1000);
    }
  }

  return {
    chart: {
      type: 'bar' as any,
      foreColor: '#949BA4',
      toolbar: { show: false },
      animations: { enabled: false }
    },
    plotOptions: {
      bar: { borderRadius: 4, columnWidth: isTrend ? '50%' : '15%' }
    },
    colors: ['#5865F2'],
    xaxis: {
      categories: props.categories,
      type: (isTrend ? 'category' : 'datetime') as any,
      min: minRange,
      max: maxRange,
      labels: {
        datetimeUTC: false,
        datetimeFormatter: { year: 'yyyy', month: "MMM 'yy", day: 'dd MMM', hour: 'HH:mm' }
      }
    },
    yaxis: {
      min: 0,
      forceNiceScale: true,
      decimalsInFloat: 0,
      labels: { formatter: (val: number) => Math.floor(val).toString() }
    },
    tooltip: { theme: 'dark' as any }
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

      <div class="header-left">
        <h2>Analisi Accessi</h2>
        <div class="view-mode-toggle">
          <button :class="{ active: viewMode === 'history' }" @click="setViewMode('history')">Storico Lineare</button>
          <button :class="{ active: viewMode === 'trend' }" @click="setViewMode('trend')">Tendenze Globali</button>
        </div>
      </div>

      <div v-if="viewMode === 'history'" class="chart-filters">
        <input type="date" v-model="customDate" @change="onDateChange" class="date-picker" title="Scegli un giorno" />
        <div class="divider"></div>
        <button :class="{ active: currentRange === '24h' }" @click="selectPreset('24h')">24 Ore</button>
        <button :class="{ active: currentRange === '7d' }" @click="selectPreset('7d')">7 Giorni</button>
        <button :class="{ active: currentRange === '30d' }" @click="selectPreset('30d')">30 Giorni</button>
      </div>

      <div v-else class="chart-filters">
        <button :class="{ active: currentRange === 'trend-hour' }" @click="selectPreset('trend-hour')">Fasce Orarie</button>
        <button :class="{ active: currentRange === 'trend-weekday' }" @click="selectPreset('trend-weekday')">Giorni Settimana</button>
        <button :class="{ active: currentRange === 'trend-monthday' }" @click="selectPreset('trend-monthday')">Giorni del Mese</button>
      </div>

    </div>
    <div class="chart-container">
      <VueApexCharts
          :key="viewMode"
          type="bar"
          height="320"
          :options="chartOptions"
          :series="chartSeries"
      />
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
  align-items: flex-start;
  margin-bottom: 20px;
}
.header-left {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.header-left h2 {
  color: #f2f3f5;
  font-size: 1.2rem;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.view-mode-toggle {
  display: flex;
  background-color: #1e1f22;
  border-radius: 6px;
  padding: 4px;
  border: 1px solid #3f3f3f;
  width: fit-content;
}
.view-mode-toggle button {
  background: transparent;
  border: none;
  color: #949BA4;
  padding: 6px 14px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
}
.view-mode-toggle button:hover {
  color: #dbdee1;
}
.view-mode-toggle button.active {
  background-color: #3f4147;
  color: #fff;
}

.chart-filters {
  display: flex;
  align-items: center;
  background-color: #1e1f22;
  border-radius: 6px;
  padding: 4px;
  border: 1px solid #3f3f3f;
  margin-top: 6px;
}
.date-picker {
  background-color: transparent;
  border: none;
  color: #949BA4;
  padding: 6px 12px;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: bold;
  cursor: pointer;
  outline: none;
}
.date-picker::-webkit-calendar-picker-indicator {
  filter: invert(0.6);
  cursor: pointer;
}
.divider {
  width: 1px;
  height: 20px;
  background-color: #3f3f3f;
  margin: 0 8px;
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