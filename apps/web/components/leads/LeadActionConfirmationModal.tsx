'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  X, 
  Trash2, 
  Archive, 
  MessageSquare,
  ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface LeadActionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  type: 'delete' | 'archive';
  leadName: string;
}

export default function LeadActionConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  type, 
  leadName 
}: LeadActionConfirmationModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) return;
    setIsSubmitting(true);
    // Simulate API call to send for admin approval
    await new Promise(resolve => setTimeout(resolve, 1500));
    onConfirm(reason);
    setIsSubmitting(false);
    setReason('');
    onClose();
  };

  if (!isOpen) return null;

  const isDelete = type === 'delete';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden relative z-10"
        >
          {/* Header */}
          <div className={cn(
            "p-8 flex flex-col items-center text-center",
            isDelete ? "bg-red-50" : "bg-orange-50"
          )}>
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg",
              isDelete ? "bg-red-500 text-white" : "bg-orange-500 text-white"
            )}>
              {isDelete ? <Trash2 className="w-8 h-8" /> : <Archive className="w-8 h-8" />}
            </div>
            <h3 className="text-xl font-black text-slate-900 leading-tight">
              {isDelete ? 'Request Deletion' : 'Request Archival'}
            </h3>
            <p className="text-sm text-slate-500 font-medium mt-2">
              You are requesting to {type} <span className="font-bold text-slate-900">"{leadName}"</span>.
            </p>
          </div>

          {/* Form */}
          <div className="p-8 space-y-6">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-3">
              <ShieldAlert className="w-5 h-5 text-blue-600 shrink-0" />
              <p className="text-[10px] font-bold text-blue-800 leading-relaxed">
                This action requires <span className="underline">Admin Approval</span>. Your request will be sent to the internal team for review.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                Reason for {type === 'delete' ? 'Deletion' : 'Archival'} *
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                <textarea 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this lead should be removed/archived..."
                  rows={4}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[24px] text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                onClick={handleConfirm}
                disabled={!reason.trim() || isSubmitting}
                className={cn(
                  "flex-grow h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all",
                  isDelete ? "bg-red-500 hover:bg-red-600 text-white" : "bg-orange-500 hover:bg-orange-600 text-white"
                )}
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  `Send ${type} Request`
                )}
              </Button>
              <Button 
                onClick={onClose}
                variant="outline"
                className="px-6 h-14 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest border-slate-200"
              >
                Cancel
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Helper to handle classNames
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
