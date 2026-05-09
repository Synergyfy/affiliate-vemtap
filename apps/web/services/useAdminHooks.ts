import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';
import { 
  AdminStats, 
  PaginatedResponse, 
  Withdrawal, 
  User, 
  PlatformSettings,
  ChartDataPoint
} from '@/types/api';

export const useAdminStats = () => {
  return useQuery<AdminStats>({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const { data } = await api.get('/admin/dashboard/stats');
      return data;
    },
  });
};

export const useAdminCharts = () => {
  return useQuery<{ revenueGrowth: ChartDataPoint[]; affiliateSignups: ChartDataPoint[] }>({
    queryKey: ['admin', 'charts'],
    queryFn: async () => {
      const { data } = await api.get('/admin/dashboard/charts');
      return data;
    },
  });
};

export const useWithdrawals = (limit = 50) => {
  return useQuery<PaginatedResponse<Withdrawal>>({
    queryKey: ['admin', 'withdrawals', { limit }],
    queryFn: async () => {
      const { data } = await api.get(`/withdrawals?limit=${limit}`);
      return data;
    },
  });
};

export const useUpdateWithdrawalStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await api.patch(`/withdrawals/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
};

export const useUsers = (params?: { role?: string; status?: string; limit?: number }) => {
  return useQuery<PaginatedResponse<User>>({
    queryKey: ['admin', 'users', params],
    queryFn: async () => {
      const { data } = await api.get('/users', { params });
      return data;
    },
  });
};

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await api.patch(`/users/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
};

export const useSettings = () => {
  return useQuery<PlatformSettings>({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      const { data } = await api.get('/settings');
      return data;
    },
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<PlatformSettings>) => {
      const { data } = await api.patch('/settings', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
    },
  });
};
