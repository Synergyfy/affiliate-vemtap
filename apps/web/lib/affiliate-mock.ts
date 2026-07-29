import { 
  PlannedVisit, 
  TerritoryStats, 
  AffiliatePerformance, 
  ClusterMaturity, 
  AIRecommendation, 
  BusinessNote 
} from '@/types/affiliate-market-mapping';

export const mockAffiliateStats: TerritoryStats = {
  country: 'Nigeria',
  state: 'FCT',
  city: 'Abuja',
  area: 'Wuse',
  clusterName: 'Banex Plaza',
  totalAssigned: 186,
  plannedToday: 20,
  visitedToday: 18,
  customersAcquired: 24,
  remainingInCluster: 168,
  prospects: 162,
  anchorBusinesses: 5,
  marketPenetration: 13,
  clusterCompletion: 42,
  missionGoal: 'Map 20 businesses',
  remainingTime: '2 days',
  recommendedAction: "Visit the remaining electronics stores on the east side of the plaza, then schedule follow-up meetings with today's interested businesses."
};

export const mockAffiliatePerformance: AffiliatePerformance = {
  todayVisits: 18,
  todayMeetings: 4,
  todayCustomers: 2,
  weekVisits: 65,
  weekCustomers: 3,
  monthVisits: 45,
  monthRevenue: 150000,
  completionRate: 60,
  targetVisits: 30,
  
  dailyTarget: 20,
  weeklyTarget: 100,
  monthlyTarget: 20,
  
  dailyProgress: 3,
  weeklyProgress: 12,
  monthlyProgress: 45,
};

export const mockClusterMaturity: ClusterMaturity = {
  discovery: 100,
  verification: 92,
  sales: 65,
  customers: 40,
  partnerships: 18,
  overall: 56
};

export const mockRecommendations: AIRecommendation[] = [
  { id: 'r1', type: 'PRIORITY_VISIT', title: 'Banex Gourmet Restaurant', description: 'High traffic. Prime target for cross-promotion with nearby pharmacy.', rating: 5 },
  { id: 'r2', type: 'UNTOUCHED_ANCHOR', title: 'Grand Square Supermarket', description: 'Anchor business. Securing them opens up the entire northern wing.', rating: 5 },
  { id: 'r3', type: 'MISSING_CATEGORY', title: 'Logistics / Dispatch', description: 'No delivery services mapped yet. High demand from current customers.', rating: 4 },
];

export const mockVisits: PlannedVisit[] = [
  { id: 'v1', name: 'ABC Electronics', category: 'Retail', status: 'VISITED', isPlaceholder: false },
  { id: 'v2', name: 'HealthPlus Pharmacy', category: 'Pharmacy', status: 'INTERESTED', isPlaceholder: false },
  { id: 'v3', name: 'Elite Beauty Salon', category: 'Salon', status: 'NOT_YET', isPlaceholder: false },
  { id: 'v4', name: 'Business 4', category: 'Unknown', status: 'NOT_YET', isPlaceholder: true },
  { id: 'v5', name: 'Business 5', category: 'Unknown', status: 'NOT_YET', isPlaceholder: true },
];

export const mockNotes: BusinessNote[] = [
  { id: 'n1', businessId: 'v1', type: 'TEXT', content: 'Owner was busy, requested callback on Friday.', createdAt: '2026-07-28T10:00:00Z' },
  { id: 'n2', businessId: 'v2', type: 'TASK', content: 'Send updated pricing proposal', createdAt: '2026-07-28T11:00:00Z', dueDate: '2026-07-29', completed: false },
];
