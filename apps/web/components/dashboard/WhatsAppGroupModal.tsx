'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, ExternalLink, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface WhatsAppGroupModalProps {
  isOpen: boolean;
  onJoin: () => void;
}

export default function WhatsAppGroupModal({ isOpen, onJoin }: WhatsAppGroupModalProps) {
  const whatsappLink = "https://chat.whatsapp.com/example-link"; // Placeholder for the actual link

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden my-auto"
          >
            {/* Header with WhatsApp Branding */}
            <div className="bg-[#25D366] p-8 text-white text-center relative overflow-hidden">
              <div className="absolute -top-4 -right-4 p-8 opacity-10 rotate-12">
                <MessageCircle className="w-32 h-32" />
              </div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-900/20">
                  <MessageCircle className="w-10 h-10 text-[#25D366]" />
                </div>
                <h2 className="text-2xl font-black mb-2 tracking-tight">Join the Community!</h2>
                <p className="text-emerald-50 text-sm font-medium">
                  Welcome to the Vemtap Affiliate Family
                </p>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <p className="text-slate-600 text-center leading-relaxed">
                  You&apos;re almost there! To stay updated with the latest tips, strategies, and announcements, join our official <span className="font-bold text-slate-900 text-emerald-600">Vemtap Affiliate WhatsApp Community</span>.
                </p>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg mt-0.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Why join?</p>
                    <p className="text-xs text-slate-500 leading-tight">Get real-time support from the team and network with top earners in the industry.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <a 
                  href={whatsappLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block w-full"
                  onClick={onJoin}
                >
                  <Button 
                    className="w-full h-14 rounded-2xl text-lg font-bold bg-[#25D366] hover:bg-[#128C7E] text-white shadow-xl shadow-emerald-100 border-none transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    Join WhatsApp Community
                    <ExternalLink className="w-5 h-5" />
                  </Button>
                </a>
                
                <button 
                  onClick={onJoin}
                  className="w-full py-3 text-slate-400 text-sm font-bold hover:text-slate-600 transition-colors flex items-center justify-center gap-2 group"
                >
                  I&apos;ve joined, take me to Dashboard
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            <div className="px-8 pb-8">
              <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: "80%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1 }}
                  className="h-full bg-[#25D366]"
                />
              </div>
              <p className="text-[10px] text-center mt-3 text-slate-400 font-bold uppercase tracking-[0.2em]">
                Final Step of Registration
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
