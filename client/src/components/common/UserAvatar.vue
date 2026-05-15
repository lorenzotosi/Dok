<script setup lang="ts">
import { computed } from 'vue';

export interface AvatarUserData {
  id?: string;
  _id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

interface Props {
  user: AvatarUserData | null | undefined;
  size?: 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md'
});

const initials = computed(() => {
  if (!props.user) return '?';

  const first = props.user.firstName?.trim().charAt(0) || '';
  const last = props.user.lastName?.trim().charAt(0) || '';

  const combined = (first + last).toUpperCase();
  return combined.length > 0 ? combined : (props.user.email?.charAt(0).toUpperCase() || '?');
});

const backgroundColor = computed(() => {
  if (!props.user) return '#e0e0e0';

  const seed = props.user.id || props.user._id || props.user.email || 'default';
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  const hex = '00000'.substring(0, 6 - c.length) + c;
  return `#${hex}`;
});
</script>

<template>
  <div
      class="user-avatar"
      :class="[`avatar-${size}`]"
      :style="{ backgroundColor }"
      :title="user ? `${user.firstName} ${user.lastName} (${user.email})` : 'Utente sconosciuto'"
  >
    <span class="initials">{{ initials }}</span>
  </div>
</template>

<style scoped>
.user-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #ffffff;
  font-weight: 600;
  user-select: none;
  flex-shrink: 0;
  border: 2px solid transparent;
  transition: transform 0.2s ease;
}

.avatar-sm {
  width: 28px;
  height: 28px;
  font-size: 0.75rem;
}

.avatar-md {
  width: 36px;
  height: 36px;
  font-size: 0.9rem;
}

.avatar-lg {
  width: 48px;
  height: 48px;
  font-size: 1.1rem;
}

.initials {
  letter-spacing: -0.5px;
}
</style>