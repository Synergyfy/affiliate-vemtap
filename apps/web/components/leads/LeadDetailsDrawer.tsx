'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Building2, 
  User, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  Calendar,
  MessageSquare,
  Target,
  Clock,
  ExternalLink,
  Edit2,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import LeadQualityBadge from '@/components/sales/LeadQualityBadge';
import SalesPipelineProgress from '@/components/sales/SalesPipelineProgress';
import ContactCommunicationSummary from '@/components/communication/ContactCommunicationSummary';
import MessageHistoryTimeline from '@/components/communication/MessageHistoryTimeline';
import SubscriptionOverrideBanner from '@/components/communication/SubscriptionOverrideBanner';
import { useLeadCommunication } from '@/services/useCommunicationHooks';
import { Loader2 } from 'lucide-react';
import { 
  SalesPipelineEntry, 
  PIPELINE_STAGES, 
  SalesPipelineStage 
} from '@/types/sales-pipeline';

interface LeadDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lead: SalesPipelineEntry | any;
  onEdit: (lead: any) => void;
}

export default function LeadDetailsDrawer({ isOpen, onClose, lead, onEdit }: LeadDetailsDrawerProps) {
  const { data: leadCommunication } = useLeadCommunication(lead?.id);
  if (!lead) return null;

  const getNextAction = (stage: SalesPipelineStage) => {
    switch (stage) {
      case 'NEW_LEAD': return { label: 'Start Visit', color: 'bg-blue-600' };
      case 'VISITED': return { label: 'Contact Lead', color: 'bg-purple-600' };
      case 'CONTACTED': return { label: 'Schedule Follow-up', color: 'bg-orange-600' };
      case 'INTERESTED': return { label: 'Schedule Demo', color: 'bg-indigo-600' };
      case 'DEMO_SCHEDULED': return { label: 'Complete Demo', color: 'bg-emerald-600' };
      case 'PROPOSAL_SENT': return { label: 'Send Proposal', color: 'bg-orange-600' };
      case 'CUSTOMER': return { label: 'View Subscription', color: 'bg-slate-800' };
      default: return { label: 'Update Status', color: 'bg-slate-600' };
    }
  };

  const nextAction = getNextAction(lead.pipelineStage || 'NEW_LEAD');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[110] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 leading-tight">{lead.businessName}</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lead.industry}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-slate-200 text-slate-400 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-grow overflow-y-auto p-6 space-y-8">
               {/* Quick Status */}
               <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                 <div className="flex items-center justify-between">
                   <div className="space-y-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Status</p>
                     <div className="flex items-center gap-3">
                       <span className="text-sm font-black text-blue-600 uppercase tracking-widest">{lead.pipelineStage || lead.status || 'Unknown'}</span>
                       <LeadQualityBadge quality={lead.leadQuality} score={lead.leadQualityInfo?.score} size="sm" />
                     </div>
                   </div>
                   <button 
                     onClick={() => onEdit(lead)}
                     className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                   >
                     <Edit2 className="w-4 h-4" />
                   </button>
                 </div>
                 
                 <div className="pt-2">
                   <SalesPipelineProgress currentStage={lead.pipelineStage || 'NEW_LEAD'} exitState={lead.exitState} compact />
                 </div>
               </div>

              {/* Info Sections */}
              <div className="space-y-6">
                <section>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Contact Person</h3>
                  <div className="bg-white border border-slate-100 rounded-[32px] p-5 space-y-4 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{lead.contactName}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{lead.contactRole || 'Primary Contact'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <Phone className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-bold text-slate-700">{lead.phone}</p>
                    </div>
                    {lead.email && (
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                          <Mail className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-bold text-slate-700">{lead.email}</p>
                      </div>
                    )}
                  </div>
                </section>

                <section>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Business Details</h3>
                  <div className="bg-white border border-slate-100 rounded-[32px] p-5 space-y-4 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-bold text-slate-700">{lead.location || 'Location not specified'}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
                        <Globe className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-bold text-slate-700">{lead.website || 'No website listed'}</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2">History & Source</h3>
                  <div className="bg-white border border-slate-100 rounded-[32px] p-5 space-y-4 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                        <Target className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lead Source</p>
                        <p className="text-sm font-bold text-slate-900">{lead.source || 'Direct Referral'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Added On</p>
                        <p className="text-sm font-bold text-slate-900">
                          {new Date(lead.createdAt).toLocaleDateString()} at {new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Communication & Follow-up</h3>
                  <div className="space-y-4">
                    <SubscriptionOverrideBanner status={lead.pipelineStage || lead.status} />
                    {leadCommunication ? (
                      <>
                        <ContactCommunicationSummary data={leadCommunication} />
                        <div className="bg-white border border-slate-100 rounded-[32px] p-5 shadow-sm">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">History</p>
                          <MessageHistoryTimeline history={leadCommunication.history} />
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                      </div>
                    )}
                  </div>
                </section>

                <section>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Notes</h3>
                  <div className="bg-purple-50/50 border border-purple-100 rounded-[32px] p-6">
                    <div className="flex items-start gap-3">
                      <MessageSquare className="w-5 h-5 text-purple-600 mt-1" />
                      <p className="text-sm text-slate-600 leading-relaxed font-medium">
                        {lead.comments || 'No additional comments added to this lead yet.'}
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </div>

             {/* Footer Actions */}
             <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-3">
               <button 
                 className={cn(
                   "w-full h-14 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all",
                   nextAction.color,
                   "text-white"
                 )}
               >
                 {nextAction.label}
                 <ChevronRight className="w-4 h-4" />
               </button>
               
               <div className="flex gap-3">
                 <button 
                   onClick={() => onEdit(lead)}
                   className="flex-grow bg-white border border-slate-200 text-slate-600 h-12 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                 >
                   Full Edit
                 </button>
                 <button 
                   onClick={onClose}
                   className="px-6 border border-slate-200 h-12 rounded-2xl text-xs font-black text-slate-400 bg-white hover:text-slate-600 transition-all"
                 >
                   Close
                 </button>
               </div>
             </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
