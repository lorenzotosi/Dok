<script setup lang="ts">
import { ref } from 'vue';
import { AuthClientService } from '../../services/auth.service';
import { useAuthStore } from '../../stores/auth.store';

const props = defineProps<{ isOpen: boolean }>();
const emit = defineEmits(['close']);

const authStore = useAuthStore();
const isLoginView = ref(true);
const isLoading = ref(false);

const email = ref('');
const password = ref('');
const firstName = ref('');
const lastName = ref('');

const toggleView = () => {
  isLoginView.value = !isLoginView.value;
};

const handleSubmit = async () => {
  isLoading.value = true;
  try {
    const data = isLoginView.value
        ? await AuthClientService.login(email.value, password.value)
        : await AuthClientService.register(email.value, password.value, firstName.value, lastName.value);

    authStore.setToken(data.token);
    emit('close');
  } catch (err) {
    alert("Errore: " + err);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <Teleport to="body">
    <div v-if="props.isOpen" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content">
        <button class="close-btn" @click="$emit('close')">&times;</button>

        <h2>{{ isLoginView ? 'Accedi a Dok' : 'Crea un Account' }}</h2>

        <form @submit.prevent="handleSubmit" class="auth-form">
          <div v-if="!isLoginView" class="form-row">
            <div class="form-group">
              <label>Nome</label>
              <input v-model="firstName" type="text" required placeholder="Es. Mario" />
            </div>
            <div class="form-group">
              <label>Cognome</label>
              <input v-model="lastName" type="text" required placeholder="Es. Rossi" />
            </div>
          </div>

          <div class="form-group">
            <label>Email</label>
            <input v-model="email" type="email" required placeholder="email@esempio.it" />
          </div>

          <div class="form-group">
            <label>Password</label>
            <input v-model="password" type="password" required placeholder="********" />
          </div>

          <button type="submit" class="submit-btn" :disabled="isLoading">
            {{ isLoginView ? 'Entra' : 'Registrati' }}
          </button>
        </form>

        <div class="switch-view">
          <p v-if="isLoginView">
            Non hai un account? <a @click="toggleView">Registrati qui</a>
          </p>
          <p v-else>
            Hai già un account? <a @click="toggleView">Accedi qui</a>
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.form-row {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 480px) {
  .form-row {
    flex-direction: row;
  }
  .form-row .form-group {
    flex: 1;
  }
}

.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; backdrop-filter: blur(4px);
}

.modal-content {
  background: white; padding: 2rem; border-radius: 16px;
  width: 90%; max-width: 450px; position: relative;
}

.auth-form { display: flex; flex-direction: column; gap: 1.2rem; margin-top: 1rem; }

.form-group { display: flex; flex-direction: column; gap: 0.4rem; }

.form-group label { font-size: 0.85rem; font-weight: 600; color: #444; }

.form-group input {
  padding: 0.8rem; border: 1.5px solid #eee; border-radius: 8px; transition: 0.3s;
}

.form-group input:focus { border-color: #4f46e5; outline: none; }

.submit-btn {
  background: #4f46e5; color: white; border: none; padding: 1rem;
  border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 0.5rem;
}

.submit-btn:disabled { opacity: 0.6; }

.switch-view { text-align: center; margin-top: 1.5rem; color: #666; }

.switch-view a { color: #4f46e5; font-weight: bold; cursor: pointer; text-decoration: underline; }

.close-btn { position: absolute; top: 1rem; right: 1rem; background: none; border: none; font-size: 1.5rem; cursor: pointer; }
</style>