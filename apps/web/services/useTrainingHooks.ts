import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';
import { TrainingModule, PaginatedResponse, ProgressStatus } from '@/types/api';

export const useTrainingModules = (params?: { limit?: number }) => {
  return useQuery<PaginatedResponse<TrainingModule>>({
    queryKey: ['training', 'modules', params],
    queryFn: async () => {
      const { data } = await api.get('/training/modules', { params });
      return data;
    },
  });
};

export const useAdminTrainingModules = (params?: { limit?: number }) => {
  return useQuery<PaginatedResponse<TrainingModule>>({
    queryKey: ['admin', 'training', 'modules', params],
    queryFn: async () => {
      const { data } = await api.get('/training/admin/modules', { params });
      return data;
    },
  });
};

export const useTrainingModuleDetails = (id: string) => {
  return useQuery<TrainingModule>({
    queryKey: ['training', 'module', id],
    queryFn: async () => {
      const { data } = await api.get(`/training/admin/modules/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useUpdateTrainingProgress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, quizScore, practiceResults }: { id: string; status: ProgressStatus; quizScore?: number; practiceResults?: any }) => {
      const { data } = await api.patch(`/training/modules/${id}/progress`, { status, quizScore, practiceResults });
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['training', 'modules'] });
      queryClient.invalidateQueries({ queryKey: ['training', 'module', id] });
    },
  });
};

export const useCreateTrainingModule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<TrainingModule>) => {
      const { data } = await api.post('/training/admin/modules', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'training', 'modules'] });
    },
  });
};

export const useUpdateTrainingModule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<TrainingModule> & { id: string }) => {
      const { data } = await api.patch(`/training/admin/modules/${id}`, payload);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'training', 'modules'] });
      queryClient.invalidateQueries({ queryKey: ['training', 'module', id] });
    },
  });
};

export const useDeleteTrainingModule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/training/admin/modules/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'training', 'modules'] });
    },
  });
};

export const useAdminModulePreview = (id?: string) => {
  return useQuery<any>({
    queryKey: ['admin', 'training', 'module', id, 'preview'],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get(`/training/admin/modules/${id}/preview`);
      return data;
    },
    enabled: !!id,
  });
};

