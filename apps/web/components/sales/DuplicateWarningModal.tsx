'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, X, ExternalLink, Copy } from 'lucide-react';
import { DuplicateWarning } from '@/types/sales-pipeline';

interface DuplicateWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  warning: DuplicateWarning;
  businessName?: string;
}

export default function DuplicateWarningModal({
  isOpen,
  onClose,
  onProceed,
  warning,
  businessName = 'Unknown Business',
}: DuplicateWarningModalProps) {
  if (!isOpen || !warning.isMatch) return null;

  const confidenceColor = {
    HIGH: 'bg-red-50 border-red-200 text-red-800',
    MEDIUM: 'bg-amber-50 border-amber-200 text-amber-800',
    LOW: 'bg-slate-50 border-slate-200 text-slate-600',
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl overflow-hidden"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">
                Possible Duplicate Business
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                {warning.reason || 'A similar business already exists in VEMTAP.'}
              </p>
            </div>
          </div>

          {/* Existing Business Info */}
          {warning.existingBusiness && (
            <div className={cn(
              "border rounded-2xl p-4 mb-4",
              confidenceColor[warning.confidence] || confidenceColor.MEDIUM,
            )}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-black uppercase tracking-widest opacity-70">
                  Existing Business
                </p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20">
                  Confidence: {warning.confidence}
                </span>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-900 dark:text-white">
                  {warning.existingBusiness.businessName}
                </p>
                {warning.existingBusiness.contactName && (
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    Contact: {warning.existingBusiness.contactName}
                  </p>
                )}
                {warning.existingBusiness.phone && (
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    Phone: {warning.existingBusiness.phone}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Status Info */}
          {warning.existingBusiness && (
            <div className="mb-4 text-center">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
                Current Status
              </p>
              <span className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-xs font-bold">
                {warning.existingBusiness.status || 'Unknown'}
              </span>
            </div>
          )}

          {/* Warning Description */}
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-6 leading-relaxed">
            This is {businessName ? `"${businessName}"` : 'this business'} matches an existing record.
            The backend is authoritative for duplicate detection.
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {warning.existingBusiness && (
              <button
                onClick={() => {
                  // View existing business
                  window.open(`/dashboard/market-mapping/pipeline`, '_blank');
                }}
                className="w-full py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View Existing Business
              </button>
            )}

            <button
              onClick={onProceed}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2"
            >
              Continue Anyway
            </button>

            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
