import { createRouter, createWebHistory } from 'vue-router';
import DashboardView from '../views/DashboardView.vue';
import DocumentView from '../views/DocumentView.vue';
import {useAuthStore} from "../stores/auth.store";
import AdminDashboardView from "../views/AdminDashboardView.vue";
import AdminUserDetailView from "../views/AdminUserDetailView.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: DashboardView },
    { path: '/document/:id', component: DocumentView },
    { path: '/admin', component: AdminDashboardView, meta: {requiresAdmin: true, requiresAuth: true} },
    { path: '/admin/user/:id', component: AdminUserDetailView, meta: {requiresAdmin: true, requiresAuth: true} },
  ]
});

router.beforeEach((to, _from) => {
  const authStore = useAuthStore();
  const requiresAdmin = to.meta.requiresAdmin;

  if (requiresAdmin && (!authStore.user || !authStore.isAdmin() || !authStore.isAuthenticated())) {
    return '/';
  }
});

export default router;