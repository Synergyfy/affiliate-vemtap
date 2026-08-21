'use client';

import { cn } from '@/lib/utils';
import { CommunicationChannel, CHANNEL_COLORS, CHANNEL_LABELS } from '@/types/communication';
import { MessageCircle, MessageSquare } from 'lucide-react';

interface ChannelBadgeProps {
  channel: CommunicationChannel;
  className?: string;
  withIcon?: boolean;
}

export default function ChannelBadge({ channel, className, withIcon = true }: ChannelBadgeProps) {
  const color = CHANNEL_COLORS[channel];
  const Icon = channel === 'WHATSAPP' ? MessageCircle : MessageSquare;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider',
        color.bg,
        color.text,
        color.border,
        className,
      )}
    >
      {withIcon && <Icon className="w-3 h-3" />}
      {CHANNEL_LABELS[channel]}
    </span>
  );
}