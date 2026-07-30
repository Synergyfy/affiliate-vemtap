'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Send, MessageCircle, Clock, CheckCircle2,
  ChevronDown, HelpCircle, Loader2, CircleDot, XCircle
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { useMarketMappingConfig } from '@/hooks/use-market-mapping-config';

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
}

const FALLBACK_STATUSES = [
  { id: 'PENDING', label: 'Pending', color: 'text-amber-600' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'text-blue-600' },
  { id: 'RESOLVED', label: 'Resolved', color: 'text-emerald-600' },
];

const statusIconMap: Record<string, typeof Clock> = {
  PENDING: Clock,
  IN_PROGRESS: CircleDot,
  RESOLVED: CheckCircle2,
};

const FALLBACK_FAQ = [
  { q: 'How do I start a new market mapping mission?', a: 'Go to Market Mapping > Plan Mission. Set your start date, choose Day or Week, enter a location and target number, then save. You can then go to Execute Visits to start adding businesses.' },
  { q: 'How do I add a business after visiting?', a: 'In Execute Visits, tap "Add Business" to create a placeholder, then tap the business card to open the capture drawer. Fill in the details across General, Profile, and Sales tabs, then save.' },
  { q: 'What does "Subscribed" mean?', a: 'A business is marked as Subscribed (Customer) when they sign up on VemTap through your referral. This counts toward your monthly subscription target.' },
  { q: 'How do I track my progress?', a: 'Your dashboard shows daily and weekly targets with progress bars. The Pipeline page shows all businesses you captured and their current status.' },
  { q: 'How do I contact support?', a: 'Use the contact form on this page. Fill in the subject and message, then submit. Our team will respond to you via the platform.' },
  { q: 'How are commissions calculated?', a: 'Commissions are based on the plan type of each subscribed business. Premium and Enterprise plans earn higher commissions. Check your Wallet & Earnings for details.' },
];

export default function SupportPage() {
  const { user } = useAuth();
  const { data: config } = useMarketMappingConfig();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const statusList = (config?.ticketStatuses as { id: string; label: string; color: string }[] | undefined) ?? FALLBACK_STATUSES;
  const faqItems = (config?.faqs as { id: string; question: string; answer: string }[] | undefined) ?? FALLBACK_FAQ;
  const statusConfig = useMemo(() => {
    const map: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {};
    for (const s of statusList) {
      map[s.id] = {
        label: s.label,
        color: s.color || 'text-slate-600',
        bg: 'bg-slate-50',
        icon: statusIconMap[s.id] || Clock,
      };
    }
    return map;
  }, [statusList]);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setIsLoadingTickets(true);
    try {
      const res = await api.get('/support/tickets');
      const data = res as any;
      setTickets(Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []);
    } catch {
      setTickets([]);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setIsSubmitting(true);
    try {
      await api.post('/support/tickets', { subject: subject.trim(), message: message.trim() });
      setSubmitted(true);
      setSubject('');
      setMessage('');
      fetchTickets();
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-0">

        {/* Header */}
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </a>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              Support
            </h1>
            <p className="text-xs text-slate-500 font-medium">Contact us or browse FAQs</p>
          </div>
        </div>

        {/* Contact Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-black text-slate-900">Send a Message</h3>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Issue with lead assignment"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-400 transition-all"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Describe your issue or question..."
              rows={4}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-400 transition-all resize-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !subject.trim() || !message.trim()}
            className={cn(
              "w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all",
              submitted
                ? "bg-emerald-600 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {submitted ? (
              <><CheckCircle2 className="w-4 h-4" /> Sent!</>
            ) : isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-pulse" /> Sending...</>
            ) : (
              <><Send className="w-4 h-4" /> Submit</>
            )}
          </button>
        </form>

        {/* Ticket History */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-black text-slate-900">Your Tickets</h3>

          {isLoadingTickets ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-pulse text-slate-300" />
            </div>
          ) : tickets.length > 0 ? (
            <div className="space-y-3">
              {tickets.map(ticket => {
                const st = statusConfig[ticket.status] || statusConfig.PENDING;
                const StatusIcon = st.icon;
                return (
                  <div key={ticket.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-slate-800 truncate">{ticket.subject}</p>
                      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0", st.bg, st.color)}>
                        <StatusIcon className="w-3 h-3" />
                        {st.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{ticket.message}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">
                      {new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-xs text-slate-400 font-semibold">No tickets yet</p>
            </div>
          )}
        </div>

        {/* FAQ */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-black text-slate-900">Frequently Asked Questions</h3>
            </div>
            <a href="/dashboard/faq" className="text-[10px] font-bold text-blue-600 hover:underline">Read More</a>
          </div>

          {faqItems.map((item: any, idx: number) => (
            <div key={idx} className="border border-slate-100 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between p-3.5 text-left hover:bg-slate-50 transition-colors"
              >
                <span className="text-xs font-bold text-slate-700 pr-2">{item.question || item.q}</span>
                <ChevronDown className={cn("w-4 h-4 text-slate-400 shrink-0 transition-transform", openFaq === idx && "rotate-180")} />
              </button>
              <AnimatePresence>
                {openFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3.5 pb-3.5 text-xs text-slate-500 font-medium leading-relaxed border-t border-slate-50 pt-3">
                      {item.answer || item.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

      </div>
    </DashboardLayout>
  );
}
