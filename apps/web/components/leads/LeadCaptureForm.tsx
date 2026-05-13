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
import { useCreateLead } from '@/services/useLeadsHooks';

const leadSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  industry: z.string().optional().or(z.literal('')),
  businessAddress: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  contactName: z.string().optional().or(z.literal('')),
  contactRole: z.string().optional(),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  source: z.string().optional().or(z.literal('')),
  otherSource: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  status: z.enum(['POTENTIAL', 'CONTACTED', 'INTERESTED', 'NOT_INTERESTED', 'COMPLETED']).default('POTENTIAL'),
  followUpDate: z.string().optional(),
  comments: z.string().optional(),
  assignedAgentId: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

interface LeadCaptureFormProps {
  agentId?: string;
  isPublic?: boolean;
  isAdmin?: boolean;
  onSuccess?: () => void;
}

export default function LeadCaptureForm({ agentId, isPublic = false, isAdmin = false, onSuccess }: LeadCaptureFormProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const { showToast } = useToast();
  const createLead = useCreateLead();

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
      priority: 'MEDIUM',
      source: 'Social Media',
      status: 'POTENTIAL'
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
    const leadData = {
      ...data,
      assignedAgentId: isAdmin ? data.assignedAgentId : undefined,
    };

    if (!navigator.onLine) {
      const queue = JSON.parse(localStorage.getItem('vemtap_pending_leads') || '[]');
      queue.push({ ...leadData, agentId, capturedAt: new Date().toISOString(), isPublic });
      localStorage.setItem('vemtap_pending_leads', JSON.stringify(queue));
      showToast('Offline: Lead saved to device.', 'warning');
      setShowSuccess(true);
      
      setTimeout(() => {
        setShowSuccess(false);
        reset();
        onSuccess?.();
      }, 2500);
    } else {
      try {
        await createLead.mutateAsync(leadData);
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          reset();
          onSuccess?.();
        }, 2500);
      } catch (error) {
        showToast('Failed to save lead. Please try again.', 'error');
      }
    }
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



        {isAdmin && (
          <section className="bg-slate-900 p-8 rounded-[32px] text-white space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
                <User className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest">Assign to Agent</h3>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Select Agent *</label>
              <select 
                {...register('assignedAgentId')}
                className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white appearance-none"
              >
                <option value="" className="text-slate-900">Select an active agent</option>
                <option value="agent-1" className="text-slate-900">John Doe (VEM-001)</option>
                <option value="agent-2" className="text-slate-900">Sarah Smith (VEM-002)</option>
                <option value="agent-3" className="text-slate-900">Michael Bolan (VEM-003)</option>
                <option value="agent-4" className="text-slate-900">David King (VEM-004)</option>
              </select>
              <p className="text-[10px] text-slate-400 px-1 mt-1 italic">This lead will appear instantly in the selected agent's dashboard.</p>
            </div>
          </section>
        )}

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
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Phone Number *</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input {...register('phone')} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm" placeholder="+234 ..." />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Industry</label>
              <select {...register('industry')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none">
                <option value="">Select Industry</option>
                <option value="Retail & Shops">Retail & Shops</option>
                <option value="Food & Hospitality">Food & Hospitality</option>
                <option value="Beauty & Personal Care">Beauty & Personal Care</option>
                <option value="Health & Medical">Health & Medical</option>
                <option value="Professional Services">Professional Services</option>
                <option value="Technology & Digital Services">Technology & Digital Services</option>
                <option value="Education & Training">Education & Training</option>
                <option value="Real Estate & Property">Real Estate & Property</option>
                <option value="Automotive">Automotive</option>
                <option value="Logistics & Transportation">Logistics & Transportation</option>
                <option value="Construction & Home Services">Construction & Home Services</option>
                <option value="Events & Entertainment">Events & Entertainment</option>
                <option value="Finance & Financial Services">Finance & Financial Services</option>
                <option value="Agriculture & Farming">Agriculture & Farming</option>
                <option value="Manufacturing & Production">Manufacturing & Production</option>
                <option value="Religious & Non-Profit Organizations">Religious & Non-Profit Organizations</option>
                <option value="Government & Public Services">Government & Public Services</option>
                <option value="Others">Others</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Business Address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input {...register('businessAddress')} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm" placeholder="123 Business St." />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">City/State</label>
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
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Contact Name</label>
              <input {...register('contactName')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm" placeholder="Full Name" />
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
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Lead Source</label>
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
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Specify Other Source</label>
                <input {...register('otherSource')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm" placeholder="Please specify..." />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Current Status</label>
              <select {...register('status')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none">
                <option value="POTENTIAL">Potential</option>
                <option value="CONTACTED">Contacted</option>
                <option value="INTERESTED">Interested</option>
                <option value="NOT_INTERESTED">Not Interested</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Priority</label>
              <div className="flex gap-2">
                {['LOW', 'MEDIUM', 'HIGH'].map((p) => (
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
            disabled={createLead.isPending}
            className="flex-grow bg-slate-900 hover:bg-blue-600 text-white h-16 rounded-2xl text-sm font-black shadow-xl transition-all flex items-center justify-center gap-3"
          >
            {createLead.isPending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-5 h-5" /> {isPublic ? 'Submit Lead' : 'Save Business'}</>}
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
