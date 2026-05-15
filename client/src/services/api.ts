import axios from 'axios';
import {useAuthStore} from "../stores/auth.store.ts";

export const api = axios.create({
    baseURL: 'http://localhost:3000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn("Token scaduto o non valido. Disconnessione forzata.");
            const authStore = useAuthStore();
            authStore.logout();
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);
