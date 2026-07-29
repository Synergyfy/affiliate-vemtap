import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';
import { 
  AdminStats, 
  PaginatedResponse, 
  Withdrawal, 
  User, 
  PlatformSettings,
  ChartDataPoint,
  Business
} from '@/types/api';
import { WithdrawalStatus, Role } from '@/types/api';
import { 
  mockAdminStats, 
  mockWithdrawals, 
  mockUsers, 
  mockSettings, 
  mockBusinesses 
} from '@/lib/admin-mock-data';

const IS_MOCK = process.env.NEXT_PUBLIC_ADMIN_MOCK === 'true';

export const useAdminStats = () => {
  return useQuery<AdminStats>({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      if (IS_MOCK) return mockAdminStats;
      const { data } = await api.get('/admin/dashboard/stats');
      return data;
    },
  });
};

export const useAdminCharts = () => {
  return useQuery<{ revenueGrowth: ChartDataPoint[]; affiliateSignups: ChartDataPoint[] }>({
    queryKey: ['admin', 'charts'],
    queryFn: async () => {
      if (IS_MOCK) {
        return {
          revenueGrowth: [
            { date: 'Jan', value: 1200000 },
            { date: 'Feb', value: 1900000 },
            { date: 'Mar', value: 3000000 },
            { date: 'Apr', value: 5000000 },
            { date: 'May', value: 4800000 },
            { date: 'Jun', value: 6200000 },
          ],
          affiliateSignups: [
            { date: 'Jan', value: 10 },
            { date: 'Feb', value: 25 },
            { date: 'Mar', value: 40 },
            { date: 'Apr', value: 65 },
            { date: 'May', value: 90 },
            { date: 'Jun', value: 124 },
          ],
        };
      }
      const { data } = await api.get('/admin/dashboard/charts');
      return data;
    },
  });
};

export const useWithdrawals = (params?: { 
  status?: WithdrawalStatus; 
  userId?: string; 
  search?: string; 
  startDate?: string; 
  endDate?: string; 
  limit?: number; 
  page?: number; 
}) => {
  return useQuery<PaginatedResponse<Withdrawal>>({
    queryKey: ['admin', 'withdrawals', params],
    queryFn: async () => {
      if (IS_MOCK) return mockWithdrawals;
      const { data } = await api.get('/withdrawals', { params });
      return data;
    },
  });
};

export const useUpdateWithdrawalStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (IS_MOCK) return { id, status };
      const { data } = await api.patch(`/withdrawals/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
};

export const useUsers = (params?: { 
  role?: Role; 
  status?: string; 
  search?: string; 
  limit?: number; 
  page?: number; 
  isManager?: boolean;
}) => {
  return useQuery<PaginatedResponse<User>>({
    queryKey: ['admin', 'users', params],
    queryFn: async () => {
      if (IS_MOCK) return mockUsers;
      const { data } = await api.get('/users', { params });
      return data;
    },
    staleTime: 0,
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & Record<string, any>) => {
      if (IS_MOCK) return { id, ...payload };
      const { data } = await api.patch(`/users/${id}/profile`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'], exact: false });
    },
  });
};

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (IS_MOCK) return { id, status };
      const { data } = await api.patch(`/users/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'], exact: false });
    },
  });
};

export const useSettings = () => {
  return useQuery<PlatformSettings>({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      if (IS_MOCK) return mockSettings;
      const { data } = await api.get('/settings');
      return data;
    },
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<PlatformSettings>) => {
      if (IS_MOCK) return { ...mockSettings, ...payload };
      const { data } = await api.patch('/settings', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
    },
  });
};

export const useBusinesses = (params?: { 
  status?: string; 
  search?: string; 
  limit?: number; 
  page?: number; 
}) => {
  return useQuery<PaginatedResponse<Business>>({
    queryKey: ['admin', 'businesses', params],
    queryFn: async () => {
      if (IS_MOCK) return mockBusinesses;
      const { data } = await api.get('/businesses', { params });
      return data;
    },
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      fullName: string;
      email: string;
      phone: string;
      password: string;
      role?: string;
      dailyLeadTarget?: number;
      monthlyConversionTarget?: number;
    }) => {
      if (IS_MOCK) return { id: 'u-new', ...payload };
      const { data } = await api.post('/users', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'], exact: false });
    },
  });
};

