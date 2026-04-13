'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { api } from '@/lib/api-client';
import { 
  Percent, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  Clock,
  Filter,
  MoreHorizontal,
  Edit3,
  Check,
  Save,
  RotateCcw
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function CommissionsManagement() {
  const { showToast } = useToast();
  const [commissionsList, setCommissionsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [directRate, setDirectRate] = useState(20);
  const [indirectRate, setIndirectRate] = useState(5);
  const [duration, setDuration] = useState(3);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [commData, statsData] = await Promise.all([
          api.get('/affiliates/admin/commissions'),
          api.get('/affiliates/admin/stats')
        ]);
        setCommissionsList(commData || []);
        // stats might contain settings or I can fetch settings specifically
      } catch (error) {
        console.error('Failed to fetch commissions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUpdateRules = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch('/affiliates/admin/settings', { 
        directRate: Number(directRate), 
        indirectRate: Number(indirectRate) 
      });
      showToast("Global commission rules updated successfully.", "success");
    } catch (error) {
      showToast("Failed to update commission rules.", "error");
    }
  };

  const commissionsStats = [
    { label: 'Total Commissions', value: `₦${commissionsList.reduce((acc, curr) => acc + Number(curr.amount), 0).toLocaleString()}`, icon: Percent, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+12%', trendUp: true },
    { label: 'Paid Commissions', value: `₦${commissionsList.filter(c => c.status === 'PAID').reduce((acc, curr) => acc + Number(curr.amount), 0).toLocaleString()}`, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', trend: '+8%', trendUp: true },
    { label: 'Pending Approval', value: `₦${commissionsList.filter(c => c.status === 'PENDING').reduce((acc, curr) => acc + Number(curr.amount), 0).toLocaleString()}`, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50', trend: '-2%', trendUp: false },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Commission Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {commissionsStats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={cn("p-3 rounded-2xl", stat.bg)}>
                  <stat.icon className={cn("w-6 h-6", stat.color)} />
                </div>
                <div className={cn(
                  "flex items-center text-xs font-bold px-2 py-1 rounded-full",
                  stat.trendUp ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
                )}>
                  {stat.trendUp ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                  {stat.trend}
                </div>
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        {/* Global Configuration Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm shadow-blue-600/5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -translate-y-16 translate-x-16"></div>
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Percent className="w-5 h-5 text-blue-600" />
                Commission Rules
              </h3>
              <p className="text-sm text-slate-500 font-medium">Configure how much affiliates earn from business subscriptions</p>
            </div>

            <form onSubmit={handleUpdateRules} className="flex flex-wrap items-end gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Direct (%)</label>
                <div className="relative w-24">
                  <input 
                    type="number" 
                    value={directRate}
                    onChange={(e) => setDirectRate(Number(e.target.value))}
                    className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Indirect (%)</label>
                <div className="relative w-24">
                  <input 
                    type="number" 
                    value={indirectRate}
                    onChange={(e) => setIndirectRate(Number(e.target.value))}
                    className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Duration (Times)</label>
                <div className="relative w-32">
                  <input 
                    type="number" 
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => { setDirectRate(20); setIndirectRate(5); }}
                  className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 hover:text-slate-600 transition-all"
                  title="Reset to defaults"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                <button 
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                >
                  <Save className="w-4 h-4" />
                  Update
                </button>
              </div>
            </form>
          </div>
        </motion.div>

        {/* Table Section */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-slate-900">Commission History</h2>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => showToast("Filters updated", "info")}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-all"
              >
                <Filter className="w-4 h-4" />
                Filter
              </button>
              <button 
                onClick={() => showToast("Exporting commissions to CSV...", "info")}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-all"
              >
                Export CSV
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-4 font-bold text-slate-600 text-sm">Affiliate</th>
                    <th className="p-4 font-bold text-slate-600 text-sm">Business Source</th>
                    <th className="p-4 font-bold text-slate-600 text-sm">Amount</th>
                    <th className="p-4 font-bold text-slate-600 text-sm">Type</th>
                    <th className="p-4 font-bold text-slate-600 text-sm">Status</th>
                    <th className="p-4 font-bold text-slate-600 text-sm text-right">Actions</th>
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
                      <td className="p-4">
                        <span className="font-bold text-slate-900">{comm.affiliate?.user?.firstName} {comm.affiliate?.user?.lastName}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-slate-600">{comm.referredBusiness?.name || 'Vemtap Subscription'}</span>
                      </td>
                      <td className="p-4 text-sm text-slate-900 font-bold">₦{Number(comm.amount).toLocaleString()}</td>
                      <td className="p-4">
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                          {comm.description || 'Commission'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider",
                          comm.status === 'PAID' ? "bg-green-100 text-green-600" : 
                          comm.status === 'APPROVED' ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-600"
                        )}>
                          {comm.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2 transition-opacity">
                          <button 
                            onClick={() => showToast("Adjusting...", "info")}
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
      </div>
    </AdminLayout>
  );
}
