'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Users, Target, Trophy, ShieldCheck, Clock, TrendingUp, Gift, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface LineManagerGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  networkStats?: any;
}

export default function LineManagerGuideModal({ isOpen, onClose, networkStats }: LineManagerGuideModalProps) {
  const role = networkStats?.role || 'AFFILIATE';
  const isAgent = role === 'AGENT';
  const IsLineManager = role === 'SUPERVISOR' || role === 'MANAGER';
  
  const targetAffiliates = networkStats?.milestones?.agents?.target || (isAgent ? 90 : 30);
  const targetBusinesses = networkStats?.milestones?.businesses?.target || (isAgent ? 40 : 100);

  let targetsDescription = `Reach ${targetAffiliates} active affiliates and ${targetBusinesses} businesses closed within your network within 90 days.`;
  if (isAgent) {
    targetsDescription = `Maintain active operation for ${targetAffiliates} days on the platform and close ${targetBusinesses} personal active businesses.`;
  } else if (IsLineManager) {
    targetsDescription = `Reach ${targetAffiliates} active agents and ${targetBusinesses} cumulative network closed deals.`;
  }

  let rewardsDescription = `Unlock 12-month extended earnings, 10% team commission, and ₦15,000 in cash bonuses.`;
  if (IsLineManager) {
    rewardsDescription = `Unlock permanent Manager mode and secure overriding team commissions across referred agents.`;
  }

  const steps = [
    {
      title: isAgent ? "1. Maintain Daily Activity" : "1. Build Your Team",
      desc: isAgent 
        ? "Consistently perform operational duties, submit reports, and verify attendance daily." 
        : "Recruit affiliates using your special link. They become part of your Line Manager Network.",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      title: "2. Hit the Targets",
      desc: targetsDescription,
      icon: Target,
      color: "text-orange-600",
      bg: "bg-orange-50"
    },
    {
      title: "3. Massive Rewards",
      desc: rewardsDescription,
      icon: Trophy,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden"
          >
            <div className="relative h-40 bg-blue-600 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -ml-16 -mt-16" />
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-white rounded-full -mr-24 -mb-24" />
              </div>
              <div className="relative z-10 text-center text-white px-6">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-md border border-white/30">
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight">
                  {IsLineManager ? "Manager Guide" : "Line Manager Guide"}
                </h2>
              </div>
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 bg-black/20 hover:bg-black/30 rounded-full text-white transition-colors z-20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div className="space-y-6">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex gap-4 group">
                    <div className={cn("w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center shadow-sm transition-transform group-hover:scale-110", step.bg)}>
                      <step.icon className={cn("w-6 h-6", step.color)} />
                    </div>
                    <div className="pt-1">
                      <h3 className="text-sm font-black text-slate-900 mb-1">{step.title}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-emerald-600 shadow-sm mb-2">
                    <Clock className="w-4 h-4" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    {isAgent ? "Active Operating" : "Qualification Window"}
                  </p>
                  <p className="text-xs font-bold text-slate-900">
                    {isAgent ? `${targetAffiliates} Days` : "90 Days Window"}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm mb-2">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    {isAgent ? "Reporting Target" : "Commission Perk"}
                  </p>
                  <p className="text-xs font-bold text-slate-900">
                    {isAgent ? `${networkStats?.reportingScore ?? 85}% Score` : "10% Override"}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <Button 
                  onClick={onClose}
                  className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest shadow-xl shadow-blue-100"
                >
                  Got it, Let's Build!
                </Button>
                <p className="text-[10px] text-center text-slate-400 font-bold">
                  *All targets must be achieved within the 90-day window.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
