'use client';

import { ShieldCheck, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isCustomerStatus } from '@/lib/communication';

interface SubscriptionOverrideBannerProps {
  status?: string;
  onDismiss?: () => void;
}

export default function SubscriptionOverrideBanner({ status, onDismiss }: SubscriptionOverrideBannerProps) {
  const active = isCustomerStatus(status);
  return (
    <div
      className={cn(
        'rounded-2xl border p-4 space-y-2',
        active ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200',
      )}
    >
      <div className="flex items-center gap-2">
        {active ? (
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
        ) : (
          <Ban className="w-4 h-4 text-slate-400" />
        )}
        <p className={cn('text-xs font-black uppercase tracking-widest', active ? 'text-emerald-700' : 'text-slate-500')}>
          {active ? 'Subscription active' : 'Lead communication'}
        </p>
      </div>
      <p className={cn('text-sm font-medium leading-snug', active ? 'text-emerald-800' : 'text-slate-500')}>
        {active
          ? 'All sales follow-up messages are stopped. This contact is on the customer journey now.'
          : 'As long as this contact is not subscribed, lead nurture messages can continue.'}
      </p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-[11px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}