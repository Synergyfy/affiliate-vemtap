'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  CheckCircle2, 
  ArrowRight, 
  Smartphone, 
  QrCode, 
  MessageSquare, 
  Zap,
  Store,
  Utensils,
  Scissors,
  ShoppingBag,
  MoreHorizontal,
  Copy,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';

export default function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    // Show onboarding if it's the first time
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('hasSeenOnboarding', 'true');
  };

  const copyLink = () => {
    navigator.clipboard.writeText('https://vemtap.com/ref/user123');
    showToast('Referral link copied!', 'success');
  };

  const shareOnWhatsApp = () => {
    const message = `Hi! I found a simple way for your business to get more customers and track visitors using QR codes. It's called Vemtap. You can try it here: https://vemtap.com/ref/user123`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const targets = [
    { id: 'restaurant', name: 'Restaurant', icon: Utensils, color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: 'fashion', name: 'Fashion Store', icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'salon', name: 'Salon / Barber', icon: Scissors, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'supermarket', name: 'Supermarket', icon: Store, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'others', name: 'Others', icon: MoreHorizontal, color: 'text-slate-600', bg: 'bg-slate-50' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden"
          >
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100">
              <motion.div 
                initial={{ width: '0%' }}
                animate={{ width: `${(step / 5) * 100}%` }}
                className="h-full bg-blue-600 transition-all duration-500"
              />
            </div>

            <button 
              onClick={handleClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 sm:p-10">
              {step === 1 && (
                <div className="text-center space-y-6 py-4">
                  <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 mx-auto mb-6">
                    <Zap className="w-10 h-10 fill-current" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 leading-tight">
                    You&apos;re ready to <br />
                    <span className="text-blue-600">start earning!</span>
                  </h2>
                  <p className="text-slate-500 text-lg">
                    Let&apos;s get your first 3 businesses and unlock your first bonus.
                  </p>
                  <Button 
                    onClick={() => setStep(2)}
                    className="w-full h-14 rounded-2xl text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200"
                  >
                    Start Now
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Who will you target first?</h3>
                    <p className="text-slate-500">We&apos;ll personalize your experience based on your choice.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {targets.map((target) => (
                      <button
                        key={target.id}
                        onClick={() => setSelectedTarget(target.id)}
                        className={cn(
                          "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all text-center group",
                          selectedTarget === target.id 
                            ? "border-blue-600 bg-blue-50/50" 
                            : "border-slate-100 hover:border-blue-200 hover:bg-slate-50"
                        )}
                      >
                        <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110", target.bg)}>
                          <target.icon className={cn("w-6 h-6", target.color)} />
                        </div>
                        <span className="text-sm font-bold text-slate-700">{target.name}</span>
                      </button>
                    ))}
                  </div>
                  <Button 
                    disabled={!selectedTarget}
                    onClick={() => setStep(3)}
                    className="w-full h-14 rounded-2xl text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200 mt-4"
                  >
                    Continue
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 text-center">
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Your Instant Tools</h3>
                    <p className="text-slate-500">Use these to refer businesses immediately.</p>
                  </div>
                  
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-6">
                    <div className="bg-white p-4 rounded-2xl shadow-sm inline-block mb-4">
                      <QRCodeSVG value="https://vemtap.com/ref/user123" size={120} />
                    </div>
                    <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 mb-4">
                      <Smartphone className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-600 truncate flex-grow text-left">vemtap.com/ref/user123</span>
                      <button onClick={copyLink} className="p-2 hover:bg-slate-50 rounded-lg text-blue-600 transition-colors">
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <Button 
                    onClick={() => setStep(4)}
                    className="w-full h-14 rounded-2xl text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200"
                  >
                    Next Step
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Ready-to-Send Message</h3>
                    <p className="text-slate-500">Copy this message and send it to your first business.</p>
                  </div>

                  <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 relative group">
                    <p className="text-slate-700 text-sm leading-relaxed italic">
                      &quot;Hi! I found a simple way for your business to get more customers and track visitors using QR codes. It&apos;s called Vemtap. You can try it here: https://vemtap.com/ref/user123&quot;
                    </p>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`Hi! I found a simple way for your business to get more customers and track visitors using QR codes. It's called Vemtap. You can try it here: https://vemtap.com/ref/user123`);
                        showToast('Message copied!', 'success');
                      }}
                      className="absolute top-4 right-4 p-2 bg-white rounded-lg text-blue-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <Button 
                      onClick={shareOnWhatsApp}
                      className="w-full h-14 rounded-2xl text-lg font-bold bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-100 flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-5 h-5 fill-current" />
                      Share on WhatsApp
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setStep(5)}
                      className="w-full h-14 rounded-2xl text-lg font-bold border-slate-200 text-slate-600"
                    >
                      I&apos;ll do this later
                    </Button>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="text-center space-y-6 py-4">
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 leading-tight">
                    Your First Task
                  </h2>
                  <p className="text-slate-500 text-lg">
                    Send your referral link to <span className="font-bold text-slate-900">5 businesses</span> right now. This is the fastest way to get your first commission!
                  </p>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm text-slate-600 font-medium">
                    Goal: 0/5 businesses contacted
                  </div>
                  <Button 
                    onClick={handleClose}
                    className="w-full h-14 rounded-2xl text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200"
                  >
                    Go to Dashboard
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
