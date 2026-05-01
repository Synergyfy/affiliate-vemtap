'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Zap, 
  Info, 
  Play,
  ArrowRight
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface TourStep {
  title: string;
  description: string;
  path: string;
  target?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    path: '/dashboard',
    title: 'Dashboard Overview',
    description: 'Welcome to your command center! Here you can track your total earnings, referrals, and view your performance charts at a glance.',
  },
  {
    path: '/dashboard/businesses',
    title: 'Businesses Referred',
    description: 'Manage every business you have brought to Vemtap. Track their subscription status and see which ones are generating the most commission for you.',
  },
  {
    path: '/dashboard/network',
    title: 'Your Network',
    description: 'View your sub-affiliates and track "Indirect Commissions". Growing your network is the fastest way to earn passive income.',
  },
  {
    path: '/dashboard/wallet',
    title: 'Earnings & Wallet',
    description: 'This is where you manage your money. View your transaction history and request instant withdrawals directly to your bank account.',
  },
  {
    path: '/dashboard/leaderboard',
    title: 'Top Performers',
    description: 'See how you rank against other affiliates. Top performers every week get special bonuses and exclusive perks.',
  },
  {
    path: '/dashboard/tools',
    title: 'Marketing Tools',
    description: 'Access your unique referral links, QR codes, and pre-designed banners to help you promote Vemtap like a pro.',
  },
  {
    path: '/dashboard/training',
    title: 'Training Academy',
    description: 'Learn the secrets of successful affiliate marketing. We have curated videos and guides to help you close more deals.',
  },
  {
    path: '/dashboard/profile',
    title: 'Your Account',
    description: 'Update your personal details, set up your payout bank account, and manage your security settings.',
  }
];

export default function DashboardTour({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Ensure we start at the right step if they are on a specific page
      const index = TOUR_STEPS.findIndex(step => step.path === pathname);
      if (index !== -1) setCurrentStep(index);
      else setCurrentStep(0);
    }
  }, [isOpen, pathname]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      const nextStep = TOUR_STEPS[currentStep + 1];
      router.push(nextStep.path);
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      const prevStep = TOUR_STEPS[currentStep - 1];
      router.push(prevStep.path);
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    onClose();
    localStorage.setItem('hasCompletedTour', 'true');
  };

  const step = TOUR_STEPS[currentStep];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 pointer-events-none">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] pointer-events-auto"
            onClick={handleComplete}
          />

          {/* Tour Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl border border-slate-200 overflow-hidden pointer-events-auto"
          >
            {/* Header */}
            <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest">Platform Tour</h3>
                  <p className="text-[10px] text-slate-400 font-bold">STEP {currentStep + 1} OF {TOUR_STEPS.length}</p>
                </div>
              </div>
              <button 
                onClick={handleComplete}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <h4 className="text-xl font-black text-slate-900">{step.title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Progress Dots */}
              <div className="flex gap-1.5">
                {TOUR_STEPS.map((_, idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      "h-1 rounded-full transition-all duration-300",
                      idx === currentStep ? "w-8 bg-blue-600" : "w-2 bg-slate-100"
                    )}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <button 
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className={cn(
                    "flex items-center gap-2 text-sm font-bold transition-colors",
                    currentStep === 0 ? "text-slate-200 cursor-not-allowed" : "text-slate-400 hover:text-slate-900"
                  )}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>

                <Button 
                  onClick={handleNext}
                  className="h-12 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 font-bold"
                >
                  {currentStep === TOUR_STEPS.length - 1 ? "Finish Tour" : "Next Page"}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Indicator */}
            <div className="bg-blue-50 px-8 py-3 flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Currently showing: {pathname}</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
