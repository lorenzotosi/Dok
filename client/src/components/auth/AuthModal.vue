<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { AuthClientService } from '../../services/auth.service';
import { useAuthStore } from '../../stores/auth.store';
import BaseModal from '../common/BaseModal.vue';
import LoginForm from './LoginForm.vue';
import RegisterForm from "./RegisterForm.vue";
import type { LoginPayload, RegisterPayload } from '../../types/auth.types';

const props = defineProps<{ isOpen: boolean }>();
const emit = defineEmits(['close']);

const authStore = useAuthStore();
const isLoginView = ref(true);
const isLoading = ref(false);
const serverError = ref('');

const modalTitle = computed(() => isLoginView.value ? 'Accedi a Dok' : 'Crea un Account');

watch(() => props.isOpen, (newVal) => {
  if (!newVal) {
    resetModalState();
  }
})

const resetModalState = () => {
  serverError.value = '';
  isLoading.value = false;
  isLoginView.value = true;
};

const toggleView = () => {
  isLoginView.value = !isLoginView.value;
  serverError.value = '';
};

const handleClose = () => {
  serverError.value = '';
  emit('close');
};

const handleAuthAction = async (payload: LoginPayload | RegisterPayload) => {
  isLoading.value = true;
  serverError.value = '';

  try {
    let data;
    if (isLoginView.value) {
      data = await AuthClientService.login(payload.email, payload.password);
    } else {
      const regPayload = payload as RegisterPayload;
      data = await AuthClientService.register(
          regPayload.email,
          regPayload.password,
          regPayload.firstName,
          regPayload.lastName
      );
    }

    authStore.setAuthData(data.token, data.user);
    emit('close');
  } catch (err: any) {
    serverError.value = err?.response?.data?.error || "Errore di connessione";
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <BaseModal
      :is-open="isOpen"
      :title="modalTitle"
      @close="handleClose"
  >
    <transition name="fade" mode="out-in">
      <LoginForm
          v-if="isLoginView"
          :is-loading="isLoading"
          :error-message="serverError"
          @submit="handleAuthAction"
          @switch-view="toggleView"
      />

      <RegisterForm
          v-else
          :is-loading="isLoading"
          :server-error="serverError"
          @submit="handleAuthAction"
          @switch-view="toggleView"
      />
    </transition>
  </BaseModal>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>