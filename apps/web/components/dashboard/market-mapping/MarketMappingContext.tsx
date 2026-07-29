'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { PlannedVisit, TerritoryStats, ClusterMaturity, AIRecommendation, AffiliatePerformance, BusinessNote, MissionPlan, MissionHistoryEntry } from '@/types/affiliate-market-mapping';
import { mockAffiliateStats, mockAffiliatePerformance, mockClusterMaturity, mockRecommendations, mockVisits, mockNotes } from '@/lib/affiliate-mock';

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
}

const MarketMappingContext = createContext<MarketMappingContextType | undefined>(undefined);

export function useMarketMapping() {
  const ctx = useContext(MarketMappingContext);
  if (!ctx) {
    // Return safe defaults when used outside the provider (e.g. businesses page)
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
  const [stats, setStats] = useState<TerritoryStats>(mockAffiliateStats);
  const [visits, setVisits] = useState<PlannedVisit[]>(mockVisits);
  const [selectedVisit, setSelectedVisit] = useState<PlannedVisit | null>(null);

  const [performance, setPerformance] = useState<AffiliatePerformance>(mockAffiliatePerformance);
  const [missionPlans, setMissionPlans] = useState<MissionPlan[]>([]);
  const [missionHistory, setMissionHistory] = useState<MissionHistoryEntry[]>([]);

  const addMissionPlan = useCallback((plan: MissionPlan) => {
    setMissionPlans(prev => {
      const filtered = prev.filter(p => p.horizon !== plan.horizon);
      return [...filtered, plan];
    });
  }, []);

  const archiveMissionPlan = useCallback((entry: MissionHistoryEntry) => {
    setMissionHistory(prev => [entry, ...prev]);
  }, []);

  const addVisits = useCallback((newVisits: PlannedVisit[]) => {
    setVisits(prev => [...prev, ...newVisits]);
    setStats(prev => ({
      ...prev,
      plannedToday: prev.plannedToday + newVisits.length,
    }));
  }, []);

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
  }, [visits]);

  return (
    <MarketMappingContext.Provider value={{
      stats, setStats,
      visits, setVisits,
      performance, setPerformance,
      maturity: mockClusterMaturity,
      recommendations: mockRecommendations,
      notes: mockNotes,
      selectedVisit, setSelectedVisit,
      addVisits, saveCapture,
      missionPlans, addMissionPlan,
      missionHistory, archiveMissionPlan,
    }}>
      {children}
    </MarketMappingContext.Provider>
  );
}
