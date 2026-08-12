export type VisitStatus = 'NOT_YET' | 'VISITED' | 'CONTACTED' | 'INTERESTED' | 'NOT_INTERESTED' | 'CUSTOMER';

export type MissionHorizon = 'DAY' | 'WEEK' | 'MONTH';

export interface PlannedVisit {
  id: string;
  name: string;
  category: string;
  status: VisitStatus;
  isPlaceholder: boolean;
  address?: string;
  exactAddress?: string;
  phone?: string;
  ownerName?: string;
  contactPosition?: string;
  contactEmail?: string;
  horizon?: MissionHorizon;
  createdAt?: string;
  visitedAt?: string;
  updatedAt?: string;
  // Business Profile
  dailyCustomers?: string;
  businessSize?: string;
  // Opening
  openingHours?: string;
  openingDays?: string[];
  // GPS
  gpsLat?: string;
  gpsLng?: string;
  gpsAddress?: string;
  // Sales
  nextVisitDate?: string;
  nextVisitTime?: string;
  decisionMakerMet?: boolean;
  interested?: 'YES' | 'NO' | 'MAYBE';
  demoDone?: boolean;
  visitNotes?: string;
  isAnchor?: boolean;
}

export const BUSINESS_CATEGORIES = [
  'Supermarket / Grocery',
  'Pharmacy',
  'Restaurant / Fast Food',
  'Retail / Clothing',
  'Electronics / Phone Accessories',
  'Beauty / Salon / Barbing',
  'Fuel / Gas Station',
  'Hotel / Lodge',
  'School / Training Center',
  'Hospital / Clinic',
  'Bakery / Confectionery',
  'Water / Pure Water',
  'POS / Bureau de Change',
  'Printing / Cyber Cafe',
  'Auto / Mechanic',
  'Construction / Building Materials',
  'Agriculture / Farm Supplies',
  'Fashion / Tailoring',
  'Entertainment / Event Center',
  'Professional Services',
  'Other',
];

export const DAILY_CUSTOMER_RANGES = [
  { value: 'LOW', label: 'Low (1–30)', min: 1, max: 30 },
  { value: 'MEDIUM', label: 'Medium (31–100)', min: 31, max: 100 },
  { value: 'HIGH', label: 'High (101–300)', min: 101, max: 300 },
  { value: 'VERY_HIGH', label: 'Very High (300+)', min: 300, max: Infinity },
];

export const OPENING_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export interface MissionPlan {
  id?: string;
  horizon: MissionHorizon;
  location: string;
  targetCount: number;
  createdAt: string;
  startDate?: string;
  endDate?: string;
}

export interface MissionHistoryEntry extends MissionPlan {
  achieved: number;
  status: 'ACHIEVED' | 'INCOMPLETE';
  archivedAt: string;
}

/**
 * Completeness score (0–19) based on every field across all tabs.
 * Each field contributes 1 point.
 */
export function getCompletenessScore(visit: PlannedVisit): number {
  let score = 0;

  if (visit.name && !visit.name.startsWith('Business ')) score++;
  if (visit.category && visit.category !== 'Unknown' && visit.category !== '') score++;
  if (visit.exactAddress) score++;
  if (visit.ownerName) score++;
  if (visit.phone) score++;
  if (visit.contactPosition) score++;
  if (visit.contactEmail) score++;
  if (visit.businessSize) score++;
  if (visit.dailyCustomers) score++;
  if (visit.openingHours) score++;
  if (visit.openingDays && visit.openingDays.length > 0) score++;
  if (visit.interested) score++;
  if (visit.visitNotes) score++;
  if (visit.status && visit.status !== 'NOT_YET') score++;
  if (visit.decisionMakerMet !== undefined) score++;
  if (visit.demoDone) score++;
  if (visit.nextVisitDate) score++;
  if (visit.nextVisitTime) score++;
  if (visit.gpsLat && visit.gpsLng) score++;

  return score;
}

export interface AffiliatePerformance {
  todayVisits: number;
  todayMeetings: number;
  todayCustomers: number;
  weekVisits: number;
  weekCustomers: number;
  monthVisits: number;
  monthRevenue: number;
  completionRate: number;
  targetVisits: number;
  dailyTarget: number;
  weeklyTarget: number;
  monthlyTarget: number;
  dailyProgress: number;
  weeklyProgress: number;
  monthlyProgress: number;
  proposalsSent?: number;
}

export interface TerritoryStats {
  country: string;
  state: string;
  city: string;
  area: string;
  clusterName: string;
  totalAssigned: number;
  plannedToday: number;
  visitedToday: number;
  customersAcquired: number;
  remainingInCluster: number;
  prospects: number;
  anchorBusinesses: number;
  marketPenetration: number;
  clusterCompletion: number;
  missionGoal: string;
  remainingTime: string;
  recommendedAction: string;
}

export interface ClusterMaturity {
  discovery: number;
  verification: number;
  sales: number;
  customers: number;
  partnerships: number;
  overall: number;
}

export interface AIRecommendation {
  id: string;
  type: 'PRIORITY_VISIT' | 'MISSING_CATEGORY' | 'UNTOUCHED_ANCHOR' | 'PARTNERSHIP';
  title: string;
  description: string;
  rating: number;
}

export interface BusinessNote {
  id: string;
  businessId: string;
  type: 'TEXT' | 'VOICE' | 'TASK' | 'REMINDER';
  content: string;
  createdAt: string;
  dueDate?: string;
  completed?: boolean;
}
