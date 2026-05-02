'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { motion } from 'framer-motion';
import { 
  ShieldCheck,
  CheckCircle2,
  Info,
  Trophy,
  Target,
  Gift,
  Clock,
  ArrowRight,
  Lock,
  TrendingUp,
  Users
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import ManagerGuideModal from '@/components/dashboard/ManagerGuideModal';
import { useAuth } from '@/hooks/use-auth';

export default function NetworkPage() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  // Calculate real-time countdown for 90-day window
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number, seconds: number}>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!user?.createdAt) return;
    
    const NINETY_DAYS_MS = timeLimitDays * 24 * 60 * 60 * 1000;
    const signupDate = new Date(user.createdAt);
    const targetDate = new Date(signupDate.getTime() + NINETY_DAYS_MS);

    const timer = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(timer);
      } else {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [user?.createdAt]);

  useEffect(() => {
    // Auto-show guide on first visit
    setShowGuide(true);
  }, []);
  
  // Mock data for milestones
  const affiliateCount = 18;
  const businessesCount = 72;
  // Mock targets (to be replaced by API settings later)
  const timeLimitDays = 90;
  const targetAffiliates = 30;
  const targetBusinesses = 100;
  const rewardDuration: string = '1year';

  const rewardDurationLabel = 
    rewardDuration === '3months' ? '3-Month' :
    rewardDuration === '6months' ? '6-Month' :
    rewardDuration === '1year' ? '12-Month' :
    rewardDuration === '2years' ? '24-Month' : 'Lifetime';
  
  const affiliateProgress = (affiliateCount / targetAffiliates) * 100;
  const businessProgress = (businessesCount / targetBusinesses) * 100;

  const isAffiliateMilestoneReached = affiliateCount >= targetAffiliates;
  const isBusinessMilestoneReached = businessesCount >= targetBusinesses;
  const isFullMilestoneReached = isAffiliateMilestoneReached && isBusinessMilestoneReached;

  const managers = [
    { id: 1, name: 'Sarah Johnson', referrals: 12, earnings: '₦45,000', status: 'Active' },
    { id: 2, name: 'Michael Chen', referrals: 8, earnings: '₦28,500', status: 'Active' },
    { id: 3, name: 'David Smith', referrals: 3, earnings: '₦12,000', status: 'Active' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {!isUnlocked ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 md:p-16 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-slate-100">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(affiliateProgress, businessProgress)}%` }}
                className="h-full bg-blue-600 transition-all duration-1000"
              />
            </div>
            
            <div className="absolute top-6 right-6">
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full bg-white/50 backdrop-blur-sm border-slate-200 text-slate-600 font-bold hover:bg-white transition-all"
                onClick={() => setShowGuide(true)}
              >
                <Info className="w-4 h-4 mr-2" />
                How it Works
              </Button>
            </div>

            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-50 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8">
              <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
            </div>

            <div className="flex flex-col items-center gap-4 mb-8">
              <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-6 py-2 rounded-full border border-orange-100 shadow-sm animate-pulse">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-black uppercase tracking-widest">
                  {timeLeft.days}d : {timeLeft.hours}h : {timeLeft.minutes}m : {timeLeft.seconds}s Left
                </span>
              </div>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Unlock Manager Status</h2>
            <p className="text-sm sm:text-base text-slate-500 max-w-lg mx-auto mb-8 sm:mb-12">
              Build your team and hit the targets <span className="text-orange-600 font-bold">within {timeLimitDays} days</span> to unlock your <span className="font-bold text-blue-600">Manager Network</span> and earn <span className="font-bold text-blue-600">10% of affiliate earnings</span>.
            </p>

            <div className="max-w-2xl mx-auto space-y-8">
              {/* Progress 1: Affiliates */}
              {/* Progress 1: Affiliates */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="text-left">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Affiliate Target</span>
                    <span className="text-sm font-bold text-slate-900">{affiliateCount} / {targetAffiliates} Affiliates</span>
                  </div>
                  <span className="text-sm font-bold text-blue-600">{Math.round(affiliateProgress)}%</span>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-1">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${affiliateProgress}%` }}
                    className="h-full bg-blue-600 rounded-full"
                  />
                </div>
              </div>

              {/* Progress 2: Businesses */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="text-left">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Business Target</span>
                    <span className="text-sm font-bold text-slate-900">{businessesCount} / {targetBusinesses} Businesses</span>
                  </div>
                  <span className="text-sm font-bold text-blue-600">{Math.round(businessProgress)}%</span>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-1">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${businessProgress}%` }}
                    className="h-full bg-blue-600 rounded-full"
                  />
                </div>
              </div>
              
              <Button className="w-full mt-10 text-sm sm:text-base h-14 bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100 font-black uppercase tracking-widest" onClick={() => router.push('/dashboard/tools')}>
                Start Recruiting Now
              </Button>

              {/* High Visibility Benefit Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="bg-emerald-50/50 p-6 rounded-[24px] border-2 border-emerald-100 text-center group hover:bg-emerald-50 transition-colors">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Verified Rewards</h4>
                  <p className="text-xs text-emerald-800 font-bold leading-relaxed">Unlock <span className="text-emerald-600">Extended {rewardDurationLabel}</span> earnings mode on all referrals.</p>
                </div>
                <div className="bg-blue-50/50 p-6 rounded-[24px] border-2 border-blue-100 text-center group hover:bg-blue-50 transition-colors">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">10% Team Share</h4>
                  <p className="text-xs text-blue-800 font-bold leading-relaxed">Earn a <span className="text-blue-600">10% commission</span> from every sale your team makes.</p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Manager Network</h2>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm sm:text-base text-slate-500">Milestone System Active</p>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <div className={cn(
                    "flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-full",
                    isFullMilestoneReached ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-blue-50 text-blue-600 border border-blue-100"
                  )}>
                    <Clock className="w-4 h-4" />
                    {isFullMilestoneReached ? `${rewardDurationLabel} Mode Unlocked` : "3-Month Mode Active"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full text-xs sm:text-sm font-bold flex items-center border border-emerald-100">
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Verified Manager
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full border-slate-200 text-slate-500 font-bold hover:bg-slate-50"
                  onClick={() => setShowGuide(true)}
                >
                  <Info className="w-4 h-4 mr-2" />
                  Guide
                </Button>
              </div>
            </div>

            {/* Section E: Milestone & Bonus Tracker */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12 transition-transform group-hover:scale-110">
                  <Trophy className="w-32 h-32 text-slate-900" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Progress to Milestone
                </h3>
                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-6 ml-7 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> {timeLeft.days}d : {timeLeft.hours}h : {timeLeft.minutes}m : {timeLeft.seconds}s Remaining
                </p>
                
                <div className="space-y-6 relative z-10">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-slate-600">Affiliates: {affiliateCount} / {targetAffiliates}</span>
                      <span className="text-blue-600">{Math.round(affiliateProgress)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div animate={{ width: `${affiliateProgress}%` }} className="h-full bg-blue-600" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-slate-600">Businesses: {businessesCount} / {targetBusinesses}</span>
                      <span className="text-blue-600">{Math.round(businessProgress)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div animate={{ width: `${businessProgress}%` }} className="h-full bg-blue-600" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col justify-between">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-emerald-600" />
                  Bonus Tracker
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className={cn(
                    "p-6 rounded-3xl border-2 transition-all",
                    isAffiliateMilestoneReached ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-100"
                  )}>
                    <p className={cn("text-xs font-black uppercase tracking-widest mb-2", isAffiliateMilestoneReached ? "text-emerald-600" : "text-slate-400")}>Affiliate Reward</p>
                    <h4 className={cn("text-2xl font-black", isAffiliateMilestoneReached ? "text-emerald-700" : "text-slate-900")}>₦5,000</h4>
                    {isAffiliateMilestoneReached ? (
                      <div className="mt-4 flex items-center gap-2 text-emerald-600 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" /> Claimed
                      </div>
                    ) : (
                      <div className="mt-4 text-slate-400 text-[10px] font-bold">Locked</div>
                    )}
                  </div>
                  <div className={cn(
                    "p-6 rounded-3xl border-2 transition-all",
                    isBusinessMilestoneReached ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-100"
                  )}>
                    <p className={cn("text-xs font-black uppercase tracking-widest mb-2", isBusinessMilestoneReached ? "text-emerald-600" : "text-slate-400")}>Business Reward</p>
                    <h4 className={cn("text-2xl font-black", isBusinessMilestoneReached ? "text-emerald-700" : "text-slate-900")}>₦10,000</h4>
                    {isBusinessMilestoneReached ? (
                      <div className="mt-4 flex items-center gap-2 text-emerald-600 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" /> Claimed
                      </div>
                    ) : (
                      <div className="mt-4 text-slate-400 text-[10px] font-bold">Locked</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Your Affiliate Team</h3>
                <Button variant="outline" size="sm" className="text-xs sm:text-sm">View All</Button>
              </div>
              <div className="divide-y divide-slate-100">
                {managers.map((affiliate) => (
                  <div key={affiliate.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm sm:text-base uppercase">
                        {(affiliate.name || 'A').charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900">
                          {affiliate.name}
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-500">Sub-affiliate</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm sm:text-base font-bold text-emerald-600">{affiliate.earnings}</p>
                      <p className="text-[10px] sm:text-xs text-slate-400">10% team share</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 sm:p-6 flex gap-3 sm:gap-4">
          <Info className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
          <div className="text-xs sm:text-sm text-blue-800">
            <p className="font-bold mb-1">How Milestone System Works:</p>
            <p>To unlock the 12-Month Extended Earnings mode, you must recruit 30 active affiliates and close 100 businesses within your network <span className="font-black underline">within 90 days</span>. You also earn a ₦5,000 bonus for the affiliate target and ₦10,000 for the business target.</p>
          </div>
        </div>

        {/* Mock Toggle Button for Testing */}
        <div className="fixed bottom-8 right-8 z-50">
            <Button 
              variant="outline" 
              className="bg-white/80 backdrop-blur-sm border-2 border-blue-600 text-blue-600 font-bold shadow-2xl hover:bg-blue-600 hover:text-white transition-all scale-90 sm:scale-100"
              onClick={() => setIsUnlocked(!isUnlocked)}
            >
              {isUnlocked ? 'Mock: Lock Manager Status' : 'Mock: Unlock Manager Status'}
            </Button>
        </div>

        <ManagerGuideModal 
          isOpen={showGuide} 
          onClose={() => setShowGuide(false)} 
        />
      </div>
    </DashboardLayout>
  );
}
