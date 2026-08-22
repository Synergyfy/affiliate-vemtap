'use client';

import { motion } from 'framer-motion';
import { 
  Users, 
  Briefcase, 
  Wallet, 
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ShieldAlert,
  ShieldCheck,
  Clock
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/toast';
import { useRouter } from 'next/navigation';

import { useAdminStats, useUpdateWithdrawalStatus } from '@/services/useAdminHooks';
import { useWithdrawals } from '@/services/useAdminHooks';
import { useFraudAlerts } from '@/services/useFraudHooks';
import { Loader2 } from 'lucide-react';

export default function AdminOverview() {
  const { showToast } = useToast();
  const router = useRouter();
  
  const { data: stats, isLoading: isStatsLoading, isError: isStatsError, refetch: refetchStats } = useAdminStats();
  const { data: withdrawalsResponse, isLoading: isWithdrawalsLoading, isError: isWithdrawalsError, refetch: refetchWithdrawals } = useWithdrawals({ limit: 5 });
  const { data: fraudResponse, isLoading: isFraudLoading, isError: isFraudError, refetch: refetchFraud } = useFraudAlerts({ limit: 5 });
  const updateWithdrawal = useUpdateWithdrawalStatus();

  const adminStats = [
    { 
      name: 'Total Affiliates', 
      value: stats?.totalAffiliates?.toString() || '0', 
      growth: stats?.totalAffiliatesGrowth || 0,
      icon: Users, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50' 
    },
    { 
      name: 'Active Affiliates', 
      value: stats?.activeAffiliates?.toString() || '0', 
      icon: ShieldCheck, 
      color: 'text-green-600', 
      bg: 'bg-green-50' 
    },
    { 
      name: 'Total Revenue', 
      value: `₦${Number(stats?.totalRevenue || 0).toLocaleString()}`, 
      growth: stats?.totalRevenueGrowth || 0,
      icon: TrendingUp, 
      color: 'text-purple-600', 
      bg: 'bg-purple-50' 
    },
    { 
      name: 'Commissions Paid', 
      value: `₦${Number(stats?.commissionsPaid || 0).toLocaleString()}`, 
      growth: stats?.commissionsTrendPercentage || 0,
      icon: Wallet, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50' 
    },
    { 
      name: 'Pending Payouts', 
      value: `₦${Number(stats?.pendingPayouts || 0).toLocaleString()}`, 
      icon: Clock, 
      color: 'text-orange-600', 
      bg: 'bg-orange-50' 
    },
    { 
      name: 'Fraud Alerts', 
      value: stats?.fraudAlerts?.toString() || '0', 
      icon: AlertTriangle, 
      color: 'text-red-600', 
      bg: 'bg-red-50' 
    },
  ];

  const handleApprove = async (id: string, name: string) => {
    try {
      await updateWithdrawal.mutateAsync({ id, status: 'PAID' });
      showToast(`Withdrawal for ${name} has been processed.`, 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to approve withdrawal.', 'error');
    }
  };

  if (isStatsLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
        </div>
      </AdminLayout>
    );
  }

  if (isStatsError || !stats) {
    return <AdminLayout><div className="flex flex-col items-center justify-center h-64 gap-3"><AlertTriangle className="w-8 h-8 text-red-500" /><p className="text-sm font-medium text-slate-600">Unable to load dashboard statistics.</p><button onClick={() => refetchStats()} className="text-sm font-bold text-blue-600 hover:underline">Retry</button></div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
          {adminStats.map((stat, idx) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-3 sm:p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all cursor-default"
            >
              <div className="flex justify-between items-start mb-1 sm:mb-4">
                <div className={cn("p-1 sm:p-3 rounded-xl", stat.bg)}>
                  <stat.icon className={cn("w-4 h-4 sm:w-6 sm:h-6", stat.color)} />
                </div>
                {stat.growth !== undefined && (
                  <div className={cn(
                    "flex items-center text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full",
                    stat.growth >= 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
                  )}>
                    {stat.growth >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5 sm:mr-1" /> : <TrendingUp className="w-3 h-3 mr-0.5 sm:mr-1 rotate-180" />}
                    {Math.abs(stat.growth)}%
                  </div>
                )}
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-500">{stat.name}</p>
              <h3 className="text-base sm:text-2xl font-bold text-slate-900">{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Pending Withdrawals */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">Pending Withdrawals</h3>
              <button 
                onClick={() => router.push('/admin/withdrawals')}
                className="text-sm font-bold text-blue-600 hover:underline"
              >
                View All
              </button>
            </div>
            <div className="space-y-4">
              {isWithdrawalsLoading ? <Loader2 className="w-5 h-5 animate-spin text-slate-300 mx-auto" /> : isWithdrawalsError ? (
                <div className="text-center py-8"><p className="text-sm text-red-500">Unable to load withdrawals.</p><button onClick={() => refetchWithdrawals()} className="text-xs font-bold text-blue-600 hover:underline mt-2">Retry</button></div>
              ) : withdrawalsResponse?.data && withdrawalsResponse.data.length > 0 ? withdrawalsResponse.data.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold">
                      {item.user?.fullName?.charAt(0) || 'A'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{item.user?.fullName}</p>
                      <p className="text-xs text-slate-500">{item.bankName || 'Bank'} • {new Date(item.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">₦{Number(item.amount || 0).toLocaleString()}</p>
                    <button 
                      onClick={() => handleApprove(item.id, item.user?.fullName || 'User')}
                      className="text-[10px] font-bold text-blue-600 uppercase tracking-wider hover:underline"
                    >
                      {updateWithdrawal.isPending && updateWithdrawal.variables?.id === item.id ? 'Processing...' : 'Approve'}
                    </button>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-slate-400 text-center py-8">No pending withdrawals.</p>
              )}
            </div>
          </div>

          {/* Fraud Monitor */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">Fraud Monitor</h3>
              <button 
                onClick={() => router.push('/admin/fraud')}
                className="flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full hover:bg-red-100 transition-colors"
              >
                <ShieldAlert className="w-3 h-3" />
                High Risk
              </button>
            </div>
            <div className="space-y-4">
              {isFraudLoading ? <Loader2 className="w-5 h-5 animate-spin text-slate-300 mx-auto" /> : isFraudError ? (
                <div className="text-center py-8"><p className="text-sm text-red-500">Unable to load fraud alerts.</p><button onClick={() => refetchFraud()} className="text-xs font-bold text-blue-600 hover:underline mt-2">Retry</button></div>
              ) : fraudResponse?.data && fraudResponse.data.length > 0 ? fraudResponse.data.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{item.user?.fullName || 'Unknown'}</p>
                      <p className="text-xs text-slate-500">{item.description || 'Suspicious activity'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider",
                      item.severity === 'HIGH' ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                    )}>
                      {item.severity}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">{new Date(item.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-slate-400 text-center py-8">No fraud alerts detected.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
