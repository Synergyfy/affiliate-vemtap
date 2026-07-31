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
