'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  MessageCircle,
  Clock,
  CheckCheck,
  MessageSquare,
  Send,
  XCircle,
  CalendarClock,
  Megaphone,
  ArrowRight,
  Loader2,
  Zap,
} from 'lucide-react';
import StatCard from '@/components/communication/StatCard';
import ChannelBadge from '@/components/communication/ChannelBadge';
import MessageStatusBadge from '@/components/communication/MessageStatusBadge';
import SmsComposerModal from '@/components/admin/communication/SmsComposerModal';
import {
  useCommunicationOverview,
  useQueues,
  useCommunicationMessages,
} from '@/services/useCommunicationHooks';
import { formatMessageDateTime } from '@/lib/communication';

export default function OverviewTab() {
  const { data: overview, isLoading } = useCommunicationOverview();
  const { data: queues, isLoading: queuesLoading } = useQueues();
  const { data: messagesData, isLoading: messagesLoading } = useCommunicationMessages({ limit: 6 });
  const [quickSmsOpen, setQuickSmsOpen] = useState(false);

  const stats = [
    { label: 'Total Contacts', value: overview?.overview.totalContacts ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', hint: 'All leads in the system' },
    { label: 'WhatsApp Eligible', value: overview?.overview.contactsEligibleForWhatsApp ?? 0, icon: MessageCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', hint: 'Contacts with a phone number' },
    { label: 'WhatsApp Follow-ups Pending', value: overview?.overview.whatsappFollowUpsPending ?? 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', hint: 'Waiting to be sent' },
    { label: 'WhatsApp Sent', value: overview?.overview.whatsappMessagesSent ?? 0, icon: CheckCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', hint: 'Marked as sent' },
    { label: 'SMS Sent', value: overview?.overview.smsSent ?? 0, icon: Send, color: 'text-sky-600', bg: 'bg-sky-50', hint: 'Delivered or sent' },
    { label: 'SMS Pending', value: overview?.overview.smsPending ?? 0, icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50', hint: 'Scheduled or queued' },
    { label: 'Failed SMS', value: overview?.overview.smsFailed ?? 0, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', hint: 'Needs attention' },
    { label: 'Scheduled Messages', value: overview?.overview.scheduledMessages ?? 0, icon: CalendarClock, color: 'text-indigo-600', bg: 'bg-indigo-50', hint: 'Across all channels' },
    { label: 'Active Campaigns', value: overview?.overview.activeCampaigns ?? 0, icon: Megaphone, color: 'text-purple-600', bg: 'bg-purple-50', hint: 'Running promotions' },
  ];

  return (
    <div className="space-y-4 sm:space-y-8">
      {/* Quick SMS action */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <button
          onClick={() => setQuickSmsOpen(true)}
          className="group flex items-center justify-between w-full p-3 sm:p-5 bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-md hover:border-amber-200 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-600 text-white shadow-lg">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-sm font-black text-slate-700 group-hover:text-amber-600 transition-colors">Quick SMS</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
        </button>
      </motion.div>

      {/* Stats grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
          {stats.map((stat, idx) => (
            <StatCard key={stat.label} index={idx} {...stat} />
          ))}
        </div>
      )}

      {/* Active queues + recent messages */}
      <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
        <section className="bg-white p-3 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-5">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate min-w-0">Active WhatsApp Queues</h3>
            <Link href="/admin/communication/whatsapp" className="text-[11px] sm:text-xs font-black text-blue-600 hover:underline uppercase tracking-widest shrink-0">
              View all
            </Link>
          </div>
          {queuesLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-slate-300 mx-auto" />
          ) : queues && queues.length > 0 ? (
            <div className="space-y-4">
              {queues.filter((q) => q.status === 'ACTIVE' || q.status === 'PAUSED').map((q) => (
                <Link
                  key={q.id}
                  href={`/admin/communication/whatsapp/queue/${q.id}`}
                  className="block p-3 sm:p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-white transition-all group overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-sm font-black text-slate-800 truncate min-w-0 group-hover:text-blue-600">{q.name}</p>
                    <MessageStatusBadge status={q.status} kind="queue" className="shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex-1 min-w-0 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${q.totalItems ? Math.round((q.completedItems / q.totalItems) * 100) : 0}%` }}
                        transition={{ duration: 0.6 }}
                        className="h-full bg-emerald-500 rounded-full"
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 shrink-0">
                      {q.completedItems}/{q.totalItems}
                    </span>
                  </div>
                </Link>
              ))}
              {queues.filter((q) => q.status === 'ACTIVE' || q.status === 'PAUSED').length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">No active queues.</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">No queues yet. Start a follow-up from the WhatsApp tab.</p>
          )}
        </section>

        <section className="bg-white p-3 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-5">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate min-w-0">Recent Messages</h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">All channels</span>
          </div>
          {messagesLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-slate-300 mx-auto" />
          ) : messagesData?.data && messagesData.data.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {messagesData.data.slice(0, 6).map((m) => (
                <div key={m.id} className="p-3 sm:p-4 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold text-slate-800 truncate min-w-0">{m.lead?.businessName || 'Unknown'}</p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <ChannelBadge channel={m.channel} />
                      <MessageStatusBadge
                        status={m.status}
                        kind={m.channel === 'WHATSAPP' ? 'whatsapp' : 'sms'}
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium truncate">{m.body}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">{formatMessageDateTime(m.sentAt || m.createdAt)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">No messages sent yet.</p>
          )}
        </section>
      </div>

      <SmsComposerModal
        isOpen={quickSmsOpen}
        onClose={() => setQuickSmsOpen(false)}
      />
    </div>
  );
}