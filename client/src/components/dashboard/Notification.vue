<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useClickOutside } from '../../composables/useClickOutside';
import { useNotificationStore, type INotification } from '../../stores/notification.store';
import { useRouter } from 'vue-router';

const notificationStore = useNotificationStore();
const router = useRouter();
const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    // Potremmo voler segnare come lette all'apertura o al click sulla singola
  }
};

useClickOutside(dropdownRef, () => {
  isOpen.value = false;
});

const handleNotificationClick = async (notification: INotification) => {
  if (!notification.read) {
    await notificationStore.markAsRead(notification._id);
  }
  
  if (notification.link) {
    router.push(notification.link);
    isOpen.value = false;
  }
};

const handleNotificationDelete = async (notification: INotification) => {
  await notificationStore.deleteNotification(notification._id);
};

// Formattazione data più leggibile
const timeAgo = (date: string) => {
  const now = new Date();
  const past = new Date(date);
  const diffInMs = now.getTime() - past.getTime();
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMins / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMins < 1) return 'Proprio ora';
  if (diffInMins < 60) return `${diffInMins}m fa`;
  if (diffInHours < 24) return `${diffInHours}h fa`;
  return `${diffInDays}g fa`;
};

onMounted(() => {
  notificationStore.fetchNotifications();
});
</script>

<template>
  <div class="notification-wrapper" ref="dropdownRef">
    <button 
      class="notification-btn" 
      @click="toggleDropdown" 
      :class="{ 'active': isOpen }"
      title="Notifiche"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      </svg>
      <span v-if="notificationStore.unreadCount > 0" class="badge">
        {{ notificationStore.unreadCount > 9 ? '9+' : notificationStore.unreadCount }}
      </span>
    </button>

    <Transition name="fade-slide">
      <div v-if="isOpen" class="notification-dropdown">
        <div class="dropdown-header">
          <h3>Notifiche</h3>
          <button @click="notificationStore.markAllAsRead" class="mark-all-btn">
            Segna tutto come letto
          </button>
        </div>

        <div class="dropdown-content">
          <div v-if="notificationStore.loading" class="empty-state">
            Caricamento...
          </div>
          
          <div v-else-if="notificationStore.notifications.length === 0" class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <p>Non hai ancora nessuna notifica</p>
          </div>

          <div v-else class="notification-list">
            <div 
              v-for="notif in notificationStore.notifications" 
              :key="notif._id"
              class="notification-item"
              :class="{ 'unread': !notif.read }"
              @click="handleNotificationClick(notif)"
            >
              <div class="notif-icon" :class="notif.type.toLowerCase()">
                <template v-if="notif.type === 'SHARE'">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                </template>
                <template v-else-if="notif.type === 'PERM_CHANGE'">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </template>
                <template v-else>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                </template>
              </div>
              <div class="notif-info">
                <div class="notif-title">{{ notif.title }}</div>
                <div class="notif-message">{{ notif.message }}</div>
                <div class="notif-time">{{ timeAgo(notif.createdAt) }}</div>
              </div>
              <div v-if="!notif.read" class="unread-dot"></div>
              <button 
                class="delete-btn" 
                @click.stop="handleNotificationDelete(notif)" 
                title="Elimina notifica"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <!--<div class="dropdown-footer">
          <button class="view-all-btn">Vedi tutte le attività</button>
        </div>-->
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.notification-wrapper {
  position: relative;
  display: inline-block;
}

.notification-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  cursor: pointer;
  position: relative;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.notification-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-1px);
  border-color: rgba(255, 255, 255, 0.2);
}

.notification-btn.active {
  background: var(--primary-color, #6366f1);
  color: white;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
}

.badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #0f172a;
}

.notification-dropdown {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 360px; /* Industria Standard: 320-400px */
  max-height: 500px;
  background: rgba(30, 41, 59, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform-origin: top right;
}

.dropdown-header {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dropdown-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #f8fafc;
}

.mark-all-btn {
  background: none;
  border: none;
  color: #6366f1;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
}

.mark-all-btn:hover {
  background: rgba(99, 102, 241, 0.1);
}

.dropdown-content {
  flex: 1;
  overflow-y: auto; /* Scorrimento richiesto */
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
}

/* Custom scrollbar for webkit */
.dropdown-content::-webkit-scrollbar {
  width: 6px;
}
.dropdown-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.notification-list {
  display: flex;
  flex-direction: column;
}

.notification-item {
  padding: 16px 20px;
  display: flex;
  gap: 14px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.notification-item:hover {
  background: rgba(255, 255, 255, 0.03);
}

.notification-item.unread {
  background: rgba(99, 102, 241, 0.03);
}

.notification-item.unread:hover {
  background: rgba(99, 102, 241, 0.06);
}

.notif-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notif-icon.share { background: rgba(99, 102, 241, 0.15); color: #818cf8; }
.notif-icon.perm_change { background: rgba(16, 185, 129, 0.15); color: #34d399; }
.notif-icon.document_delete { background: rgba(239, 68, 68, 0.15); color: #f87171; }
.notif-icon.system { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }

.notif-info {
  flex: 1;
  min-width: 0;
}

.notif-title {
  font-size: 14px;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 2px;
}

.notif-message {
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.4;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notif-time {
  font-size: 11px;
  color: #64748b;
  margin-top: 6px;
}

.unread-dot {
  width: 8px;
  height: 8px;
  background: #6366f1;
  border-radius: 50%;
  margin-top: 6px;
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.6);
}

.empty-state {
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #64748b;
  text-align: center;
}

.empty-state svg {
  margin-bottom: 12px;
  opacity: 0.5;
}

.dropdown-footer {
  padding: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  text-align: center;
}

.view-all-btn {
  width: 100%;
  padding: 8px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  color: #94a3b8;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.view-all-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #f1f5f9;
}

/* Bottone Cestino */
.delete-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(239, 68, 68, 0.1);
  border: none;
  border-radius: 8px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ef4444;
  opacity: 0;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  transform: scale(0.8);
}

.notification-item:hover .delete-btn {
  opacity: 1;
  transform: scale(1);
}

.delete-btn:hover {
  background: #ef4444;
  color: white;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

/* Se c'è il pallino, lo nascondiamo se il cestino è visibile per pulizia */
.notification-item:hover .unread-dot {
  opacity: 0;
}

/* Transizione */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
}
</style>
