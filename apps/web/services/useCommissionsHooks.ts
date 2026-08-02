import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';
import { Commission, PaginatedResponse, CommissionStatus } from '@/types/api';

export const useCommissions = (params?: { 
  limit?: number; 
  status?: CommissionStatus; 
  userId?: string;
  search?: string;
}) => {
  return useQuery<PaginatedResponse<Commission>>({
    queryKey: ['commissions', params],
    queryFn: async () => {
      const { data } = await api.get('/commissions', { params });
      return data;
    },
  });
};

export const useMyCommissions = (params?: { limit?: number }) => {
  return useQuery<PaginatedResponse<Commission>>({
    queryKey: ['commissions', 'me', params],
    queryFn: async () => {
      const { data } = await api.get('/commissions/me', { params });
      return data;
    },
  });
};

export const useUpdateCommissionStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CommissionStatus }) => {
      const { data } = await api.patch(`/commissions/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
    },
  });
};

export const useCommissionAdminStats = () => {
  return useQuery<{
    totalCommissions?: number;
    paidCommissions?: number;
    pendingCommissions?: number;
    rejectedCommissions?: number;
    commissionsTrendPercentage?: number;
    paidTrendPercentage?: number;
    pendingTrendPercentage?: number;
    [key: string]: any;
  }>({
    queryKey: ['commissions', 'admin', 'stats'],
    queryFn: async () => {
      const { data } = await api.get('/commissions/admin/stats');
      return data;
    },
  });
};

export const downloadCommissionsExport = async () => {
  const response = await api.get('/commissions/export', { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `commissions_export_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

