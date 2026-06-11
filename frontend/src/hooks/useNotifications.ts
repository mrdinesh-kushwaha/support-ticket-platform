import { useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs.min.js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { notificationsApi, type NotificationItem } from '../api/notifications';
import { useAuthStore } from '../store/authStore';

export function useNotifications() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.getAll,
    enabled: !!user?.id,
  });

  const unreadQuery = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: notificationsApi.unreadCount,
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!user?.id) return;

    const wsBaseUrl =
    import.meta.env.VITE_WS_URL ||
    import.meta.env.VITE_API_URL?.replace(/\/api$/, '') ||
    'http://localhost:8080';

    const wsUrl = `${wsBaseUrl}/ws-notifications`;

    const stompClient = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
      onConnect: () => {
        stompClient.subscribe(`/topic/notifications/${user.id}`, (message) => {
          const notification: NotificationItem = JSON.parse(message.body);

          queryClient.setQueryData<NotificationItem[]>(['notifications'], (old = []) => [
            notification,
            ...old,
          ]);

          queryClient.invalidateQueries({
            queryKey: ['notifications-unread-count'],
          });

          toast.success(notification.title);
        });
      },
    });

    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, [user?.id, queryClient]);

  return {
    notifications: notificationsQuery.data ?? [],
    unreadCount: unreadQuery.data ?? 0,
  };
}

export default useNotifications;