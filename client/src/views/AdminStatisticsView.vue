<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { AdminService } from '../services/admin.service';
import AdminStatCard from '../components/admin/stats/AdminStatCard.vue';
import AdminAccessChart from '../components/admin/stats/AdminAccessChart.vue';

const router = useRouter();
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);

const chartRange = ref('7d');
const isChartLoading = ref(false);

const stats = ref({
  users: { total: 0, admins: 0, normals: 0 },
  documents: { total: 0, public: 0, private: 0 },
  folders: { total: 0 },
  shares: { total: 0, readOnly: 0, edit: 0 },
  accessChart: { categories: [] as string[], series: [] as number[] }
});

const loadStats = async (isSoftLoad = false) => {
  try {
    if (!isSoftLoad) isLoading.value = true;
    isChartLoading.value = true;
    errorMessage.value = null;

    stats.value = await AdminService.getGlobalStats(chartRange.value);
  } catch (error) {
    console.error("Errore statistiche:", error);
    errorMessage.value = "Impossibile caricare le statistiche del sistema.";
  } finally {
    isLoading.value = false;
    isChartLoading.value = false;
  }
};

const handleUpdateRange = (range: string) => {
  chartRange.value = range;
  loadStats(true);
};

onMounted(() => {
  loadStats();
});
</script>

<template>
  <div class="admin-stats-container">
    <button @click="router.push('/admin')" class="back-button">
      <span class="icon">&#8592;</span> Torna alla Dashboard
    </button>

    <div class="header-titles">
      <h1>Statistiche Globali</h1>
      <p class="subtitle">Panoramica dello stato di salute del sistema</p>
    </div>

    <div v-if="isLoading" class="loading-state">Elaborazione dati in corso...</div>

    <div v-else-if="errorMessage" class="error-state">
      {{ errorMessage }}
      <button @click="loadStats(false)" class="retry-btn">Riprova</button>
    </div>

    <template v-else>
      <div class="stats-grid">
        <AdminStatCard
            title="Utenti Registrati"
            :value="stats.users?.total || 0"
            colorClass="text-blue"
            :details="[{ label: 'Amministratori:', value: stats.users?.admins }, { label: 'Utenti Base:', value: stats.users?.normals }]"
        />
        <AdminStatCard
            title="Dok Creati"
            :value="stats.documents?.total || 0"
            colorClass="text-green"
            :details="[{ label: 'Globali (Pubblici):', value: stats.documents?.public }, { label: 'Privati:', value: stats.documents?.private }]"
        />
        <AdminStatCard
            title="Cartelle Esistenti"
            :value="stats.folders?.total || 0"
            colorClass="text-yellow"
            :details="[{ label: 'Organizzazione file utente' }]"
        />
        <AdminStatCard
            title="Dok Condivisi"
            :value="stats.shares?.total || 0"
            colorClass="text-purple"
            :details="[{ label: 'In Sola Lettura:', value: stats.shares?.readOnly }, { label: 'In Modifica:', value: stats.shares?.edit }]"
        />
      </div>

      <AdminAccessChart
          :categories="stats.accessChart.categories"
          :seriesData="stats.accessChart.series"
          :currentRange="chartRange"
          :isLoading="isChartLoading"
          @update-range="handleUpdateRange"
      />
    </template>
  </div>
</template>

<style scoped>
.admin-stats-container {
  width: 100%;
  min-height: 100vh;
  background-color: #1e1f22;
  padding: 24px;
  box-sizing: border-box;
}

.back-button {
  background: #2b2d31;
  border: 1px solid #3f3f3f;
  color: #dbdee1;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
  margin-bottom: 24px;
}
.back-button:hover { background-color: #3f4147; color: #ffffff; }

.header-titles { text-align: center; margin-bottom: 40px; }
.header-titles h1 { font-size: 2rem; color: #dbdee1; margin: 0 0 8px 0; }
.header-titles .subtitle { color: #949BA4; margin: 0; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
  align-items: start;
}

.loading-state, .error-state { text-align: center; color: #dbdee1; padding: 40px; }
.error-state { color: #f23f42; }
.retry-btn { margin-top: 10px; background-color: #5865F2; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
</style>