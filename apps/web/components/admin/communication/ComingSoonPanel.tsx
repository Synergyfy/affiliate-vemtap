'use client';

import { Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ComingSoonPanelProps {
  title: string;
  description: string;
  bullets?: string[];
  href?: string;
  cta?: string;
  iconBackground?: string;
}

export default function ComingSoonPanel({
  title,
  description,
  bullets = [],
  href,
  cta,
  iconBackground = 'bg-blue-50',
}: ComingSoonPanelProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-10 lg:p-14 text-center max-w-2xl mx-auto shadow-sm">
      <div className={cn('w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-5', iconBackground)}>
        <Sparkles className="w-8 h-8 text-blue-600" />
      </div>
      <h3 className="text-xl font-black text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 font-medium max-w-md mx-auto leading-relaxed">{description}</p>
      {bullets.length > 0 && (
        <ul className="mt-6 space-y-2 text-left max-w-sm mx-auto">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-xs font-bold text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shrink-0" />
              {b}
            </li>
          ))}
        </ul>
      )}
      {href && cta && (
        <Link
          href={href}
          className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
        >
          {cta}
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}