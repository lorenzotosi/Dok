<script setup lang="ts">
import { ref } from 'vue';
import type { LoginPayload } from '../../types/auth.types';

defineProps<{
  isLoading: boolean;
  errorMessage?: string;
}>();

const emit = defineEmits<{
  (e: 'submit', payload: LoginPayload): void;
  (e: 'switch-view'): void;
}>();

const email = ref('');
const password = ref('');

const onSubmit = () => {
  emit('submit', { email: email.value, password: password.value });
};
</script>

<template>
  <form @submit.prevent="onSubmit" class="auth-form">
    <div class="form-group">
      <label>Email</label>
      <input v-model="email" type="email" required placeholder="email@esempio.it" />
    </div>

    <div class="form-group">
      <label>Password</label>
      <input v-model="password" type="password" required placeholder="********" />
    </div>

    <Transition name="fade">
      <div v-if="errorMessage" class="error-alert" role="alert">
        {{ errorMessage }}
      </div>
    </Transition>

    <button type="submit" class="submit-btn" :disabled="isLoading">
      {{ isLoading ? 'Accesso in corso...' : 'Entra' }}
    </button>

    <div class="switch-view">
      <p>Non hai un account? <a @click="$emit('switch-view')">Registrati qui</a></p>
    </div>
  </form>
</template>

<style scoped>
.auth-form { display: flex; flex-direction: column; gap: 1.2rem; }

.form-group { display: flex; flex-direction: column; gap: 0.4rem; }

.form-group label { font-size: 0.85rem; font-weight: 600; color: #444; }

.form-group input { padding: 0.8rem; border: 1.5px solid #eee; border-radius: 8px; transition: 0.3s; }

.form-group input:focus { border-color: #4f46e5; outline: none; }

.error-alert {
  background-color: #fee2e2;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  text-align: center;
  border: 1px solid #f87171;
}

.submit-btn { background: #4f46e5; color: white; border: none; padding: 1rem; border-radius: 8px; font-weight: bold; cursor: pointer; }

.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.switch-view { text-align: center; margin-top: 1rem; font-size: 0.9rem; color: #666; }

.switch-view a { color: #4f46e5; font-weight: bold; cursor: pointer; text-decoration: underline; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }

.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>