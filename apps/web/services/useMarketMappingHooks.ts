import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';
import type {
  AdminAssignment,
  AdminClusterResponse,
  AdminLocation,
  AdminSubmission,
  AssignmentDuration,
  GeographicHierarchyNode,
  MappedBusiness,
  MarketMappingStats,
} from '@/types/market-mapping';
import type { PlannedVisit } from '@/types/affiliate-market-mapping';

interface AdminHierarchyApiNode extends GeographicHierarchyNode {
  children?: AdminHierarchyApiNode[];
}

export interface MarketMappingConfigResponse {
  id?: string;
  userId?: string;
  targetCluster?: string;
  dailyVisitsTarget?: number;
  dailyTarget?: number;
  minDailyTarget?: number;
  globalDailyTarget?: number;
  weeklyConversionGoal?: number;
  pipelineStatuses?: unknown[];
  categories?: string[];
  fieldDefaults?: Record<string, unknown>;
  assignment?: { clusterId: string; clusterName: string; allowUserEdit: boolean } | null;
  assignedCluster?: string;
}

export interface TerritoryResponse {
  country: string;
  state: string;
  city: string;
  area: string;
  cluster: string;
  totalAssigned: number;
  plannedToday: number;
  visitedToday: number;
  customersAcquired: number;
  prospects: number;
  anchors: number;
  remainingInCluster: number;
  marketPenetration: number;
  clusterCompletion: number;
}

export interface MissionPlanPayload {
  targetVisits: number;
  targetLeads: number;
  targetConversions: number;
  locationCluster?: string;
  notes?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export interface MarketMappingInsightsResponse {
  maturity: { discovery: number; verification: number; sales: number; customers: number; partnerships: number; overall: number };
  recommendations: Array<{ id: string; type: 'PRIORITY_VISIT' | 'MISSING_CATEGORY' | 'UNTOUCHED_ANCHOR' | 'PARTNERSHIP'; title: string; description: string; rating: number }>;
}

export interface MarketMappingPerformanceResponse {
  dailyVisits: number;
  weeklyVisits: number;
  monthlyVisits: number;
  meetingsCompleted: number;
  customersAcquired: number;
  proposalsSent?: number;
  conversionRatePercent: number;
  reportingScore: number;
  attendanceRate: number;
  monthRevenue?: number;
  dailyTarget?: number;
  weeklyTarget?: number;
  monthlyTarget?: number;
  dailyProgress?: number;
  weeklyProgress?: number;
  monthlyProgress?: number;
}

export interface MarketMappingHistoryResponse {
  id: string;
  targetVisits: number;
  locationCluster?: string | null;
  status: string;
  startDate: string;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
  leads: Array<{ status: string; visitedAt?: string | null }>;
}

export interface MarketMappingReportSummary {
  score?: number;
  totalLeads: number;
  totalConversions: number;
  totalVisits: number;
  totalEarnings: number;
  completionRate: number;
  businessesReferred: number;
  avgLeadsPerDay: number;
  avgConversionRate: number;
  target: number;
  visitsTarget: number;
  conversionTarget: number;
  infoPct?: number;
  gpsPct?: number;
  infoComposite?: number;
}

export interface MarketMappingReportWeights {
  leads: number;
  conversion: number;
  businessInfo: number;
  visits: number;
  completion: number;
  riskThreshold: number;
  conversionReference: number;
  leadTarget: number;
}

export interface MarketMappingReportDay {
  id: string;
  date: string;
  leads: number;
  target: number;
  conversions: number;
  visits: number;
  infoPct: number;
  gpsPct: number;
  infoComposite: number;
  completionPct: number;
  isToday: boolean;
  score: number;
  met: boolean;
  optional: boolean;
}

export interface MarketMappingReport {
  period: string;
  summary: MarketMappingReportSummary;
  weights: MarketMappingReportWeights;
  ledger: MarketMappingReportDay[];
  leads: Array<{ id: string; businessName: string; phone?: string; status: string; date: string }>;
  visitedBusinesses: Array<{ id: string; businessName: string; ownerName?: string; planType?: string; status: string; date: string }>;
  notes: Array<{ id: string; businessName: string; content: string; followUpDate?: string; createdAt: string }>;
  visits: Array<{ id: string; businessName: string; category: string; status: string; date: string; notes?: string }>;
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
  return useQuery<Array<Record<string, unknown>>>({
    queryKey: ['market-mapping', 'plans'],
    queryFn: async () => {
      const { data } = await api.get('/market-mapping/plans');
      return data;
    },
  });
};

export const useMarketMappingVisits = () => {
  return useQuery<PlannedVisit[]>({
    queryKey: ['market-mapping', 'visits'],
    queryFn: async () => {
      const { data } = await api.get('/market-mapping/visits');
      const rows = Array.isArray(data) ? data : data?.data ?? [];
      return rows.map(mapLeadToPlannedVisit);
    },
  });
};

/**
 * Maps the unified API Lead (pipeline business) to the PlannedVisit shape used
 * by the market-mapping UI.
 */
export const mapLeadToPlannedVisit = (lead: Record<string, any>): PlannedVisit => {
  const mapped: PlannedVisit = {
    id: lead.id,
    name: lead.businessName ?? '',
    category: lead.industry ?? '',
    status: lead.status ?? 'NOT_YET',
    isPlaceholder: !!lead.isPlaceholder,
    address: lead.businessAddress ?? undefined,
    exactAddress: lead.location ?? undefined,
    phone: lead.phone ?? undefined,
    ownerName: lead.contactName ?? undefined,
    contactPosition: lead.contactRole ?? undefined,
    contactEmail: lead.email ?? undefined,
    horizon: lead.horizon,
    createdAt: lead.createdAt,
    visitedAt: lead.visitedAt ?? undefined,
    updatedAt: lead.updatedAt,
    dailyCustomers: lead.dailyCustomers ?? undefined,
    businessSize: lead.businessSize ?? undefined,
    openingHours: lead.openingHours ?? undefined,
    openingDays: lead.openingDays ?? undefined,
    gpsLat: lead.gpsLat ?? undefined,
    gpsLng: lead.gpsLng ?? undefined,
    gpsAddress: lead.gpsAddress ?? undefined,
    nextVisitDate: lead.nextVisitDate ?? undefined,
    nextVisitTime: lead.nextVisitTime ?? undefined,
    decisionMakerMet: lead.decisionMakerMet ?? undefined,
    interested: lead.interested ?? undefined,
    demoDone: lead.demoDone ?? undefined,
    visitNotes: lead.comments ?? undefined,
    isAnchor: lead.isAnchor ?? false,
  };
  return mapped;
};

const VISIT_FIELDS = [
  'businessName', 'industry', 'status', 'isPlaceholder', 'businessAddress',
  'location', 'phone', 'contactName', 'contactRole', 'email', 'horizon',
  'dailyCustomers', 'businessSize', 'openingHours', 'openingDays',
  'gpsLat', 'gpsLng', 'gpsAddress', 'nextVisitDate', 'nextVisitTime', 'decisionMakerMet',
  'interested', 'demoDone', 'comments', 'isAnchor', 'planId', 'source',
] as const;

const pickVisitFields = (payload: Record<string, unknown>): Record<string, unknown> => {
  const clean: Record<string, unknown> = {};
  for (const key of VISIT_FIELDS) {
    if (payload[key] !== undefined) clean[key] = payload[key];
  }
  return clean;
};

const toLeadPayload = (visit: Omit<PlannedVisit, 'id'>): Record<string, unknown> => {
  const payload: Record<string, unknown> = {
    businessName: visit.name,
    industry: visit.category,
    businessAddress: visit.address,
    location: visit.exactAddress,
    contactName: visit.ownerName,
    contactRole: visit.contactPosition,
    email: visit.contactEmail,
    comments: visit.visitNotes,
  };
  for (const key of VISIT_FIELDS) {
    if (payload[key] === undefined && (visit as Record<string, unknown>)[key] !== undefined) {
      payload[key] = (visit as Record<string, unknown>)[key];
    }
  }
  return pickVisitFields(payload);
};

export const useCreateMarketMappingVisit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<PlannedVisit, 'id'>) => {
      const { data } = await api.post('/market-mapping/visits', toLeadPayload(payload));
      return data as PlannedVisit;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['market-mapping', 'visits'] }); },
  });
};

export const useUpdateMarketMappingVisit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: PlannedVisit) => {
      const { data } = await api.patch(`/market-mapping/visits/${id}`, toLeadPayload(payload));
      return data as PlannedVisit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-mapping', 'visits'] });
      queryClient.invalidateQueries({ queryKey: ['market-mapping', 'performance'] });
      queryClient.invalidateQueries({ queryKey: ['market-mapping', 'reports'] });
    },
  });
};

export const useMarketMappingHistory = () => useQuery<MarketMappingHistoryResponse[]>({
  queryKey: ['market-mapping', 'history'],
  queryFn: async () => {
    const { data } = await api.get('/market-mapping/history');
    return Array.isArray(data) ? data : data?.data ?? [];
  },
});

export const useCreateMissionPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: MissionPlanPayload) => {
      const { data } = await api.post('/market-mapping/plans', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-mapping'] });
      queryClient.invalidateQueries({ queryKey: ['field-activity'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
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
      queryClient.invalidateQueries({ queryKey: ['market-mapping'] });
      queryClient.invalidateQueries({ queryKey: ['field-activity'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
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
  return useQuery<MarketMappingInsightsResponse>({
    queryKey: ['market-mapping', 'insights'],
    queryFn: async () => {
      const { data } = await api.get('/market-mapping/insights');
      return data;
    },
  });
};

export const useMarketMappingNotes = (businessId?: string, reportKey?: string) => {
  return useQuery<any[]>({
    queryKey: ['market-mapping', 'notes', businessId, reportKey],
    queryFn: async () => {
      const { data } = await api.get('/market-mapping/notes', { params: { businessId, reportKey } });
      return data;
    },
  });
};

export const useMarketMappingPerformance = () => useQuery<MarketMappingPerformanceResponse>({
  queryKey: ['market-mapping', 'performance'],
  queryFn: async () => {
    const { data } = await api.get('/market-mapping/performance');
    return data;
  },
});

export const useAddMarketMappingNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { businessId?: string; leadId?: string; reportKey?: string; businessName: string; content: string; followUpDate?: string }) => {
      const { data } = await api.post('/market-mapping/notes', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-mapping', 'notes'] });
    },
  });
};

export const useMarketMappingReports = (period: string = 'monthly') => {
  return useQuery<MarketMappingReport>({
    queryKey: ['market-mapping', 'reports', period],
    queryFn: async () => {
      const { data } = await api.get('/market-mapping/reports', { params: { period } });
      return data;
    },
  });
};

export const useMarketMappingReportData = (userId?: string, period: string = 'monthly') => {
  return useQuery<MarketMappingReport>({
    queryKey: userId
      ? ['market-mapping', 'admin', 'reports', userId, period]
      : ['market-mapping', 'reports', period],
    queryFn: async () => {
      const { data } = userId
        ? await api.get('/market-mapping/admin/reports', { params: { userId, period } })
        : await api.get('/market-mapping/reports', { params: { period } });
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
  return useQuery<GeographicHierarchyNode[]>({
    queryKey: ['market-mapping', 'admin', 'hierarchy'],
    queryFn: async () => {
      const { data } = await api.get('/market-mapping/admin/hierarchy');
      const flatten = (items: AdminHierarchyApiNode[], parentId?: string | null): GeographicHierarchyNode[] =>
        items.flatMap((item) => [
          { ...item, parentId: item.parentId ?? parentId },
          ...flatten(item.children ?? [], item.id),
        ]);
      return flatten(Array.isArray(data) ? data : data?.data ?? data?.children ?? []);
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
  return useQuery<AdminLocation[]>({
    queryKey: ['market-mapping', 'admin', 'locations'],
    queryFn: async () => {
      const { data } = await api.get('/market-mapping/admin/locations');
      return Array.isArray(data) ? data : data?.data ?? [];
    },
  });
};

export const useAdminClusterDetail = (id?: string) => {
  return useQuery<AdminClusterResponse | null>({
    queryKey: ['market-mapping', 'admin', 'cluster', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get(`/market-mapping/admin/cluster/${id}`);
      return data?.cluster ? data : { cluster: data, businesses: [] };
    },
    enabled: !!id,
  });
};

export const useAdminCapturedVisits = () => {
  return useQuery<MappedBusiness[]>({
    queryKey: ['market-mapping', 'admin', 'captured-visits'],
    queryFn: async () => {
      const { data } = await api.get('/market-mapping/admin/captured-visits');
      return Array.isArray(data) ? data : data?.data ?? [];
    },
  });
};

export const useAdminAssignments = (params?: { clusterId?: string; userId?: string; includeExpired?: boolean }) => {
  return useQuery<AdminAssignment[]>({
    queryKey: ['market-mapping', 'admin', 'assignments', params],
    queryFn: async () => {
      const { data } = await api.get('/market-mapping/admin/assignments', { params });
      return Array.isArray(data) ? data : data?.data ?? [];
    },
  });
};

export const useCreateAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      userId: string;
      clusterId: string;
      dailyLeadTarget?: number;
      weeklyLeadTarget?: number;
      monthlyConversionTarget?: number;
      allowUserEdit?: boolean;
      duration?: AssignmentDuration;
      customExpiresAt?: string;
      customDays?: number;
      reassignExisting?: boolean;
    }) => {
      const { data } = await api.post('/market-mapping/admin/assignments', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-mapping', 'admin', 'assignments'] });
    },
  });
};

export const useAssignLineManager = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      managerId: string;
      clusterId: string;
      dailyLeadTarget?: number;
      weeklyLeadTarget?: number;
      monthlyConversionTarget?: number;
      allowUserEdit?: boolean;
      duration?: AssignmentDuration;
      customExpiresAt?: string;
      customDays?: number;
      includeTeamMembers?: boolean;
      reassignExisting?: boolean;
    }) => {
      const { data } = await api.post('/market-mapping/admin/assignments/line-manager', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-mapping', 'admin', 'assignments'] });
    },
  });
};

export const useReassignAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: {
      id: string;
      clusterId: string;
      duration?: AssignmentDuration;
      customExpiresAt?: string;
      customDays?: number;
      dailyLeadTarget?: number;
      weeklyLeadTarget?: number;
      monthlyConversionTarget?: number;
      allowUserEdit?: boolean;
    }) => {
      const { data } = await api.post(`/market-mapping/admin/assignments/${id}/reassign`, payload);
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
  return useQuery<AdminSubmission[]>({
    queryKey: ['market-mapping', 'admin', 'submissions', clusterId],
    queryFn: async () => {
      if (!clusterId) return [];
      const { data } = await api.get(`/market-mapping/admin/cluster/${clusterId}/submissions`);
      return data?.submissions ?? (Array.isArray(data) ? data : []);
    },
    enabled: !!clusterId,
  });
};

export const useAdminMarketStats = () => {
  return useQuery<MarketMappingStats>({
    queryKey: ['market-mapping', 'admin', 'stats'],
    queryFn: async () => {
      const { data } = await api.get('/market-mapping/admin/stats');
      return {
        commercialAreas: data.commercialAreas ?? data.totalTerritories ?? 0,
        commercialClusters: data.commercialClusters ?? data.activeClusters ?? data.totalClusters ?? 0,
        businessesMapped: data.businessesMapped ?? data.totalBusinessesCaptured ?? data.mappedBusinesses ?? 0,
        verifiedBusinesses: data.verifiedBusinesses ?? 0,
        vemtapCustomers: data.vemtapCustomers ?? data.customers ?? 0,
        prospects: data.prospects ?? 0,
        anchorBusinesses: data.anchorBusinesses ?? 0,
        assignedAffiliates: data.assignedAffiliates ?? data.activeAffiliates ?? 0,
        averagePenetration: data.averagePenetration ?? data.overallPenetrationPercent ?? data.marketPenetration ?? 0,
        todayVisits: data.todayVisits ?? 0,
        todayNewCustomers: data.todayNewCustomers ?? 0,
      };
    },
  });
};

export interface AdminEditorConfig {
  id: string;
  pipelineStatuses: any[];
  categories: string[];
  businessCategories: string[];
  openingDays: string[];
  customerRanges: { value: string; label: string; min?: number; max?: number }[];
  businessSizes: { value: string; label: string; minStaff?: number; maxStaff?: number }[];
  contactPositions: string[];
  interestOptions: { value: string; label: string }[];
  planTypes: { value: string; label: string }[];
  faqs: { id: string; question: string; answer: string; category: string }[];
  ticketStatuses: { id: string; label: string; color: string; bg: string }[];
  businessStatuses: { id: string; label: string; color: string; bg: string }[];
  paymentStatuses: { id: string; label: string; color: string; bg: string }[];
  dailyTarget: number;
  weeklyTarget: number;
  monthlyTarget: number;
  fieldDefaults: Record<string, boolean>;
}

export const useAdminEditorConfig = () => {
  return useQuery<AdminEditorConfig>({
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
    mutationFn: async (payload: Partial<AdminEditorConfig>) => {
      const { data } = await api.patch('/market-mapping/admin/editor-config', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-mapping', 'admin', 'editor-config'] });
      queryClient.invalidateQueries({ queryKey: ['market-mapping', 'config'] });
    },
  });
};
