'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useMyCommunicationFollowUps } from '@/services/useCommunicationHooks';
import { openWhatsApp, formatMessageDate } from '@/lib/communication';
import {
  MessageCircle,
  MessageSquare,
  ExternalLink,
  ArrowLeft,
  CheckCircle2,
  CalendarClock,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function CommunicationFollowUpsPage() {
  const { data, isLoading } = useMyCommunicationFollowUps();

  const whatsappDue = data?.whatsappDue || [];
  const smsScheduled = data?.smsScheduled || [];

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6 pb-6">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm pb-2">
          <div className="flex items-center gap-3 mb-1">
            <Link
              href="/dashboard"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                Follow-ups
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {whatsappDue.length + smsScheduled.length > 0
                  ? `${whatsappDue.length + smsScheduled.length} action${whatsappDue.length + smsScheduled.length !== 1 ? 's' : ''} due today`
                  : 'All caught up for today'}
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, idx) => (
              <div key={idx} className="h-28 bg-slate-50 animate-pulse rounded-[24px] border border-slate-100" />
            ))}
          </div>
        ) : whatsappDue.length === 0 && smsScheduled.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-[32px] p-12 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1">Nothing pending</h3>
            <p className="text-sm text-slate-500 font-medium">
              No WhatsApp follow-ups or scheduled SMS right now.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* WhatsApp due */}
            {whatsappDue.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                    WhatsApp follow-up due
                  </h2>
                  <span className="ml-auto text-xs font-black text-emerald-600">{whatsappDue.length}</span>
                </div>
                <div className="space-y-3">
                  {whatsappDue.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white border border-slate-200 rounded-[24px] p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <h3 className="text-sm font-black text-slate-900">{item.lead.businessName}</h3>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {item.lead.phone || 'No phone'} · {item.lead.location || 'No location'}
                          </p>
                          {item.lead.status && (
                            <span className="inline-block mt-1.5 text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider">
                              {item.lead.status.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-wider">
                          {item.status === 'OPENED' ? 'Opened' : 'Due'}
                        </span>
                      </div>
                      <button
                        onClick={() => openWhatsApp(item.lead.phone, item.message)}
                        className="flex w-full items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-100 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open WhatsApp
                      </button>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* SMS scheduled */}
            {smsScheduled.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-sky-600" />
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                    SMS scheduled
                  </h2>
                  <span className="ml-auto text-xs font-black text-sky-600">{smsScheduled.length}</span>
                </div>
                <div className="space-y-3">
                  {smsScheduled.map((msg, idx) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white border border-slate-200 rounded-[24px] p-5 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600 shrink-0">
                          <CalendarClock className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-black text-slate-900 truncate">
                            {msg.lead?.businessName || 'Unknown'}
                          </h3>
                          <p className="text-xs text-slate-400 font-medium truncate">{msg.body}</p>
                        </div>
                        <span className={cn('ml-auto text-[10px] font-black px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider shrink-0')}>
                          {formatMessageDate(msg.scheduledAt)}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Assurance note */}
        <div className="flex items-start gap-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4">
          <Loader2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0 animate-none" />
          <p className="text-xs text-emerald-800 font-medium leading-relaxed">
            WhatsApp messages are only recorded as sent when you confirm them — nothing is sent automatically.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}