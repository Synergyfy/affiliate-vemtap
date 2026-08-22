'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api-client';
import { 
  Percent, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  Clock,
  MoreHorizontal
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import FilterBar from '@/components/admin/FilterBar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/toast';
import { useDebounce } from '@/hooks/use-debounce';

import { useCommissions, useUpdateCommissionStatus, useCommissionAdminStats, downloadCommissionsExport } from '@/services/useCommissionsHooks';
import { Loader2, Check, X, CreditCard } from 'lucide-react';
import { Commission, CommissionStatus } from '@/types/api';

export default function CommissionsManagement() {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(searchTerm, 500);
  
  const { data: commissionsResponse, isLoading: isCommissionsLoading } = useCommissions({ 
    limit: 20,
    search: debouncedSearch || undefined,
    status: statusFilter === 'All' ? undefined : statusFilter as any
  });
  const { data: adminStats } = useCommissionAdminStats();
  const updateStatus = useUpdateCommissionStatus();

  const commissionsList = commissionsResponse?.data || [];

  const handleStatusChange = async (id: string, status: CommissionStatus) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      showToast(`Commission marked as ${status}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update commission status', 'error');
    }
  };

  const trendFor = (pct: number | undefined) =>
    pct === undefined || pct === null
      ? null
      : { value: `${pct > 0 ? '+' : ''}${pct}%`, up: pct >= 0 };

  const totalTrend = trendFor(adminStats?.trends?.totalChangePercent);
  const paidTrend = trendFor(adminStats?.trends?.paidChangePercent);
  const pendingTrend = trendFor(adminStats?.trends?.pendingChangePercent);

  const commissionsStats = [
    { label: 'Total Commissions', value: `₦${Number(adminStats?.totalAmount ?? commissionsList.reduce((acc, curr) => acc + Number(curr.amount), 0)).toLocaleString()}`, icon: Percent, color: 'text-blue-600', bg: 'bg-blue-50', trend: totalTrend?.value ?? '—', trendUp: totalTrend?.up ?? true },
    { label: 'Paid Commissions', value: `₦${Number(adminStats?.paidAmount ?? commissionsList.filter(c => c.status === 'PAID').reduce((acc, curr) => acc + Number(curr.amount), 0)).toLocaleString()}`, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', trend: paidTrend?.value ?? '—', trendUp: paidTrend?.up ?? true },
    { label: 'Pending Approval', value: `₦${Number(adminStats?.pendingAmount ?? commissionsList.filter(c => c.status === 'PENDING').reduce((acc, curr) => acc + Number(curr.amount), 0)).toLocaleString()}`, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50', trend: pendingTrend?.value ?? '—', trendUp: pendingTrend?.up ?? false },
  ];

  if (isCommissionsLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-8">
        {/* Commission Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
          {commissionsStats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm"
            >
              <div className="flex justify-between items-start mb-2 sm:mb-4">
                <div className={cn("p-2 sm:p-3 rounded-xl sm:rounded-2xl", stat.bg)}>
                  <stat.icon className={cn("w-5 h-5 sm:w-6 sm:h-6", stat.color)} />
                </div>
                <div className={cn(
                  "flex items-center text-xs font-bold px-2 py-1 rounded-full",
                  stat.trendUp ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
                )}>
                  {stat.trendUp ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                  {stat.trend}
                </div>
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-500 mb-1 hidden sm:block">{stat.label}</p>
              <h3 className="text-lg sm:text-2xl font-bold text-slate-900">{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        {/* Table Section */}
        <div className="space-y-4">
          <FilterBar 
            searchQuery={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by affiliate or business..."
            activeFilter={statusFilter}
            onFilterChange={setStatusFilter}
            filterLabel="Status"
            filterOptions={[
              { label: 'All Status', value: 'All' },
              { label: 'Pending', value: 'PENDING' },
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Paid', value: 'PAID' }
            ]}
            extraActions={
              <button 
                onClick={() => downloadCommissionsExport()}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-all text-xs font-bold"
              >
                Export CSV
              </button>
            }
          />
        </div>

        {/* Mobile card layout */}
        <div className="sm:hidden divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {commissionsList.map((comm) => (
            <div key={comm.id} className="p-3 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">{comm.user?.fullName || 'Unknown'}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-900 font-bold">₦{Number(comm.amount).toLocaleString()}</span>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                    comm.status === 'PAID' ? "bg-green-100 text-green-600" : 
                    comm.status === 'PENDING' ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"
                  )}>
                    {comm.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {comm.status === 'PENDING' && (
                  <button
                    onClick={() => handleStatusChange(comm.id, 'PAID')}
                    className="px-2 py-1 bg-green-50 text-green-700 rounded-lg text-[10px] font-bold"
                  >
                    Pay
                  </button>
                )}
                <button 
                  onClick={() => showToast(`Commission details for ${comm.user?.fullName || 'affiliate'}`, "info")}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden sm:block bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto relative min-h-[400px]">
              {isCommissionsLoading && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              )}
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-3 sm:p-4 font-bold text-slate-600 text-xs sm:text-sm">Affiliate</th>
                    <th className="p-3 sm:p-4 font-bold text-slate-600 text-xs sm:text-sm hidden md:table-cell">Business Source</th>
                    <th className="p-3 sm:p-4 font-bold text-slate-600 text-xs sm:text-sm">Amount</th>
                    <th className="p-3 sm:p-4 font-bold text-slate-600 text-xs sm:text-sm hidden lg:table-cell">Type</th>
                    <th className="p-3 sm:p-4 font-bold text-slate-600 text-xs sm:text-sm">Status</th>
                    <th className="p-3 sm:p-4 font-bold text-slate-600 text-xs sm:text-sm text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {commissionsList.map((comm, idx) => (
                    <motion.tr 
                      key={comm.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-slate-50/50 transition-all group"
                    >
                      <td className="p-3 sm:p-4">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">{comm.user?.fullName || 'Unknown'}</span>
                      </td>
                      <td className="p-3 sm:p-4 hidden md:table-cell">
                        <span className="text-xs sm:text-sm text-slate-600">{comm.business?.businessName || 'Vemtap Subscription'}</span>
                      </td>
                      <td className="p-3 sm:p-4 text-xs sm:text-sm text-slate-900 font-bold">₦{Number(comm.amount).toLocaleString()}</td>
                      <td className="p-3 sm:p-4 hidden lg:table-cell">
                        <span className="text-[10px] sm:text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                          {comm.type === 'DIRECT' ? 'Direct Referral' : 'Network Bonus'}
                        </span>
                      </td>
                      <td className="p-3 sm:p-4">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider",
                          comm.status === 'PAID' ? "bg-green-100 text-green-600" : 
                          comm.status === 'PENDING' ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"
                        )}>
                          {comm.status}
                        </span>
                      </td>
                      <td className="p-3 sm:p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {comm.status === 'PENDING' && (
                            <button
                              onClick={() => handleStatusChange(comm.id, 'PAID')}
                              className="px-2 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-bold"
                            >
                              <span className="hidden sm:inline">Approve & Pay</span>
                              <span className="sm:hidden">Pay</span>
                            </button>
                          )}
                          <button 
                            onClick={() => showToast(`Commission details for ${comm.user?.fullName || 'affiliate'}`, "info")}
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
