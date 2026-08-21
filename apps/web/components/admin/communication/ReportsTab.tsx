'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  MessageCircle, Send, CheckCheck, XCircle, Clock, Users,
  TrendingUp, BarChart3, Loader2,
} from 'lucide-react';
import StatCard from '@/components/communication/StatCard';
import { useCommunicationOverview, useQueues, useCommunicationMessages } from '@/services/useCommunicationHooks';
import { cn } from '@/lib/utils';

function MiniBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-600">{label}</span>
        <span className="text-xs font-black text-slate-800">{value.toLocaleString()}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6 }}
          className={cn('h-full rounded-full', color)}
        />
      </div>
    </div>
  );
}

export default function ReportsTab() {
  const { data: overview, isLoading } = useCommunicationOverview();
  const { data: queues } = useQueues();
  const { data: messagesData } = useCommunicationMessages({ limit: 200 });

  const messages = messagesData?.data ?? [];

  const stats = useMemo(() => {
    const totalQueued = queues?.reduce((sum, q) => sum + q.totalItems, 0) || 0;
    const completedQueued = queues?.reduce((sum, q) => sum + q.completedItems, 0) || 0;
    const smsMessages = messages.filter((m) => m.channel === 'SMS');
    const whatsappMessages = messages.filter((m) => m.channel === 'WHATSAPP');

    return {
      whatsapp: {
        queued: totalQueued,
        sent: overview?.overview.whatsappMessagesSent || whatsappMessages.filter((m) => m.status === 'SENT').length,
        pending: overview?.overview.whatsappFollowUpsPending || 0,
        completedQueued,
      },
      sms: {
        sent: overview?.overview.smsSent || smsMessages.filter((m) => m.status === 'SENT').length,
        failed: overview?.overview.smsFailed || smsMessages.filter((m) => m.status === 'FAILED').length,
        scheduled: overview?.overview.scheduledMessages || smsMessages.filter((m) => m.status === 'SCHEDULED').length,
      },
      conversion: {
        totalContacts: overview?.overview.totalContacts || 0,
        whatsappEligible: overview?.overview.contactsEligibleForWhatsApp || 0,
      },
    };
  }, [overview, queues, messages]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
      </div>
    );
  }

  const maxWhatsapp = Math.max(stats.whatsapp.queued, stats.whatsapp.sent, 1);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Communication Reports</h3>
        <p className="text-xs text-slate-500 mt-1">Track WhatsApp and SMS performance across the platform.</p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard index={0} label="Total Contacts" value={stats.conversion.totalContacts} icon={Users} color="text-blue-600" bg="bg-blue-50" />
        <StatCard index={1} label="WhatsApp Eligible" value={stats.conversion.whatsappEligible} icon={MessageCircle} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard index={2} label="Active Campaigns" value={overview?.overview.activeCampaigns || 0} icon={TrendingUp} color="text-purple-600" bg="bg-purple-50" />
        <StatCard index={3} label="Scheduled" value={stats.sms.scheduled} icon={Clock} color="text-indigo-600" bg="bg-indigo-50" />
      </div>

      {/* Channel breakdowns */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* WhatsApp */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-600">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800">WhatsApp</h4>
              <p className="text-[11px] text-slate-400">Assisted follow-up queues</p>
            </div>
          </div>
          <div className="space-y-4">
            <MiniBar label="Total queued" value={stats.whatsapp.queued} max={maxWhatsapp} color="bg-emerald-500" />
            <MiniBar label="Sent" value={stats.whatsapp.sent} max={maxWhatsapp} color="bg-emerald-400" />
            <MiniBar label="Pending" value={stats.whatsapp.pending} max={maxWhatsapp} color="bg-amber-400" />
            <MiniBar label="Active queues" value={queues?.filter((q) => q.status === 'ACTIVE').length || 0} max={Math.max(queues?.length || 0, 1)} color="bg-blue-500" />
          </div>
        </motion.section>

        {/* SMS */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-2xl bg-sky-100 text-sky-600">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800">SMS</h4>
              <p className="text-[11px] text-slate-400">Direct platform sends</p>
            </div>
          </div>
          <div className="space-y-4">
            <MiniBar label="Sent" value={stats.sms.sent} max={Math.max(stats.sms.sent, 1)} color="bg-sky-500" />
            <MiniBar label="Delivered" value={stats.sms.sent} max={Math.max(stats.sms.sent, 1)} color="bg-emerald-500" />
            <MiniBar label="Failed" value={stats.sms.failed} max={Math.max(stats.sms.sent + stats.sms.failed, 1)} color="bg-red-500" />
            <MiniBar label="Scheduled" value={stats.sms.scheduled} max={Math.max(stats.sms.scheduled, 1)} color="bg-indigo-400" />
          </div>
        </motion.section>
      </div>

      {/* Conversion funnel */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-600">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-800">Funnel Overview</h4>
            <p className="text-[11px] text-slate-400">Contact reach and communication coverage</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total contacts', value: stats.conversion.totalContacts, color: 'bg-blue-500' },
            { label: 'WhatsApp eligible', value: stats.conversion.whatsappEligible, color: 'bg-emerald-500' },
            { label: 'WhatsApp sent', value: stats.whatsapp.sent, color: 'bg-emerald-400' },
            { label: 'SMS sent', value: stats.sms.sent, color: 'bg-sky-500' },
          ].map((item, idx) => {
            const pct = stats.conversion.totalContacts > 0 ? Math.round((item.value / stats.conversion.totalContacts) * 100) : 0;
            return (
              <div key={item.label} className="text-center p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-2xl font-black text-slate-800">{item.value.toLocaleString()}</p>
                <p className="text-[11px] font-bold text-slate-500 mt-1">{item.label}</p>
                <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: idx * 0.1 }}
                    className={cn('h-full rounded-full', item.color)}
                  />
                </div>
                <p className="text-[10px] font-bold text-slate-400 mt-1">{pct}%</p>
              </div>
            );
          })}
        </div>
      </motion.section>
    </div>
  );
}
