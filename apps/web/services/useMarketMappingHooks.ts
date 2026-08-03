import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';

export interface MarketMappingConfigResponse {
  id?: string;
  userId?: string;
  targetCluster?: string;
  dailyVisitsTarget?: number;
  weeklyConversionGoal?: number;
  pipelineStatuses?: any[];
  businessCategories?: string[];
  [key: string]: any;
}

export interface TerritoryResponse {
  mappedBusinessesCount: number;
  activeLeadsCount: number;
  penetrationPercentage: number;
  [key: string]: any;
}

export interface MissionPlanPayload {
  title: string;
  clusterId?: string;
  targetCount: number;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export const useMarketMappingConfig = () => {
  return useQuery<MarketMappingConfigResponse>({
    queryKey: ['market-mapping', 'config'],
    queryFn: async () => {
      const { data } = await api.get('/market-mapping/config');
      return data;
    },
  });
};

export const useMarketMappingTerritory = () => {
  return useQuery<TerritoryResponse>({
    queryKey: ['market-mapping', 'territory'],
    queryFn: async () => {
      const { data } = await api.get('/market-mapping/territory');
      return data;
    },
  });
};

export const useMarketMappingPlans = () => {
  return useQuery<any[]>({
    queryKey: ['market-mapping', 'plans'],
    queryFn: async () => {
      const { data } = await api.get('/market-mapping/plans');
      return data;
    },
  });
};

export const useCreateMissionPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: MissionPlanPayload) => {
      const { data } = await api.post('/market-mapping/plans', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-mapping', 'plans'] });
    },
  });
};

export const useUpdateMissionPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & Partial<MissionPlanPayload>) => {
      const { data } = await api.patch(`/market-mapping/plans/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-mapping', 'plans'] });
    },
  });
};

export const useMarketMappingAnchors = () => {
  return useQuery<any[]>({
    queryKey: ['market-mapping', 'anchors'],
    queryFn: async () => {
      const { data } = await api.get('/market-mapping/anchors');
      return data;
    },
  });
};

export const usePriorityVisits = () => {
  return useQuery<any[]>({
    queryKey: ['market-mapping', 'priority-visits'],
    queryFn: async () => {
      const { data } = await api.get('/market-mapping/priority-visits');
      return data;
    },
  });
};

export const usePartnerships = () => {
  return useQuery<any[]>({
    queryKey: ['market-mapping', 'partnerships'],
    queryFn: async () => {
      const { data } = await api.get('/market-mapping/partnerships');
      return data;
    },
  });
};

export const useClusterInsights = () => {
  return useQuery<any>({
    queryKey: ['market-mapping', 'insights'],
    queryFn: async () => {
      const { data } = await api.get('/market-mapping/insights');
      return data;
    },
  });
};

export const useMarketMappingNotes = (businessId?: string) => {
  return useQuery<any[]>({
    queryKey: ['market-mapping', 'notes', businessId],
    queryFn: async () => {
      const { data } = await api.get('/market-mapping/notes', { params: { businessId } });
      return data;
    },
  });
};

export const useAddMarketMappingNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { businessId?: string; content: string; followUpDate?: string }) => {
      const { data } = await api.post('/market-mapping/notes', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-mapping', 'notes'] });
    },
  });
};

export const useMarketMappingReports = (period: string = 'monthly') => {
  return useQuery<any>({
    queryKey: ['market-mapping', 'reports', period],
    queryFn: async () => {
      const { data } = await api.get('/market-mapping/reports', { params: { period } });
      return data;
    },
  });
};

export const downloadMarketMappingReport = async (period: string = 'monthly') => {
  const response = await api.get('/market-mapping/reports/download', {
    params: { period },
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `market_mapping_report_${period}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

// Admin Market Mapping Endpoints
export const useAdminMarketHierarchy = () => {
  return useQuery<any[]>({
    queryKey: ['market-mapping', 'admin', 'hierarchy'],
    queryFn: async () => {
      const { data } = await api.get('/market-mapping/admin/hierarchy');
      return data;
    },
  });
};

export const useCreateHierarchyNode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; type: string; parentId?: string; totalBusinesses?: number; penetrationRate?: number }) => {
      const { data } = await api.post('/market-mapping/admin/hierarchy', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-mapping', 'admin', 'hierarchy'] });
    },
  });
};

export const useUpdateHierarchyNode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & Record<string, any>) => {
      const { data } = await api.patch(`/market-mapping/admin/hierarchy/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-mapping', 'admin', 'hierarchy'] });
    },
  });
};

export const useDeleteHierarchyNode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/market-mapping/admin/hierarchy/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-mapping', 'admin', 'hierarchy'] });
    },
  });
};

export const useAdminLocations = () => {
  return useQuery<any[]>({
    queryKey: ['market-mapping', 'admin', 'locations'],
    queryFn: async () => {
      const { data } = await api.get('/market-mapping/admin/locations');
      return data;
    },
  });
};

export const useAdminClusterDetail = (id?: string) => {
  return useQuery<any>({
    queryKey: ['market-mapping', 'admin', 'cluster', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get(`/market-mapping/admin/cluster/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useAdminAssignments = () => {
  return useQuery<any[]>({
    queryKey: ['market-mapping', 'admin', 'assignments'],
    queryFn: async () => {
      const { data } = await api.get('/market-mapping/admin/assignments');
      return data;
    },
  });
};

export const useCreateAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { userId: string; clusterId: string; dailyTarget?: number; weeklyTarget?: number; monthlyTarget?: number; allowUserEdit?: boolean }) => {
      const { data } = await api.post('/market-mapping/admin/assignments', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-mapping', 'admin', 'assignments'] });
    },
  });
};

export const useUpdateAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & Record<string, any>) => {
      const { data } = await api.patch(`/market-mapping/admin/assignments/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-mapping', 'admin', 'assignments'] });
    },
  });
};

export const useDeleteAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/market-mapping/admin/assignments/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-mapping', 'admin', 'assignments'] });
    },
  });
};

export const useAdminSubmissions = (clusterId?: string) => {
  return useQuery<any[]>({
    queryKey: ['market-mapping', 'admin', 'submissions', clusterId],
    queryFn: async () => {
      if (!clusterId) return [];
      const { data } = await api.get(`/market-mapping/admin/cluster/${clusterId}/submissions`);
      return data;
    },
    enabled: !!clusterId,
  });
};

export const useAdminMarketStats = () => {
  return useQuery<any>({
    queryKey: ['market-mapping', 'admin', 'stats'],
    queryFn: async () => {
      const { data } = await api.get('/market-mapping/admin/stats');
      return data;
    },
  });
};

export const useAdminEditorConfig = () => {
  return useQuery<any>({
    queryKey: ['market-mapping', 'admin', 'editor-config'],
    queryFn: async () => {
      const { data } = await api.get('/market-mapping/admin/editor-config');
      return data;
    },
  });
};

export const useUpdateAdminEditorConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { pipelineStatuses?: string[]; businessCategories?: string[] }) => {
      const { data } = await api.patch('/market-mapping/admin/editor-config', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-mapping', 'admin', 'editor-config'] });
    },
  });
};

