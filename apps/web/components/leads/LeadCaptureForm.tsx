'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Globe, 
  User, 
  Phone, 
  Mail, 
  Target, 
  MessageSquare,
  Save,
  Rocket,
  Info,
  CheckCircle2,
  AlertCircle,
  WifiOff,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const leadSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  industry: z.string().min(1, 'Industry is required'),
  location: z.string().optional(),
  website: z.string().optional(),
  contactName: z.string().min(1, 'Contact person name is required'),
  contactRole: z.string().optional(),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  source: z.string().min(1, 'Lead source is required'),
  otherSource: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High']).default('Medium'),
  status: z.enum(['Potential', 'Contacted', 'Interested', 'Not Interested', 'Completed']).default('Potential'),
  followUpDate: z.string().optional(),
  comments: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

interface LeadCaptureFormProps {
  agentId?: string;
  isPublic?: boolean;
  onSuccess?: () => void;
}

export default function LeadCaptureForm({ agentId, isPublic = false, onSuccess }: LeadCaptureFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      priority: 'Medium',
      source: 'Social Media',
      status: 'Potential'
    }
  });

  const selectedSource = watch('source');
  const selectedPriority = watch('priority');

  useEffect(() => {
    const handleStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    handleStatus();
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  const onSubmit = async (data: LeadFormValues) => {
    setIsSubmitting(true);
    
    const leadData = {
      ...data,
      agentId,
      capturedAt: new Date().toISOString(),
      isPublic
    };

    if (!navigator.onLine) {
      const queue = JSON.parse(localStorage.getItem('vemtap_pending_leads') || '[]');
      queue.push(leadData);
      localStorage.setItem('vemtap_pending_leads', JSON.stringify(queue));
      showToast('Offline: Lead saved to device.', 'warning');
      setIsSubmitting(false);
      setShowSuccess(true);
    } else {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Submitting Lead:', leadData);
      setIsSubmitting(false);
      setShowSuccess(true);
    }

    setTimeout(() => {
      setShowSuccess(false);
      reset();
      onSuccess?.();
    }, 2500);
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
        {isOffline && (
          <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-center gap-3">
            <WifiOff className="w-5 h-5 text-orange-600" />
            <p className="text-xs font-bold text-orange-900">Working Offline. Your lead will sync automatically.</p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-blue-900">Partial Info Allowed</p>
            <p className="text-[10px] text-blue-700 leading-relaxed">Submit what you have now; you can add more details later in your dashboard.</p>
          </div>
        </div>

        {/* Section 1: Business */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Business Details</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Business Name *</label>
              <input {...register('businessName')} className={cn("w-full px-4 py-3 bg-slate-50 border rounded-2xl text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all", errors.businessName ? "border-red-300" : "border-slate-200")} placeholder="Name" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Industry *</label>
              <select {...register('industry')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none">
                <option value="">Select Industry</option>
                <option value="Retail">Retail</option>
                <option value="Hospitality">Hospitality</option>
                <option value="Health">Health</option>
                <option value="Professional Services">Professional Services</option>
                <option value="Others">Others</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Location</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input {...register('location')} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm" placeholder="City, State" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Website</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input {...register('website')} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm" placeholder="www.example.com" />
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Contact */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <User className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Contact Information</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Contact Name *</label>
              <input {...register('contactName')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm" placeholder="Full Name" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Phone Number *</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input {...register('phone')} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm" placeholder="+234 ..." />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input {...register('email')} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm" placeholder="email@example.com" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Role/Position</label>
              <input {...register('contactRole')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm" placeholder="e.g. CEO" />
            </div>
          </div>
        </section>

        {/* Section 3: Status */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-50 rounded-xl text-orange-600">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Classification</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Lead Source *</label>
              <select {...register('source')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none">
                <option value="Social Media">Social Media</option>
                <option value="Direct Referral">Direct Referral</option>
                <option value="Event/Networking">Event/Networking</option>
                <option value="Cold Outreach">Cold Outreach</option>
                <option value="Others">Others</option>
              </select>
            </div>
            {selectedSource === 'Others' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Specify Other Source *</label>
                <input {...register('otherSource')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm" placeholder="Please specify..." />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Current Status *</label>
              <select {...register('status')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none">
                <option value="Potential">Potential</option>
                <option value="Contacted">Contacted</option>
                <option value="Interested">Interested</option>
                <option value="Not Interested">Not Interested</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Priority</label>
              <div className="flex gap-2">
                {['Low', 'Medium', 'High'].map((p) => (
                  <button 
                    key={p} 
                    type="button"
                    onClick={() => setValue('priority', p as any)}
                    className={cn(
                      "flex-grow py-3 rounded-2xl text-[10px] font-black border transition-all uppercase tracking-widest",
                      selectedPriority === p ? "bg-slate-900 text-white border-slate-900 shadow-lg" : "bg-slate-50 text-slate-400 border-slate-200"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Comments */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Additional Notes</h3>
          </div>
          <textarea 
            {...register('comments')}
            rows={4}
            placeholder="Add any additional details or remarks..."
            className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-[32px] text-sm outline-none transition-all resize-none"
          />
        </section>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="flex-grow bg-slate-900 hover:bg-blue-600 text-white h-16 rounded-2xl text-sm font-black shadow-xl transition-all flex items-center justify-center gap-3"
          >
            {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-5 h-5" /> {isPublic ? 'Submit Lead' : 'Save Business'}</>}
          </Button>
          {!isPublic && (
            <Button 
              type="button"
              onClick={handleSubmit((data) => {
                onSubmit(data);
                showToast('Initiating onboarding sequence...', 'info');
              })}
              className="flex-grow bg-blue-600 hover:bg-blue-700 text-white h-16 rounded-2xl text-sm font-black shadow-xl transition-all flex items-center justify-center gap-3"
            >
              <Rocket className="w-5 h-5" /> Save & Start Onboarding
            </Button>
          )}
        </div>
      </form>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/95 backdrop-blur-md z-50 flex flex-col items-center justify-center text-center p-8 rounded-[40px]"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-100"
            >
              <CheckCircle2 className="w-10 h-10" />
            </motion.div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Lead Recorded!</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto font-medium">
              {isOffline ? 'You are offline. The lead has been saved to your device and will sync later.' : 'The business lead has been successfully added to your pipeline.'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
