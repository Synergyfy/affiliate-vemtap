'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Crown, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Users, 
  Clock, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Star, 
  TrendingUp, 
  Handshake, 
  Camera, 
  ExternalLink,
  UserCheck
} from 'lucide-react';
import { MappedBusiness } from '@/types/market-mapping';
import { cn } from '@/lib/utils';

interface BusinessDrawerProps {
  business: MappedBusiness | null;
  onClose: () => void;
}

type TabId = 'general' | 'operations' | 'sales' | 'ecosystem' | 'documents' | 'tasks';

export default function BusinessDrawer({ business, onClose }: BusinessDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabId>('general');

  if (!business) return null;

  const tabs: { id: TabId; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'operations', label: 'Operations' },
    { id: 'sales', label: 'Sales' },
    { id: 'ecosystem', label: 'Ecosystem' },
    { id: 'documents', label: 'Documents' },
    { id: 'tasks', label: 'Tasks' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CUSTOMER': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'MEETING': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'NEGOTIATING': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'PROSPECT': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'LOST': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  return (
    <AnimatePresence>
      {business && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-xl bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white shrink-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    {business.isAnchor && (
                      <span className="bg-amber-400 text-amber-950 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Crown className="w-3 h-3" /> Anchor
                      </span>
                    )}
                    {business.source === 'CAPTURE' && (
                      <span className="bg-blue-100 text-blue-700 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Captured
                      </span>
                    )}
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", getStatusColor(business.status))}>
                      {business.status}
                    </span>
                    {business.isVerified && (
                      <span className="text-emerald-600 flex items-center gap-0.5 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900">{business.name}</h2>
                  <p className="text-xs text-slate-500">{business.category} • {business.industry} • {business.size}</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-200 overflow-x-auto shrink-0">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap",
                    activeTab === tab.id
                      ? "text-blue-600 border-blue-600 bg-blue-50/50"
                      : "text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-grow overflow-y-auto p-5 space-y-4">
              {/* TAB: General & Location */}
              {activeTab === 'general' && (
                <div className="space-y-4">
                  <InfoRow icon={MapPin} label="Address" value={business.address} />
                  <InfoRow icon={Phone} label="Phone" value={business.phone} />
                  {business.email && <InfoRow icon={Mail} label="Email" value={business.email} />}
                  {business.website && <InfoRow icon={Globe} label="Website" value={business.website} />}
                  <div className="border-t border-slate-100 pt-4" />
                  <InfoRow icon={Users} label="Owner" value={business.ownerName} />
                  <InfoRow icon={UserCheck} label="Decision Maker" value={business.decisionMaker} />
                  <InfoRow icon={MapPin} label="GPS Coordinates" value={`${business.latitude}, ${business.longitude}`} />
                  {business.notes && (
                    <div className="bg-amber-50 border border-amber-100 p-3 rounded-2xl">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1">Notes</p>
                      <p className="text-xs text-amber-900">{business.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: Operations & Traffic */}
              {activeTab === 'operations' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <MetricCard label="Daily Customers" value={business.dailyCustomers.toLocaleString()} color="text-blue-600" />
                    <MetricCard label="Monthly Customers" value={business.monthlyCustomers.toLocaleString()} color="text-emerald-600" />
                    <MetricCard label="Staff Count" value={business.staffCount?.toString() || 'N/A'} color="text-purple-600" />
                    <MetricCard label="Size" value={business.size} color="text-slate-700" />
                  </div>
                  {business.openingHours && <InfoRow icon={Clock} label="Opening Hours" value={business.openingHours} />}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <MetricCard label="Anchor Score" value={`${business.anchorScore}/100`} color="text-amber-600" />
                    <MetricCard label="Influence Score" value={`${business.influenceScore}/100`} color="text-indigo-600" />
                  </div>
                </div>
              )}

              {/* TAB: Sales Pipeline */}
              {activeTab === 'sales' && (
                <div className="space-y-4">
                  <InfoRow icon={TrendingUp} label="Status" value={business.status} />
                  <InfoRow icon={UserCheck} label="Assigned Affiliate" value={business.assignedAffiliateName || 'Unassigned'} />
                  <InfoRow icon={Calendar} label="Last Visit" value={business.lastVisit || 'Never'} />
                  <InfoRow icon={Calendar} label="Next Visit" value={business.nextVisit || 'Not scheduled'} />
                  <InfoRow icon={Star} label="Priority" value={business.priority} />
                  <InfoRow icon={MapPin} label="Cluster" value={business.clusterName} />
                </div>
              )}

              {/* TAB: Ecosystem & Anchor Score */}
              {activeTab === 'ecosystem' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Nearby Partnership Opportunities
                  </h4>
                  {business.nearbyPartnerships && business.nearbyPartnerships.length > 0 ? (
                    business.nearbyPartnerships.map((p) => (
                      <div key={p.businessId} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-bold text-slate-900">{p.businessName}</p>
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                            Synergy: {p.synergyScore}%
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500">{p.category}</p>
                        <p className="text-xs text-slate-600 mt-1">{p.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-400">
                      No partnership data available yet.
                    </div>
                  )}

                  {/* Future placeholder */}
                  <div className="mt-6 p-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-center space-y-1">
                    <Handshake className="w-6 h-6 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-400">AI Partnership Suggestions</p>
                    <p className="text-[10px] text-slate-300">Coming Soon</p>
                  </div>
                </div>
              )}

              {/* TAB: Documents & Media */}
              {activeTab === 'documents' && (
                <div className="space-y-4">
                  {business.documents && business.documents.length > 0 ? (
                    business.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            {doc.type === 'PHOTO' ? <Camera className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{doc.title}</p>
                            <p className="text-[10px] text-slate-400">{doc.type} • {doc.uploadedAt}</p>
                          </div>
                        </div>
                        <button className="text-xs text-blue-600 font-bold flex items-center gap-1 hover:underline">
                          <ExternalLink className="w-3 h-3" /> View
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-xs text-slate-400">No documents uploaded yet.</div>
                  )}
                </div>
              )}

              {/* TAB: Tasks & History */}
              {activeTab === 'tasks' && (
                <div className="space-y-4">
                  {business.tasks && business.tasks.length > 0 ? (
                    business.tasks.map((task) => (
                      <div key={task.id} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center mt-0.5 shrink-0",
                          task.status === 'COMPLETED' ? "bg-emerald-100 text-emerald-600" :
                          task.status === 'IN_PROGRESS' ? "bg-blue-100 text-blue-600" :
                          "bg-slate-200 text-slate-500"
                        )}>
                          {task.status === 'COMPLETED' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                        </div>
                        <div className="min-w-0">
                          <p className={cn("text-xs font-bold", task.status === 'COMPLETED' ? "text-slate-500 line-through" : "text-slate-900")}>
                            {task.title}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {task.assignedAffiliateName && `${task.assignedAffiliateName} • `}
                            {task.dueDate ? `Due: ${task.dueDate}` : 'No due date'}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-xs text-slate-400">No tasks assigned yet.</div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* Reusable sub-components */
function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
      <h4 className={cn("text-lg font-extrabold", color)}>{value}</h4>
    </div>
  );
}
