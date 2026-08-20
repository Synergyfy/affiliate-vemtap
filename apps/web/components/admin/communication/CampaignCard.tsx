'use client';

import { motion } from 'framer-motion';
import { Megaphone, Calendar, Users, Pause, Play, Trash2, Edit3, AlertTriangle, MessageSquareText } from 'lucide-react';
import ChannelBadge from '@/components/communication/ChannelBadge';
import MessageStatusBadge from '@/components/communication/MessageStatusBadge';
import { Campaign, CAMPAIGN_STATUS_LABELS } from '@/types/communication';
import { useTemplates } from '@/services/useCommunicationHooks';
import { cn } from '@/lib/utils';

interface CampaignCardProps {
  campaign: Campaign;
  onEdit: (campaign: Campaign) => void;
  onStatusChange: (id: string, status: Campaign['status']) => void;
  onDelete: (id: string) => void;
  index?: number;
}

export default function CampaignCard({ campaign, onEdit, onStatusChange, onDelete, index = 0 }: CampaignCardProps) {
  const { data: templates } = useTemplates();
  const now = new Date();
  const start = new Date(campaign.startDate);
  const end = new Date(campaign.endDate);
  const isActive = campaign.status === 'ACTIVE';
  const isDraft = campaign.status === 'DRAFT';
  const isPaused = campaign.status === 'PAUSED';
  const isEnded = campaign.status === 'ENDED' || now > end;

  const templatesForChannels = (templates || []).filter((t) => campaign.channels.includes(t.channel));
  const selectedTemplateNames = campaign.templateIds
    .map((id) => templates?.find((t) => t.id === id)?.name)
    .filter(Boolean) as string[];

  const audienceCount =
    (campaign.audience.statuses?.length || 0) +
    (campaign.audience.salespeople?.length || 0) +
    (campaign.audience.locations?.length || 0) +
    (campaign.audience.dateAdded ? 1 : 0);

  const setupIncomplete =
    audienceCount === 0 || selectedTemplateNames.length === 0 || templatesForChannels.length === 0;

  const audienceLabels =
    (campaign.audience.statuses || []).map((s) => s.replace(/_/g, ' ').toLowerCase());

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2.5 rounded-2xl',
            isActive ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500',
          )}>
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-800">{campaign.name}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              {start.toLocaleDateString([], { day: 'numeric', month: 'short' })} – {end.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
        <MessageStatusBadge status={campaign.status} kind="campaign" />
      </div>

      {setupIncomplete && (isDraft || isPaused) && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <p className="text-[11px] font-bold text-amber-700">Add audience & templates to activate</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {campaign.channels.map((ch) => (
          <ChannelBadge key={ch} channel={ch} />
        ))}
        {selectedTemplateNames.length > 0 ? (
          selectedTemplateNames.map((name) => (
            <span key={name} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border border-slate-200 bg-slate-50 text-slate-500">
              <MessageSquareText className="w-3 h-3 text-slate-400" />
              {name}
            </span>
          ))
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border border-dashed border-slate-300 bg-white text-slate-400">
            No templates selected
          </span>
        )}
        {audienceCount > 0 ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border border-slate-200 bg-slate-50 text-slate-500">
            <Users className="w-3 h-3" />
            {audienceLabels.join(', ')}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border border-dashed border-slate-300 bg-white text-slate-400">
            <Users className="w-3 h-3" />
            Audience not set
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        {isDraft && (
          <button
            onClick={() => onStatusChange(campaign.id, 'ACTIVE')}
            disabled={setupIncomplete}
            title={setupIncomplete ? 'Add an audience and at least one template to activate' : undefined}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-colors',
              setupIncomplete
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-700',
            )}
          >
            <Play className="w-3 h-3" /> Activate
          </button>
        )}
        {isActive && (
          <button
            onClick={() => onStatusChange(campaign.id, 'PAUSED')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
          >
            <Pause className="w-3 h-3" /> Pause
          </button>
        )}
        {isPaused && (
          <button
            onClick={() => onStatusChange(campaign.id, 'ACTIVE')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
          >
            <Play className="w-3 h-3" /> Resume
          </button>
        )}
        {isActive && (
          <button
            onClick={() => onStatusChange(campaign.id, 'ENDED')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            End
          </button>
        )}
        <div className="flex-1" />
        <button
          onClick={() => onEdit(campaign)}
          aria-label="Edit campaign"
          className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
        >
          <Edit3 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(campaign.id)}
          aria-label="Delete campaign"
          className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}