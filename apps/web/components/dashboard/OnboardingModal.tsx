'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, 
  Target, 
  Users, 
  Wallet, 
  ChevronRight, 
  CheckCircle2, 
  PlayCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const steps = [
  {
    title: 'Welcome to Vemtap',
    description: 'Start your journey as an affiliate. Learn how to refer businesses and earn commissions.',
    icon: Rocket,
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  },
  {
    title: 'Refer Businesses',
    description: 'Use your unique referral code to sign up businesses to Vemtap services.',
    icon: Target,
    color: 'text-orange-600',
    bg: 'bg-orange-50'
  },
  {
    title: 'Build your Network',
    description: 'Invite other affiliates and earn indirect commissions from their referrals.',
    icon: Users,
    color: 'text-purple-600',
    bg: 'bg-purple-50'
  },
  {
    title: 'Withdraw Earnings',
    description: 'Track your commissions and withdraw them directly to your bank account.',
    icon: Wallet,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50'
  }
];

export default function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  React.useEffect(() => {
    const completed = localStorage.getItem('vemtap_onboarding_completed');
    if (!completed) {
      setIsOpen(true);
    }
  }, []);

  if (!isOpen) return null;

  const step = steps[currentStep];

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('vemtap_onboarding_completed', 'true');
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden"
        >
          <div className="p-8 sm:p-12">
            <div className="flex justify-between items-center mb-8">
              <div className="flex gap-1.5">
                {steps.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      idx === currentStep ? 'w-8 bg-blue-600' : 'w-1.5 bg-slate-200'
                    }`}
                  />
                ))}
              </div>
              <button 
                onClick={handleClose}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest"
              >
                Skip
              </button>
            </div>

            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center"
            >
              <div className={`w-20 h-20 mx-auto rounded-3xl ${step.bg} flex items-center justify-center mb-8 shadow-inner`}>
                <step.icon className={`w-10 h-10 ${step.color}`} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-3">{step.title}</h2>
              <p className="text-slate-500 leading-relaxed mb-10">
                {step.description}
              </p>
            </motion.div>

            <Button 
              onClick={handleNext}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-14 rounded-2xl text-base font-black shadow-xl shadow-blue-100 group"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  Get Started
                  <CheckCircle2 className="w-5 h-5 ml-2" />
                </>
              ) : (
                <>
                  Next Step
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
            
            <div className="mt-6 flex items-center justify-center gap-2 text-slate-400">
              <PlayCircle className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Watch Tutorial (2m)</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
