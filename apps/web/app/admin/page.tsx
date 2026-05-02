'use client';

import { useState, useEffect } from 'react';
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
import { api } from '@/lib/api-client';
import AdminLayout from '@/components/admin/AdminLayout';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function AdminOverview() {
  const { showToast } = useToast();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, withdrawalsData, fraudData] = await Promise.all([
          api.get('/affiliates/admin/stats'),
          api.get('/affiliates/admin/withdrawals?status=PENDING'),
          api.get('/affiliates/admin/fraud')
        ]);
        setStats(statsData);
        setPendingWithdrawals((withdrawalsData || []).slice(0, 5));
        setFraudAlerts((fraudData || []).slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const adminStats = [
    { name: 'Total Affiliates', value: stats?.activeAffiliates?.toString() || '0', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Active Subscriptions', value: stats?.totalReferrals?.toString() || '0', icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50' },
    { name: 'Total Revenue', value: `₦${stats?.totalRevenue?.toLocaleString() || '0'}`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
    { name: 'Commissions Paid', value: `₦${stats?.totalCommissionsPaid?.toLocaleString() || '0'}`, icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Pending Payouts', value: `₦${stats?.pendingPayouts?.toLocaleString() || '0'}`, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { name: 'Fraud Alerts', value: stats?.fraudAlerts?.toString() || '0', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  const handleApprove = async (id: string, name: string) => {
    try {
      await api.post(`/affiliates/admin/withdrawals/${id}/process`, { status: 'APPROVED' });
      showToast(`Withdrawal for ${name} has been approved.`, 'success');
      setPendingWithdrawals(prev => prev.filter(w => w.id !== id));
    } catch (error) {
      showToast('Failed to approve withdrawal.', 'error');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminStats.map((stat, idx) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all cursor-default"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={cn("p-3 rounded-xl", stat.bg)}>
                  <stat.icon className={cn("w-6 h-6", stat.color)} />
                </div>
                <div className="flex items-center text-xs font-bold px-2 py-1 rounded-full text-blue-600 bg-blue-50">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Live
                </div>
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">{stat.name}</p>
              <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
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
              {pendingWithdrawals.length > 0 ? pendingWithdrawals.map((item, idx) => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold">
                      {item.affiliate?.user?.firstName?.charAt(0) || 'A'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{item.affiliate?.user?.firstName} {item.affiliate?.user?.lastName}</p>
                      <p className="text-xs text-slate-500">{item.affiliate?.bankAccountDetails?.bank || 'Bank'} • {new Date(item.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">₦{item.amount?.toLocaleString()}</p>
                    <button 
                      onClick={() => handleApprove(item.id, item.affiliate?.user?.firstName)}
                      className="text-[10px] font-bold text-blue-600 uppercase tracking-wider hover:underline"
                    >
                      Approve
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
              {fraudAlerts.length > 0 ? fraudAlerts.map((item, idx) => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{item.user?.firstName} {item.user?.lastName}</p>
                      <p className="text-xs text-slate-500">{item.fraudReason || 'Suspicious activity'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider bg-red-100 text-red-600"
                    )}>
                      High
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">{new Date(item.updatedAt).toLocaleDateString()}</p>
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
