'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Send, MessageCircle, Clock, CheckCircle2,
  ChevronDown, HelpCircle, Loader2, CircleDot, XCircle
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useCreateSupportTicket, useFaqs, useSupportTickets } from '@/services/useSupportHooks';

const statusIconMap: Record<string, typeof Clock> = {
  PENDING: Clock,
  IN_PROGRESS: CircleDot,
  RESOLVED: CheckCircle2,
};

export default function SupportPage() {
  const { showToast } = useToast();
  const { data: tickets = [], isLoading: isLoadingTickets } = useSupportTickets();
  const { data: faqItems = [] } = useFaqs();
  const createTicket = useCreateSupportTicket();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setIsSubmitting(true);
    try {
      await createTicket.mutateAsync({ subject: subject.trim(), message: message.trim() });
      setSubmitted(true);
      setSubject('');
      setMessage('');
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      showToast('Unable to submit your ticket.', 'error');
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
                 const st = {
                   label: ticket.status.replace('_', ' '),
                   color: ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? 'text-emerald-600' : ticket.status === 'IN_PROGRESS' ? 'text-blue-600' : 'text-amber-600',
                   bg: 'bg-slate-50',
                   icon: statusIconMap[ticket.status] || Clock,
                 };
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

           {faqItems.map((item, idx) => (
             <div key={item.id} className="border border-slate-100 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between p-3.5 text-left hover:bg-slate-50 transition-colors"
              >
                 <span className="text-xs font-bold text-slate-700 pr-2">{item.question}</span>
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
                       {item.answer}
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
