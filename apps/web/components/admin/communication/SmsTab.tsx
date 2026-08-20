'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Send, Loader2, Clock, CheckCircle2, XCircle, RefreshCw, MessageSquare,
  CalendarClock, AlertTriangle,
} from 'lucide-react';
import AudienceBuilder from '@/components/communication/AudienceBuilder';
import MessageComposer from '@/components/communication/MessageComposer';
import MessageStatusBadge from '@/components/communication/MessageStatusBadge';
import SchedulePicker from '@/components/communication/SchedulePicker';
import { useToast } from '@/hooks/toast';
import {
  useSendSms,
  useTemplates,
  useCommunicationMessages,
  useCancelScheduledSms,
  useRetryFailedSms,
  useCommunicationSettings,
  useAudienceEstimate,
} from '@/services/useCommunicationHooks';
import { AudienceFilter, EMPTY_AUDIENCE, OutboundMessage } from '@/types/communication';
import { countSmsCharacters, estimateSmsCost, formatMessageDateTime, substituteVariables } from '@/lib/communication';
import { mockLeadFixtures } from '@/lib/communication-mock';
import { useDebounce } from '@/hooks/use-debounce';
import { UsersRound } from 'lucide-react';
import { cn } from '@/lib/utils';

const UNIT_COST = 1.50;

export default function SmsTab() {
  const { showToast } = useToast();
  const [filters, setFilters] = useState<AudienceFilter>(EMPTY_AUDIENCE);
  const [message, setMessage] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined);
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);

  const { data: templates } = useTemplates({ channel: 'SMS', status: 'ACTIVE' });
  const { data: settings } = useCommunicationSettings();
  const sendSms = useSendSms();
  const cancelSms = useCancelScheduledSms();
  const retrySms = useRetryFailedSms();

  const { data: messagesData, isLoading: messagesLoading } = useCommunicationMessages({ channel: 'SMS' });
  const rawMessages = messagesData?.data ?? [];
  const messages = useMemo(() => rawMessages, [rawMessages]);

  const scheduled = useMemo(() => messages.filter((m) => m.status === 'SCHEDULED'), [messages]);
  const sent = useMemo(() => messages.filter((m) => m.status === 'SENT' || m.status === 'DELIVERED'), [messages]);
  const failed = useMemo(() => messages.filter((m) => m.status === 'FAILED'), [messages]);

  const previewLead = mockLeadFixtures.find((l) => l.phone) || null;
  const resolvedMessage = useMemo(() => {
    if (!previewLead || !message) return message;
    return substituteVariables(message, previewLead);
  }, [message, previewLead]);

  const charCount = useMemo(() => (message ? countSmsCharacters(resolvedMessage) : null), [resolvedMessage]);
  const smsCost = useMemo(() => estimateSmsCost(resolvedMessage, UNIT_COST), [resolvedMessage]);
  const hasOverLimit = charCount?.over ?? false;

  const debouncedFilters = useDebounce(filters, 400);
  const { data: estimate } = useAudienceEstimate(filtersActive() ? debouncedFilters : null);
  const audienceCount = estimate?.count ?? 0;

  const canSend = filtersActive() && message.trim().length > 0 && !hasOverLimit && audienceCount > 0 && (settings?.smsEnabled ?? true);

  function filtersActive() {
    return (
      (filters.statuses?.length ?? 0) > 0 ||
      (filters.salespeople?.length ?? 0) > 0 ||
      (filters.locations?.length ?? 0) > 0 ||
      !!filters.dateAdded
    );
  }

  const handleSend = async () => {
    if (!canSend) return;
    try {
      const leadIds = mockLeadFixtures.filter((l) => l.phone).slice(0, audienceCount || 1).map((l) => l.id);
      await sendSms.mutateAsync({
        leadIds,
        message: message.trim(),
        templateId: selectedTemplateId,
        scheduledAt: scheduledAt || undefined,
      });
      showToast(
        scheduledAt
          ? `SMS scheduled for ${new Date(scheduledAt).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}.`
          : `SMS sent to ${leadIds.length} contact${leadIds.length > 1 ? 's' : ''}.`,
        'success',
      );
      setMessage('');
      setScheduledAt(null);
    } catch (error: any) {
      showToast(error?.message || 'Failed to send SMS.', 'error');
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelSms.mutateAsync(id);
      showToast('Scheduled SMS cancelled.', 'info');
    } catch {
      showToast('Failed to cancel SMS.', 'error');
    }
  };

  const handleRetry = async (id: string) => {
    try {
      await retrySms.mutateAsync(id);
      showToast('Retrying SMS delivery...', 'info');
    } catch {
      showToast('Failed to retry SMS.', 'error');
    }
  };

  if (!settings?.smsEnabled) {
    return (
      <div className="space-y-8">
        <div className="flex items-start gap-4 bg-amber-50 border border-amber-200 rounded-3xl p-6">
          <AlertTriangle className="w-6 h-6 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-base font-bold text-amber-800">SMS sending is disabled</h3>
            <p className="text-sm text-amber-700 mt-1">
              SMS sending has been turned off by an administrator. Enable it in Communication Settings to send messages.
            </p>
          </div>
        </div>
        <MessageListSection title="Scheduled" messages={scheduled} emptyText="No scheduled messages." onAction={handleCancel} actionLabel="Cancel" />
        <MessageListSection title="Sent" messages={sent} emptyText="No sent messages." />
        <MessageListSection title="Failed" messages={failed} emptyText="No failed messages." onAction={handleRetry} actionLabel="Retry" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Compose section */}
      <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 lg:p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">Compose SMS</h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Select the audience and write your message. SMS costs {UNIT_COST.toFixed(2)} per message.
          </p>
        </div>
        <div className="p-5 lg:p-6 space-y-6">
          <AudienceBuilder filters={filters} onChange={setFilters} />

          <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Message</p>
            <MessageComposer
              channel="SMS"
              value={message}
              onChange={setMessage}
              onPickTemplate={(tpl) => setSelectedTemplateId(tpl.id)}
              templates={templates}
              resolveLead={previewLead}
            />
          </div>

          {/* Cost estimate */}
          {message.trim() && charCount && (
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
              <span className={cn('px-3 py-1.5 rounded-full border', hasOverLimit ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-100 text-slate-600 border-slate-200')}>
                {charCount.chars} / 160 chars · {charCount.parts} SMS{charCount.parts > 1 ? 's' : ''}
              </span>
              {smsCost != null && (
                <span className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Est. cost: {smsCost.toFixed(2)} × {audienceCount || 1} = {((smsCost) * (audienceCount || 1)).toFixed(2)}
                </span>
              )}
              {audienceCount > 0 && (
                <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {audienceCount} contact{audienceCount > 1 ? 's' : ''} selected
                </span>
              )}
            </div>
          )}

          <SchedulePicker scheduledAt={scheduledAt} onChange={setScheduledAt} />

          <div className="flex items-center justify-between gap-4 flex-wrap pt-1">
            <div className="flex flex-wrap items-center gap-2">
              {filtersActive() && (
                audienceCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
                    <UsersRound className="w-3.5 h-3.5" />
                    {audienceCount} contact{audienceCount !== 1 ? 's' : ''} selected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-bold text-amber-700">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    No contacts match these filters
                  </span>
                )
              )}
              <p className="text-xs font-medium text-slate-400">
                {scheduledAt
                  ? `Message will be sent at the scheduled time to ${audienceCount} contact${audienceCount !== 1 ? 's' : ''}.`
                  : audienceCount === 0 && filtersActive()
                  ? 'Adjust filters to reach at least one contact.'
                  : 'Message sends immediately.'}
              </p>
            </div>
            <button
              onClick={handleSend}
              disabled={!canSend || sendSms.isPending}
              className={cn(
                'inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-lg',
                canSend
                  ? 'bg-sky-600 text-white hover:bg-sky-700 shadow-sky-100'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed',
              )}
            >
              {sendSms.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : scheduledAt ? (
                <CalendarClock className="w-4 h-4" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {scheduledAt ? `Schedule SMS (${audienceCount})` : `Send Now (${audienceCount})`}
            </button>
          </div>
        </div>
      </section>

      {/* Message lists */}
      <MessageListSection
        title="Scheduled"
        icon={<Clock className="w-4 h-4" />}
        messages={scheduled}
        emptyText="No scheduled messages."
        isLoading={messagesLoading}
        onAction={handleCancel}
        actionLabel="Cancel"
      />
      <MessageListSection
        title="Sent"
        icon={<CheckCircle2 className="w-4 h-4" />}
        messages={sent}
        emptyText="No sent messages."
        isLoading={messagesLoading}
      />
      <MessageListSection
        title="Failed"
        icon={<XCircle className="w-4 h-4" />}
        messages={failed}
        emptyText="No failed messages."
        isLoading={messagesLoading}
        onAction={handleRetry}
        actionLabel="Retry"
      />
    </div>
  );
}

function MessageListSection({
  title,
  icon,
  messages,
  emptyText,
  isLoading,
  onAction,
  actionLabel,
}: {
  title: string;
  icon?: React.ReactNode;
  messages: OutboundMessage[];
  emptyText: string;
  isLoading?: boolean;
  onAction?: (id: string) => void;
  actionLabel?: string;
}) {
  return (
    <section>
      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        {icon}
        {title}
        {messages.length > 0 && (
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{messages.length}</span>
        )}
      </h3>
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
        </div>
      ) : messages.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
          <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">{emptyText}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg, idx) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {msg.lead?.businessName || 'Unknown'}
                    </p>
                    <MessageStatusBadge status={msg.status} kind="sms" />
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {msg.lead?.contactName || '—'} · {msg.lead?.phone || '—'}
                  </p>
                  <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">{msg.body}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {msg.sentAt ? `Sent ${formatMessageDateTime(msg.sentAt)}` : msg.scheduledAt ? `Scheduled ${formatMessageDateTime(msg.scheduledAt)}` : formatMessageDateTime(msg.createdAt)}
                  </p>
                </div>
                {onAction && actionLabel && (
                  <button
                    onClick={() => onAction(msg.id)}
                    className="shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    {actionLabel}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
