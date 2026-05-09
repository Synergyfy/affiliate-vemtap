'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api-client';
import { 
  Wallet, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Banknote,
  MoreHorizontal,
  Check,
  X,
  CreditCard,
  Zap,
  Loader2
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/toast';

import { useAdminStats } from '@/services/useAdminHooks';

export default function WithdrawalsManagement() {
  const { showToast } = useToast();
  const [withdrawalsList, setWithdrawalsList] = useState<any[]>([]);
  const { data: stats, isLoading: isStatsLoading } = useAdminStats();
  const [loading, setLoading] = useState(true);
  const [processingBulk, setProcessingBulk] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/withdrawals?limit=50');
        setWithdrawalsList(response?.data || []);
      } catch (error) {
        console.error('Failed to fetch withdrawals data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const response = await api.get('/withdrawals?limit=50');
      setWithdrawalsList(response?.data || []);
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  };

  const handleBulkTrigger = async () => {
    if (!confirm('Are you sure you want to trigger bulk payouts? This will process all eligible pending earnings for verified affiliates.')) return;
    
    setProcessingBulk(true);
    try {
      const response = await api.post('/withdrawals/bulk-trigger');
      showToast(`Bulk processing complete: ${response.successCount} successful payouts.`, 'success');
      fetchWithdrawals();
    } catch (error) {
      showToast('Failed to trigger bulk payouts.', 'error');
    } finally {
      setProcessingBulk(false);
    }
  };

  const handleProcess = async (id: string, name: string, status: string) => {
    try {
      await api.patch(`/withdrawals/${id}/status`, { status });
      showToast(`Withdrawal for ${name} has been ${status.toLowerCase()}.`, 'success');
      fetchWithdrawals();
    } catch (error) {
      showToast(`Failed to ${status.toLowerCase()} withdrawal.`, 'error');
    }
  };

  const withdrawalStats = [
    { label: 'Total Payouts', value: `₦${stats?.completedPayouts?.toLocaleString() || '0'}`, icon: Banknote, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending Request', value: `₦${stats?.pendingPayouts?.toLocaleString() || '0'}`, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Approved', value: `₦${stats?.approvedPayouts?.toLocaleString() || '0'}`, icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Completed', value: `₦${stats?.completedPayouts?.toLocaleString() || '0'}`, icon: CreditCard, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Withdrawal Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {withdrawalStats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"
            >
              <div className={cn("p-3 rounded-2xl w-fit mb-4", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        {/* Withdrawals Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-slate-900">Withdrawal Requests</h3>
            <div className="flex items-center gap-3">
              <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1">
                <button 
                  onClick={() => showToast("Showing all requests", "info")}
                  className="px-3 py-1.5 text-xs font-bold bg-white text-slate-900 rounded-lg shadow-sm"
                >All</button>
                <button 
                  onClick={() => showToast("Showing pending requests", "info")}
                  className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 rounded-lg"
                >Pending</button>
                <button 
                  onClick={() => showToast("Showing approved requests", "info")}
                  className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 rounded-lg"
                >Approved</button>
              </div>
              <button 
                onClick={handleBulkTrigger}
                disabled={processingBulk}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50"
              >
                {processingBulk ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                Trigger Bulk Payouts
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 font-bold text-slate-600 text-sm">Affiliate</th>
                  <th className="p-4 font-bold text-slate-600 text-sm">Amount</th>
                  <th className="p-4 font-bold text-slate-600 text-sm">Bank Details</th>
                  <th className="p-4 font-bold text-slate-600 text-sm">Status</th>
                  <th className="p-4 font-bold text-slate-600 text-sm">Requested</th>
                  <th className="p-4 font-bold text-slate-600 text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {withdrawalsList.map((wth, idx) => (
                  <motion.tr 
                    key={wth.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-slate-50/50 transition-all group"
                  >
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{wth.user?.fullName || 'User'}</p>
                      <p className="text-xs text-slate-400 font-mono text-xs">{wth.id}</p>
                    </td>
                    <td className="p-4 text-sm text-slate-900 font-bold">₦{Number(wth.amount).toLocaleString()}</td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-slate-700">{wth.bankName || 'Bank'}</p>
                      <p className="text-xs text-slate-500">{wth.accountNumber || 'Acc Number'}</p>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider",
                        wth.status === 'PAID' ? "bg-green-100 text-green-600" : 
                        wth.status === 'APPROVED' ? "bg-blue-100 text-blue-600" : 
                        wth.status === 'REJECTED' ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
                      )}>
                        {wth.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-600">{new Date(wth.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        {wth.status === 'PENDING' && (
                          <>
                            <button 
                              onClick={() => handleProcess(wth.id, wth.user?.fullName, 'APPROVED')}
                              className="p-2 hover:bg-green-50 rounded-lg text-slate-400 hover:text-green-600 transition-all"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleProcess(wth.id, wth.user?.fullName, 'REJECTED')}
                              className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-all"
                              title="Reject"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {wth.status === 'APPROVED' && (
                          <button 
                            onClick={() => handleProcess(wth.id, wth.user?.fullName, 'PAID')}
                            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-all"
                          >
                            Mark as Paid
                          </button>
                        )}
                        <button 
                          onClick={() => showToast("More options", "info")}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
