'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/components/admin/AdminLayout';
import { ArrowLeft, Search, MapPin, Phone, Mail, Building2, User, Crown, CheckCircle2, Clock, AlertCircle, ChevronRight, FileText, ExternalLink, X, Globe, Users, Star, Calendar, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { MappedBusiness } from '@/types/market-mapping';
import { Business } from '@/types/api';
import { useBusinesses } from '@/services/useAdminHooks';
import { useDebounce } from '@/hooks/use-debounce';

const statusColor: Record<string, string> = {
  CUSTOMER: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  MEETING: 'text-blue-700 bg-blue-50 border-blue-200',
  NEGOTIATING: 'text-amber-700 bg-amber-50 border-amber-200',
  PROSPECT: 'text-slate-700 bg-slate-50 border-slate-200',
  LOST: 'text-red-700 bg-red-50 border-red-200',
};

const sizeLabel: Record<string, string> = {
  SMALL: 'Small',
  MEDIUM: 'Medium',
  LARGE: 'Large',
  ENTERPRISE: 'Enterprise',
};

export default function BusinessesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedBusiness, setSelectedBusiness] = useState<MappedBusiness | null>(null);

  const debouncedSearch = useDebounce(search, 400);
  const businessesQuery = useBusinesses({
    search: debouncedSearch || undefined,
    status: statusFilter === 'CUSTOMER' ? 'ACTIVE' : statusFilter === 'LOST' ? 'EXPIRED' : statusFilter === 'PROSPECT' ? 'TRIAL' : undefined,
  });

  const businessesList: MappedBusiness[] = (businessesQuery.data?.data ?? []).map(normalizeBusiness);

  const filtered = businessesList.filter(b => {
    const nameStr = b.name;
    const ownerStr = b.ownerName;
    if (search && !nameStr.toLowerCase().includes(search.toLowerCase()) && !ownerStr.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
    return true;
  });


  const statuses = ['ALL', ...new Set(businessesList.map(b => b.status))];

  const openInOps = (biz: MappedBusiness) => {
    router.push(`/admin/operations?businessId=${biz.id}`);
  };

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/admin/market-mapping" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
              Captured Businesses
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
              {businessesQuery.data?.meta.total ?? 0} businesses captured by affiliates — click a business to see full details
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          <div className="relative flex-1 min-w-0 sm:min-w-[200px] sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by business or owner..."
              className="w-full pl-9 pr-3 py-2 sm:py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-400 transition-all"
            />
          </div>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
            {statuses.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all whitespace-nowrap",
                  statusFilter === s ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {businessesQuery.isLoading && <p className="text-sm text-slate-500">Loading businesses...</p>}
        {businessesQuery.isError && <div className="text-sm text-red-600">Unable to load businesses. <button onClick={() => businessesQuery.refetch()} className="font-bold underline">Retry</button></div>}
        {/* Business List */}
        <div className="space-y-2.5 sm:space-y-3">
          {filtered.map(biz => (
            <button
              key={biz.id}
              onClick={() => setSelectedBusiness(biz)}
              className="w-full bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 flex items-center justify-between text-left hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                <div className={cn(
                  "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold shrink-0",
                  biz.isAnchor ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                )}>
                  {biz.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <p className="font-bold text-slate-900 text-sm sm:text-base truncate">{biz.name}</p>
                    {biz.isAnchor && <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 shrink-0" />}
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-500 truncate">{biz.category} • {biz.clusterName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <span className={cn("px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold border", statusColor[biz.status] || '')}>
                  {biz.status}
                </span>
                {biz.lastVisit && <span className="text-[9px] sm:text-[10px] text-slate-400 hidden sm:inline">Last: {biz.lastVisit}</span>}
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
              </div>
            </button>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-500">No businesses found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Slide-in Panel */}
      <AnimatePresence>
        {selectedBusiness && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBusiness(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[250]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 sm:top-0 sm:right-0 sm:left-auto h-[90vh] sm:h-full w-full sm:max-w-xl bg-white shadow-2xl z-[260] overflow-y-auto rounded-t-[28px] sm:rounded-none"
            >
              <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto mt-3 sm:hidden" />
              <div className="p-5 sm:p-8 space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className={cn(
                      "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-base sm:text-lg font-bold shrink-0",
                      selectedBusiness.isAnchor ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                    )}>
                      {selectedBusiness.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <h3 className="text-base sm:text-xl font-bold text-slate-900 truncate">{selectedBusiness.name}</h3>
                        {selectedBusiness.isAnchor && <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />}
                      </div>
                      <p className="text-[10px] sm:text-xs text-slate-500 truncate">{selectedBusiness.category} • {selectedBusiness.industry}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedBusiness(null)}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                {/* Status Badge + Priority */}
                <div className="flex items-center gap-3">
                  <span className={cn("px-3 py-1.5 rounded-full text-xs font-bold border", statusColor[selectedBusiness.status] || '')}>
                    {selectedBusiness.status}
                  </span>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-1 rounded-lg",
                    selectedBusiness.priority === 'HIGH' ? "bg-red-50 text-red-700" :
                    selectedBusiness.priority === 'MEDIUM' ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-500"
                  )}>
                    {selectedBusiness.priority} PRIORITY
                  </span>
                  {selectedBusiness.isVerified && (
                    <span className="text-[10px] flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>

                {/* Quick Info Row */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100">
                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Anchor Score</p>
                    <p className="text-lg sm:text-xl font-black text-slate-900">{selectedBusiness.anchorScore}/100</p>
                  </div>
                  <div className="p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100">
                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Influence Score</p>
                    <p className="text-lg sm:text-xl font-black text-slate-900">{selectedBusiness.influenceScore}/100</p>
                  </div>
                  <div className="p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100">
                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Daily Customers</p>
                    <p className="text-lg sm:text-xl font-black text-slate-900">{selectedBusiness.dailyCustomers?.toLocaleString()}</p>
                  </div>
                  <div className="p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100">
                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Size</p>
                    <p className="text-lg sm:text-xl font-black text-slate-900">{sizeLabel[selectedBusiness.size]}</p>
                  </div>
                </div>

                {/* Movement/Status History */}
                 {selectedBusiness.lastVisit && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-blue-500" /> Status Movement History
                    </h4>
                    <div className="space-y-2">
                       <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600"><Clock className="w-4 h-4 text-blue-500" /> Last visited {selectedBusiness.lastVisit}</div>
                    </div>
                  </div>
                )}

                {/* Contact Info */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Info</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <User className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400">Owner</p>
                        <p className="text-sm font-bold text-slate-900">{selectedBusiness.ownerName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <Star className="w-4 h-4 text-amber-500" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400">Decision Maker</p>
                        <p className="text-sm font-bold text-slate-900">{selectedBusiness.decisionMaker}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <Phone className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400">Phone</p>
                        <p className="text-sm font-bold text-slate-900">{selectedBusiness.phone}</p>
                      </div>
                    </div>
                    {selectedBusiness.email && (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <Mail className="w-4 h-4 text-blue-500" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400">Email</p>
                          <p className="text-sm font-bold text-slate-900">{selectedBusiness.email}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400">Address</p>
                        <p className="text-sm font-bold text-slate-900">{selectedBusiness.address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assignment & Visit */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {selectedBusiness.assignedAffiliateName && (
                    <div className="p-3 sm:p-4 bg-purple-50 rounded-xl sm:rounded-2xl border border-purple-100">
                      <p className="text-[9px] sm:text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1">Assigned Affiliate</p>
                      <p className="text-xs sm:text-sm font-bold text-purple-900 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> <span className="truncate">{selectedBusiness.assignedAffiliateName}</span>
                      </p>
                    </div>
                  )}
                  {selectedBusiness.lastVisit && (
                    <div className="p-3 sm:p-4 bg-blue-50 rounded-xl sm:rounded-2xl border border-blue-100">
                      <p className="text-[9px] sm:text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">Last Visit</p>
                      <p className="text-xs sm:text-sm font-bold text-blue-900 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> {selectedBusiness.lastVisit}
                      </p>
                    </div>
                  )}
                  {selectedBusiness.clusterName && (
                    <div className="p-3 sm:p-4 bg-emerald-50 rounded-xl sm:rounded-2xl border border-emerald-100">
                      <p className="text-[9px] sm:text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Cluster</p>
                      <p className="text-xs sm:text-sm font-bold text-emerald-900 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> <span className="truncate">{selectedBusiness.clusterName}</span>
                      </p>
                    </div>
                  )}
                  {selectedBusiness.nextVisit && (
                    <div className="p-3 sm:p-4 bg-amber-50 rounded-xl sm:rounded-2xl border border-amber-100">
                      <p className="text-[9px] sm:text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">Next Visit</p>
                      <p className="text-xs sm:text-sm font-bold text-amber-900 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> {selectedBusiness.nextVisit}
                      </p>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {selectedBusiness.notes && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Affiliate Notes</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{selectedBusiness.notes}</p>
                  </div>
                )}

                {/* Documents */}
                {selectedBusiness.documents && selectedBusiness.documents.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Documents ({selectedBusiness.documents.length})</h4>
                    <div className="space-y-2">
                      {selectedBusiness.documents.map(doc => (
                        <div key={doc.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <FileText className="w-4 h-4 text-blue-500" />
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-900">{doc.title}</p>
                            <p className="text-[10px] text-slate-400">{new Date(doc.uploadedAt).toLocaleDateString()} • {doc.type}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action: See in Operation Command */}
                <div className="pt-3 sm:pt-4 border-t border-slate-100">
                  <button
                    onClick={() => openInOps(selectedBusiness)}
                    className="w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-blue-700 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    See in Operation Command
                  </button>
                  <p className="text-[10px] text-slate-400 text-center mt-2">Open this business in the Global Operations Command for full lifecycle management</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}

function normalizeBusiness(business: Business): MappedBusiness {
  const status: MappedBusiness['status'] = business.status === 'ACTIVE' ? 'CUSTOMER' : business.status === 'EXPIRED' || business.status === 'CANCELLED' ? 'LOST' : 'PROSPECT';
  return {
    id: business.id, name: business.businessName, category: business.category ?? 'Business', industry: business.category ?? '', size: 'SMALL', status,
    isAnchor: false, anchorScore: 0, influenceScore: 0, isVerified: business.status === 'ACTIVE', ownerName: business.ownerName, decisionMaker: business.ownerName,
    phone: business.phone, email: business.email, website: undefined, address: '', clusterId: '', clusterName: '', latitude: 0, longitude: 0,
    dailyCustomers: 0, monthlyCustomers: 0, assignedAffiliateId: business.affiliateId, assignedAffiliateName: business.affiliate?.fullName,
    priority: 'LOW', lastVisit: undefined, nextVisit: undefined, notes: undefined,
  };
}
