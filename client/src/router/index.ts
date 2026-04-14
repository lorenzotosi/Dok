import { createRouter, createWebHistory } from 'vue-router';
import DashboardView from '../views/DashboardView.vue';
import DocumentView from '../views/DocumentView.vue';
import {useAuthStore} from "../stores/auth.store";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: DashboardView },
    { path: '/document/:id', component: DocumentView } // Rotta dinamica
  ]
});

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated()) {
    next('/login'); // Reindirizza se cerca di andare in Dashboard senza login
  } else {
    next(); // Lascia passare alla home pubblica o se è loggato
  }
});

export default router;