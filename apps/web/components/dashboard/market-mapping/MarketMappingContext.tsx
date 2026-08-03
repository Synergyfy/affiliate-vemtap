'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { PlannedVisit, TerritoryStats, ClusterMaturity, AIRecommendation, AffiliatePerformance, BusinessNote, MissionPlan, MissionHistoryEntry } from '@/types/affiliate-market-mapping';
import { mockAffiliateStats, mockAffiliatePerformance, mockClusterMaturity, mockRecommendations, mockVisits, mockNotes } from '@/lib/affiliate-mock';
import { 
  useMarketMappingTerritory, 
  useMarketMappingPlans, 
  useCreateMissionPlan, 
  useMarketMappingNotes, 
  useAddMarketMappingNote,
  useClusterInsights
} from '@/services/useMarketMappingHooks';
import { useLeads, useCreateLead, useUpdateLead } from '@/services/useLeadsHooks';

interface MarketMappingContextType {
  stats: TerritoryStats;
  setStats: React.Dispatch<React.SetStateAction<TerritoryStats>>;
  visits: PlannedVisit[];
  setVisits: React.Dispatch<React.SetStateAction<PlannedVisit[]>>;
  performance: AffiliatePerformance;
  setPerformance: React.Dispatch<React.SetStateAction<AffiliatePerformance>>;
  maturity: ClusterMaturity;
  recommendations: AIRecommendation[];
  notes: BusinessNote[];
  selectedVisit: PlannedVisit | null;
  setSelectedVisit: (v: PlannedVisit | null) => void;
  addVisits: (newVisits: PlannedVisit[]) => void;
  saveCapture: (updatedVisit: PlannedVisit) => void;
  missionPlans: MissionPlan[];
  addMissionPlan: (plan: MissionPlan) => void;
  missionHistory: MissionHistoryEntry[];
  archiveMissionPlan: (entry: MissionHistoryEntry) => void;
  addNote?: (note: { businessId?: string; content: string }) => void;
}

const MarketMappingContext = createContext<MarketMappingContextType | undefined>(undefined);

export function useMarketMapping() {
  const ctx = useContext(MarketMappingContext);
  if (!ctx) {
    return {
      stats: mockAffiliateStats,
      setStats: () => {},
      visits: [] as PlannedVisit[],
      setVisits: () => {},
      performance: mockAffiliatePerformance,
      setPerformance: () => {},
      maturity: mockClusterMaturity,
      recommendations: mockRecommendations,
      notes: mockNotes,
      selectedVisit: null,
      setSelectedVisit: () => {},
      addVisits: () => {},
      saveCapture: () => {},
      missionPlans: [] as MissionPlan[],
      addMissionPlan: () => {},
      missionHistory: [] as MissionHistoryEntry[],
      archiveMissionPlan: () => {},
    };
  }
  return ctx;
}

export function MarketMappingProvider({ children }: { children: React.ReactNode }) {
  const { data: territoryData } = useMarketMappingTerritory();
  const { data: apiPlans } = useMarketMappingPlans();
  const { data: apiNotes } = useMarketMappingNotes();
  const { data: apiInsights } = useClusterInsights();
  const { data: apiLeadsData } = useLeads({ limit: 100 });

  const createPlanMutation = useCreateMissionPlan();
  const addNoteMutation = useAddMarketMappingNote();
  const createLeadMutation = useCreateLead();
  const updateLeadMutation = useUpdateLead();

  const [stats, setStats] = useState<TerritoryStats>(mockAffiliateStats);
  const [visits, setVisits] = useState<PlannedVisit[]>(mockVisits);
  const [selectedVisit, setSelectedVisit] = useState<PlannedVisit | null>(null);

  const [performance, setPerformance] = useState<AffiliatePerformance>(mockAffiliatePerformance);
  const [missionPlans, setMissionPlans] = useState<MissionPlan[]>([]);
  const [missionHistory, setMissionHistory] = useState<MissionHistoryEntry[]>([]);
  const [notes, setNotes] = useState<BusinessNote[]>(mockNotes);

  // Sync Territory Stats from Backend
  useEffect(() => {
    if (territoryData && typeof territoryData === 'object') {
      setStats(prev => ({
        ...prev,
        customersAcquired: territoryData.mappedBusinessesCount ?? prev.customersAcquired ?? 0,
        totalAssigned: ((territoryData.mappedBusinessesCount ?? 0) + (territoryData.activeLeadsCount ?? 0)) || prev.totalAssigned || 0,
        marketPenetration: territoryData.penetrationPercentage ?? prev.marketPenetration ?? 0,
      }));
    }
  }, [territoryData]);

  // Sync Mission Plans from Backend
  useEffect(() => {
    if (Array.isArray(apiPlans) && apiPlans.length > 0) {
      const formatted: MissionPlan[] = apiPlans.map((p: any) => ({
        horizon: (p?.horizon || 'MONTH') as any,
        location: p?.clusterId || p?.location || 'Assigned Cluster',
        targetCount: p?.targetCount || 50,
        createdAt: p?.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
      }));
      setMissionPlans(formatted);
    }
  }, [apiPlans]);

  // Sync Notes from Backend
  useEffect(() => {
    if (Array.isArray(apiNotes) && apiNotes.length > 0) {
      const formatted: BusinessNote[] = apiNotes.map((n: any) => ({
        id: n?.id || `note-${Date.now()}`,
        businessId: n?.businessId || 'biz-1',
        type: 'TEXT' as const,
        content: n?.content || '',
        createdAt: n?.createdAt ? new Date(n.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
      }));
      setNotes(formatted);
    }
  }, [apiNotes]);

  // Sync Leads into Visits from Backend
  useEffect(() => {
    const leadsList = Array.isArray(apiLeadsData?.data) ? apiLeadsData.data : Array.isArray(apiLeadsData) ? apiLeadsData : [];
    if (leadsList.length > 0) {
      const mappedVisits: PlannedVisit[] = leadsList.map((lead: any) => ({
        id: lead?.id || `lead-${Date.now()}`,
        name: lead?.businessName || lead?.name || 'Unnamed Business',
        category: lead?.industry || lead?.category || 'General',
        address: lead?.businessAddress || lead?.location || 'Address Pending',
        phone: lead?.phone || '',
        ownerName: lead?.contactName || lead?.ownerName || '',
        status: lead?.status === 'COMPLETED' ? 'CUSTOMER' : lead?.status === 'INTERESTED' ? 'INTERESTED' : 'VISITED',
        visitNotes: lead?.comments || lead?.visitNotes || '',
        isPlaceholder: false,
      }));
      setVisits(mappedVisits);
    }
  }, [apiLeadsData]);

  const addMissionPlan = useCallback((plan: MissionPlan) => {
    setMissionPlans(prev => {
      const filtered = prev.filter(p => p.horizon !== plan.horizon);
      return [...filtered, plan];
    });
    createPlanMutation.mutate({
      title: `Mission Plan - ${plan.location}`,
      targetCount: plan.targetCount,
    });
  }, [createPlanMutation]);

  const archiveMissionPlan = useCallback((entry: MissionHistoryEntry) => {
    setMissionHistory(prev => [entry, ...prev]);
  }, []);

  const addVisits = useCallback((newVisits: PlannedVisit[]) => {
    setVisits(prev => [...prev, ...newVisits]);
    setStats(prev => ({
      ...prev,
      plannedToday: prev.plannedToday + newVisits.length,
    }));
    newVisits.forEach(v => {
      createLeadMutation.mutate({
        businessName: v.name,
        industry: v.category,
        businessAddress: v.address,
        phone: v.phone,
        contactName: v.ownerName,
        priority: 'MEDIUM',
        status: 'POTENTIAL',
        source: 'MARKET_MAPPING',
      });
    });
  }, [createLeadMutation]);

  const saveCapture = useCallback((updatedVisit: PlannedVisit) => {
    setVisits(prev => prev.map(v => v.id === updatedVisit.id ? updatedVisit : v));
    const wasPlaceholder = visits.find(v => v.id === updatedVisit.id)?.isPlaceholder;
    if (wasPlaceholder && !updatedVisit.isPlaceholder) {
      setStats(prev => ({ ...prev, visitedToday: prev.visitedToday + 1 }));
      setPerformance(prev => ({
        ...prev,
        dailyProgress: prev.dailyProgress + 1,
        weeklyProgress: prev.weeklyProgress + 1,
        monthlyProgress: prev.monthlyProgress + 1,
        monthVisits: prev.monthVisits + 1
      }));
    }
    const isMockId = !updatedVisit.id || /^v\d+$/i.test(updatedVisit.id) || updatedVisit.id.startsWith('mock-') || updatedVisit.id.startsWith('v-');
    if (!isMockId) {
      updateLeadMutation.mutate({
        id: updatedVisit.id,
        data: {
          businessName: updatedVisit.name,
          businessAddress: updatedVisit.address,
          comments: updatedVisit.visitNotes,
          status: updatedVisit.status === 'CUSTOMER' ? 'COMPLETED' : 'INTERESTED',
        },
      });
    }
  }, [visits, updateLeadMutation]);

  const addNote = useCallback((notePayload: { businessId?: string; content: string }) => {
    addNoteMutation.mutate(notePayload);
  }, [addNoteMutation]);

  return (
    <MarketMappingContext.Provider value={{
      stats, setStats,
      visits, setVisits,
      performance, setPerformance,
      maturity: apiInsights?.maturity || mockClusterMaturity,
      recommendations: apiInsights?.recommendations || mockRecommendations,
      notes,
      selectedVisit, setSelectedVisit,
      addVisits, saveCapture,
      missionPlans, addMissionPlan,
      missionHistory, archiveMissionPlan,
      addNote,
    }}>
      {children}
    </MarketMappingContext.Provider>
  );
}

