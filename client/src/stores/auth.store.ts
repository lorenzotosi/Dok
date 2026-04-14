import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAuthStore = defineStore('auth', () => {
    const token = ref<string | null>(localStorage.getItem('token'));
    const user = ref<any>(null); // Idealmente tipizzato

    const setToken = (newToken: string) => {
        token.value = newToken;
        localStorage.setItem('token', newToken);
    };

    const logout = () => {
        token.value = null;
        user.value = null;
        localStorage.removeItem('token');
    };

    const isAuthenticated = () => !!token.value;
    const isAdmin = () => user.value?.role === 'ADMIN';

    return { token, user, setToken, logout, isAuthenticated, isAdmin };
});