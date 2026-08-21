'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { PlayCircle, ArrowRight, Loader2, CheckCircle2, Pause, Play } from 'lucide-react';
import AudienceBuilder from '@/components/communication/AudienceBuilder';
import MessageComposer from '@/components/communication/MessageComposer';
import MessageStatusBadge from '@/components/communication/MessageStatusBadge';
import { useToast } from '@/hooks/toast';
import {
  useCreateWhatsAppQueue,
  useQueues,
  useTemplates,
  useQueueLifecycle,
  useAudienceEstimate,
  useAudiencePreviewContact,
} from '@/services/useCommunicationHooks';
import { AudienceFilter, EMPTY_AUDIENCE } from '@/types/communication';
import { useDebounce } from '@/hooks/use-debounce';
import { AlertTriangle, UsersRound } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WhatsAppTab() {
  const router = useRouter();
  const { showToast } = useToast();
  const [filters, setFilters] = useState<AudienceFilter>(EMPTY_AUDIENCE);
  const [message, setMessage] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined);

  const { data: templates } = useTemplates({ channel: 'WHATSAPP', status: 'ACTIVE' });
  const { data: queues, isLoading: queuesLoading } = useQueues();
  const createQueue = useCreateWhatsAppQueue();
  const queueLifecycle = useQueueLifecycle();

  const debouncedFilters = useDebounce(filters, 400);
  const { data: estimate } = useAudienceEstimate(filtersActive() ? debouncedFilters : null);

  const previewLead = useAudiencePreviewContact(debouncedFilters).data ?? null;

  const audienceCount = estimate?.eligibleCount ?? 0;
  const canStart = filtersActive() && message.trim().length > 0 && audienceCount > 0;

  function filtersActive() {
    return (
      (filters.statuses?.length ?? 0) > 0 ||
      (filters.salespersonIds?.length ?? 0) > 0 ||
      !!filters.location
    );
  }

  const handleStart = async () => {
    if (!canStart) return;
    try {
      const queue = await createQueue.mutateAsync({
        name: buildQueueName(),
        filters,
        templateId: selectedTemplateId,
        message: message.trim(),
      });
      showToast('WhatsApp follow-up messages created.', 'success');
      router.push('/admin/communication');
    } catch (error: any) {
      showToast(error?.message || 'Failed to start WhatsApp follow-up.', 'error');
    }
  };

  const buildQueueName = () => {
    const statusFilters = (filters.statuses || []).map((s) => s.replace(/_/g, ' ').toLowerCase());
    const loc =
      filters.location ? ` — ${filters.location}` : '';
    return statusFilters.length > 0
      ? `Follow-up: ${statusFilters.map((s) => s[0].toUpperCase() + s.slice(1)).join(', ')}${loc}`
      : `Follow-up${loc}`;
  };

  const handlePauseToggle = async (q: { id: string; status: string; name: string }) => {
    try {
      await queueLifecycle.mutateAsync({
        queueId: q.id,
        action: q.status === 'ACTIVE' ? 'pause' : 'resume',
      });
      showToast(q.status === 'ACTIVE' ? `${q.name} paused.` : `${q.name} resumed.`, 'info');
    } catch (error: any) {
      showToast(error?.message || 'Failed to update queue.', 'error');
    }
  };

  const queueItems = queues || [];

  return (
    <div className="space-y-4 sm:space-y-8">
      {/* Create follow-up */}
      <section className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden">
        <div className="p-3 sm:p-5 lg:p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">Create WhatsApp Follow-up</h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Select the audience, prepare one message, then work through the contacts one at a time.
          </p>
        </div>
        <div className="p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-6">
          <AudienceBuilder filters={filters} onChange={setFilters} />
          <div className="p-3 sm:p-5 bg-slate-50 rounded-2xl sm:rounded-3xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Message</p>
            <MessageComposer
              channel="WHATSAPP"
              value={message}
              onChange={setMessage}
              onPickTemplate={(tpl) => setSelectedTemplateId(tpl.id)}
              templates={templates}
              resolveLead={previewLead}
            />
          </div>
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
              {estimate && estimate.skippedFrequency > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  {estimate.skippedFrequency} excluded by frequency rules
                </span>
              )}
              <p className="text-xs font-medium text-slate-400">
                {canStart ? 'WhatsApp opens for you to send — VEMTAP only records what you confirm as sent.' : audienceCount === 0 && filtersActive() ? 'Adjust filters to reach at least one contact.' : 'Select an audience and write a message to begin.'}
              </p>
            </div>
            <button
              onClick={handleStart}
              disabled={!canStart}
              className={cn(
                'inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-lg',
                canStart
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed',
              )}
            >
              {createQueue.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
              Start WhatsApp Follow-up ({audienceCount})
            </button>
          </div>
        </div>
      </section>

      {/* Queues */}
      <section>
        <h3 className="text-lg font-bold text-slate-900 mb-4">Queues</h3>
        {queuesLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
          </div>
        ) : queueItems.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center">
            <PlayCircle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">No WhatsApp queues yet. Build your first follow-up above.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {queueItems.map((q, idx) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-black text-slate-800">{q.name}</p>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      {q.completedItems}/{q.totalItems} completed · {new Date(q.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <MessageStatusBadge status={q.status} kind="queue" />
                </div>

                <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${q.totalItems ? Math.round((q.completedItems / q.totalItems) * 100) : 0}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-emerald-500 rounded-full"
                  />
                </div>

                <div className="flex items-center gap-2">
                  {(q.status === 'ACTIVE' || q.status === 'PAUSED') && (
                    <button
                      onClick={() => handlePauseToggle(q)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-slate-600 bg-slate-100 hover:bg-slate-200 uppercase tracking-widest transition-colors"
                    >
                      {q.status === 'ACTIVE' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      {q.status === 'ACTIVE' ? 'Pause' : 'Resume'}
                    </button>
                  )}
                  <button
                    onClick={() => router.push(`/admin/communication/whatsapp/queue/${q.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100 transition-colors"
                  >
                    {q.status === 'COMPLETED' || q.status === 'CANCELLED' ? 'View' : 'Continue'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Assurance note */}
      <div className="flex items-start gap-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
        <p className="text-xs text-emerald-800 font-medium leading-relaxed">
          VEMTAP never pretends a WhatsApp message was sent. The recipient and message are prepared, WhatsApp opens for
          you to press send, and only then do you mark it as sent — recorded transparently in the history.
        </p>
      </div>
    </div>
  );
}