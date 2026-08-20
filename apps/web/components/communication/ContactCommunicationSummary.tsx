'use client';

import { MessageCircle, MessageSquare } from 'lucide-react';
import { LeadCommunication } from '@/types/communication';
import { formatMessageDate } from '@/lib/communication';

interface ContactCommunicationSummaryProps {
  data: LeadCommunication;
}

export default function ContactCommunicationSummary({ data }: ContactCommunicationSummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* WhatsApp */}
      <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="w-4 h-4 text-emerald-600" />
          <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">WhatsApp</p>
        </div>
        <p className="text-lg font-black text-slate-900">
          {data.whatsapp.sentCount} <span className="text-xs font-bold text-slate-500">sent</span>
        </p>
        {data.whatsapp.pendingCount > 0 && (
          <p className="text-[11px] font-bold text-amber-600 mt-1">
            {data.whatsapp.pendingCount} follow-up pending
          </p>
        )}
        <p className="text-[11px] font-medium text-slate-500 mt-1">Last: {formatMessageDate(data.whatsapp.lastSent)}</p>
      </div>

      {/* SMS */}
      <div className="bg-sky-50/60 border border-sky-100 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-sky-600" />
          <p className="text-[10px] font-black text-sky-700 uppercase tracking-widest">SMS</p>
        </div>
        <p className="text-lg font-black text-slate-900">
          {data.sms.sentCount} <span className="text-xs font-bold text-slate-500">sent</span>
        </p>
        {data.sms.nextScheduled && (
          <p className="text-[11px] font-bold text-blue-600 mt-1">
            Next: {formatMessageDate(data.sms.nextScheduled)}
          </p>
        )}
        <p className="text-[11px] font-medium text-slate-500 mt-1">Last: {formatMessageDate(data.sms.lastSent)}</p>
      </div>
    </div>
  );
}