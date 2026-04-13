import { createRouter, createWebHistory } from 'vue-router';
import DashboardView from '../views/DashboardView.vue';
import DocumentView from '../views/DocumentView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: DashboardView },
    { path: '/document/:id', component: DocumentView } // Rotta dinamica
  ]
});

export default router;