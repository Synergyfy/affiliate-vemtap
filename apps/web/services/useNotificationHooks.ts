import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';
import { Notification, PaginatedResponse, NotificationType } from '@/types/api';

export const useNotifications = (params?: { limit?: number }) => {
  return useQuery<PaginatedResponse<Notification>>({
    queryKey: ['notifications', params],
    queryFn: async () => {
      const { data } = await api.get('/notifications', { params });
      return data;
    },
  });
};

export const useMyNotifications = (params?: { limit?: number }) => {
  return useQuery<PaginatedResponse<Notification>>({
    queryKey: ['notifications', 'me', params],
    queryFn: async () => {
      const { data } = await api.get('/notifications/me', { params });
      return data;
    },
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/notifications/${id}/read`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'me'] });
    },
  });
};

export const useUnreadNotificationCount = () => {
  return useQuery<{ unreadCount: number }>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const { data } = await api.get('/notifications/unread-count');
      return data;
    },
    refetchInterval: 30000, // Check every 30s
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.patch('/notifications/read-all');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useBroadcastNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { title: string; message: string; type: NotificationType; targetRoles?: string[] }) => {
      const { data } = await api.post('/notifications/broadcast', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useNotificationDrafts = () => {
  return useQuery<any[]>({
    queryKey: ['notifications', 'drafts'],
    queryFn: async () => {
      const { data } = await api.get('/notifications/drafts');
      return data;
    },
  });
};

export const useSaveNotificationDraft = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { title: string; message: string; type: NotificationType; targetRoles?: string[] }) => {
      const { data } = await api.post('/notifications/drafts', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'drafts'] });
    },
  });
};

export const useNotificationDetail = (id?: string) => {
  return useQuery<any>({
    queryKey: ['notifications', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get(`/notifications/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/notifications/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};


