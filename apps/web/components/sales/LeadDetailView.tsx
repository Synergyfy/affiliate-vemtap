'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  Calendar,
  MessageSquare,
  Target,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Copy,
  ExternalLink,
  Star,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  SalesPipelineEntry,
  SalesPipelineStage,
  SalesExitState,
  LeadQuality,
  PIPELINE_ORDER,
  PIPELINE_STAGES,
  LEAD_QUALITY_COLORS,
  LEAD_QUALITY_LABELS,
} from '@/types/sales-pipeline';
import LeadQualityBadge from '@/components/sales/LeadQualityBadge';
import SalesPipelineProgress from '@/components/sales/SalesPipelineProgress';
import FollowUpCompletionModal from '@/components/sales/FollowUpCompletionModal';
import DemoCompletionModal from '@/components/sales/DemoCompletionModal';
import {
  useUpdatePipelineStage,
  useSetExitState,
  useScheduleFollowUp,
  useScheduleDemo,
  useQualifyLead,
  useCompleteFollowUp,
  useCompleteDemo,
} from '@/services/useSalesPipeline';

interface LeadDetailViewProps {
  lead: SalesPipelineEntry;
  onClose: () => void;
  onUpdated: () => void;
}

export default function LeadDetailView({ lead, onClose, onUpdated }: LeadDetailViewProps) {
  const { showToast } = useToast();
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showCompleteFollowUpModal, setShowCompleteFollowUpModal] = useState(false);
  const [showCompleteDemoModal, setShowCompleteDemoModal] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<LeadQuality | ''>('');
  const [showQualitySelector, setShowQualitySelector] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [demoDate, setDemoDate] = useState('');
  const [demoTime, setDemoTime] = useState('');
  const [demoType, setDemoType] = useState<'VIRTUAL' | 'ONSITE'>('VIRTUAL');
  const [demoMeetingUrl, setDemoMeetingUrl] = useState('');
  const [demoNotes, setDemoNotes] = useState('');

  const updateStage = useUpdatePipelineStage();
  const setExitState = useSetExitState();
  const scheduleFollowUp = useScheduleFollowUp();
  const scheduleDemo = useScheduleDemo();
  const qualifyLead = useQualifyLead();
  const completeFollowUp = useCompleteFollowUp();
  const completeDemo = useCompleteDemo();

  const isExited = !!lead.exitState;
  const currentStageIndex = PIPELINE_ORDER.indexOf(lead.pipelineStage);
  const isCustomer = lead.pipelineStage === 'CUSTOMER';

  // Determine available actions
  const getContextualAction = () => {
    if (isExited) {
      return null;
    }
    if (isCustomer) {
      return { label: 'View Customer', icon: <CheckCircle2 className="w-4 h-4" />, action: () => showToast('Customer view', 'info') };
    }
    if (currentStageIndex < 1) {
      return { label: 'Start Visit', icon: <MapPin className="w-4 h-4" />, action: () => updateToStage('VISITED') };
    }
    if (lead.pipelineStage === 'VISITED') {
      return { label: 'Contact Lead', icon: <Phone className="w-4 h-4" />, action: () => updateToStage('CONTACTED') };
    }
    if (lead.pipelineStage === 'CONTACTED') {
      return { label: 'Mark Interested', icon: <Target className="w-4 h-4" />, action: () => updateToStage('INTERESTED') };
    }
    if (lead.pipelineStage === 'INTERESTED') {
      return { label: 'Schedule Follow-up', icon: <Clock className="w-4 h-4" />, action: () => setShowFollowUpModal(true) };
    }
    if (lead.followUpDate) {
      return { label: 'Complete Follow-up', icon: <CheckCircle2 className="w-4 h-4" />, action: () => setShowCompleteFollowUpModal(true) };
    }
    if (lead.pipelineStage === 'DEMO_SCHEDULED') {
      return { label: 'Complete Demo', icon: <CheckCircle2 className="w-4 h-4" />, action: () => setShowCompleteDemoModal(true) };
    }
    return null;
  };

  const primaryAction = getContextualAction();

  const updateToStage = async (stage: SalesPipelineStage) => {
    try {
      await updateStage.mutateAsync({ leadId: lead.id, stage });
      showToast(`Moved to ${PIPELINE_STAGES[stage].label}`, 'success');
      onUpdated();
    } catch {
      showToast('Failed to update stage', 'error');
    }
  };

  const setExit = async (exitState: SalesExitState, quality?: string) => {
    try {
      await setExitState.mutateAsync({ leadId: lead.id, exitState, quality });
      showToast(`Lead marked as ${exitState.replace('_', ' ')}`, 'success');
      onUpdated();
    } catch {
      showToast('Failed to update exit state', 'error');
    }
  };

  const handleScheduleFollowUp = async () => {
    if (!followUpDate) return;
    try {
      await scheduleFollowUp.mutateAsync({
        leadId: lead.id,
        scheduledDate: followUpDate,
        scheduledTime: followUpTime || undefined,
        notes: followUpNotes || undefined,
      });
      showToast('Follow-up scheduled', 'success');
      setShowFollowUpModal(false);
      setFollowUpDate('');
      setFollowUpTime('');
      setFollowUpNotes('');
      onUpdated();
    } catch {
      showToast('Failed to schedule follow-up', 'error');
    }
  };

  const handleScheduleDemo = async () => {
    if (!demoDate) return;
    try {
      await scheduleDemo.mutateAsync({
        leadId: lead.id,
        scheduledDate: demoDate,
        scheduledTime: demoTime || undefined,
        type: demoType,
        meetingUrl: demoMeetingUrl || undefined,
        notes: demoNotes || undefined,
      });
      showToast('Demo scheduled', 'success');
      setShowDemoModal(false);
      setDemoDate('');
      setDemoTime('');
      setDemoMeetingUrl('');
      setDemoNotes('');
      onUpdated();
    } catch {
      showToast('Failed to schedule demo', 'error');
    }
  };

  const handleQualifyLead = async (quality: LeadQuality) => {
    try {
      await qualifyLead.mutateAsync({ leadId: lead.id, quality });
      setSelectedQuality(quality);
      setShowQualitySelector(false);
      showToast(`Lead marked as ${quality.replace('_', ' ')}`, 'success');
      onUpdated();
    } catch {
      showToast('Failed to update lead quality', 'error');
    }
  };

  const handleCompleteFollowUp = () => {
    setShowCompleteFollowUpModal(true);
  };

  const handleCompleteDemo = () => {
    setShowCompleteDemoModal(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100]"
        onClick={onClose}
      />

      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-800 shadow-2xl z-[110] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">{lead.businessName}</h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                {lead.industry}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-5 space-y-6">
          {/* Lead Quality + Status */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-200 dark:border-slate-600">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lead Quality</p>
              <div className="flex items-center gap-2">
                <LeadQualityBadge quality={lead.leadQuality} size="md" />
                <button
                  onClick={() => setShowQualitySelector(!showQualitySelector)}
                  className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-blue-600 transition-all"
                  title="Change quality"
                >
                  <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showQualitySelector && 'rotate-180')} />
                </button>
              </div>

              {showQualitySelector && (
                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Set Lead Quality</p>
                  {(['NEW', 'QUALIFIED', 'UNQUALIFIED', 'INVALID', 'DUPLICATE', 'INTERESTED', 'CONVERTED'] as LeadQuality[]).map((q) => (
                    <button
                      key={q}
                      onClick={() => handleQualifyLead(q)}
                      disabled={qualifyLead.isPending}
                      className={cn(
                        'w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all text-left flex items-center gap-2',
                        lead.leadQuality === q
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-300',
                      )}
                    >
                      <span className={cn('w-2 h-2 rounded-full', LEAD_QUALITY_COLORS[q].bg.replace('bg-', 'bg-'))} />
                      {LEAD_QUALITY_LABELS[q]}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pipeline Stage</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {isExited ? lead.exitState?.replace('_', ' ') : PIPELINE_STAGES[lead.pipelineStage]?.label}
                </span>
              </div>
            </div>
          </div>

          {/* Pipeline Progress */}
          <SalesPipelineProgress
            currentStage={lead.pipelineStage}
            exitState={lead.exitState}
          />

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Contact Information
            </h3>

            <div className="space-y-3 text-sm">
              {lead.contactName && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Contact Person</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{lead.contactName}</p>
                    {lead.contactRole && <p className="text-xs text-slate-500">{lead.contactRole}</p>}
                  </div>
                </div>
              )}

              {lead.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Phone</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{lead.phone}</p>
                  </div>
                  <button
                    onClick={() => window.location.href = `tel:${lead.phone}`}
                    className="ml-auto p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                    title="Call"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => window.open(`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`, '_blank')}
                    className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                    title="WhatsApp"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText(lead.phone);
                      showToast('Phone copied', 'success');
                    }}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    title="Copy"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {lead.email && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Email</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{lead.email}</p>
                  </div>
                  <button
                    onClick={() => window.location.href = `mailto:${lead.email}`}
                    className="ml-auto p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500"
                    title="Email"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {lead.location && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Location</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{lead.location}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sales Activity */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Sales Activity
            </h3>
            <div className="space-y-2">
              {lead.followUpDate && (
                <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-100 rounded-xl">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">
                    Follow-up scheduled for {new Date(lead.followUpDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )}
              {lead.demoScheduledDate && (
                <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-medium text-indigo-800">
                    Demo scheduled for {new Date(lead.demoScheduledDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )}
              {lead.activities && lead.activities.length > 0 && (
                <div className="space-y-2">
                  {lead.activities.map(activity => (
                    <div key={activity.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                      <User className="w-4 h-4 text-slate-500" />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{activity.title}</p>
                        {activity.description && <p className="text-[10px] text-slate-500">{activity.description}</p>}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Next Action */}
          {!isExited && primaryAction && (
            <div className="space-y-3 pt-2">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Next Action
              </h3>
              <button
                onClick={primaryAction.action}
                disabled={updateStage.isPending}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
              >
                {primaryAction.icon}
                {primaryAction.label}
              </button>
            </div>
          )}

          {/* Exit Options (only for active leads) */}
          {!isExited && !isCustomer && (
            <div className="relative">
              <button
                onClick={() => setShowActionMenu(!showActionMenu)}
                className="w-full py-3 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
                More Actions
              </button>

              <AnimatePresence>
                {showActionMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl z-10 overflow-hidden"
                  >
                    <button
                      onClick={() => {
                        setShowActionMenu(false);
                        setShowFollowUpModal(true);
                      }}
                      className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <Calendar className="w-4 h-4 text-orange-500" />
                      Schedule Follow-up
                    </button>
                    <button
                      onClick={() => {
                        setShowActionMenu(false);
                        setShowDemoModal(true);
                      }}
                      className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <Clock className="w-4 h-4 text-indigo-500" />
                      Schedule Demo
                    </button>
                    {lead.pipelineStage !== 'CONTACTED' && (
                      <button
                        onClick={() => {
                          setShowActionMenu(false);
                          updateToStage('CONTACTED');
                        }}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                      >
                        <Phone className="w-4 h-4 text-blue-500" />
                        Mark as Contacted
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowActionMenu(false);
                        setExit('NOT_INTERESTED', 'UNQUALIFIED');
                      }}
                      className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4" />
                      Not Interested
                    </button>
                    <button
                      onClick={() => {
                        setShowActionMenu(false);
                        setExit('INVALID', 'INVALID');
                      }}
                      className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4" />
                      Mark Invalid
                    </button>
                    <button
                      onClick={() => {
                        setShowActionMenu(false);
                        setExit('DUPLICATE', 'DUPLICATE');
                      }}
                      className="w-full px-4 py-3 text-left text-sm font-medium text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4" />
                      Mark Duplicate
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">
            Last updated {new Date(lead.updatedAt).toLocaleDateString()} at {new Date(lead.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Follow-up Modal */}
        <FollowUpModal
          isOpen={showFollowUpModal}
          onClose={() => setShowFollowUpModal(false)}
          date={followUpDate}
          time={followUpTime}
          notes={followUpNotes}
          onDateChange={setFollowUpDate}
          onTimeChange={setFollowUpTime}
          onNotesChange={setFollowUpNotes}
          onSchedule={handleScheduleFollowUp}
          isSubmitting={scheduleFollowUp.isPending}
        />

        {/* Demo Modal */}
        <DemoModal
          isOpen={showDemoModal}
          onClose={() => {
            setShowDemoModal(false);
            setDemoDate(''); setDemoTime(''); setDemoType('VIRTUAL'); setDemoMeetingUrl(''); setDemoNotes('');
          }}
          date={demoDate}
          time={demoTime}
          type={demoType}
          meetingUrl={demoMeetingUrl}
          notes={demoNotes}
          onDateChange={setDemoDate}
          onTimeChange={setDemoTime}
          onTypeChange={setDemoType}
          onMeetingUrlChange={setDemoMeetingUrl}
          onNotesChange={setDemoNotes}
          onSchedule={handleScheduleDemo}
          isSubmitting={scheduleDemo.isPending}
        />

        {/* Completion Modals */}
        <FollowUpCompletionModal
          isOpen={showCompleteFollowUpModal}
          onClose={() => setShowCompleteFollowUpModal(false)}
          leadId={lead.id}
          leadName={lead.businessName}
          currentStage={lead.pipelineStage}
          onComplete={onUpdated}
        />
        <DemoCompletionModal
          isOpen={showCompleteDemoModal}
          onClose={() => setShowCompleteDemoModal(false)}
          leadId={lead.id}
          leadName={lead.businessName}
          currentStage={lead.pipelineStage}
          onComplete={onUpdated}
        />
      </motion.div>
    </AnimatePresence>
  );
}

function FollowUpModal({
  isOpen,
  onClose,
  date,
  time,
  notes,
  onDateChange,
  onTimeChange,
  onNotesChange,
  onSchedule,
  isSubmitting,
}: {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  time: string;
  notes: string;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onSchedule: () => void;
  isSubmitting: boolean;
}) {
  if (!isOpen) return null;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-[200] flex items-end">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 w-full max-w-md mx-auto mb-safe rounded-t-3xl p-6 shadow-2xl animate-slide-up">
        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">Schedule Follow-up</h3>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date *</label>
            <input
              type="date"
              value={date || defaultDate}
              onChange={e => onDateChange(e.target.value)}
              className="w-full mt-1 px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Time</label>
            <input
              type="time"
              value={time}
              onChange={e => onTimeChange(e.target.value)}
              className="w-full mt-1 px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => onNotesChange(e.target.value)}
              placeholder="Add notes for this follow-up..."
              rows={3}
              className="w-full mt-1 px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onSchedule}
            disabled={!date || isSubmitting}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Scheduling...' : 'Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DemoModal({
  isOpen,
  onClose,
  date,
  time,
  type,
  meetingUrl,
  notes,
  onDateChange,
  onTimeChange,
  onTypeChange,
  onMeetingUrlChange,
  onNotesChange,
  onSchedule,
  isSubmitting,
}: {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  time: string;
  type: 'VIRTUAL' | 'ONSITE';
  meetingUrl: string;
  notes: string;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  onTypeChange: (v: 'VIRTUAL' | 'ONSITE') => void;
  onMeetingUrlChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onSchedule: () => void;
  isSubmitting: boolean;
}) {
  if (!isOpen) return null;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-[200] flex items-end">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 w-full max-w-md mx-auto mb-safe rounded-t-3xl p-6 shadow-2xl animate-slide-up">
        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">Schedule Demo</h3>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date *</label>
            <input
              type="date"
              value={date || defaultDate}
              onChange={e => onDateChange(e.target.value)}
              className="w-full mt-1 px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Time</label>
            <input
              type="time"
              value={time}
              onChange={e => onTimeChange(e.target.value)}
              className="w-full mt-1 px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Demo Type</label>
            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={() => onTypeChange('VIRTUAL')}
                className={cn(
                  "flex-1 py-3 rounded-xl border text-sm font-semibold transition-all",
                  type === 'VIRTUAL'
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-slate-50 border-slate-200 text-slate-500',
                )}
              >
                Virtual
              </button>
              <button
                type="button"
                onClick={() => onTypeChange('ONSITE')}
                className={cn(
                  "flex-1 py-3 rounded-xl border text-sm font-semibold transition-all",
                  type === 'ONSITE'
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-slate-50 border-slate-200 text-slate-500',
                )}
              >
                On-site
              </button>
            </div>
          </div>
          {type === 'VIRTUAL' && (
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Meeting Link</label>
              <input
                type="url"
                value={meetingUrl}
                onChange={e => onMeetingUrlChange(e.target.value)}
                placeholder="https://meet.google.com/..."
                className="w-full mt-1 px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          )}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => onNotesChange(e.target.value)}
              placeholder="Add any notes..."
              rows={3}
              className="w-full mt-1 px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onSchedule}
            disabled={!date || isSubmitting}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Scheduling...' : 'Schedule Demo'}
          </button>
        </div>
      </div>
    </div>
  );
}
