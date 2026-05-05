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
  ArrowUpRight,
  Mail,
  Phone,
  User as UserIcon,
  X,
  MapPin,
  Briefcase
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import AdminLayout from '@/components/admin/AdminLayout';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function ReferralsManagement() {
  const { showToast } = useToast();
  const [referralsList, setReferralsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReferral, setSelectedReferral] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        const response = await api.get('/businesses?limit=50');
        setReferralsList(response?.data || []);
      } catch (error) {
        console.error('Failed to fetch referrals:', error);
        showToast("Failed to load referrals data.", "error");
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
                        <p className="font-bold text-slate-900">{ref.businessName || 'User Account'}</p>
                        <p className="text-xs text-slate-400 font-mono text-xs">{ref.id}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-[10px] text-blue-600 font-bold uppercase">
                          {ref.affiliate?.fullName?.charAt(0) || 'A'}
                        </div>
                        <span className="text-sm font-medium text-slate-700">{ref.affiliate?.fullName || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600">{ref.planType || 'N/A'}</td>
                    <td className="p-4 text-sm text-slate-900 font-bold">₦{Number(ref.subscriptionAmount || 0).toLocaleString()}</td>
                    <td className="p-4 text-sm text-slate-600">{new Date(ref.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      <div className={cn(
                        "flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider w-fit",
                        ref.status === 'ACTIVE' ? "bg-green-100 text-green-600" : 
                        ref.status === 'TRIAL' ? "bg-blue-100 text-blue-600" : "bg-red-100 text-red-600"
                      )}>
                        {ref.status === 'ACTIVE' && <CheckCircle2 className="w-3 h-3" />}
                        {ref.status === 'TRIAL' && <Clock className="w-3 h-3" />}
                        {ref.status === 'EXPIRED' && <XCircle className="w-3 h-3" />}
                        {ref.status}
                      </div>
                    </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2 transition-opacity">
                          <button 
                            onClick={() => {
                              setSelectedReferral(ref);
                              setIsModalOpen(true);
                            }}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-all"
                            title="View Details"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => showToast("More options coming soon", "info")}
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

      {/* Detail Modal */}
      <AnimatePresence>
        {isModalOpen && selectedReferral && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                      <Briefcase className="w-7 h-7 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{selectedReferral.businessName}</h3>
                      <p className="text-sm text-slate-500 font-medium">Business ID: {selectedReferral.id.split('-')[0]}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Status & Plan Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                      <div className={cn(
                        "text-xs font-bold w-fit px-2 py-1 rounded-lg uppercase",
                        selectedReferral.status === 'ACTIVE' ? "bg-green-100 text-green-600" : 
                        selectedReferral.status === 'TRIAL' ? "bg-blue-100 text-blue-600" : "bg-red-100 text-red-600"
                      )}>
                        {selectedReferral.status}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Plan Type</p>
                      <p className="text-sm font-bold text-slate-900">{selectedReferral.planType}</p>
                    </div>
                  </div>

                  {/* Owner Info */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-blue-600" />
                      Owner Contact
                    </h4>
                    <div className="grid gap-3">
                      <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-600">{selectedReferral.ownerName}</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-600">{selectedReferral.email}</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-600">{selectedReferral.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Subscription Info */}
                  <div className="p-5 bg-blue-600 rounded-3xl text-white shadow-xl shadow-blue-600/20">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-xs font-bold text-blue-100 opacity-80">Subscription Amount</p>
                      <ArrowUpRight className="w-4 h-4 text-blue-200" />
                    </div>
                    <h2 className="text-3xl font-black italic tracking-tighter">₦{Number(selectedReferral.subscriptionAmount).toLocaleString()}</h2>
                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-[10px] font-bold uppercase tracking-widest text-blue-100">
                      <span>Referred By</span>
                      <span className="text-white">{selectedReferral.affiliate?.fullName}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
