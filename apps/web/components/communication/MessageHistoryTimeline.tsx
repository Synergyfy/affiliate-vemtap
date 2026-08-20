'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { MessageCircle, MessageSquare, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OutboundMessage, CHANNEL_COLORS } from '@/types/communication';
import MessageStatusBadge from './MessageStatusBadge';
import { formatMessageDateTime } from '@/lib/communication';

interface MessageHistoryTimelineProps {
  history: OutboundMessage[];
  expandable?: boolean;
}

export default function MessageHistoryTimeline({ history, expandable = true }: MessageHistoryTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!history || history.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm font-medium text-slate-400">No communication history yet.</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-1 pl-1">
      {history.map((message, idx) => {
        const colors = CHANNEL_COLORS[message.channel];
        const Icon = message.channel === 'WHATSAPP' ? MessageCircle : MessageSquare;
        const isExpanded = expandedId === message.id;
        const isLast = idx === history.length - 1;

        return (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04 }}
            className="relative pl-10 pb-5"
          >
            {/* rail */}
            {!isLast && <div className="absolute left-[17px] top-9 bottom-0 w-px bg-slate-200" />}
            {/* node */}
            <div
              className={cn(
                'absolute left-0 top-0 w-9 h-9 rounded-full flex items-center justify-center',
                colors.bg,
              )}
            >
              <Icon className={cn('w-4 h-4', colors.text)} />
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-3.5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <MessageStatusBadge
                    status={message.status}
                    kind={message.channel === 'WHATSAPP' ? 'whatsapp' : 'sms'}
                  />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                    {message.sentBy || 'System'} · {formatMessageDateTime(message.sentAt || message.createdAt)}
                  </span>
                </div>
                {expandable && (
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : message.id)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                  >
                    <ChevronDown
                      className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')}
                    />
                  </button>
                )}
              </div>

              <AnimatePresence initial={false}>
                {(isExpanded || !expandable) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    <p className="text-xs text-slate-600 leading-relaxed font-medium pt-2 whitespace-pre-wrap">
                      {message.body}
                    </p>
                    {message.templateId && (
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Template: {message.templateId}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}