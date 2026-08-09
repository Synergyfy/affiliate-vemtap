'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Phone, Mail, MapPin, MessageSquare, Plus, Loader2, Edit2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useMarketMappingConfig } from '@/hooks/use-market-mapping-config';

interface BusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (business: any) => void;
  initialData?: any;
  mode: 'add' | 'edit';
}

export default function BusinessModal({ isOpen, onClose, onConfirm, initialData, mode }: BusinessModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: config } = useMarketMappingConfig();
  const planTypes = config?.planTypes ?? [];
  const [formData, setFormData] = useState({
    businessName: initialData?.name || '',
    ownerName: initialData?.ownerName || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    state: initialData?.state || '',
    address: initialData?.address || '',
    planType: initialData?.planType || 'BASIC',
    comment: initialData?.comment || ''
  });

  // Update form data when initialData changes (for editing)
  useEffect(() => {
    if (initialData) {
      setFormData({
        businessName: initialData.name || '',
        ownerName: initialData.ownerName || initialData.name || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        state: initialData.state || '',
        address: initialData.address || '',
        planType: initialData.planType || 'BASIC',
        comment: initialData.comment || ''
      });
    } else {
      // Reset if no initial data (add mode)
      setFormData({
        businessName: '',
        ownerName: '',
        phone: '',
        email: '',
        state: '',
        address: '',
        planType: 'BASIC',
        comment: ''
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Pass to parent for API call
    onConfirm({
      ...formData,
      id: initialData?.id
    });
    
    // We don't close immediately anymore, parent handles it on success
    // But if we want to keep it simple and close:
    setTimeout(() => {
      setIsSubmitting(false);
      if (mode === 'add') {
        setFormData({ businessName: '', ownerName: '', phone: '', email: '', state: '', address: '', planType: 'BASIC', comment: '' });
      }
    }, 500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl overflow-hidden my-auto"
          >
            {/* Header */}
            <div className="bg-blue-600 p-8 text-white relative overflow-hidden">
              <div className="absolute -top-4 -right-4 p-8 opacity-10 rotate-12">
                <Building2 className="w-32 h-32" />
              </div>
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black mb-1">
                    {mode === 'edit' ? 'Edit Business' : 'Add New Business'}
                  </h2>
                  <p className="text-blue-100 text-sm font-medium">
                    {mode === 'edit' ? 'Update the details for this referral' : 'Register a new referral to your network'}
                  </p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5" /> Business Name <span className="text-red-500">*</span>
                  </label>
                  <p className="text-[10px] text-slate-400 font-medium leading-none">The official registered name.</p>
                  <Input 
                    placeholder="e.g. Tech Solutions Ltd"
                    value={formData.businessName}
                    onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                    required
                    className="h-12 rounded-xl border-slate-200 focus:border-blue-600 transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5" /> Owner Name <span className="text-red-500">*</span>
                  </label>
                  <p className="text-[10px] text-slate-400 font-medium leading-none">The person to contact.</p>
                  <Input 
                    placeholder="e.g. John Doe"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({...formData, ownerName: e.target.value})}
                    required
                    className="h-12 rounded-xl border-slate-200 focus:border-blue-600 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" /> Phone Number <span className="text-red-500">*</span>
                  </label>
                  <p className="text-[10px] text-slate-400 font-medium leading-none">Best contact number.</p>
                  <Input 
                    placeholder="e.g. +234 800 000 0000"
                    value={formData.phone}
                    onChange={(e) => {
                      const val = e.target.value;
                      const cleaned = val.replace(/[^\d+]/g, '');
                      setFormData({...formData, phone: cleaned});
                    }}
                    required
                    className="h-12 rounded-xl border-slate-200 focus:border-blue-600 transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5" /> Plan Type
                  </label>
                    <p className="text-[10px] text-slate-400 font-medium leading-none">{planTypes.map(p => p.label).join(', ')}</p>
                  <select 
                    value={formData.planType}
                    onChange={(e) => setFormData({...formData, planType: e.target.value})}
                    className="w-full h-12 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition-all px-4 text-sm font-medium"
                  >
                    {planTypes.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" /> Email Address (Optional)
                </label>
                <p className="text-[10px] text-slate-400 font-medium leading-none">Where we will send the onboarding invitation.</p>
                <Input 
                  type="email"
                  placeholder="e.g. contact@business.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="h-12 rounded-xl border-slate-200 focus:border-blue-600 transition-all font-medium"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" /> State <span className="text-red-500">*</span>
                  </label>
                  <p className="text-[10px] text-slate-400 font-medium leading-none">The state where the business is located.</p>
                  <Input 
                    placeholder="e.g. Lagos"
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                    required
                    className="h-12 rounded-xl border-slate-200 focus:border-blue-600 transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" /> Full Address <span className="text-red-500">*</span>
                  </label>
                  <p className="text-[10px] text-slate-400 font-medium leading-none">Specific street address and landmark.</p>
                  <Input 
                    placeholder="e.g. 123 Business Way, Ikeja"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    required
                    className="h-12 rounded-xl border-slate-200 focus:border-blue-600 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5" /> Extra Comments
                </label>
                <p className="text-[10px] text-slate-400 font-medium leading-none">Notes to help our sales team close the deal.</p>
                <textarea 
                  placeholder="Any additional information about this business..."
                  value={formData.comment}
                  onChange={(e) => setFormData({...formData, comment: e.target.value})}
                  className="w-full p-4 rounded-2xl border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium min-h-[100px] resize-none text-sm"
                />
              </div>

              <div className="pt-4">
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-14 rounded-2xl text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-pulse" />
                      {mode === 'edit' ? 'Updating...' : 'Registering...'}
                    </>
                  ) : (
                    <>
                      {mode === 'edit' ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                      {mode === 'edit' ? 'Update Business' : 'Add Business'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
