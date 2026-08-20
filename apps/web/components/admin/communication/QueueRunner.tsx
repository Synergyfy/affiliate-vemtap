'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Loader2,
  MessageCircle,
  Phone,
  Copy,
  Check,
  ExternalLink,
  CheckCircle2,
  SkipForward,
  MapPin,
  User,
  PartyPopper,
  ListChecks,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ModalShell from '@/components/ui/ModalShell';
import MessageStatusBadge from '@/components/communication/MessageStatusBadge';
import { useToast } from '@/hooks/toast';
import { useQueue, useQueueItemAction } from '@/services/useCommunicationHooks';
import { openWhatsApp } from '@/lib/communication';
import { CommunicationQueueItem } from '@/types/communication';

interface QueueRunnerProps {
  queueId: string;
  hideNav?: boolean;
}

export default function QueueRunner({ queueId, hideNav }: QueueRunnerProps) {
  const { showToast } = useToast();
  const { data: queue, isLoading, isError } = useQueue(queueId);
  const itemAction = useQueueItemAction();
  const [copied, setCopied] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);

  const currentItem = useMemo<CommunicationQueueItem | null>(() => {
    if (!queue) return null;
    const resumed =
      queue.items.find((i) => i.status === 'PENDING');
    return resumed || null;
  }, [queue]);

  const isDone = queue && queue.completedItems >= queue.totalItems;

  const handleOpen = async (item: CommunicationQueueItem) => {
    openWhatsApp(item.lead.phone, item.message);
    showToast('WhatsApp opened — send the message there.', 'info');
  };

  const handleSent = async (item: CommunicationQueueItem) => {
    try {
      await itemAction.mutateAsync({ queueId, itemId: item.id, action: 'sent' });
      showToast(`${item.lead.businessName} marked as sent.`, 'success');
    } catch (error: any) {
      showToast(error?.message || 'Failed to record as sent.', 'error');
    }
  };

  const handleSkip = async (item: CommunicationQueueItem) => {
    await itemAction.mutateAsync({ queueId, itemId: item.id, action: 'skip' });
    showToast(`${item.lead.businessName} skipped.`, 'info');
  };

  const copyMessage = async () => {
    if (!currentItem) return;
    try {
      await navigator.clipboard.writeText(currentItem.message);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
      </div>
    );
  }

  if (isError || !queue) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
        <p className="text-sm font-medium text-slate-500">Unable to load this queue.</p>
        <Link href="/admin/communication/whatsapp" className="inline-block mt-4 text-xs font-black text-blue-600 uppercase tracking-widest">
          Back to WhatsApp
        </Link>
      </div>
    );
  }

  const remainingItems = queue.items.filter((i) => i.status === 'PENDING');
  const completedItems = queue.items.filter((i) => i.status === 'SENT' || i.status === 'CANCELLED');
  const progress = queue.totalItems ? Math.round((queue.completedItems / queue.totalItems) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      {!hideNav && (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/communication/whatsapp"
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h2 className="text-lg font-black text-slate-900">{queue.name}</h2>
              <p className="text-xs text-slate-400 font-medium">Created {new Date(queue.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <MessageStatusBadge status={queue.status} kind="queue" size="md" />
        </div>
      )}

      {/* Progress */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Progress</p>
          <p className="text-sm font-black text-slate-900 font-mono">
            {queue.completedItems}/{queue.totalItems} done · {remainingItems.length} remaining
          </p>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-emerald-500 rounded-full"
          />
        </div>
      </div>

      {isDone ? (
        /* Completion state */
        <div className="bg-white border border-slate-200 rounded-[32px] p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <PartyPopper className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-1">All done!</h3>
          <p className="text-sm text-slate-500 font-medium mb-6">
            You worked through {queue.completedItems} contact{queue.completedItems !== 1 ? 's' : ''}.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/admin/communication"
              className="px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100"
            >
              Back to Overview
            </Link>
            <Link
              href="/admin/communication/whatsapp"
              className="px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              Start another follow-up
            </Link>
          </div>
        </div>
      ) : currentItem ? (
        <div className="grid lg:grid-cols-[1fr_340px] gap-6">
          {/* Working card */}
          <div className="space-y-4">
            <motion.div
              key={currentItem.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden"
            >
              <div className="p-6 lg:p-8">
                {/* Contact header */}
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900">{currentItem.lead.businessName}</h3>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mt-1">
                        <Phone className="w-3 h-3" />
                        {currentItem.lead.phone || 'No phone number'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageStatusBadge status={currentItem.status} />
                  </div>
                </div>

                {/* Context row */}
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-500 mb-6">
                  {currentItem.lead.contactName && (
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" /> {currentItem.lead.contactName}
                    </span>
                  )}
                  {currentItem.lead.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {currentItem.lead.location}
                    </span>
                  )}
                  {currentItem.lead.status && (
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider">
                      {currentItem.lead.status.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>

                {/* Message */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Message ready</p>
                  <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{currentItem.message}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 lg:px-8 py-5 border-t border-slate-100 bg-slate-50/60 flex flex-wrap items-center gap-3">
                <button
                  onClick={copyMessage}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={() => handleOpen(currentItem)}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open WhatsApp
                </button>
                <button
                  onClick={() => handleSent(currentItem)}
                  disabled={currentItem.status !== 'PENDING'}
                  className={cn(
                    'flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all',
                    currentItem.status === 'PENDING'
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed',
                  )}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mark as Sent
                </button>
                <button
                  onClick={() => handleSkip(currentItem)}
                  className="ml-auto flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 hover:bg-white transition-colors"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  Skip
                </button>
              </div>

              {currentItem.status !== 'PENDING' && (
                <div className="px-6 lg:px-8 py-3 bg-amber-50/60 border-t border-amber-100 flex items-center gap-2">
                  <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
                  <p className="text-[11px] font-bold text-amber-700">
                    Open WhatsApp first, then mark as sent — VEMTAP never records a send you didn&apos;t make.
                  </p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Side rail (desktop) */}
          <div className="hidden lg:block">
            <QueueList
              items={queue.items}
              currentId={currentItem.id}
              completedCount={completedItems.length}
            />
          </div>
        </div>
      ) : null}

      {/* Mobile queue toggle */}
      {currentItem && !isDone && (
        <div className="lg:hidden fixed bottom-5 inset-x-0 px-4 z-40 flex justify-center pointer-events-none">
          <button
            onClick={() => setQueueOpen(true)}
            className="pointer-events-auto flex items-center gap-2 pl-4 pr-5 py-3 rounded-full bg-blue-600 text-white shadow-xl shadow-blue-900/20 hover:bg-blue-700 active:scale-95 transition-all"
          >
            <ListChecks className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-widest">
              Queue · {remainingItems.length} left
            </span>
          </button>
        </div>
      )}

      {/* Mobile queue sheet */}
      <ModalShell
        isOpen={queueOpen}
        onClose={() => setQueueOpen(false)}
        header={
          <div className="flex items-center justify-between p-5 sm:p-6 pr-14">
            <div>
              <h2 className="text-lg font-black text-slate-900">Queue items</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {completedItems.length} complete · {remainingItems.length} remaining
              </p>
            </div>
          </div>
        }
      >
        <QueueList
          items={queue.items}
          currentId={currentItem?.id || ''}
          completedCount={completedItems.length}
        />
      </ModalShell>
    </div>
  );
}

function QueueList({
  items,
  currentId,
  completedCount,
}: {
  items: CommunicationQueueItem[];
  currentId: string;
  completedCount: number;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden h-full">
      <div className="hidden lg:block px-5 py-4 border-b border-slate-100">
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Queue items</p>
      </div>
      <div className="max-h-[520px] lg:max-h-none overflow-y-auto">
        {items.map((item) => {
          const isCurrent = item.id === currentId;
          const finished = item.status === 'SENT' || item.status === 'CANCELLED';
          return (
            <div
              key={item.id}
              className={cn(
                'flex items-center gap-3 px-5 py-4 border-b border-slate-50',
                isCurrent && 'bg-blue-50/60',
              )}
            >
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center shrink-0 border text-[11px] font-black',
                  isCurrent
                    ? 'bg-blue-600 text-white border-blue-600'
                    : finished
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'bg-slate-100 text-slate-500 border-slate-200',
                )}
              >
                {finished ? <Check className="w-3 h-3" /> : item.order}
              </div>
              <div className="min-w-0">
                <p className={cn('text-sm font-bold truncate', isCurrent ? 'text-blue-700' : 'text-slate-700')}>
                  {item.lead.businessName}
                </p>
                <p className="text-[10px] text-slate-400 font-medium">{item.lead.phone || 'No phone'}</p>
              </div>
              <span className="ml-auto text-[10px] font-black uppercase tracking-wider text-slate-400">
                {finished ? '—' : isCurrent ? 'now' : ''}
              </span>
            </div>
          );
        })}
      </div>
      <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completed</p>
        <p className="text-sm font-black text-slate-800 font-mono">{completedCount}</p>
      </div>
    </div>
  );
}