'use client';

import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, ShieldQuestion, ArrowUpCircle, ArrowDownCircle, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  type: 'upgrade' | 'downgrade' | 'suspend' | 'reactivate';
}

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText,
  type 
}: ConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-8"
          >
            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${
                type === 'upgrade' ? 'bg-purple-100 text-purple-600' : 
                type === 'suspend' ? 'bg-red-100 text-red-600' :
                type === 'reactivate' ? 'bg-emerald-100 text-emerald-600' :
                'bg-slate-100 text-slate-600'
              }`}>
                {type === 'upgrade' && <ArrowUpCircle className="w-8 h-8" />}
                {type === 'downgrade' && <ArrowDownCircle className="w-8 h-8" />}
                {type === 'suspend' && <ShieldAlert className="w-8 h-8" />}
                {type === 'reactivate' && <ShieldCheck className="w-8 h-8" />}
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">
                {message}
              </p>

              <div className="flex w-full gap-3">
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="flex-1 h-12 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={onConfirm}
                  className={`flex-1 h-12 rounded-xl font-bold text-white shadow-lg ${
                    type === 'upgrade' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-200' : 
                    type === 'suspend' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' :
                    type === 'reactivate' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' :
                    'bg-slate-900 hover:bg-slate-800 shadow-slate-200'
                  }`}
                >
                  {confirmText}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
