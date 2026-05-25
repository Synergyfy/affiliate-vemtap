'use client';

import { Phone, Mail, MessageCircle, Clock } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { Lead } from '@/types/api';

interface LeadCardProps {
  lead: Lead;
  isAdmin: boolean;
  onAction: (action: string) => void;
}

export default function LeadCard({ lead, isAdmin, onAction }: LeadCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: { type: 'lead', status: lead.status },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "bg-white p-4 rounded-xl border shadow-sm group touch-none",
        isDragging ? "border-blue-400 shadow-lg z-50" : "border-slate-100 cursor-grab active:cursor-grabbing hover:shadow-md"
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold text-slate-400">Priority: {lead.priority}</span>
        </div>
        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{lead.industry}</span>
      </div>

      <h5 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{lead.businessName}</h5>
      <p className="text-xs text-slate-500 mb-2">{lead.contactName}</p>

      {isAdmin && lead.assignedAgentId && (
        <div className="mb-4 flex items-center gap-2 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">
          <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-[8px] font-black text-blue-600">A</div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Agent ID: <span className="text-slate-600">{lead.assignedAgentId.slice(0, 8)}...</span></span>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onAction(`Calling ${lead.contactName}...`); }}
            className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
          >
            <Phone className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onAction(`Opening WhatsApp for ${lead.contactName}...`); }}
            className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
          >
            <MessageCircle className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onAction(`Drafting email to ${lead.contactName}...`); }}
            className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
          >
            <Mail className="w-3 h-3" />
          </button>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
          <Clock className="w-3 h-3" />
          {new Date(lead.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
