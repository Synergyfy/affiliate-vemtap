'use client';

import { cn } from '@/lib/utils';
import {
  QueueStatus,
  SmsMessageStatus,
  TemplateStatus,
  WhatsAppItemStatus,
  WHATSAPP_STATUS_COLORS,
  WHATSAPP_STATUS_LABELS,
  SMS_STATUS_COLORS,
  SMS_STATUS_LABELS,
  QUEUE_STATUS_COLORS,
  QUEUE_STATUS_LABELS,
  TEMPLATE_STATUS_COLORS,
  TEMPLATE_STATUS_LABELS,
  CampaignStatus,
  CAMPAIGN_STATUS_COLORS,
  CAMPAIGN_STATUS_LABELS,
} from '@/types/communication';

type AnyStatus = WhatsAppItemStatus | SmsMessageStatus | QueueStatus | TemplateStatus | CampaignStatus;

interface MessageStatusBadgeProps {
  status: AnyStatus;
  kind?: 'whatsapp' | 'sms' | 'queue' | 'template' | 'campaign';
  className?: string;
  size?: 'sm' | 'md';
}

export default function MessageStatusBadge({ status, kind = 'whatsapp', className, size = 'sm' }: MessageStatusBadgeProps) {
  let colors = WHATSAPP_STATUS_COLORS[status as WhatsAppItemStatus];
  let label = WHATSAPP_STATUS_LABELS[status as WhatsAppItemStatus];

  if (kind === 'sms' && status in SMS_STATUS_COLORS) {
    colors = SMS_STATUS_COLORS[status as SmsMessageStatus];
    label = SMS_STATUS_LABELS[status as SmsMessageStatus];
  } else if (kind === 'queue' && status in QUEUE_STATUS_COLORS) {
    colors = QUEUE_STATUS_COLORS[status as QueueStatus];
    label = QUEUE_STATUS_LABELS[status as QueueStatus];
  } else if (kind === 'template' && status in TEMPLATE_STATUS_COLORS) {
    colors = TEMPLATE_STATUS_COLORS[status as TemplateStatus];
    label = TEMPLATE_STATUS_LABELS[status as TemplateStatus];
  } else if (kind === 'campaign' && status in CAMPAIGN_STATUS_COLORS) {
    colors = CAMPAIGN_STATUS_COLORS[status as CampaignStatus];
    label = CAMPAIGN_STATUS_LABELS[status as CampaignStatus];
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-bold uppercase tracking-wider shrink-0',
        size === 'sm' ? 'text-[10px] px-2.5 py-1' : 'text-xs px-3 py-1.5',
        colors?.bg,
        colors?.text,
        colors?.border,
        className,
      )}
    >
      {label || status}
    </span>
  );
}