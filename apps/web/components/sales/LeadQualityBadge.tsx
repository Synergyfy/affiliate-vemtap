import { cn } from '@/lib/utils';
import { LeadQuality, LEAD_QUALITY_LABELS, LEAD_QUALITY_COLORS } from '@/types/sales-pipeline';
import { HelpCircle } from 'lucide-react';

interface LeadQualityBadgeProps {
  quality: LeadQuality | undefined;
  showScore?: boolean;
  score?: number;
  size?: 'sm' | 'md';
  compact?: boolean;
}

const QUALITY_TOOLTIP: Record<LeadQuality, string> = {
  NEW: 'Lead has been submitted but not yet assessed.',
  QUALIFIED: 'Business is a legitimate potential VEMTAP customer.',
  UNQUALIFIED: 'Business does not currently fit the target.',
  INVALID: 'Information is incomplete, false or unusable.',
  DUPLICATE: 'Business already exists or another lead already represents it.',
  INTERESTED: 'Business has shown interest and requires follow-up.',
  CONVERTED: 'Business subscribed.',
};

export default function LeadQualityBadge({
  quality,
  showScore = false,
  score,
  size = 'md',
  compact = false,
}: LeadQualityBadgeProps) {
  if (!quality) {
    return (
      <span className={cn(
        "inline-flex items-center rounded-full font-semibold",
        size === 'sm' ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-xs',
        "bg-slate-100 text-slate-500",
      )}>
        Unassessed
      </span>
    );
  }

  const styles = LEAD_QUALITY_COLORS[quality];
  const label = LEAD_QUALITY_LABELS[quality];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-black uppercase tracking-widest",
        size === 'sm' ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-xs',
        styles.bg,
        styles.text,
      )}
      title={QUALITY_TOOLTIP[quality]}
    >
      {label}
      {showScore && score !== undefined && (
        <span className="opacity-70">({score})</span>
      )}
      {!compact && (
        <HelpCircle className="w-3 h-3 opacity-50" />
      )}
    </span>
  );
}
