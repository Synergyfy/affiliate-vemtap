import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useState, useEffect } from 'react';
import {
  FieldMission,
  FieldBusiness,
  StartVisitPayload,
  CompleteVisitPayload,
  VisitStatusResponse,
  MissionProgress,
  FieldActivityTimelineEvent,
} from '@/types/field-activity';

const IS_MOCK = process.env.NEXT_PUBLIC_ADMIN_MOCK === 'true';

// Mock data for development - will be replaced by real API
const mockMission: FieldMission = {
  id: 'mission-1',
  name: 'Daily Mission - Banex Plaza',
  location: 'Banex Plaza, Wuse',
  targetCount: 20,
  horizon: 'DAY',
  businesses: [
    { id: 'b1', name: 'Grand Square Supermarket', category: 'Supermarket / Grocery', address: 'Banex Plaza, Block A', isAnchor: true, status: 'NOT_YET', dailyCustomers: 'VERY_HIGH', businessSize: 'LARGE' },
    { id: 'b2', name: 'Kingsley Hotel & Suites', category: 'Hotel / Lodge', address: 'Banex Plaza, Block C', isAnchor: true, status: 'NOT_YET', dailyCustomers: 'HIGH', businessSize: 'LARGE' },
    { id: 'b3', name: 'City Medical Center', category: 'Hospital / Clinic', address: 'Banex Plaza, Block D', isAnchor: true, status: 'NOT_YET', dailyCustomers: 'HIGH', businessSize: 'MEDIUM' },
    { id: 'b4', name: 'Bolla Filling Station', category: 'Fuel / Gas Station', address: 'Banex Plaza, East Gate', isAnchor: true, status: 'NOT_YET', dailyCustomers: 'VERY_HIGH', businessSize: 'LARGE' },
    { id: 'b5', name: 'Federal Training Institute', category: 'School / Training Center', address: 'Banex Plaza, Block E', isAnchor: true, status: 'NOT_YET', dailyCustomers: 'HIGH', businessSize: 'LARGE' },
    { id: 'b6', name: 'Banex Gourmet Restaurant', category: 'Restaurant / Fast Food', address: 'Banex Plaza, Block B', status: 'NOT_YET', dailyCustomers: 'HIGH', businessSize: 'MEDIUM' },
    { id: 'b7', name: 'TechHub Phone Accessories', category: 'Electronics / Phone Accessories', address: 'Banex Plaza, Block A', status: 'NOT_YET', dailyCustomers: 'MEDIUM', businessSize: 'SMALL' },
    { id: 'b8', name: 'Glow Beauty World', category: 'Beauty / Salon / Barbing', address: 'Banex Plaza, Block F', status: 'NOT_YET', dailyCustomers: 'MEDIUM', businessSize: 'SMALL' },
    { id: 'b9', name: 'QuickPrint Services', category: 'Printing / Cyber Cafe', address: 'Banex Plaza, Block C', status: 'NOT_YET', dailyCustomers: 'LOW', businessSize: 'SMALL' },
    { id: 'b10', name: 'Excel Motors', category: 'Auto / Mechanic', address: 'Banex Plaza, East Wing', status: 'NOT_YET', dailyCustomers: 'MEDIUM', businessSize: 'MEDIUM' },
    { id: 'b11', name: 'Fresh Bakes & More', category: 'Bakery / Confectionery', address: 'Banex Plaza, Block B', status: 'NOT_YET', dailyCustomers: 'MEDIUM', businessSize: 'SMALL' },
    { id: 'b12', name: 'Greenfield Farms', category: 'Agriculture / Farm Supplies', address: 'Banex Plaza, Block G', status: 'NOT_YET', dailyCustomers: 'LOW', businessSize: 'MEDIUM' },
    { id: 'b13', name: 'Placeholder 13', category: 'Unknown', address: 'Banex Plaza', status: 'NOT_YET', isPlaceholder: true },
    { id: 'b14', name: 'Placeholder 14', category: 'Unknown', address: 'Banex Plaza', status: 'NOT_YET', isPlaceholder: true },
    { id: 'b15', name: 'Placeholder 15', category: 'Unknown', address: 'Banex Plaza', status: 'NOT_YET', isPlaceholder: true },
    { id: 'b16', name: 'Placeholder 16', category: 'Unknown', address: 'Banex Plaza', status: 'NOT_YET', isPlaceholder: true },
    { id: 'b17', name: 'Placeholder 17', category: 'Unknown', address: 'Banex Plaza', status: 'NOT_YET', isPlaceholder: true },
    { id: 'b18', name: 'Placeholder 18', category: 'Unknown', address: 'Banex Plaza', status: 'NOT_YET', isPlaceholder: true },
    { id: 'b19', name: 'Placeholder 19', category: 'Unknown', address: 'Banex Plaza', status: 'NOT_YET', isPlaceholder: true },
    { id: 'b20', name: 'Placeholder 20', category: 'Unknown', address: 'Banex Plaza', status: 'NOT_YET', isPlaceholder: true },
  ],
};

const mockProgress: MissionProgress = {
  totalBusinesses: 20,
  visitedCount: 0,
  leadsCaptured: 0,
  interestedCount: 0,
  followUps: 0,
  conversions: 0,
  remaining: 20,
  percentComplete: 0,
};

const mockTimeline: FieldActivityTimelineEvent[] = [];

export function useActiveMission() {
  return useQuery<FieldMission | null>({
    queryKey: ['field-activity', 'active-mission'],
    queryFn: async () => {
      if (IS_MOCK) return mockMission;
      const { data } = await api.get('/field-activity/mission/active');
      return data;
    },
    refetchInterval: 30000,
  });
}

export function useMissionProgress(missionId: string | undefined) {
  return useQuery<MissionProgress>({
    queryKey: ['field-activity', 'progress', missionId],
    queryFn: async () => {
      if (IS_MOCK) return mockProgress;
      const { data } = await api.get(`/field-activity/mission/${missionId}/progress`);
      return data;
    },
    enabled: !!missionId,
    refetchInterval: 30000,
  });
}

export function useTimeline(missionId: string | undefined) {
  return useQuery<FieldActivityTimelineEvent[]>({
    queryKey: ['field-activity', 'timeline', missionId],
    queryFn: async () => {
      if (IS_MOCK) return mockTimeline;
      const { data } = await api.get(`/field-activity/mission/${missionId}/timeline`);
      return data;
    },
    enabled: !!missionId,
    refetchInterval: 60000,
  });
}

export function useStartVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: StartVisitPayload) => {
      if (IS_MOCK) {
        await new Promise(r => setTimeout(r, 500));
        return { visitId: `visit-${Date.now()}` };
      }
      const { data } = await api.post('/field-activity/visit/start', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-activity'] });
    },
  });
}

export function useCompleteVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CompleteVisitPayload) => {
      if (IS_MOCK) {
        await new Promise(r => setTimeout(r, 500));
        return { visitId: payload.visitId, transition: null };
      }
      const { data } = await api.post('/field-activity/visit/complete', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-activity'] });
    },
  });
}

export function useVisitStatus(visitId: string | undefined) {
  return useQuery<VisitStatusResponse>({
    queryKey: ['field-activity', 'visit-status', visitId],
    queryFn: async () => {
      if (IS_MOCK) {
        return {
          visitId: visitId || '',
          business: mockMission.businesses[0],
          mission: mockMission,
          progress: mockProgress,
        };
      }
      const { data } = await api.get(`/field-activity/visit/${visitId}/status`);
      return data;
    },
    enabled: !!visitId,
    refetchInterval: 10000,
  });
}

export function useSubmitTransitionExplanation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ visitId, explanation }: { visitId: string; explanation: { reason: string; notes?: string } }) => {
      if (IS_MOCK) {
        await new Promise(r => setTimeout(r, 500));
        return;
      }
      await api.post(`/field-activity/visit/${visitId}/transition/explanation`, explanation);
    },
    onSuccess: (_, { visitId }) => {
      queryClient.invalidateQueries({ queryKey: ['field-activity', 'visit-status', visitId] });
    },
  });
}

// Helper to get GPS position
export function getCurrentPosition(): Promise<{ latitude: number; longitude: number; accuracy: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      }),
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('PERMISSION_DENIED'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('UNAVAILABLE'));
            break;
          case error.TIMEOUT:
            reject(new Error('TIMEOUT'));
            break;
          default:
            reject(new Error('UNKNOWN'));
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  });
}

export function useGpsPermission() {
  const [permissionState, setPermissionState] = useState<PermissionState>('prompt');

  useEffect(() => {
    if (!navigator.permissions) {
      setPermissionState('prompt');
      return;
    }

    navigator.permissions.query({ name: 'geolocation' }).then((permission) => {
      setPermissionState(permission.state);
      permission.onchange = () => setPermissionState(permission.state);
    });
  }, []);

  return permissionState;
}