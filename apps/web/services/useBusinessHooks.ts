import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';
import { Business, PaginatedResponse, BusinessStatus, PlanType } from '@/types/api';

export const useBusinesses = (params?: { limit?: number; status?: BusinessStatus; affiliateId?: string }) => {
  return useQuery<PaginatedResponse<Business>>({
    queryKey: ['businesses', params],
    queryFn: async () => {
      const { data } = await api.get('/businesses', { params });
      return data;
    },
  });
};

export const useMyBusinesses = (params?: { limit?: number }) => {
  return useQuery<PaginatedResponse<Business>>({
    queryKey: ['businesses', 'me', params],
    queryFn: async () => {
      const { data } = await api.get('/businesses/me', { params });
      return data;
    },
  });
};

export const useCreateBusiness = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { businessName: string; ownerName: string; email: string; phone: string; planType: PlanType }) => {
      const { data } = await api.post('/businesses', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses', 'me'] });
    },
  });
};

export const useUpdateBusiness = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Business> & { id: string }) => {
      const { data } = await api.patch(`/businesses/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
    },
  });
};
