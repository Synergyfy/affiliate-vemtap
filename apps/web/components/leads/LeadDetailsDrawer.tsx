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
  Edit2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeadDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any;
  onEdit: (lead: any) => void;
}

export default function LeadDetailsDrawer({ isOpen, onClose, lead, onEdit }: LeadDetailsDrawerProps) {
  if (!lead) return null;

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
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Status</p>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-sm font-black text-blue-600 uppercase tracking-widest">{lead.status}</span>
                  </div>
                </div>
                <button 
                  onClick={() => onEdit(lead)}
                  className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
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
                        <p className="text-sm font-bold text-slate-900">{lead.contact}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{lead.role || 'Primary Contact'}</p>
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
                        <p className="text-sm font-bold text-slate-900">{lead.date} at {lead.time || '10:00 AM'}</p>
                      </div>
                    </div>
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
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
              <button 
                onClick={() => onEdit(lead)}
                className="flex-grow bg-slate-900 text-white h-14 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-200"
              >
                Full Edit
              </button>
              <button 
                onClick={onClose}
                className="px-6 border border-slate-200 h-14 rounded-2xl text-xs font-black text-slate-600 bg-white"
              >
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
