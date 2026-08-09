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
  Briefcase,
  Loader2,
  Copy,
  ExternalLink
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import AdminLayout from '@/components/admin/AdminLayout';
import FilterBar from '@/components/admin/FilterBar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/toast';
import { useDebounce } from '@/hooks/use-debounce';
import { useBusinesses, downloadBusinessesExport } from '@/services/useAdminHooks';
import { Business } from '@/types/api';
import { Download } from 'lucide-react';

export default function ReferralsManagement() {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(searchTerm, 500);

  const { data: businessesResponse, isLoading, refetch } = useBusinesses({
    limit: 20,
    page,
    search: debouncedSearch || undefined,
    status: statusFilter === 'All' ? undefined : statusFilter
  });

  const [selectedReferral, setSelectedReferral] = useState<Business | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);

  const handleUpdateStatus = async (businessId: string, status: string) => {
    try {
      await api.patch(`/businesses/${businessId}/status`, { status });
      showToast(`Business status updated to ${status}`, 'success');
      refetch();
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copied to clipboard`, 'success');
    } catch {
      showToast('Failed to copy', 'error');
    }
  };

  const openReferral = (ref: Business) => {
    setOpenMenuId(null);
    setSelectedReferral(ref);
    setIsModalOpen(true);
  };

  const openMenu = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    setOpenMenuId(openMenuId === id ? null : id);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">Referred Businesses</h2>
          <button
            onClick={() => downloadBusinessesExport()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        <FilterBar 
          searchQuery={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search by business or affiliate..."
          activeFilter={statusFilter}

          onFilterChange={setStatusFilter}
          filterLabel="Status"
          filterOptions={[
            { label: 'All Status', value: 'All' },
            { label: 'Active', value: 'ACTIVE' },
            { label: 'Trial', value: 'TRIAL' },
            { label: 'Expired', value: 'EXPIRED' }
          ]}
        />

        {/* Referrals Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative min-h-[400px]">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          )}
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
                {businessesResponse?.data.map((ref, idx) => (
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
                        <div className="flex items-center justify-end gap-2 transition-opacity relative">
                          <button 
                            onClick={() => openReferral(ref)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-all"
                            title="View Details"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                          <div className="relative">
                            <button 
                              onClick={(e) => openMenu(e, ref.id)}
                              className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all"
                              title="More actions"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                            {openMenuId === ref.id && menuPos && (
                              <>
                                <div className="fixed inset-0 z-[90]" onClick={() => { setOpenMenuId(null); }} />
                                <div 
                                  className="fixed z-[100] w-56 bg-white rounded-2xl border border-slate-200 shadow-2xl p-1.5 origin-top-right"
                                  style={{ top: menuPos.top, right: menuPos.right }}
                                >
                                  <button
                                    onClick={() => openReferral(ref)}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" /> View Details
                                  </button>
                                  <button
                                    onClick={() => { setOpenMenuId(null); window.location.href = `mailto:${ref.email}`; }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                  >
                                    <Mail className="w-3.5 h-3.5" /> Email Owner
                                  </button>
                                  <button
                                    onClick={() => { setOpenMenuId(null); window.location.href = `tel:${ref.phone}`; }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                  >
                                    <Phone className="w-3.5 h-3.5" /> Call Owner
                                  </button>
                                  <div className="h-px bg-slate-100 my-1" />
                                  <button
                                    onClick={() => copyText(ref.id, 'Business ID')}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                                  >
                                    <Copy className="w-3.5 h-3.5" /> Copy Business ID
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
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
