'use client';

import { useState } from 'react';
import { User, Phone, Mail, Building, AlertCircle, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { FieldBusiness, VisitOutcome } from '@/types/field-activity';

interface LeadCaptureProps {
  business: FieldBusiness;
  onComplete: (leadData: {
    outcome: VisitOutcome;
    businessName: string;
    category: string;
    contactName: string;
    phone: string;
    email?: string;
    subscriptionInterest: boolean;
    notes?: string;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const OUTCOME_OPTIONS: { value: VisitOutcome; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'INTERESTED', label: 'Interested', icon: <CheckCircle2 className="w-5 h-5" />, color: 'bg-emerald-500' },
  { value: 'NOT_INTERESTED', label: 'Not Interested', icon: <AlertCircle className="w-5 h-5" />, color: 'bg-slate-500' },
  { value: 'MANAGER_UNAVAILABLE', label: 'Manager Unavailable', icon: <AlertCircle className="w-5 h-5" />, color: 'bg-amber-500' },
  { value: 'FOLLOW_UP_REQUIRED', label: 'Follow-up Required', icon: <ChevronUp className="w-5 h-5" />, color: 'bg-blue-500' },
  { value: 'OTHER', label: 'Other', icon: <AlertCircle className="w-5 h-5" />, color: 'bg-slate-400' },
];

export function LeadCapture({ business, onComplete, onCancel, isLoading = false }: LeadCaptureProps) {
  const [outcome, setOutcome] = useState<VisitOutcome | null>(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subscriptionInterest, setSubscriptionInterest] = useState(false);
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (!outcome) return;

    if (outcome === 'INTERESTED') {
      setShowLeadForm(true);
      return;
    }

    onComplete({
      outcome,
      businessName: business.name,
      category: business.category,
      contactName: contactName || business.ownerName || '',
      phone: phone || business.phone || '',
      email: email || business.contactEmail,
      subscriptionInterest: subscriptionInterest,
      notes,
    });
  };

  const handleLeadSubmit = () => {
    if (!phone) return;

    onComplete({
      outcome: 'INTERESTED',
      businessName: business.name,
      category: business.category,
      contactName,
      phone,
      email,
      subscriptionInterest,
      notes,
    });
  };

  const handleOutcomeSelect = (selected: VisitOutcome) => {
    setOutcome(selected);
    setShowLeadForm(false);
    if (selected !== 'INTERESTED') {
      onComplete({
        outcome: selected,
        businessName: business.name,
        category: business.category,
        contactName: contactName || business.ownerName || '',
        phone: phone || business.phone || '',
        email: email || business.contactEmail,
        subscriptionInterest: subscriptionInterest,
        notes,
      });
    }
  };

  if (showLeadForm) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-5"
      >
        <h3 className="text-lg font-black text-slate-900">Capture Lead — {business.name}</h3>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
            <User className="w-3.5 h-3.5" />
            Contact Name
          </label>
          <input
            type="text"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder={business.ownerName || 'e.g. John Doe'}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
            <Phone className="w-3.5 h-3.5" />
            Phone Number *
          </label>
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder={business.phone || 'e.g. 08012345678'}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
            <Mail className="w-3.5 h-3.5" />
            Email (optional)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. contact@business.com"
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
            <Building className="w-3.5 h-3.5" />
            Category
          </label>
          <input
            type="text"
            value={business.category}
            readOnly
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600"
          />
        </div>

        <div className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl">
          <input
            type="checkbox"
            id="subscription-interest"
            checked={subscriptionInterest}
            onChange={(e) => setSubscriptionInterest(e.target.checked)}
            className="w-5 h-5 accent-blue-600 rounded"
          />
          <label htmlFor="subscription-interest" className="text-sm font-medium text-slate-700">
            Business is interested in VEMTAP subscription
          </label>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Key discussion points..."
            rows={3}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium resize-none focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => setShowLeadForm(false)}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
          >
            Back
          </button>
          <button
            onClick={handleLeadSubmit}
            disabled={isLoading || !phone}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? 'Saving...' : 'Save Lead'}
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <h3 className="text-lg font-black text-slate-900">Visit Outcome — {business.name}</h3>

      <div className="grid gap-2">
        {OUTCOME_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleOutcomeSelect(opt.value)}
            disabled={isLoading}
            className={cn(
              'flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all',
              outcome === opt.value
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50'
            )}
          >
            <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', opt.color, 'text-white')}>
              {opt.icon}
            </div>
            <span className="font-semibold">{opt.label}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
        >
          Cancel
        </button>
        {outcome === 'INTERESTED' ? (
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? 'Saving...' : 'Continue to Lead'}
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-400 bg-slate-50 border border-slate-200 cursor-default"
          >
            Select an outcome to save
          </button>
        )}
      </div>
    </motion.div>
  );
}