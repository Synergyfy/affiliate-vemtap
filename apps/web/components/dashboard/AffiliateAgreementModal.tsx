'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, PenTool, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/use-auth';

interface AffiliateAgreementModalProps {
  isOpen: boolean;
  onSign: (name: string, date: string) => void;
}

export default function AffiliateAgreementModal({ isOpen, onSign }: AffiliateAgreementModalProps) {
  const { user } = useAuth();
  const [signatureName, setSignatureName] = useState('');
  const [signatureDate, setSignatureDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dynamicAgreement, setDynamicAgreement] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vemtap_agreement_template');
      if (saved) setDynamicAgreement(saved);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signatureName || !signatureDate) return;
    
    setIsSubmitting(true);
    // Simulate slight delay for professional feel
    setTimeout(() => {
      onSign(signatureName, signatureDate);
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
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
            className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden my-auto"
          >
            {/* Header / Banner */}
            <div className="bg-blue-600 p-8 text-white text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                <ShieldCheck className="w-32 h-32" />
              </div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
                  <PenTool className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-black mb-2">Affiliate Agreement</h2>
                <p className="text-blue-100 text-sm max-w-md mx-auto">
                  Please sign this legal document to finalize your agreement with the Vemtap Affiliate Program.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 sm:p-10 space-y-8">
              {/* Agreement Content */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 max-h-[300px] overflow-y-auto space-y-4 text-slate-600 text-sm leading-relaxed scrollbar-thin">
                <p className="font-bold text-slate-900">Between: Vemtap Team (&quot;Company&quot;) and {user?.fullName || 'the Registered Affiliate'} (&quot;Affiliate&quot;)</p>
                
                {dynamicAgreement ? (
                  <div className="prose prose-slate prose-sm max-w-none prose-h4:text-slate-800 prose-h4:font-bold prose-p:text-slate-600" dangerouslySetInnerHTML={{ __html: dynamicAgreement }} />
                ) : (
                  <>
                    <h4 className="font-bold text-slate-800">1. Independent Contractor Status</h4>
                    <p>
                      The Affiliate acknowledges and agrees that their relationship with Vemtap is that of an <strong>Independent Contractor</strong>. This agreement DOES NOT create an employee-employer relationship, a partnership, or a joint venture between the parties.
                    </p>

                    <h4 className="font-bold text-slate-800">2. No Staff Benefits</h4>
                    <p>
                      The Affiliate is not entitled to any benefits, including but not limited to health insurance, paid leave, pension contributions, or any other staff-related perks provided by Vemtap to its full-time employees.
                    </p>

                    <h4 className="font-bold text-slate-800">3. Non-Representation</h4>
                    <p>
                      The Affiliate shall not represent themselves as a staff member, agent, or legal representative of Vemtap in any capacity that could bind the Company to any contract or obligation. Any marketing materials used must clearly state the &quot;Affiliate&quot; status.
                    </p>

                    <h4 className="font-bold text-slate-800">4. Tax Responsibility</h4>
                    <p>
                      The Affiliate is solely responsible for reporting and paying any taxes applicable to the commissions earned through the Vemtap Affiliate Network according to local laws.
                    </p>

                    <h4 className="font-bold text-slate-800">5. Confidentiality</h4>
                    <p>
                      The Affiliate agrees to keep confidential any non-public information regarding Vemtap&apos;s business processes, technology, and partner businesses discovered during their participation in the program.
                    </p>
                  </>
                )}

                <p className="pt-4 border-t border-slate-200 text-[11px] uppercase tracking-wider font-bold text-slate-400">
                  By typing your name below, you electronically sign this agreement.
                </p>
              </div>

              {/* Signing Section */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <User className="w-3 h-3" /> Full Name (Digital Signature)
                  </label>
                  <Input 
                    placeholder="Type your full name"
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    required
                    className="h-12 border-slate-200 focus:border-blue-500 rounded-xl font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> Current Date
                  </label>
                  <Input 
                    type="date"
                    value={signatureDate}
                    readOnly
                    className="h-12 border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-700 text-xs font-medium">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  This is a legally binding electronic agreement. Your IP address and timestamp will be logged upon submission.
                </div>
                
                <Button 
                  type="submit"
                  isLoading={isSubmitting}
                  disabled={!signatureName || !signatureDate}
                  className="w-full h-14 rounded-2xl text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-[0.98]"
                >
                  Confirm & Sign Agreement
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
