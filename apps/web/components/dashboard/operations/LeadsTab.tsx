'use client';

import { useState, useMemo } from 'react';
import { Plus, Search, Filter, MoreHorizontal, Phone, Mail, MessageCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import LeadCreationModal from './LeadCreationModal';
import LeadCard from './LeadCard';
import { useToast } from '@/hooks/use-toast';

import { DndContext, DragOverlay, useDroppable, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { useLeads, useUpdateLead } from '@/services/useLeadsHooks';
import { LeadStatus } from '@/types/api';

const stages = [
  { id: 'POTENTIAL', name: 'Potential', color: 'bg-blue-500' },
  { id: 'CONTACTED', name: 'Contacted', color: 'bg-purple-500' },
  { id: 'INTERESTED', name: 'Interested', color: 'bg-emerald-500' },
  { id: 'NOT_INTERESTED', name: 'Not Interested', color: 'bg-red-500' },
  { id: 'COMPLETED', name: 'Completed', color: 'bg-slate-500' },
];

interface StageColumnProps {
  stage: { id: string; name: string; color: string };
  leadIds: string[];
  children: React.ReactNode;
}

function StageColumn({ stage, leadIds, children }: StageColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `stage-${stage.id}`,
    data: { type: 'stage', stage: stage.id },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-shrink-0 w-80 flex flex-col transition-colors duration-200",
        isOver && "opacity-90"
      )}
    >
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", stage.color)} />
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">{stage.name}</h4>
          <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
            {leadIds.length}
          </span>
        </div>
        <button
          onClick={() => {}}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
        <div className={cn(
          "flex-grow space-y-4 p-2 rounded-2xl border border-dashed min-h-[500px] transition-colors duration-200",
          isOver ? "bg-blue-50/50 border-blue-300" : "bg-slate-50/50 border-slate-200"
        )}>
          {children}
        </div>
      </SortableContext>
    </div>
  );
}

interface LeadsTabProps {
  isAdmin?: boolean;
}

export default function LeadsTab({ isAdmin = false }: LeadsTabProps) {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);

  const { data: response, isLoading } = useLeads({ search: searchQuery });
  const leads = response?.data || [];

  const updateLead = useUpdateLead();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleMoveLead = async (id: string, newStatus: LeadStatus) => {
    try {
      await updateLead.mutateAsync({ id, data: { status: newStatus } });
      showToast(`Lead moved to ${newStatus.toLowerCase()}`, 'success');
    } catch {
      showToast('Failed to update lead status', 'error');
    }
  };

  const handleDragStart = (event: any) => {
    setActiveLeadId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    setActiveLeadId(null);
    const { active, over } = event;
    if (!over) return;

    const leadId = active.id as string;
    const overStageId = over.data.current?.stage;
    if (!overStageId) return;

    const lead = leads.find(l => l.id === leadId);
    if (lead && lead.status !== overStageId) {
      handleMoveLead(leadId, overStageId as LeadStatus);
    }
  };

  const activeLead = useMemo(
    () => leads.find(l => l.id === activeLeadId) || null,
    [leads, activeLeadId]
  );

  const handleAction = (action: string) => {
    showToast(`${action}`, 'info');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <div className="relative flex-grow max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads, businesses, or contacts..."
            className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            onClick={() => showToast('Filters overlay coming soon', 'info')}
            variant="outline"
            className="flex-grow sm:flex-grow-0 border-slate-200 text-xs font-bold h-10 rounded-xl flex items-center gap-2"
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
          </Button>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="flex-grow sm:flex-grow-0 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold h-10 rounded-xl flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Lead
          </Button>
        </div>
      </div>

      <LeadCreationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isAdmin={isAdmin}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide min-h-[600px]">
          {stages.map((stage) => {
            const stageLeads = leads.filter(l => l.status === stage.id);
            return (
              <StageColumn
                key={stage.id}
                stage={stage}
                leadIds={stageLeads.map(l => l.id)}
              >
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-white/50 p-4 rounded-xl border border-slate-100 h-32 animate-pulse" />
                    ))}
                  </div>
                ) : stageLeads.length === 0 ? (
                  <div className="p-6 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                    No leads
                  </div>
                ) : stageLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    isAdmin={isAdmin}
                    onAction={handleAction}
                  />
                ))}

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full py-3 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs font-bold hover:bg-white hover:border-slate-300 hover:text-slate-600 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Lead
                </button>
              </StageColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeLead ? (
            <div className="bg-white p-4 rounded-xl border-2 border-blue-400 shadow-xl rotate-3 scale-105">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-bold text-slate-400">Priority: {activeLead.priority}</span>
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{activeLead.industry}</span>
              </div>
              <h5 className="text-sm font-bold text-slate-900 mb-1">{activeLead.businessName}</h5>
              <p className="text-xs text-slate-500 mb-2">{activeLead.contactName}</p>
              <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
                <Phone className="w-3 h-3 text-slate-400" />
                <MessageCircle className="w-3 h-3 text-slate-400" />
                <Mail className="w-3 h-3 text-slate-400" />
                <span className="ml-auto text-[10px] font-bold text-slate-400">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {new Date(activeLead.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
