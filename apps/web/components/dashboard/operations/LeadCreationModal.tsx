'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import LeadCaptureForm from '@/components/leads/LeadCaptureForm';

interface LeadCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId?: string;
  isAdmin?: boolean;
}

export default function LeadCreationModal({ isOpen, onClose, agentId, isAdmin = false }: LeadCreationModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
          className="bg-white rounded-[40px] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden relative z-10 flex flex-col"
        >
          {/* Header */}
          <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h2 className="text-2xl font-black text-slate-900 leading-tight">Quick Capture</h2>
              <p className="text-xs text-slate-500 font-medium">Record a business lead instantly. Details can be completed later.</p>
            </div>
            <button 
              onClick={onClose}
              className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-grow overflow-y-auto p-8 lg:p-12">
            <LeadCaptureForm 
              agentId={agentId} 
              isPublic={false} 
              onSuccess={onClose} 
              isAdmin={isAdmin}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
