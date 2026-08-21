'use client';

import { motion } from 'framer-motion';
import { Pencil, Trash2, Power, Archive, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import ChannelBadge from '@/components/communication/ChannelBadge';
import MessageStatusBadge from '@/components/communication/MessageStatusBadge';
import { MessageTemplate, TemplateStatus } from '@/types/communication';
import { countSmsCharacters } from '@/lib/communication';

interface TemplateCardProps {
  template: MessageTemplate;
  index?: number;
  busy?: boolean;
  onEdit: (template: MessageTemplate) => void;
  onToggleStatus: (template: MessageTemplate) => void;
  onArchive: (template: MessageTemplate) => void;
  onDelete: (template: MessageTemplate) => void;
}

export default function TemplateCard({
  template,
  index = 0,
  busy,
  onEdit,
  onToggleStatus,
  onArchive,
  onDelete,
}: TemplateCardProps) {
  const charCount = template.channel === 'SMS' ? countSmsCharacters(template.body) : null;
  const isActive = template.status === 'ACTIVE';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-sm font-black text-slate-800 truncate">{template.name}</h3>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">{template.description || 'No description'}</p>
        </div>
        <ChannelBadge channel={template.channel} />
      </div>

      <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-4">
        <p className="text-xs text-slate-600 font-medium leading-relaxed line-clamp-3 whitespace-pre-wrap">{template.body}</p>
        {charCount && (
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
            {charCount.chars}/160{charCount.parts > 1 ? ` · ${charCount.parts} parts` : ''}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <MessageStatusBadge status={template.status} kind="template" />
        {busy ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
        ) : (
          <div className="flex items-center gap-1">
            {isActive && (
              <button
                onClick={() => onArchive(template)}
                title="Archive"
                className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
              >
                <Archive className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onEdit(template)}
              title="Edit"
              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => onToggleStatus(template)}
              title={isActive ? 'Deactivate' : 'Activate'}
              className={cnFor(template.status)}
            >
              <Power className="w-4 h-4" />
            </button>
            {!isActive && (
              <button
                onClick={() => onDelete(template)}
                title="Delete"
                className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function cnFor(status: TemplateStatus) {
  const active = status === 'ACTIVE';
  return cn(
    'w-9 h-9 flex items-center justify-center rounded-xl transition-colors',
    active ? 'text-amber-600 hover:bg-amber-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50',
  );
}