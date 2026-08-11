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
import type {
  AdminPerformanceReport,
  AdminUserHistory,
  AdminUserLocations,
  AdminUserTeam,
} from '@/types/api';

export const useAdminUser = (userId?: string) => {
  return useQuery<User | null>({
    queryKey: ['admin', 'users', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await api.get<User | null>(`/users/${userId}`);
      return data;
    },
    enabled: !!userId,
  });
};

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
      const { data } = await api.get('/withdrawals', { params });
      return data;
    },
  });
};

export const useUpdateWithdrawalStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      const { data } = await api.patch(`/withdrawals/${id}/status`, { status, reason });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
};

export const useUpdateWithdrawalAmount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      const { data } = await api.patch(`/withdrawals/${id}`, { amount });
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
  enabled?: boolean;
}) => {
  return useQuery<PaginatedResponse<User>>({
    queryKey: ['admin', 'users', params],
    queryFn: async () => {
      const { enabled, ...query } = params || {};
      const { data } = await api.get('/users', { params: query });
      return data;
    },
    staleTime: 0,
    enabled: params?.enabled ?? true,
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & Record<string, any>) => {
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

export const useBusinesses = (params?: { 
  status?: string; 
  search?: string; 
  limit?: number; 
  page?: number; 
}) => {
  return useQuery<PaginatedResponse<Business>>({
    queryKey: ['admin', 'businesses', params],
    queryFn: async () => {
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
      supervisorId?: string;
      managerId?: string;
      workingDays?: string[];
    }) => {
      const { data } = await api.post('/users', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'], exact: false });
    },
  });
};

export const useUserLocations = (userId?: string) => {
  return useQuery<AdminUserLocations | null>({
    queryKey: ['admin', 'users', userId, 'locations'],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await api.get<AdminUserLocations>(`/users/${userId}/locations`);
      return data;
    },
    enabled: !!userId,
  });
};

export const useUpdateUserLocations = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, territoryId }: { userId: string; territoryId: string }) => {
      const { data } = await api.patch(`/users/${userId}/locations`, { territoryId });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', variables.userId, 'locations'] });
    },
  });
};

export const useSendUserEmail = () => {
  return useMutation({
    mutationFn: async ({ userId, subject, message }: { userId: string; subject: string; message: string }) => {
      const { data } = await api.post(`/users/${userId}/send-email`, { subject, message });
      return data;
    },
  });
};

export const useUserReports = (userId?: string) => {
  return useQuery<AdminPerformanceReport | null>({
    queryKey: ['admin', 'users', userId, 'reports'],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await api.get<AdminPerformanceReport>(`/users/${userId}/reports`);
      return data;
    },
    enabled: !!userId,
  });
};

export const useUserHistory = (userId?: string) => {
  return useQuery<AdminUserHistory | null>({
    queryKey: ['admin', 'users', userId, 'history'],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await api.get<AdminUserHistory>(`/users/${userId}/history`);
      return data;
    },
    enabled: !!userId,
  });
};

export const useUserTeam = (userId?: string) => {
  return useQuery<AdminUserTeam | null>({
    queryKey: ['admin', 'users', userId, 'team'],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await api.get<AdminUserTeam>(`/users/${userId}/team`);
      return data;
    },
    enabled: !!userId,
  });
};

export const useUpdateUserTargets = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, dailyLeadTarget, monthlyConversionTarget, reason }: { userId: string; dailyLeadTarget?: number; monthlyConversionTarget?: number; reason?: string }) => {
      const { data } = await api.patch(`/users/${userId}/targets`, { dailyLeadTarget, monthlyConversionTarget, reason });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', variables.userId, 'history'] });
    },
  });
};

export const useAssignUserManager = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, managerId }: { userId: string; managerId: string }) => {
      const { data } = await api.patch(`/users/${userId}/assign-manager`, { managerId });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', variables.userId] });
    },
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: Role }) => {
      const { data } = await api.patch(`/users/${userId}/role`, { role });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', variables.userId] });
    },
  });
};

export const useAssignUserHierarchy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, supervisorId, managerId }: { userId: string; supervisorId?: string; managerId?: string }) => {
      const { data } = await api.patch(`/users/${userId}/assign-hierarchy`, { supervisorId, managerId });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', variables.userId] });
    },
  });
};

export const downloadBusinessesExport = async () => {
  const response = await api.get('/businesses/export', { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `businesses_export_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
