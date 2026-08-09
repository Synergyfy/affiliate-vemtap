'use client';

import { useState, useMemo } from 'react';
import {
  Building2,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  Clock,
  MapPin,
  MoreVertical,
  CheckCircle2,
  PauseCircle,
  XCircle,
  User,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  SalesPipelineEntry,
  SalesPipelineStage,
  SalesExitState,
  PIPELINE_ORDER,
  PIPELINE_STAGES,
  LEAD_QUALITY_COLORS,
  LEAD_QUALITY_LABELS,
} from '@/types/sales-pipeline';
import { useSalesPipeline } from '@/services/useSalesPipeline';
import LeadQualityBadge from '@/components/sales/LeadQualityBadge';

const STAGE_FILTERS: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  ...PIPELINE_ORDER.map(stage => ({ id: stage, label: PIPELINE_STAGES[stage].label })),
  { id: 'exited', label: 'Exited' },
];

interface SalesPipelineCardProps {
  onLeadSelect?: (lead: SalesPipelineEntry) => void;
  selectedLeadId?: string | null;
}

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-700 border-red-200',
  MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
  LOW: 'bg-slate-100 text-slate-600 border-slate-200',
};

const EXIT_STATE_COLORS: Record<SalesExitState, string> = {
  NOT_INTERESTED: 'bg-red-100 text-red-700 border-red-200',
  LOST: 'bg-gray-100 text-gray-700 border-gray-300',
  INVALID: 'bg-red-100 text-red-700 border-red-200',
  DUPLICATE: 'bg-purple-100 text-purple-700 border-purple-200',
};

export default function SalesPipelineCard({ onLeadSelect, selectedLeadId }: SalesPipelineCardProps) {
  const { showToast } = useToast();
  const { data: response, isLoading, refetch } = useSalesPipeline();
  const [stageFilter, setStageFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Ensure selecting a lead opens the drawer if callback provided
  const handleSelectLead = (lead: SalesPipelineEntry) => {
    onLeadSelect?.(lead);
  };

  const allLeads: SalesPipelineEntry[] = response?.data || [];

  const filteredLeads = useMemo(() => {
    let leads = allLeads;

    if (stageFilter === 'exited') {
      leads = leads.filter(l => !!l.exitState);
    } else if (stageFilter !== 'all') {
      leads = leads.filter(l => l.pipelineStage === stageFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      leads = leads.filter(
        l =>
          l.businessName.toLowerCase().includes(q) ||
          (l.contactName || '').toLowerCase().includes(q) ||
          l.phone.replace(/[^0-9]/g, '').includes(q),
      );
    }

    return leads;
  }, [allLeads, stageFilter, searchQuery]);

  const groupedLeads = useMemo(() => {
    if (stageFilter !== 'all') {
      return { [stageFilter]: filteredLeads };
    }
    const groups: Record<string, SalesPipelineEntry[]> = {};
    filteredLeads.forEach(lead => {
      const key = lead.exitState ? `exited` : lead.pipelineStage;
      if (!groups[key]) groups[key] = [];
      groups[key].push(lead);
    });
    return groups;
  }, [filteredLeads, stageFilter]);

  const handleCall = (lead: SalesPipelineEntry) => {
    if (lead.phone) {
      window.location.href = `tel:${lead.phone}`;
    } else {
      showToast('No phone number available', 'info');
    }
  };

  const handleWhatsApp = (lead: SalesPipelineEntry) => {
    if (lead.phone) {
      window.open(`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`, '_blank');
    } else {
      showToast('No phone number available', 'info');
    }
  };

  const handleEmail = (lead: SalesPipelineEntry) => {
    if (lead.email) {
      window.location.href = `mailto:${lead.email}`;
    } else {
      showToast('No email available', 'info');
    }
  };

  const getStageLabel = (stage: SalesPipelineStage | SalesExitState) => {
    if (PIPELINE_STAGES[stage as SalesPipelineStage]) {
      return PIPELINE_STAGES[stage as SalesPipelineStage].label;
    }
    const exitLabels: Record<SalesExitState, string> = {
      NOT_INTERESTED: 'Not Interested',
      LOST: 'Lost',
      INVALID: 'Invalid',
      DUPLICATE: 'Duplicate',
    };
    return exitLabels[stage as SalesExitState] || stage;
  };

  return (
    <div className="space-y-4">
      {/* Search + Filter */}
      <div className="space-y-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search businesses or contacts..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
          />
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {STAGE_FILTERS.map(filter => (
            <button
              key={filter.id}
              onClick={() => setStageFilter(filter.id)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black white-space-nowrap transition-all",
                stageFilter === filter.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
              )}
            >
              {filter.label}
              {stageFilter !== filter.id && stageFilter === 'all' && (() => {
                let count: number;
                if (filter.id === 'all') {
                  count = allLeads.length;
                } else if (filter.id === 'exited') {
                  count = allLeads.filter(l => l.exitState).length;
                } else {
                  count = allLeads.filter(l => l.pipelineStage === filter.id).length;
                }
                return count > 0 ? <span className="ml-1 opacity-60">({count})</span> : null;
              })()}
            </button>
          ))}
        </div>
      </div>

      {/* Leads */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-50 animate-pulse rounded-[24px] border border-slate-100" />
          ))}
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-black text-slate-900 mb-1">No leads found</h4>
          <p className="text-sm text-slate-500 font-medium">
            {searchQuery ? 'Try adjusting your search.' : 'Leads will appear here once captured.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLeads.map(lead => (
            <LeadCard
              key={lead.id}
              lead={lead}
              isSelected={selectedLeadId === lead.id}
              onSelect={() => handleSelectLead(lead)}
              onCall={() => handleCall(lead)}
              onWhatsApp={() => handleWhatsApp(lead)}
              onEmail={() => handleEmail(lead)}
              onAction={(action) => showToast(`${action} for ${lead.businessName}`, 'info')}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface LeadCardProps {
  lead: SalesPipelineEntry;
  isSelected: boolean;
  onSelect: () => void;
  onCall: () => void;
  onWhatsApp: () => void;
  onEmail: () => void;
  onAction: (action: string) => void;
}

function LeadCard({ lead, isSelected, onSelect, onCall, onWhatsApp, onEmail, onAction }: LeadCardProps) {
  const stageKey = lead.exitState || lead.pipelineStage;
  const isExited = !!lead.exitState;

  const getStageDisplay = () => {
    const stageInfo = PIPELINE_STAGES[lead.pipelineStage as SalesPipelineStage];
    const colorClass = isExited
      ? EXIT_STATE_COLORS[lead.exitState!]
      : stageInfo
        ? `${stageInfo.color.replace('bg-', 'bg-').replace('-500', '-100')} text-blue-700 border-blue-200`
        : 'bg-slate-100 text-slate-600 border-slate-200';

    return {
      label: isExited
        ? lead.exitState!.replace('_', ' ')
        : stageInfo?.label || lead.pipelineStage.replace('_', ' '),
      colorClass,
      dotColor: isExited
        ? EXIT_STATE_COLORS[lead.exitState!]
        : 'bg-blue-500',
    };
  };

  const stageDisplay = getStageDisplay();

  return (
    <div
      onClick={onSelect}
      className={cn(
        "bg-white rounded-[24px] border shadow-sm p-4 transition-all cursor-pointer",
        isSelected
          ? 'border-blue-300 shadow-blue-100 ring-2 ring-blue-100'
          : 'border-slate-100 hover:border-slate-200 hover:shadow-md',
      )}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
          <Building2 className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-slate-900 truncate">{lead.businessName}</h3>
            {lead.leadQuality && (
              <LeadQualityBadge quality={lead.leadQuality} size="sm" compact />
            )}
          </div>
          <p className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">
            {lead.industry} · {stageDisplay.label}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {lead.priority && (
            <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded-full border", PRIORITY_COLORS[lead.priority] || PRIORITY_COLORS.MEDIUM)}>
              {lead.priority}
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onAction('Options'); }}
            className="p-1 rounded-lg bg-slate-50 text-slate-400 hover:text-slate-600"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-2 text-xs text-slate-600">
        {lead.contactName && (
          <div className="flex items-center gap-2">
            <User className="w-3 h-3 text-slate-400" />
            <span>{lead.contactName}</span>
            {lead.contactRole && <span className="text-slate-400">· {lead.contactRole}</span>}
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-3 h-3 text-slate-400" />
            <span>{lead.phone}</span>
          </div>
        )}
        {lead.location && (
          <div className="flex items-center gap-2">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span className="truncate">{lead.location}</span>
          </div>
        )}
        {lead.followUpDate && (
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3 text-orange-500" />
            <span className="font-semibold text-orange-700">
              Follow-up: {new Date(lead.followUpDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
          </div>
        )}
        {lead.demoScheduledDate && (
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-indigo-500" />
            <span className="font-semibold text-indigo-700">
              Demo: {new Date(lead.demoScheduledDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onCall(); }}
            className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
            title="Call"
          >
            <Phone className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onWhatsApp(); }}
            className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
            title="WhatsApp"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
          {lead.email && (
            <button
              onClick={(e) => { e.stopPropagation(); onEmail(); }}
              className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-all"
              title="Email"
            >
              <Mail className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {isExited ? (
          <div className={cn("px-2 py-1 rounded-lg flex items-center gap-1", stageDisplay.colorClass)}>
            <AlertCircle className="w-3 h-3" />
            <span className="text-[9px] font-black">
              {lead.exitState === 'NOT_INTERESTED' ? 'Declined' :
               lead.exitState === 'LOST' ? 'Lost' :
               lead.exitState === 'INVALID' ? 'Invalid' : 'Duplicate'}
            </span>
          </div>
        ) : (
          <span className={cn("w-2 h-2 rounded-full", stageDisplay.dotColor.replace('bg-', 'bg-'))} />
        )}
      </div>
    </div>
  );
}
