'use client';

import { motion } from 'motion/react';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  UserPlus, 
  ShieldCheck, 
  ShieldAlert,
  Mail,
  Phone,
  ExternalLink,
  UserX,
  UserCheck
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';

export default function AffiliatesManagement() {
  const { showToast } = useToast();
  const [affiliatesList, setAffiliatesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAffiliates = async () => {
    try {
      const data = await api.get('/affiliates/admin/profiles');
      setAffiliatesList(data || []);
    } catch (error) {
      console.error('Failed to fetch affiliates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliates();
  }, []);

  const handleSuspend = async (id: string, name: string, currentlyFlagged: boolean) => {
    try {
      await api.post(`/affiliates/admin/profiles/${id}/flag`, { 
        isFlagged: !currentlyFlagged,
        reason: !currentlyFlagged ? 'Administrative suspension' : ''
      });
      showToast(`${name} has been ${currentlyFlagged ? 'activated' : 'suspended'}.`, currentlyFlagged ? 'success' : 'error');
      setAffiliatesList(prev => prev.map(a => a.id === id ? { ...a, isFlagged: !currentlyFlagged } : a));
    } catch (error) {
      showToast('Failed to update affiliate status.', 'error');
    }
  };

  const handleApprove = async (id: string, name: string) => {
    try {
      await api.post(`/affiliates/admin/profiles/${id}/verify-kyc`, { status: 'verified' });
      showToast(`${name}'s KYC has been verified.`, 'success');
      fetchAffiliates();
    } catch (error) {
      showToast('Failed to verify KYC.', 'error');
    }
  };

  const handleReject = async (id: string, name: string) => {
    try {
      await api.post(`/affiliates/admin/profiles/${id}/verify-kyc`, { status: 'unverified' });
      showToast(`${name}'s KYC has been rejected.`, 'info');
      fetchAffiliates();
    } catch (error) {
      showToast('Failed to reject KYC.', 'error');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name, email or code..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-all">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button className="px-4 py-2 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-all">
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
                  <th className="p-4 font-bold text-slate-600 text-sm">Referral Code</th>
                  <th className="p-4 font-bold text-slate-600 text-sm">Tier</th>
                  <th className="p-4 font-bold text-slate-600 text-sm">Earnings</th>
                  <th className="p-4 font-bold text-slate-600 text-sm">KYC Status</th>
                  <th className="p-4 font-bold text-slate-600 text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {affiliatesList.map((aff, idx) => (
                  <motion.tr 
                    key={aff.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={cn(
                      "hover:bg-slate-50/50 transition-all group",
                      aff.isFlagged && "bg-red-50/30"
                    )}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                          {aff.user?.firstName?.charAt(0) || 'A'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{aff.user?.firstName} {aff.user?.lastName}</p>
                          <p className="text-xs text-slate-400 font-medium">{aff.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                        {aff.referralCode}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-600">{aff.tier}</td>
                    <td className="p-4 text-sm text-slate-900 font-bold">₦{Number(aff.totalEarnings).toLocaleString()}</td>
                    <td className="p-4">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider",
                        aff.kycStatus === 'verified' ? "bg-green-100 text-green-600" : 
                        aff.kycStatus === 'pending' ? "bg-orange-100 text-orange-600" : "bg-slate-100 text-slate-400"
                      )}>
                        {aff.kycStatus}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        {aff.kycStatus === 'pending' && (
                          <div className="flex gap-1">
                            <button 
                              onClick={() => handleApprove(aff.id, aff.user?.firstName)}
                              className="p-2 hover:bg-green-50 rounded-lg text-slate-400 hover:text-green-600 transition-all"
                              title='Verify KYC'
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleReject(aff.id, aff.user?.firstName)}
                              className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-all"
                              title='Reject KYC'
                            >
                              <ShieldAlert className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        <button 
                          onClick={() => handleSuspend(aff.id, aff.user?.firstName, aff.isFlagged)}
                          className={cn(
                            "p-2 rounded-lg transition-all",
                            aff.isFlagged ? "hover:bg-green-50 text-red-600 hover:text-green-600" : "hover:bg-red-50 text-slate-400 hover:text-red-600"
                          )}
                          title={aff.isFlagged ? 'Activate' : 'Suspend Account'}
                        >
                          <UserX className="w-4 h-4" />
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
