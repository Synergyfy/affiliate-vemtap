'use client';

import { AIRecommendation } from '@/types/affiliate-market-mapping';
import { Sparkles, Crown, MapPin, Store, Handshake } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIRecommendationsProps {
  recommendations: AIRecommendation[];
}

export default function AIRecommendations({ recommendations }: AIRecommendationsProps) {
  const getIconAndColors = (type: string) => {
    switch (type) {
      case 'PRIORITY_VISIT': return { icon: Store, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
      case 'MISSING_CATEGORY': return { icon: MapPin, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
      case 'UNTOUCHED_ANCHOR': return { icon: Crown, bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
      case 'PARTNERSHIP': return { icon: Handshake, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
      default: return { icon: Sparkles, bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
    }
  };

  const getLabel = (type: string) => type.replace('_', ' ');

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm mb-6 bg-gradient-to-br from-white to-indigo-50/30">
      <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-indigo-600" />
        Opportunities & Recommendations
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map(rec => {
          const style = getIconAndColors(rec.type);
          return (
            <div key={rec.id} className="bg-white border border-slate-200 p-4 rounded-2xl hover:shadow-md transition-shadow cursor-pointer group">
              <div className="flex items-start justify-between mb-3">
                <span className={cn("px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-md border", style.bg, style.text, style.border)}>
                  {getLabel(rec.type)}
                </span>
                <div className="flex items-center text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon key={i} filled={i < rec.rating} />
                  ))}
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors", style.bg, "group-hover:bg-indigo-600 group-hover:text-white")}>
                  <style.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 mb-1 leading-tight">{rec.title}</h4>
                  <p className="text-xs text-slate-500 leading-snug">{rec.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg className={cn("w-3.5 h-3.5", filled ? "fill-current" : "fill-transparent border-current text-slate-300")} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
