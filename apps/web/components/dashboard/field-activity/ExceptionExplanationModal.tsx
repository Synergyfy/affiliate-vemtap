'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ExceptionExplanationProps {
  visitId: string;
  businessName: string;
  onSubmit: (reason: string, notes?: string) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const EXCEPTION_REASONS = [
  { value: 'WAITING_OWNER', label: 'Waiting for business owner' },
  { value: 'WAITING_MANAGER', label: 'Waiting for manager' },
  { value: 'CUSTOMER_MEETING', label: 'Customer meeting' },
  { value: 'TRAFFIC', label: 'Traffic / transport delay' },
  { value: 'TRANSPORT_ISSUE', label: 'Transport issue' },
  { value: 'NETWORK_ISSUE', label: 'Network/connectivity issue' },
  { value: 'GPS_ISSUE', label: 'GPS/location issue' },
  { value: 'OTHER', label: 'Other' },
];

export function ExceptionExplanationModal({
  visitId,
  businessName,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ExceptionExplanationProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    const reason = selectedReason === 'OTHER' ? customReason : selectedReason;
    if (!reason) return;

    await onSubmit(reason, notes);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onCancel}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-5 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Unusual Transition Detected</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Help us understand what happened</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Your visit to <strong>{businessName}</strong> was flagged as an unusual transition.
              Please select the reason for the delay.
            </p>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Reason for delay
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {EXCEPTION_REASONS.map((reason) => (
                  <button
                    key={reason.value}
                    type="button"
                    onClick={() => {
                      setSelectedReason(reason.value);
                      if (reason.value !== 'OTHER') setCustomReason('');
                    }}
                    className={cn(
                      'p-3 rounded-xl text-left text-sm font-medium border-2 transition-all',
                      selectedReason === reason.value
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300'
                        : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-blue-300'
                    )}
                  >
                    {reason.label}
                  </button>
                ))}
              </div>

              {selectedReason === 'OTHER' && (
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Enter custom reason..."
                  className="mt-2 w-full px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Additional details (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional context..."
                rows={3}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
          </div>

          <div className="p-5 border-t border-slate-200 dark:border-slate-700 flex gap-3">
            <button
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedReason}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Submit Explanation
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}