import apiClient from './client';

export type NotificationItem = {
  id: number;
  ticketId: number;
  title: string;
  message: string;
  readStatus: boolean;
  createdAt: string;
};

export const notificationsApi = {
  getAll: async () => {
    const res = await apiClient.get<NotificationItem[]>('/notifications');
    return res.data;
  },

  unreadCount: async () => {
    const res = await apiClient.get<{ count: number }>('/notifications/unread-count');
    return res.data.count;
  },

  markAllRead: async () => {
    await apiClient.patch('/notifications/mark-all-read');
  },
};