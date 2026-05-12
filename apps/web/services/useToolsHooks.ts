import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';
import { PaginatedResponse, TrainingModule } from '@/types/api';

export interface MarketingTool {
  id: string;
  title: string;
  description?: string;
  type: 'FLYER' | 'COPY_TEMPLATE';
  content: string;
  category?: string;
  isPublished: boolean;
  createdAt: string;
}

export interface ShortLink {
  id: string;
  code: string;
  url: string;
  clicks: number;
  createdAt: string;
}

export const useMarketingTools = (params?: { skip?: number; take?: number; all?: boolean }) => {
  return useQuery<PaginatedResponse<MarketingTool>>({
    queryKey: ['tools', params],
    queryFn: async () => {
      const { data } = await api.get('/tools', { params });
      return data;
    },
  });
};

export const useShortLinks = () => {
  return useQuery<ShortLink[]>({
    queryKey: ['tools', 'short-links'],
    queryFn: async () => {
      const { data } = await api.get('/tools/short-links');
      return data;
    },
  });
};

export const useCreateShortLink = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { code: string }) => {
      const { data } = await api.post('/tools/short-links', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools', 'short-links'] });
    },
  });
};

export const useDeleteShortLink = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/tools/short-links/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools', 'short-links'] });
    },
  });
};
