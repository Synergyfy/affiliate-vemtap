'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { PlannedVisit, TerritoryStats, ClusterMaturity, AIRecommendation, AffiliatePerformance, BusinessNote, MissionPlan, MissionHistoryEntry } from '@/types/affiliate-market-mapping';
import { 
  useMarketMappingTerritory, 
  useMarketMappingPlans, 
  useCreateMissionPlan, 
  useMarketMappingNotes, 
  useAddMarketMappingNote,
  useClusterInsights,
  useMarketMappingVisits,
  useCreateMarketMappingVisit,
  useUpdateMarketMappingVisit,
  useMarketMappingPerformance,
  useMarketMappingHistory,
  useUpdateMissionPlan,
} from '@/services/useMarketMappingHooks';

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
  addVisits: (newVisits: PlannedVisit[], onCreated?: (tempId: string, created: PlannedVisit) => void) => void;
  saveCapture: (updatedVisit: PlannedVisit) => void;
  missionPlans: MissionPlan[];
  addMissionPlan: (plan: MissionPlan) => void;
  missionHistory: MissionHistoryEntry[];
  archiveMissionPlan: (entry: MissionHistoryEntry) => void;
  addNote?: (note: { businessId?: string; content: string }) => void;
}

const emptyStats: TerritoryStats = { country: '', state: '', city: '', area: '', clusterName: '', totalAssigned: 0, plannedToday: 0, visitedToday: 0, customersAcquired: 0, remainingInCluster: 0, prospects: 0, anchorBusinesses: 0, marketPenetration: 0, clusterCompletion: 0, missionGoal: '', remainingTime: '', recommendedAction: '' };
const emptyPerformance: AffiliatePerformance = { todayVisits: 0, todayMeetings: 0, todayCustomers: 0, weekVisits: 0, weekCustomers: 0, monthVisits: 0, monthRevenue: 0, completionRate: 0, targetVisits: 0, dailyTarget: 0, weeklyTarget: 0, monthlyTarget: 0, dailyProgress: 0, weeklyProgress: 0, monthlyProgress: 0 };
const emptyMaturity: ClusterMaturity = { discovery: 0, verification: 0, sales: 0, customers: 0, partnerships: 0, overall: 0 };

const MarketMappingContext = createContext<MarketMappingContextType | undefined>(undefined);

function planDateKey(date?: string): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date).slice(0, 10);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function useMarketMapping() {
  const ctx = useContext(MarketMappingContext);
  if (!ctx) {
    return {
      stats: emptyStats,
      setStats: () => {},
      visits: [] as PlannedVisit[],
      setVisits: () => {},
      performance: emptyPerformance,
      setPerformance: () => {},
      maturity: emptyMaturity,
      recommendations: [] as AIRecommendation[],
      notes: [] as BusinessNote[],
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
  const { data: apiVisits } = useMarketMappingVisits();
  const { data: apiPerformance } = useMarketMappingPerformance();
  const { data: apiHistory } = useMarketMappingHistory();

  const createPlanMutation = useCreateMissionPlan();
  const addNoteMutation = useAddMarketMappingNote();
  const createVisitMutation = useCreateMarketMappingVisit();
  const updateVisitMutation = useUpdateMarketMappingVisit();
  const updatePlanMutation = useUpdateMissionPlan();

  const [stats, setStats] = useState<TerritoryStats>(emptyStats);
  const [visits, setVisits] = useState<PlannedVisit[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<PlannedVisit | null>(null);

  const [performance, setPerformance] = useState<AffiliatePerformance>(emptyPerformance);
  const [missionPlans, setMissionPlans] = useState<MissionPlan[]>([]);
  const [missionHistory, setMissionHistory] = useState<MissionHistoryEntry[]>([]);
  const [notes, setNotes] = useState<BusinessNote[]>([]);

  // Sync Territory Stats from Backend
  useEffect(() => {
    if (territoryData && typeof territoryData === 'object') {
      setStats(prev => ({
        ...prev,
        country: territoryData.country,
        state: territoryData.state,
        city: territoryData.city,
        area: territoryData.area,
        clusterName: territoryData.cluster,
        totalAssigned: territoryData.totalAssigned,
        plannedToday: territoryData.plannedToday,
        visitedToday: territoryData.visitedToday,
        customersAcquired: territoryData.customersAcquired,
        prospects: territoryData.prospects,
        anchorBusinesses: territoryData.anchors,
        remainingInCluster: territoryData.remainingInCluster,
        marketPenetration: territoryData.marketPenetration,
        clusterCompletion: territoryData.clusterCompletion,
      }));
    }
  }, [territoryData]);

  // Sync Mission Plans from Backend
  useEffect(() => {
    if (Array.isArray(apiPlans)) {
      const formatted: MissionPlan[] = apiPlans.map((p) => ({
        id: String(p.id),
        horizon: (p.endDate && new Date(String(p.endDate)).getTime() - new Date(String(p.startDate || p.createdAt)).getTime() > 86400000 ? 'WEEK' : 'DAY') as MissionPlan['horizon'],
        location: String(p.locationCluster || 'Assigned Cluster'),
        targetCount: Number(p.targetVisits || 0),
        createdAt: p.createdAt ? new Date(String(p.createdAt)).toISOString() : new Date().toISOString(),
        startDate: p.startDate ? String(p.startDate) : undefined,
        endDate: p.endDate ? String(p.endDate) : undefined,
      }));

      // Deduplicate so there is at most one plan per day (keeping latest)
      const dayPlanMap = new Map<string, MissionPlan>();
      const nonDayPlans: MissionPlan[] = [];
      formatted.forEach((plan) => {
        if (plan.horizon === 'DAY') {
          const key = planDateKey(plan.startDate || plan.createdAt);
          if (key && !dayPlanMap.has(key)) {
            dayPlanMap.set(key, plan);
          }
        } else {
          nonDayPlans.push(plan);
        }
      });
      const uniquePlans = [...Array.from(dayPlanMap.values()), ...nonDayPlans];
      setMissionPlans(uniquePlans);

      const today = new Date();
      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const dayPlan = uniquePlans.find(
        p => p.horizon === 'DAY' && planDateKey(p.startDate || p.createdAt) === todayKey
      );
      if (dayPlan) {
        setStats(prev => ({ ...prev, plannedToday: dayPlan.targetCount }));
      }
    }
  }, [apiPlans]);

  // Sync Notes from Backend
  useEffect(() => {
    if (Array.isArray(apiNotes)) {
      const formatted: BusinessNote[] = apiNotes.map((n: any) => ({
        id: String(n?.id || ''),
        businessId: String(n?.businessId || n?.leadId || ''),
        type: 'TEXT' as const,
        content: n?.content || '',
        createdAt: n?.createdAt ? new Date(n.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
      }));
      setNotes(formatted);
    }
  }, [apiNotes]);

  // Sync persisted visits from the market-mapping API.
  useEffect(() => {
    if (Array.isArray(apiVisits)) setVisits(apiVisits);
  }, [apiVisits]);

  // visitedToday is authoritative from the backend (lead.visitedAt based). Only
  // fall back to a client-side count from visitedAt while it is not loaded yet;
  // edits/creates alone must never count as a visit.
  useEffect(() => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    const countToday = visits.filter((v: any) => {
      if (!v.visitedAt) return false;
      const visitedKey = new Date(v.visitedAt).toLocaleDateString('en-CA');
      return visitedKey === todayStr;
    }).length;

    setStats(prev => ({
      ...prev,
      visitedToday: countToday || prev.visitedToday,
    }));
  }, [visits]);

  useEffect(() => {
    if (!apiPerformance) return;
    setPerformance((prev) => ({
      ...prev,
      todayVisits: apiPerformance.dailyVisits ?? prev.todayVisits,
      weekVisits: apiPerformance.weeklyVisits ?? prev.weekVisits,
      monthVisits: apiPerformance.monthlyVisits ?? prev.monthVisits,
      todayMeetings: apiPerformance.meetingsCompleted ?? prev.todayMeetings,
      todayCustomers: apiPerformance.customersAcquired ?? prev.todayCustomers,
      completionRate: apiPerformance.conversionRatePercent ?? prev.completionRate,
      monthRevenue: apiPerformance.monthRevenue ?? prev.monthRevenue,
      dailyTarget: apiPerformance.dailyTarget ?? prev.dailyTarget,
      weeklyTarget: apiPerformance.weeklyTarget ?? prev.weeklyTarget,
      monthlyTarget: apiPerformance.monthlyTarget ?? prev.monthlyTarget,
      dailyProgress: apiPerformance.dailyProgress ?? prev.dailyProgress,
      weeklyProgress: apiPerformance.weeklyProgress ?? prev.weeklyProgress,
      monthlyProgress: apiPerformance.monthlyProgress ?? prev.monthlyProgress,
      proposalsSent: apiPerformance.proposalsSent ?? prev.proposalsSent,
    }));
  }, [apiPerformance]);

  useEffect(() => {
    if (!Array.isArray(apiHistory)) return;
    setMissionHistory(apiHistory.map((p) => ({ id: p.id, horizon: p.endDate ? 'WEEK' : 'DAY', location: p.locationCluster || '', targetCount: p.targetVisits || 0, createdAt: p.createdAt, startDate: p.startDate ? String(p.startDate) : undefined, endDate: p.endDate ? String(p.endDate) : undefined, achieved: (p.leads ?? []).filter((v) => v.status !== 'NOT_YET').length, status: p.status === 'COMPLETED' ? 'ACHIEVED' : 'INCOMPLETE', archivedAt: p.updatedAt || p.createdAt })) as MissionHistoryEntry[]);
  }, [apiHistory]);

  const addMissionPlan = useCallback((plan: MissionPlan) => {
    setMissionPlans(prev => {
      const others = prev.filter(p => !(p.horizon === plan.horizon && planDateKey(p.startDate) === planDateKey(plan.startDate)));
      return [...others, plan];
    });
    if (plan.horizon === 'DAY') {
      const today = new Date();
      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      if (planDateKey(plan.startDate || plan.createdAt) === todayKey) {
        setStats(prev => ({ ...prev, plannedToday: plan.targetCount }));
      }
    }
    const payload = {
      targetVisits: plan.targetCount,
      targetLeads: plan.targetCount,
      targetConversions: 0,
      locationCluster: plan.location,
      startDate: plan.startDate || plan.createdAt,
      endDate: plan.endDate,
    };
    if (plan.id) {
      updatePlanMutation.mutate({ id: plan.id, ...payload });
    } else {
      createPlanMutation.mutate(payload, {
        onSuccess: (created: any) => {
          if (created?.id) {
            setMissionPlans((prev) =>
              prev.map((p) =>
                p.horizon === plan.horizon && planDateKey(p.startDate) === planDateKey(plan.startDate)
                  ? { ...p, id: String(created.id) }
                  : p
              )
            );
          }
        },
      });
    }
  }, [createPlanMutation, updatePlanMutation]);

  const archiveMissionPlan = useCallback((entry: MissionHistoryEntry) => {
    setMissionHistory(prev => [entry, ...prev]);
    if (entry.id) updatePlanMutation.mutate({ id: entry.id, status: entry.status === 'ACHIEVED' ? 'COMPLETED' : 'ARCHIVED' });
  }, [updatePlanMutation]);

  const isTempId = (id?: string) => Boolean(id && (id.startsWith('biz-') || id.startsWith('v-') || id.startsWith('exec-')));

  const addVisits = useCallback((newVisits: PlannedVisit[], onCreated?: (tempId: string, created: PlannedVisit) => void) => {
    setVisits(prev => [...prev, ...newVisits]);
    setStats(prev => ({
      ...prev,
      plannedToday: prev.plannedToday + newVisits.length,
    }));
    newVisits.forEach(({ id: tempId, ...visit }) => createVisitMutation.mutate(visit, {
      onSuccess: (created) => {
        setVisits((current) => current.map((item) => item.id === tempId ? created : item));
        setSelectedVisit((current) => (current?.id === tempId ? created : current));
        onCreated?.(tempId, created);
      },
    }));
  }, [createVisitMutation]);

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
    if (updatedVisit.id) {
      if (isTempId(updatedVisit.id)) {
        const { id: tempId, ...visitPayload } = updatedVisit;
        createVisitMutation.mutate(visitPayload, {
          onSuccess: (created) => {
            setVisits((current) => current.map((item) => (item.id === tempId || item.id === updatedVisit.id ? created : item)));
            setSelectedVisit((current) => (current?.id === tempId || current?.id === updatedVisit.id ? created : current));
          },
        });
      } else {
        updateVisitMutation.mutate(updatedVisit);
      }
    }
  }, [visits, updateVisitMutation, createVisitMutation]);

  const addNote = useCallback((notePayload: { businessId?: string; content: string }) => {
    const visit = visits.find((item) => item.id === notePayload.businessId);
    addNoteMutation.mutate({ ...notePayload, businessName: visit?.name || 'Market mapping visit' });
  }, [addNoteMutation, visits]);

  return (
    <MarketMappingContext.Provider value={{
      stats, setStats,
      visits, setVisits,
      performance, setPerformance,
       maturity: apiInsights?.maturity || emptyMaturity,
       recommendations: apiInsights?.recommendations || [],
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

