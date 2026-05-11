import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';
import { Lead, LeadStats, LeadStatus, LeadPriority, PaginatedResponse } from '../types/api';

export interface LeadFilters {
  status?: LeadStatus;
  search?: string;
  limit?: number;
  page?: number;
  offset?: number;
}

export const useLeads = (filters: LeadFilters = {}) => {
  return useQuery({
    queryKey: ['leads', filters],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Lead>>('/leads/me', { params: filters });
      return response.data;
    },
  });
};


export const useLeadStats = () => {
  return useQuery({
    queryKey: ['leads-stats'],
    queryFn: async () => {
      const response = await api.get<LeadStats>('/leads/stats');
      return response.data;
    },
  });
};

export const useCreateLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Lead>) => {
      const response = await api.post<Lead>('/leads', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads-stats'] });
    },
  });
};

export const useUpdateLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Lead> }) => {
      const response = await api.patch<Lead>(`/leads/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads-stats'] });
    },
  });
};

export const useDeleteLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/leads/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads-stats'] });
    },
  });
};
