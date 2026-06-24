import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '../services/api';

export interface INotification {
  _id: string;
  recipient: string;
  sender: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  type: 'SHARE' | 'PERM_CHANGE' | 'DOCUMENT_DELETE' | 'SYSTEM';
  title: string;
  message: string;
  documentId?: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<INotification[]>([]);
  const loading = ref(false);
  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length);

  const fetchNotifications = async () => {
    loading.value = true;
    try {
      const response = await api.get('/notifications');
      notifications.value = response.data;
    } catch (error) {
      console.error('Errore caricamento notifiche:', error);
    } finally {
      loading.value = false;
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      const index = notifications.value.findIndex(n => n._id === id);
      if (index !== -1) {
        notifications.value[index].read = true;
      }
    } catch (error) {
      console.error('Errore markAsRead:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      notifications.value.forEach(n => n.read = true);
    } catch (error) {
      console.error('Errore markAllAsRead:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      console.log(id)
      await api.delete(`/notifications/${id}`);
      notifications.value = notifications.value.filter(n => n._id !== id);
    } catch (error) {
      console.error('Errore eliminazione notifica:', error);
    }
  };

  const addNotification = (notification: INotification) => {
    notifications.value.unshift(notification);
  };

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification
  };
});
