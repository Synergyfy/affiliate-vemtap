export type Role = 'AFFILIATE' | 'ADMIN' | 'SUPER_ADMIN' | 'AGENT' | 'SUPERVISOR' | 'MANAGER';
export type BusinessStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
export type PlanType = 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
export type CommissionType = 'DIRECT' | 'INDIRECT' | 'BONUS';
export type CommissionStatus = 'PENDING' | 'PAID' | 'CANCELLED';
export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
export type FraudStatus = 'OPEN' | 'CONFIRMED' | 'RESOLVED';
export type NotificationType = 'SYSTEM' | 'COMMISSION' | 'REFERRAL' | 'SECURITY';
export type ProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
export type LeadPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type LeadStatus = 'NOT_YET' | 'VISITED' | 'CONTACTED' | 'INTERESTED' | 'NOT_INTERESTED' | 'CUSTOMER' | 'DEMO_SCHEDULED' | 'DEMO_DONE' | 'CONVERTED' | 'LOST' | (string & {});

/**
 * Unified lead — every business captured through the pipeline (market
 * mapping), entered directly, or via the sales pipeline. A lead is a "visit"
 * once it has been marked visited (visitedAt set / status != NOT_YET).
 */
export interface Lead {
  id: string;
  userId: string;
  user?: User & {
    supervisor?: { id: string; fullName: string; email?: string; phone?: string } | null;
    manager?: { id: string; fullName: string; email?: string; phone?: string } | null;
  };
  planId?: string | null;
  plan?: {
    id: string;
    locationCluster?: string | null;
    targetVisits?: number;
    targetLeads?: number;
    targetConversions?: number;
    status?: string;
    startDate?: string;
    endDate?: string | null;
    notes?: string | null;
  } | null;
  businessName: string;
  industry: string;
  businessAddress?: string | null;
  location?: string | null;
  phone?: string | null;
  email?: string | null;
  contactName?: string | null;
  contactRole?: string | null;
  source: string;
  priority?: string;
  status: LeadStatus;
  followUpDate?: string | null;
  comments?: string | null;
  assignedAgentId?: string | null;
  gpsLat?: string | null;
  gpsLng?: string | null;
  gpsAddress?: string | null;
  openingHours?: string | null;
  openingDays?: string[] | any;
  dailyCustomers?: string | null;
  businessSize?: string | null;
  horizon?: string | null;
  nextVisitDate?: string | null;
  nextVisitTime?: string | null;
  decisionMakerMet?: boolean | null;
  interested?: string | null;
  demoDone?: boolean | null;
  isAnchor?: boolean;
  isPlaceholder?: boolean;
  visitedAt?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  visited?: boolean;
  demos?: Array<{
    id: string;
    businessName: string;
    date: string;
    status: string;
    agentId: string;
    meetingUrl?: string | null;
    notes?: string | null;
  }>;
  salesPipelines?: Array<{
    id: string;
    pipelineStage: string;
    leadQuality: string;
    priority: string;
    notes?: string | null;
    followUps?: Array<{ id: string; scheduledAt: string; status: string; notes?: string | null }>;
    demos?: Array<{ id: string; scheduledAt: string; status: string; notes?: string | null }>;
  }>;
  marketMappingNotes?: Array<{
    id: string;
    content: string;
    followUpDate?: string | null;
    createdAt: string;
  }>;
}

export interface HarvestStats {
  totalHarvested: number;
  totalWithPhone: number;
  totalConverted: number;
  totalPipeline: number;
  statusBreakdown: Record<string, number>;
}

export interface HarvestResponse {
  data: Lead[];
  meta: Meta;
  stats: HarvestStats;
}

export interface HarvestFilterParams {
  search?: string;
  role?: string;
  userId?: string;
  status?: string;
  location?: string;
  hasPhone?: boolean;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface DuplicateLeadItem extends Lead {
  similarityPercentage: number;
  isPrimary: boolean;
  reasons: string[];
}

export interface DuplicateCluster {
  clusterId: string;
  primaryLeadId: string;
  primaryBusinessName: string;
  leadCount: number;
  maxSimilarity: number;
  matchReasons: string[];
  leads: DuplicateLeadItem[];
}

export interface DuplicateStats {
  totalClusters: number;
  totalDuplicateLeads: number;
  highConfidenceClusters: number;
  threshold: number;
}

export interface DuplicateLeadsResponse {
  clusters: DuplicateCluster[];
  stats: DuplicateStats;
}

export interface DuplicateFilterParams {
  threshold?: number;
  search?: string;
  limit?: number;
}

export interface LeadStats {
  total: number;
  visited: number;
  notVisited: number;
  byStatus: Record<string, number>;
}

export interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: Meta;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  status: 'ACTIVE' | 'SUSPENDED';
  referralCode: string;
  createdAt: string;
  totalEarnings: number;
  pendingEarnings?: number;
  referralCount?: number;
  avatar?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  nin?: string;
  bvn?: string;
  kycStatus?: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

  isTourCompleted?: boolean;
  driversLicense?: string;
  dailyLeadTarget?: number;
  monthlyConversionTarget?: number;
  reportingScore?: number;
  attendanceRate?: number;
  territoryId?: string;
  supervisorId?: string;
  managerId?: string;
  supervisor?: { id: string; fullName: string; email: string };
  manager?: { id: string; fullName: string; email: string };
  _count?: {
    referrals?: number;
    businesses?: number;
    leads?: number;
    marketMappingAssignments?: number;
  };
}

export interface MarketMappingVisit {
  id: string;
  userId: string;
  businessName: string;
  industry: string;
  status: string;
  businessAddress?: string;
  location?: string;
  phone?: string;
  contactName?: string;
  contactRole?: string;
  email?: string;
  gpsLat?: string;
  gpsLng?: string;
  gpsAddress?: string;
  comments?: string;
  visitedAt?: string;
  createdAt: string;
}

export interface AdminUserLeadsResponse {
  userId: string;
  stats: {
    totalLeads: number;
    potentialLeads: number;
    contactedLeads: number;
    interestedLeads: number;
    completedLeads: number;
    totalVisits: number;
    totalReferredBusinesses: number;
    activeBusinesses: number;
  };
  leads: Lead[];
  businesses: Business[];
  visits: Lead[];
}

export interface AdminPerformanceReport {
  userId: string;
  period: string;
  totalLeads: number;
  totalConversions: number;
  totalEarnings: number;
  dailyTarget?: number | null;
  monthlyTarget?: number | null;
  reportingScore: number;
  attendanceRate: number;
  leads: Lead[];
  businesses: Business[];
  commissions: Commission[];
}

export interface AdminLocationAssignment {
  id: string;
  clusterId: string;
  assignedAt: string;
  dailyLeadTarget: number;
  weeklyLeadTarget: number;
  monthlyConversionTarget: number;
  allowUserEdit?: boolean;
  duration?: string;
  expiresAt?: string | null;
  cluster: {
    id: string;
    name: string;
    type: string;
    parentId?: string | null;
    totalBusinesses?: number;
  };
}

export interface AdminUserLocations {
  id: string;
  territoryId?: string | null;
  marketMappingAssignments: AdminLocationAssignment[];
}

export interface AdminActivity {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  businessName?: string | null;
  createdAt: string;
}

export interface AdminTargetAdjustmentLog {
  id: string;
  managerId: string;
  memberId: string;
  oldDailyLeadTarget: number;
  newDailyLeadTarget: number;
  oldMonthlyConversionTarget: number;
  newMonthlyConversionTarget: number;
  reason?: string | null;
  createdAt: string;
}

export interface AdminAgreementSignature {
  id: string;
  agreementId: string;
  version: number;
  signedAt: string;
  agreement?: { id: string; title: string };
}

export interface AdminUserHistory {
  userId: string;
  activities: AdminActivity[];
  targetAdjustmentLogs: AdminTargetAdjustmentLog[];
  signatures: AdminAgreementSignature[];
}

export interface AdminTeamMember {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  status: 'ACTIVE' | 'SUSPENDED';
  dailyLeadTarget?: number | null;
  monthlyConversionTarget?: number | null;
  createdAt: string;
}

export interface AdminUserTeam {
  managerId: string;
  teamMembers: AdminTeamMember[];
}

export interface PlatformSettings {
  id: string;
  directCommissionRate: number;
  indirectCommissionRate: number;
  minWithdrawal: number;
  withdrawalFee: number;
  subAffiliateUnlockCount: number;
  fraudThresholdScore: number;
  earningDurationMonths: number;
  agreementTemplate?: string;
  agreementVersion?: number;
  updatedAt: string;
  reqAgentActiveDays?: number;
  reqAgentActiveBusinesses?: number;
  reqAgentMinReportingScore?: number;
  reqAgentMinAttendanceRate?: number;
  reqAffiliateActiveAgents?: number;
  reqAffiliateNetworkBusinesses?: number;
  reqSupervisorActiveAgents?: number;
  reqSupervisorActiveSupervisors?: number;
  reqSupervisorNetworkBusinesses?: number;
  dailyTarget?: number;
  weeklyTarget?: number;
  monthlyTarget?: number;
  recurringAgentCommission?: number;
  recurringAffiliateCommission?: number;
  recurringLineManagerCommission?: number;
  recurringDurationMonths?: number;
  recurringYear2Rate?: number;
  marketMappingConfig?: MarketMappingConfig;
}

export interface PipelineStatusConfig {
  id: string;
  name: string;
  color: string;
  bg: string;
  text: string;
}

export interface CustomerRangeConfig {
  value: string;
  label: string;
  min?: number;
  max?: number;
}

export interface BusinessSizeConfig {
  value: string;
  label: string;
  minStaff?: number;
  maxStaff?: number;
}

export interface MarketMappingConfig {
  businessCategories: string[];
  openingDays: string[];
  customerRanges: CustomerRangeConfig[];
  businessSizes: BusinessSizeConfig[];
  contactPositions: string[];
  pipelineStatuses: PipelineStatusConfig[];
  interestOptions: { value: string; label: string }[];
  planTypes: { value: string; label: string }[];
  faqs: { id: string; question: string; answer: string; category: string }[];
  ticketStatuses: { id: string; label: string; color: string; bg: string }[];
  businessStatuses: { id: string; label: string; color: string; bg: string }[];
  paymentStatuses: { id: string; label: string; color: string; bg: string }[];
  dailyTarget: number;
  minDailyTarget?: number;
  globalDailyTarget?: number;
  weeklyTarget: number;
  monthlyTarget: number;
  isTargetLocked?: boolean;
  targetSource?: 'CLUSTER_ASSIGNMENT' | 'USER_ADMIN_SET' | 'CUSTOM' | 'GLOBAL_DEFAULT';
  assignment?: {
    id?: string;
    clusterId: string;
    clusterName: string;
    allowUserEdit: boolean;
    dailyLeadTarget?: number;
    weeklyLeadTarget?: number;
    monthlyConversionTarget?: number;
    duration?: string;
    expiresAt?: string | null;
    assignedAt?: string;
  } | null;
  assignedCluster?: string;
}

export interface Agreement {
  agreementTemplate: string;
  agreementVersion: number;
}

export interface Business {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  planType: PlanType;
  status: BusinessStatus;
  subscriptionAmount: number;
  commissionRate: number;
  commissionAmount: number;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  category?: string;
  affiliateId: string;
  affiliate?: User;
}

export interface Commission {
  id: string;
  amount: number;
  type: CommissionType;
  status: CommissionStatus;
  description: string;
  createdAt: string;
  paidAt?: string;
  userId: string;
  businessId: string;
  subAffiliateId?: string;
  user?: User;
  business?: Business;
}

export interface Withdrawal {
  id: string;
  amount: number;
  fee?: number;
  netAmount?: number;
  status: WithdrawalStatus;
  bankName: string;
  accountNumber: string;
  accountName: string;
  adminNotes?: string;
  processedAt?: string;
  processedBy?: string;
  createdAt: string;
  userId: string;
  user?: User;
}

export interface FraudAlert {
  id: string;
  userId: string;
  type: string;
  severity: string;
  description: string;
  status: FraudStatus;
  createdAt: string;
  resolution?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  user?: User;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  user?: User;
}

export interface Quiz {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  audience?: string[];
  order: number;
}

export interface Scenario {
  title: string;
  situation: string;
  objection: string;
  idealResponse: string;
  options?: string[];
  correctAnswerIndex?: number;
  audience?: string[];
  order: number;
}

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  content: string;
  videoUrl?: string;
  pdfUrl?: string;
  order: number;
  category: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  quizzes?: Quiz[];
  scenarios?: Scenario[];
}

export interface AdminStats {
  totalAffiliates: number;
  activeAffiliates: number;
  totalRevenue: number;
  commissionsPaid: number;
  pendingPayouts: number;
  approvedPayouts: number;
  completedPayouts: number;
  fraudAlerts: number;
  commissionsTrendPercentage: number;
  totalRevenueGrowth: number;
  totalAffiliatesGrowth: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface AffiliateStats {
  totalEarnings: number;
  pendingEarnings: number;
  todayEarnings: number;
  todayClicks: number;
  currentLevel: string;
  activeReferrals: number;
  referralCount: number;
  totalClicks: number;
  referralSignupUrl: string;
  // Agent target metrics
  dailyLeadTarget: number;
  monthlyConversionTarget: number;
  isTargetLocked?: boolean;
  assignedCluster?: string | null;
  todayLeadsCount: number;
  weeklyLeadsCount: number;
  monthlyLeadsCount: number;
  monthlyConversionsCount: number;
  // Today's sales work stats
  todaySalesPipelineCount: number;
  todayMarketMappingCount: number;
  todayBusinessesAdded: number;
  todayVisitsCount: number;
  todayFollowUpsDue: number;
  todayDemosDue: number;
  todayConversions: number;
}

export interface AffiliateForecast {
  monthlyRecurringRevenue: number;
  activeBusinessCount: number;
  projectedEarnings: number;
}

export interface LeaderboardEntry {
  rank: number;
  fullName: string;
  totalEarnings: number;
  referralCount: number;
  trend?: 'up' | 'down' | 'stable';
  avatar?: string;
}

export interface NetworkStats {
  activeAgentsCount: number;
  newNetworkBusinessesCount: number;
  networkSize: number;
  isQualified: boolean;
  targetAgents: number;
  targetBusinesses: number;
}

export interface CustomAgreement {
  id: string;
  title: string;
  description: string;
  content: string;
  targetRoles: Role[];
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AgreementSignature {
  id: string;
  agreementId: string;
  agreement?: CustomAgreement;
  userId: string;
  user?: User;
  version: number;
  signedAt: string;
}

export interface AgreementStats {
  agreementId: string;
  title: string;
  description: string;
  version: number;
  isActive: boolean;
  createdAt: string;
  stats: {
    totalTargeted: number;
    totalSigned: number;
    totalPending: number;
    signedPercentage: number;
  };
  signatures: {
    userId: string;
    fullName: string;
    email: string;
    role: Role;
    signed: boolean;
    signedVersion: number | null;
    signedAt: string | null;
    isUpToDate: boolean;
  }[];
}

