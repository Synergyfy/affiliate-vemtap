'use client';

import { AlertTriangle } from 'lucide-react';

interface OverMessagingNoticeProps {
  count: number;
  warnings: string[];
}

export default function OverMessagingNotice({ count, warnings }: OverMessagingNoticeProps) {
  if (count <= 0 && warnings.length === 0) return null;
  return (
    <div className="flex items-start gap-2 max-w-sm">
      <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
      <div className="space-y-0.5">
        {count > 0 && (
          <p className="text-xs font-bold text-amber-700">
            {count} contact{count !== 1 ? 's' : ''} excluded by frequency rules
          </p>
        )}
        {warnings.map((w, i) => (
          <p key={i} className="text-[11px] font-medium text-amber-600/90 leading-snug">
            {w}
          </p>
        ))}
      </div>
    </div>
  );
}