'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, PenTool, Calendar, User, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { usePendingAgreements, useSignAgreement } from '@/services/useAgreementHooks';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export default function AgreementSignModal() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { data: pendingAgreementsRaw, isLoading } = usePendingAgreements();
  const pendingAgreements = Array.isArray(pendingAgreementsRaw) ? pendingAgreementsRaw : [];
  const signAgreement = useSignAgreement();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [signatureName, setSignatureName] = useState('');
  const [signatureDate] = useState(new Date().toISOString().split('T')[0]);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const [showSuccessState, setShowSuccessState] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const currentAgreement = pendingAgreements && pendingAgreements.length > currentIndex 
    ? pendingAgreements[currentIndex] 
    : null;

  // Reset signature form and scroll state when moving to a new agreement
  useEffect(() => {
    if (currentAgreement) {
      setSignatureName('');
      setHasScrolledToBottom(false);
      setIsAgreed(false);
      setShowSuccessState(false);
      
      // Reset scroll container position
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    }
  }, [currentIndex, currentAgreement]);

  // Track scrolling to enforce scroll-to-read requirement
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;

    // Threshold of 15px from bottom
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 15;
    if (isAtBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAgreement || !signatureName || !isAgreed || !hasScrolledToBottom) return;

    try {
      await signAgreement.mutateAsync({
        id: currentAgreement.id,
        version: currentAgreement.version,
      });

      // Show a premium success checkmark animation
      setShowSuccessState(true);
      
      setTimeout(() => {
        if (pendingAgreements && currentIndex + 1 < pendingAgreements.length) {
          setCurrentIndex(prev => prev + 1);
        } else {
          // Fully completed
          setCurrentIndex(0);
        }
      }, 1500);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Failed to sign agreement. Please try again.';
      showToast(errMsg, 'error');
    }
  };

  const hasPending = pendingAgreements && pendingAgreements.length > 0;

  return (
    <AnimatePresence>
      {hasPending && currentAgreement && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Glassmorphic backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[90svh] flex flex-col"
          >
            {/* Sequential Progress Indicators */}
            {pendingAgreements && pendingAgreements.length > 1 && (
              <div className="absolute top-4 left-6 z-20 flex gap-1.5">
                {pendingAgreements.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`h-1 rounded-full transition-all duration-300 ${
                      idx === currentIndex 
                        ? 'w-6 bg-white' 
                        : idx < currentIndex 
                          ? 'w-2 bg-emerald-400' 
                          : 'w-2 bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Header with deep blue-slate gradient and glass effect */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-blue-900 p-8 text-white text-center relative overflow-hidden shrink-0">
              <div className="absolute -right-8 -top-8 p-8 opacity-5 rotate-12">
                <ShieldCheck className="w-36 h-36" />
              </div>
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-14 h-14 bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center mb-3 backdrop-blur-md">
                  <PenTool className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-black mb-1">Review & Sign Agreement</h2>
                <p className="text-slate-300 text-xs font-semibold max-w-md mx-auto">
                  {pendingAgreements.length > 1 
                    ? `Agreement ${currentIndex + 1} of ${pendingAgreements.length}: ${currentAgreement.title}`
                    : currentAgreement.title
                  }
                </p>
                <div className="mt-2 text-[10px] bg-blue-500/20 border border-blue-500/30 px-3 py-1 rounded-full text-blue-300 font-bold uppercase tracking-wider">
                  Target: {user?.role} • Version {currentAgreement.version}
                </div>
              </div>
            </div>

            {/* Content / Signing Forms - Scrollable Wrapper */}
            <div className="overflow-y-auto flex-grow p-6 sm:p-8 space-y-6">
              {showSuccessState ? (
                // Success Signature Animation
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-12 flex flex-col items-center justify-center space-y-4 text-center"
                >
                  <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
                    <Check className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800">Signature Submitted!</h3>
                  <p className="text-slate-500 text-sm max-w-sm">
                    {pendingAgreements && currentIndex + 1 < pendingAgreements.length
                      ? 'Loading next pending agreement...'
                      : 'Thank you. You have signed all required agreements.'
                    }
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Brief description card */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/80">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Description / Summary</p>
                    <p className="text-xs font-semibold text-slate-600 leading-normal">{currentAgreement.description}</p>
                  </div>

                  {/* Scrollable Agreement Text */}
                  <div className="relative group">
                    <div 
                      ref={scrollContainerRef}
                      onScroll={handleScroll}
                      className="bg-slate-50 p-5 rounded-2xl border border-slate-100 max-h-[220px] overflow-y-auto text-slate-600 text-xs leading-relaxed scrollbar-thin scroll-smooth"
                    >
                      <div 
                        className="prose prose-slate prose-xs max-w-none prose-h4:text-slate-800 prose-h4:font-bold prose-p:text-slate-600" 
                        dangerouslySetInnerHTML={{ __html: currentAgreement.content }} 
                      />
                    </div>

                    {/* Dynamic Scroll to Bottom Helper */}
                    {!hasScrolledToBottom && (
                      <div className="absolute bottom-2 right-2 bg-slate-900/90 text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 backdrop-blur-sm pointer-events-none animate-bounce">
                        Scroll to bottom to sign <ArrowRight className="w-3 h-3 rotate-90" />
                      </div>
                    )}
                  </div>

                  {/* Checkbox and Scrolling validation error prompt */}
                  <div className="space-y-4">
                    <label className={`flex items-start gap-3 p-4 rounded-2xl border transition-all duration-300 ${
                      !hasScrolledToBottom 
                        ? 'bg-slate-50/50 border-slate-100 opacity-60 cursor-not-allowed'
                        : isAgreed 
                          ? 'bg-blue-50/50 border-blue-200 text-blue-900'
                          : 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer'
                    }`}>
                      <input 
                        type="checkbox"
                        checked={isAgreed}
                        disabled={!hasScrolledToBottom}
                        onChange={(e) => setIsAgreed(e.target.checked)}
                        className="w-4.5 h-4.5 mt-0.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500 disabled:opacity-50"
                      />
                      <div className="text-xs leading-snug">
                        <span className="font-bold block text-slate-800">I Agree to the Terms & Conditions</span>
                        <span className="text-slate-400 font-medium block mt-0.5">
                          I have read this agreement in full and confirm my consent to all outlined obligations and terms.
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Signature Section */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <User className="w-3.5 h-3.5" /> E-Signature (Type Full Name)
                      </label>
                      <Input 
                        placeholder="Your typed full name"
                        value={signatureName}
                        disabled={!isAgreed}
                        onChange={(e) => setSignatureName(e.target.value)}
                        required
                        className="h-11 border-slate-200 focus:border-blue-500 rounded-xl font-medium text-xs disabled:opacity-50 disabled:bg-slate-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" /> Date of Agreement
                      </label>
                      <Input 
                        type="date"
                        value={signatureDate}
                        readOnly
                        className="h-11 border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed rounded-xl font-medium text-xs"
                      />
                    </div>
                  </div>

                  {/* Submission segment with safety alerts */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-800 text-[10px] font-medium leading-normal">
                      <ShieldCheck className="w-4.5 h-4.5 shrink-0 text-emerald-600" />
                      This electronic signature is legally binding. Your identity, IP address, and timestamp will be logged on submit.
                    </div>
                    
                    <Button 
                      type="submit"
                      isLoading={signAgreement.isPending}
                      disabled={!signatureName || !isAgreed || !hasScrolledToBottom || signAgreement.isPending}
                      className="w-full h-12.5 rounded-2xl text-sm font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100/50 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      Sign & Agree to Terms
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
