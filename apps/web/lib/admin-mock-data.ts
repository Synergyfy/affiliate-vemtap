import { AdminStats, PaginatedResponse, Withdrawal, User, Business, FraudAlert, PlatformSettings } from '@/types/api';

export const mockAdminStats: AdminStats = {
  totalAffiliates: 124,
  activeAffiliates: 89,
  totalRevenue: 15450000,
  commissionsPaid: 3200000,
  pendingPayouts: 450000,
  approvedPayouts: 1200000,
  completedPayouts: 3200000,
  fraudAlerts: 2,
  commissionsTrendPercentage: 12.5,
  totalRevenueGrowth: 18.2,
  totalAffiliatesGrowth: 8.4,
};

export const mockWithdrawals: PaginatedResponse<Withdrawal> = {
  data: [
    {
      id: 'w-1',
      amount: 75000,
      status: 'PENDING',
      bankName: 'Guaranty Trust Bank',
      accountNumber: '0123456789',
      accountName: 'John Doe',
      createdAt: new Date().toISOString(),
      userId: 'u-1',
      user: {
        id: 'u-1',
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '+2348012345678',
        role: 'AFFILIATE',
        status: 'ACTIVE',
        referralCode: 'JOHNDOE1',
        createdAt: new Date().toISOString(),
        totalEarnings: 250000,
      },
    },
    {
      id: 'w-2',
      amount: 120000,
      status: 'PENDING',
      bankName: 'Access Bank',
      accountNumber: '9876543210',
      accountName: 'Jane Smith',
      createdAt: new Date().toISOString(),
      userId: 'u-2',
      user: {
        id: 'u-2',
        fullName: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+2348087654321',
        role: 'AFFILIATE',
        status: 'ACTIVE',
        referralCode: 'JANESMITH',
        createdAt: new Date().toISOString(),
        totalEarnings: 540000,
      },
    },
  ],
  meta: {
    total: 2,
    page: 1,
    limit: 5,
    totalPages: 1,
  },
};

export const mockFraudAlerts: PaginatedResponse<FraudAlert> = {
  data: [
    {
      id: 'f-1',
      userId: 'u-3',
      type: 'IP_REUSE',
      severity: 'HIGH',
      description: 'Multiple referral signups detected from identical IP address within 5 minutes.',
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      user: {
        id: 'u-3',
        fullName: 'Suspicious User',
        email: 'suspect@example.com',
        phone: '+2348000000000',
        role: 'AFFILIATE',
        status: 'SUSPENDED',
        referralCode: 'SUSPECT1',
        createdAt: new Date().toISOString(),
        totalEarnings: 0,
      },
    },
  ],
  meta: {
    total: 1,
    page: 1,
    limit: 5,
    totalPages: 1,
  },
};

export const mockUsers: PaginatedResponse<User> = {
  data: [
    {
      id: 'u-1',
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '+2348012345678',
      role: 'AFFILIATE',
      status: 'ACTIVE',
      referralCode: 'JOHNDOE1',
      createdAt: new Date().toISOString(),
      totalEarnings: 250000,
    },
    {
      id: 'admin-1',
      fullName: 'Admin User',
      email: 'admin@vemtap.com',
      phone: '+2348099999999',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      referralCode: 'ADMIN01',
      createdAt: new Date().toISOString(),
      totalEarnings: 0,
    },
  ],
  meta: {
    total: 2,
    page: 1,
    limit: 10,
    totalPages: 1,
  },
};

export const mockSettings: PlatformSettings = {
  id: 'settings-1',
  directCommissionRate: 15,
  indirectCommissionRate: 5,
  minWithdrawal: 5000,
  withdrawalFee: 100,
  subAffiliateUnlockCount: 3,
  fraudThresholdScore: 75,
  earningDurationMonths: 12,
  updatedAt: new Date().toISOString(),
};

export const mockBusinesses: PaginatedResponse<Business> = {
  data: [
    {
      id: 'b-1',
      businessName: 'Acme Supermarket',
      ownerName: 'Alice Johnson',
      email: 'alice@acme.com',
      phone: '+2348033333333',
      planType: 'PREMIUM',
      status: 'ACTIVE',
      subscriptionAmount: 50000,
      commissionRate: 15,
      commissionAmount: 7500,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      affiliateId: 'u-1',
    },
  ],
  meta: {
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
  },
};
