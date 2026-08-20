'use client';

import { useState, useEffect } from 'react';
import { Send, Loader2, MessageSquare, Phone } from 'lucide-react';
import ModalShell from '@/components/ui/ModalShell';
import MessageComposer from '@/components/communication/MessageComposer';
import { useTemplates, useSendSms } from '@/services/useCommunicationHooks';
import { cn } from '@/lib/utils';

interface SmsComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: string;
  initialPhone?: string;
  onSent?: () => void;
}

export default function SmsComposerModal({ isOpen, onClose, initialMessage = '', initialPhone, onSent }: SmsComposerModalProps) {
  const { data: templates } = useTemplates();
  const sendSms = useSendSms();
  const [message, setMessage] = useState(initialMessage);
  const [phone, setPhone] = useState(initialPhone || '');

  useEffect(() => {
    if (isOpen) {
      setMessage(initialMessage);
      setPhone(initialPhone || '');
    }
  }, [isOpen, initialMessage, initialPhone]);

  const smsTemplates = (templates || []).filter((t) => t.channel === 'SMS');
  const canSend = message.trim().length > 0 && phone.trim().length >= 7;

  const handleSend = async () => {
    if (!canSend) return;
    try {
      await sendSms.mutateAsync({
        leadIds: [`quick-${phone.trim()}`],
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
            <p className="text-xs text-slate-500 font-medium mt-0.5">Send a one-off SMS message</p>
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
        {/* Phone number */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recipient phone number</label>
          <div className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-2xl focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 08012345678"
              className="w-full bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
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