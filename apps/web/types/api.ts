export type Role = 'AFFILIATE' | 'ADMIN' | 'SUPER_ADMIN';
export type BusinessStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
export type PlanType = 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
export type CommissionType = 'DIRECT' | 'INDIRECT' | 'BONUS';
export type CommissionStatus = 'PENDING' | 'PAID' | 'CANCELLED';
export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
export type FraudStatus = 'OPEN' | 'CONFIRMED' | 'RESOLVED';
export type NotificationType = 'SYSTEM' | 'COMMISSION' | 'REFERRAL' | 'SECURITY';
export type ProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
export type LeadPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type LeadStatus = 'POTENTIAL' | 'CONTACTED' | 'INTERESTED' | 'NOT_INTERESTED' | 'COMPLETED';

export interface Lead {
  id: string;
  businessName: string;
  industry: string;
  businessAddress?: string;
  location?: string;
  website?: string;
  contactName: string;
  contactRole?: string;
  phone: string;
  email?: string;
  source: string;
  otherSource?: string;
  priority: LeadPriority;
  status: LeadStatus;
  followUpDate?: string;
  comments?: string;
  affiliateId: string;
  assignedAgentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadStats {
  total: number;
  contacted: number;
  interested: number;
  potential: number;
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
  isManagerMode?: boolean;
  _count?: {
    referrals?: number;
    businesses?: number;
    leads?: number;
  };
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
  status: WithdrawalStatus;
  bankName: string;
  accountNumber: string;
  accountName: string;
  createdAt: string;
  processedAt?: string;
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
  order: number;
}

export interface Scenario {
  title: string;
  situation: string;
  objection: string;
  idealResponse: string;
  options?: string[];
  correctAnswerIndex?: number;
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
