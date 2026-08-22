'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Send, Loader2, MessageSquare, Search, Check, X } from 'lucide-react';
import ModalShell from '@/components/ui/ModalShell';
import MessageComposer from '@/components/communication/MessageComposer';
import { useTemplates, useSendSms } from '@/services/useCommunicationHooks';
import { isAdminMockEnabled } from '@/lib/admin-mock';
import { mockLeadFixtures } from '@/lib/communication-mock';
import { Lead } from '@/types/api';
import api from '@/services/api';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';

interface SmsComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: string;
  onSent?: () => void;
}

export default function SmsComposerModal({ isOpen, onClose, initialMessage = '', onSent }: SmsComposerModalProps) {
  const isMock = isAdminMockEnabled();
  const { data: templates } = useTemplates();
  const sendSms = useSendSms();
  const [message, setMessage] = useState(initialMessage);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Lead | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (isOpen) {
      setMessage(initialMessage);
      setSearch('');
      setSelected(null);
    }
  }, [isOpen, initialMessage]);

  const mockLeads = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return mockLeadFixtures
      .filter((l) => !!l.phone)
      .filter(
        (l) =>
          !q ||
          l.businessName?.toLowerCase().includes(q) ||
          l.contactName?.toLowerCase().includes(q) ||
          l.phone?.includes(q),
      );
  }, [debouncedSearch]);

  const leadsQuery = useQuery({
    queryKey: ['admin', 'harvest', 'quick-sms', debouncedSearch],
    enabled: !isMock,
    queryFn: async (): Promise<Lead[]> => {
      // Only string params — numeric/boolean query values fail backend validation.
      const params: { search?: string } = {};
      const s = debouncedSearch.trim();
      if (s) params.search = s;
      const { data } = await api.get<{ data: Lead[] }>('/leads/harvest', { params });
      return data.data ?? [];
    },
  });

  const leads = isMock ? mockLeads : leadsQuery.data ?? [];
  const loadingLeads = !isMock && leadsQuery.isLoading;

  const smsTemplates = (templates || []).filter((t) => t.channel === 'SMS');
  const canSend = !!selected && message.trim().length > 0;

  const handleSend = async () => {
    if (!canSend) return;
    try {
      await sendSms.mutateAsync({
        leadIds: [selected.id],
        message: message.trim(),
      });
      onSent?.();
      onClose();
    } catch {
      /* error handled by hook */
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      header={
        <div className="flex items-center gap-3 p-5 sm:p-6 pr-14">
          <div className="p-2.5 rounded-2xl bg-sky-100 text-sky-600 shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-black text-slate-900">Quick SMS</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Send a one-off SMS to a contact</p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between gap-3 p-5 sm:p-6">
          <button
            onClick={onClose}
            className="px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!canSend || sendSms.isPending}
            className={cn(
              'inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg',
              canSend
                ? 'bg-sky-600 text-white hover:bg-sky-700 shadow-sky-100'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none',
            )}
          >
            {sendSms.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send SMS
          </button>
        </div>
      }
    >
      <div className="p-5 sm:p-6 space-y-5">
        {/* Recipient picker */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recipient</label>
          {selected ? (
            <div className="flex items-center justify-between gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <div className="min-w-0 flex items-center gap-2.5">
                <span className="p-1 rounded-full bg-emerald-600 text-white shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-emerald-900 truncate">{selected.businessName}</p>
                  <p className="text-[11px] font-medium text-emerald-700 truncate">
                    {[selected.contactName, selected.phone].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="shrink-0 p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-100 transition-colors"
                aria-label="Change recipient"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-2xl focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search contacts by name or phone..."
                  className="w-full bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
              <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100">
                {loadingLeads ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                  </div>
                ) : leads.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">No contacts found.</p>
                ) : (
                  leads.map((lead) => {
                    const hasPhone = !!lead.phone;
                    return (
                      <button
                        key={lead.id}
                        onClick={() => hasPhone && setSelected(lead)}
                        disabled={!hasPhone}
                        className={cn(
                          'flex items-center justify-between gap-3 w-full px-4 py-3 text-left transition-colors',
                          hasPhone ? 'hover:bg-sky-50' : 'cursor-not-allowed opacity-50',
                        )}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{lead.businessName}</p>
                          <p className="text-[11px] font-medium text-slate-500 truncate">
                            {[lead.contactName, lead.phone].filter(Boolean).join(' · ') || '—'}
                          </p>
                        </div>
                        {!hasPhone && (
                          <span className="shrink-0 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            No phone
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {/* Message composer */}
        <MessageComposer
          channel="SMS"
          value={message}
          onChange={setMessage}
          templates={smsTemplates}
          disabled={sendSms.isPending}
        />
      </div>
    </ModalShell>
  );
}
