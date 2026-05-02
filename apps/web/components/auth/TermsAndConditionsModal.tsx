'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, CheckCircle2, AlertCircle, ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface TermsAndConditionsModalProps {
  isOpen: boolean;
  onAccept: () => void;
}

export default function TermsAndConditionsModal({ isOpen, onAccept }: TermsAndConditionsModalProps) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      // Using a small buffer of 20px
      if (scrollTop + clientHeight >= scrollHeight - 20) {
        setHasScrolledToBottom(true);
      }
    }
  };

  useEffect(() => {
    // Reset if it opens/reopens
    if (isOpen) {
      setHasScrolledToBottom(false);
      setIsAccepted(false);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                <ScrollText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Terms and Conditions</h2>
                <p className="text-sm text-slate-500 font-medium text-[10px] uppercase tracking-wider">Please read entirely to continue</p>
              </div>
            </div>

            {/* Content Area */}
            <div 
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex-grow overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-600 text-sm leading-relaxed scrollbar-thin scrollbar-thumb-slate-200"
            >
              <section className="space-y-3">
                <h3 className="font-bold text-slate-900 text-base">1. Introduction</h3>
                <p>
                  Welcome to the Vemtap Affiliate Network. By registering as an affiliate, you agree to comply with and be bound by the following terms and conditions. Please review them carefully.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="font-bold text-slate-900 text-base">2. Eligibility</h3>
                <p>
                  To be an affiliate, you must be at least 18 years of age and possess the legal authority to enter into this agreement. You must provide accurate and complete information during the registration process.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="font-bold text-slate-900 text-base">3. Commission Structure</h3>
                <p>
                  Affiliates earn a 20% direct commission on the first subscription payment of every business successfully referred to Vemtap. Commissions are calculated based on the net subscription price after any discounts or taxes.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="font-bold text-slate-900 text-base">4. Payout Policy</h3>
                <p>
                  Withdrawals are processed within 24-48 hours of a request. The minimum withdrawal amount is ₦2,000. Vemtap reserves the right to withhold payments if fraudulent activity is suspected.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="font-bold text-slate-900 text-base">5. Prohibited Activities</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Creating multiple accounts to refer yourself.</li>
                  <li>Using misleading or deceptive advertising to attract referrals.</li>
                  <li>Spamming potential businesses or using unauthorized contact methods.</li>
                  <li>Representing yourself as a direct employee or executive of Vemtap.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="font-bold text-slate-900 text-base">6. Termination</h3>
                <p>
                  Vemtap reserves the right to terminate your affiliate status at any time if you violate these terms. Upon termination, any unpaid commissions earned through prohibited activities will be forfeited.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="font-bold text-slate-900 text-base">7. Limitation of Liability</h3>
                <p>
                  Vemtap shall not be liable for any indirect, incidental, or consequential damages arising from your participation in the affiliate program.
                </p>
              </section>

              <div className="pt-4 border-t border-slate-50 italic text-slate-400 text-xs">
                Last updated: April 8, 2026
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-4">
              <div className="flex items-start gap-3">
                <div className="pt-0.5">
                  <input 
                    type="checkbox" 
                    id="accept-terms"
                    disabled={!hasScrolledToBottom}
                    checked={isAccepted}
                    onChange={(e) => setIsAccepted(e.target.checked)}
                    className={cn(
                      "w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-all",
                      !hasScrolledToBottom ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                    )}
                  />
                </div>
                <label 
                  htmlFor="accept-terms" 
                  className={cn(
                    "text-sm font-medium transition-colors",
                    !hasScrolledToBottom ? "text-slate-400" : "text-slate-700 cursor-pointer"
                  )}
                >
                  I have read and agree to the Terms and Conditions of the Vemtap Affiliate Network.
                </label>
              </div>

              {!hasScrolledToBottom && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg text-xs font-bold">
                  <AlertCircle className="w-4 h-4" />
                  Please scroll to the bottom of the content to enable acceptance.
                </div>
              )}

              <Button 
                onClick={onAccept}
                disabled={!isAccepted}
                className="w-full h-12 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400"
              >
                Accept and Continue
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
