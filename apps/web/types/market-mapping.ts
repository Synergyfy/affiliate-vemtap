export type BusinessStatus = 'PROSPECT' | 'MEETING' | 'NEGOTIATING' | 'CUSTOMER' | 'LOST';
export type BusinessSize = 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE';
export type PriorityScore = 'HIGH' | 'MEDIUM' | 'LOW';

export interface GeographicHierarchyNode {
  id: string;
  name: string;
  type: 'COUNTRY' | 'STATE' | 'CITY' | 'AREA' | 'CLUSTER';
  parentId?: string | null;
  childrenCount?: number;
  totalBusinesses?: number;
  totalCustomers?: number;
  totalProspects?: number;
  totalAnchors?: number;
  penetrationPercentage?: number;
  clusterStage?: number; // 1-10
}

export interface ExpansionStageInfo {
  stage: number;
  name: string;
  description: string;
  isCompleted: boolean;
  completedAt?: string;
}

export interface ClusterDetail {
  id: string;
  name: string;
  areaName: string;
  cityName: string;
  stateName: string;
  countryName: string;
  totalBusinesses: number;
  verifiedBusinesses: number;
  customersCount: number;
  prospectsCount: number;
  anchorBusinessesCount: number;
  assignedAffiliatesCount: number;
  penetrationPercentage: number;
  discoveryProgress: number; // %
  verificationProgress: number; // %
  salesContactProgress: number; // %
  partnershipsProgress: number; // %
  overallCompletion: number; // %
  currentStage: number; // 1 to 10
  nextRecommendedAction: string;
  assignedAffiliates: {
    id: string;
    fullName: string;
    avatar?: string;
    businessesAssigned: number;
    businessesVisited: number;
    customersClosed: number;
    performanceScore: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface MappedBusiness {
  id: string;
  name: string;
  category: string;
  industry: string;
  size: BusinessSize;
  status: BusinessStatus;
  isAnchor: boolean;
  anchorScore: number; // 1 - 100
  influenceScore: number; // 1 - 100
  isVerified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  ownerName: string;
  decisionMaker: string;
  phone: string;
  email?: string;
  website?: string;
  address: string;
  clusterId: string;
  clusterName: string;
  latitude: number;
  longitude: number;
  dailyCustomers: number;
  monthlyCustomers: number;
  openingHours?: string;
  staffCount?: number;
  assignedAffiliateId?: string;
  assignedAffiliateName?: string;
  priority: PriorityScore;
  lastVisit?: string;
  nextVisit?: string;
  notes?: string;
  documents?: {
    id: string;
    title: string;
    type: 'PHOTO' | 'BUSINESS_CARD' | 'PROPOSAL' | 'CONTRACT' | 'OTHER';
    url: string;
    uploadedAt: string;
  }[];
  nearbyPartnerships?: {
    businessId: string;
    businessName: string;
    category: string;
    synergyScore: number;
    description: string;
  }[];
  tasks?: {
    id: string;
    title: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    dueDate?: string;
    assignedAffiliateName?: string;
  }[];
}

export interface MarketMappingStats {
  commercialAreas: number;
  commercialClusters: number;
  businessesMapped: number;
  verifiedBusinesses: number;
  vemtapCustomers: number;
  prospects: number;
  anchorBusinesses: number;
  assignedAffiliates: number;
  averagePenetration: number;
  todayVisits: number;
  todayNewCustomers: number;
}
