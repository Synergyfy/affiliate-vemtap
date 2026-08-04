'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/components/admin/AdminLayout';
import KPIStrip from '@/components/dashboard/operations/KPIStrip';
import TabNavigation from '@/components/dashboard/operations/TabNavigation';
import OverviewTab from '@/components/dashboard/operations/OverviewTab';
import LeadsTab from '@/components/dashboard/operations/LeadsTab';
import FollowUpsTab from '@/components/dashboard/operations/FollowUpsTab';
import DemosTab from '@/components/dashboard/operations/DemosTab';
import BusinessesTab from '@/components/dashboard/operations/BusinessesTab';
import ReportViewsTab from '@/components/dashboard/operations/ReportViewsTab';
import { X, Building2, Crown, MapPin, Phone, Mail, User, Clock, Calendar, CheckCircle2, BarChart3, ArrowLeft, Users, Star, FileText, ExternalLink, Search, Filter, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOperationsBusiness } from '@/services/useOperationsHooks';

const statusColor: Record<string, string> = {
  ACTIVE: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  TRIAL: 'text-blue-700 bg-blue-50 border-blue-200',
  EXPIRED: 'text-amber-700 bg-amber-50 border-amber-200',
  CANCELLED: 'text-red-700 bg-red-50 border-red-200',
};

function AdminOperationsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const businessId = searchParams.get('businessId');
  const [activeTab, setActiveTab] = useState('overview');
  const { data: selectedBusiness, isLoading: isBusinessLoading, error: businessError } = useOperationsBusiness(businessId || undefined);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab onNavigate={setActiveTab} />;
      case 'leads':
        return <LeadsTab isAdmin={true} />;
      case 'follow-ups':
        return <FollowUpsTab />;
      case 'demos':
        return <DemosTab />;
      case 'businesses':
        return <BusinessesTab />;
      case 'reports':
        return <ReportViewsTab />;
      default:
        return <OverviewTab />;
    }
  };

  const closeBusinessModal = () => {
    router.replace('/admin/operations');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Global Operations Command</h2>
          <p className="text-slate-500">Full administrative control over leads, businesses, and operational workflows.</p>
        </div>

        <KPIStrip />

        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
          
          <div className="p-6 sm:p-8 min-h-[600px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {businessId && isBusinessLoading && <p className="text-sm text-slate-500">Loading business details...</p>}
      {businessId && businessError && <p className="text-sm text-red-600">Unable to load this business.</p>}

      {/* Business Detail Modal */}
      <AnimatePresence>
        {selectedBusiness && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeBusinessModal}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[250]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-xl bg-white shadow-2xl z-[260] overflow-y-auto"
            >
              <div className="p-8 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold",
                       "bg-slate-100 text-slate-600"
                    )}>
                       {selectedBusiness.businessName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-slate-900">{selectedBusiness.businessName}</h3>
                      </div>
                      <p className="text-xs text-slate-500">{selectedBusiness.category || 'Business'} • {selectedBusiness.planType}</p>
                    </div>
                  </div>
                  <button onClick={closeBusinessModal} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                {/* Status */}
                <div className="flex items-center gap-3">
                  <span className={cn("px-3 py-1.5 rounded-full text-xs font-bold border", statusColor[selectedBusiness.status] || '')}>
                    {selectedBusiness.status}
                  </span>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-1 rounded-lg",
                    selectedBusiness.priority === 'HIGH' ? "bg-red-50 text-red-700" :
                    selectedBusiness.priority === 'MEDIUM' ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-500"
                  )}>
                     {selectedBusiness.status} STATUS
                  </span>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subscription</p>
                    <p className="text-xl font-black text-slate-900">₦{selectedBusiness.subscriptionAmount.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Commission</p>
                    <p className="text-xl font-black text-slate-900">₦{selectedBusiness.commissionAmount.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Created</p>
                    <p className="text-xl font-black text-slate-900">{new Date(selectedBusiness.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Affiliate</p>
                    <p className="text-xl font-black text-slate-900">{selectedBusiness.affiliate?.fullName || 'Unassigned'}</p>
                  </div>
                </div>

                {/* Status Movement History */}
                {selectedBusiness.statusHistory.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-blue-500" /> Lifecycle Movement
                    </h4>
                    <div className="relative pl-6 space-y-3 before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {selectedBusiness.statusHistory.map((move) => (
                        <div key={move.id} className="relative">
                          <div className="absolute -left-[18px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white shadow" />
                          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 ml-2">
                            <div className="flex flex-col gap-0.5">
                              <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded text-center", statusColor[move.fromStatus || ''] || '')}>{move.fromStatus || 'NEW'}</span>
                              <span className="text-[8px] text-slate-400 text-center">→</span>
                              <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded text-center", statusColor[move.toStatus] || '')}>{move.toStatus}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 ml-3">
                              <p>by <span className="font-bold text-slate-700">{move.changedBy.fullName}</span></p>
                              <p className="flex items-center gap-1 mt-0.5"><Calendar className="w-3 h-3" /> {new Date(move.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      ))}
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
                         <p className="text-sm font-bold text-slate-900">{selectedBusiness.affiliate?.fullName || 'Unassigned'}</p>
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
                <div className="grid grid-cols-2 gap-3">
                  {selectedBusiness.assignedAffiliateName && (
                    <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                      <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1">Assigned Affiliate</p>
                      <p className="text-sm font-bold text-purple-900 flex items-center gap-1.5">
                        <Users className="w-4 h-4" /> {selectedBusiness.assignedAffiliateName}
                      </p>
                    </div>
                  )}
                  {selectedBusiness.lastVisit && (
                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">Last Visit</p>
                      <p className="text-sm font-bold text-blue-900 flex items-center gap-1.5">
                        <Clock className="w-4 h-4" /> {selectedBusiness.lastVisit}
                      </p>
                    </div>
                  )}
                  {selectedBusiness.clusterName && (
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Cluster</p>
                      <p className="text-sm font-bold text-emerald-900 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" /> {selectedBusiness.clusterName}
                      </p>
                    </div>
                  )}
                  {selectedBusiness.nextVisit && (
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                      <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">Next Visit</p>
                      <p className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" /> {selectedBusiness.nextVisit}
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
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}

export default function OperationsPage() {
  return (
    <Suspense>
      <AdminOperationsPage />
    </Suspense>
  );
}
