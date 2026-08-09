'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useCompleteDemo } from '@/services/useSalesPipeline';
import { DemoOutcome } from '@/types/sales-pipeline';

interface DemoCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  leadName: string;
  currentStage: string;
  onComplete: () => void;
}

const OUTCOME_OPTIONS = [
  { value: 'INTERESTED', label: 'Interested', icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  { value: 'NEEDS_FOLLOW_UP', label: 'Needs Follow-up', icon: Calendar, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  { value: 'NOT_INTERESTED', label: 'Not Interested', icon: AlertCircle, color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  { value: 'READY_TO_SUBSCRIBE', label: 'Ready to Subscribe', icon: CheckCircle2, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
] as const;

export default function DemoCompletionModal({
  isOpen,
  onClose,
  leadId,
  leadName,
  currentStage,
  onComplete,
}: DemoCompletionModalProps) {
  const { showToast } = useToast();
  const [outcome, setOutcome] = useState<DemoOutcome | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const completeDemo = useCompleteDemo();

  const handleSubmit = async () => {
    if (!outcome || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await completeDemo.mutateAsync({ leadId, outcome, notes: notes || undefined });
      if (outcome === 'READY_TO_SUBSCRIBE') {
        showToast('Demo completed — lead moved to Customer', 'success');
      } else if (outcome === 'NOT_INTERESTED') {
        showToast('Demo completed: not interested', 'success');
      } else {
        showToast('Demo completed', 'success');
      }
      onComplete();
      handleClose();
    } catch {
      showToast('Failed to complete demo', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => { setOutcome(null); setNotes(''); onClose(); };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end">
      <div className="absolute inset-0 bg-slate-900/50" onClick={handleClose} />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative bg-white w-full max-w-md mx-auto mb-safe rounded-t-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-black text-slate-900">Complete Demo</h3>
            <p className="text-xs text-slate-500 font-medium">{leadName}</p>
          </div>
          <button onClick={handleClose} className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3 mb-6">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">What was the outcome?</label>
          {OUTCOME_OPTIONS.map((opt) => (
            <button key={opt.value} type="button" onClick={() => setOutcome(opt.value)} className={cn('w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3', outcome === opt.value ? opt.bg + ' ' + opt.color + ' border-current' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300')}>
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', outcome === opt.value ? opt.bg : 'bg-slate-50')}>
                <opt.icon className={cn('w-5 h-5', outcome === opt.value ? opt.color : 'text-slate-400')} />
              </div>
              <span className="font-bold text-sm">{opt.label}</span>
            </button>
          ))}
        </div>
        <div className="mb-6">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notes (optional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add any notes about this demo..." rows={3} className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-blue-100" />
        </div>
        <div className="flex gap-3">
          <button onClick={handleClose} disabled={isSubmitting} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors disabled:opacity-50">Cancel</button>
          <button onClick={handleSubmit} disabled={!outcome || isSubmitting} className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle2 className="w-4 h-4" />Complete Demo</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
