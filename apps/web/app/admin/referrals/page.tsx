'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api-client';
import { 
  Search, 
  Filter, 
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  MoreHorizontal,
  ArrowUpRight
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function ReferralsManagement() {
  const { showToast } = useToast();
  const [referralsList, setReferralsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        const data = await api.get('/affiliates/admin/referrals');
        setReferralsList(data || []);
      } catch (error) {
        console.error('Failed to fetch referrals:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReferrals();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by business or affiliate..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-white border border-slate-200 rounded-xl p-1">
              <button 
                onClick={() => showToast("Showing all referrals", "info")}
                className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-900 rounded-lg"
              >All</button>
              <button 
                onClick={() => showToast("Showing paid referrals", "info")}
                className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 rounded-lg"
              >Paid</button>
              <button 
                onClick={() => showToast("Showing pending referrals", "info")}
                className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 rounded-lg"
              >Pending</button>
            </div>
            <button 
              onClick={() => showToast("Calendar picker would open here", "info")}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-all"
            >
              <Calendar className="w-4 h-4" />
              Date Range
            </button>
          </div>
        </div>

        {/* Referrals Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 font-bold text-slate-600 text-sm">Business</th>
                  <th className="p-4 font-bold text-slate-600 text-sm">Referred By</th>
                  <th className="p-4 font-bold text-slate-600 text-sm">Plan</th>
                  <th className="p-4 font-bold text-slate-600 text-sm">Amount</th>
                  <th className="p-4 font-bold text-slate-600 text-sm">Date</th>
                  <th className="p-4 font-bold text-slate-600 text-sm">Status</th>
                  <th className="p-4 font-bold text-slate-600 text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {referralsList.map((ref, idx) => (
                  <motion.tr 
                    key={ref.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-slate-50/50 transition-all group"
                  >
                    <td className="p-4">
                      <div>
                        <p className="font-bold text-slate-900">{ref.referredBusiness?.name || ref.referredUserId || 'User Account'}</p>
                        <p className="text-xs text-slate-400 font-mono text-xs">{ref.id}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-[10px] text-blue-600 font-bold">
                          {ref.affiliate?.user?.firstName?.charAt(0) || 'A'}
                        </div>
                        <span className="text-sm font-medium text-slate-700">{ref.affiliate?.user?.firstName} {ref.affiliate?.user?.lastName}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600">{ref.referredBusiness?.plan || 'N/A'}</td>
                    <td className="p-4 text-sm text-slate-900 font-bold">₦{Number(ref.referredBusiness?.subscriptionAmount || 0).toLocaleString()}</td>
                    <td className="p-4 text-sm text-slate-600">{new Date(ref.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      <div className={cn(
                        "flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider w-fit",
                        ref.status === 'CONVERTED' ? "bg-green-100 text-green-600" : 
                        ref.status === 'PENDING' ? "bg-orange-100 text-orange-600" : "bg-red-100 text-red-600"
                      )}>
                        {ref.status === 'CONVERTED' && <CheckCircle2 className="w-3 h-3" />}
                        {ref.status === 'PENDING' && <Clock className="w-3 h-3" />}
                        {ref.status === 'FAILED' && <XCircle className="w-3 h-3" />}
                        {ref.status}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        <button 
                          onClick={() => showToast(`Redirecting to details`, "info")}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-all"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
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
