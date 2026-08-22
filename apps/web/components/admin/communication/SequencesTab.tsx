'use client';

import { useState, useEffect } from 'react';
import { Zap, Plus, Loader2, Users, Route, Save } from 'lucide-react';
import RuleCard from '@/components/admin/communication/RuleCard';
import RuleWizardModal from '@/components/admin/communication/RuleWizardModal';
import CustomerJourneyEditor from '@/components/admin/communication/CustomerJourneyEditor';
import { useAutomationRules, useRuleMutations, useTemplates, useCustomerJourney, useJourneyMutations } from '@/services/useCommunicationHooks';
import { useToast } from '@/hooks/toast';
import { AutomationRule, CustomerJourneyStage } from '@/types/communication';
import { cn } from '@/lib/utils';

export default function SequencesTab() {
  const { showToast } = useToast();
  const { data: rules, isLoading } = useAutomationRules();
  const { data: templates } = useTemplates();
  const { data: journeyStages } = useCustomerJourney();
  const mutations = useRuleMutations();
  const journeyMutations = useJourneyMutations();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AutomationRule | null>(null);
  const [localJourney, setLocalJourney] = useState<CustomerJourneyStage[]>([]);
  const [journeyDirty, setJourneyDirty] = useState(false);

  useEffect(() => {
    if (journeyStages) {
      setLocalJourney(journeyStages);
      setJourneyDirty(false);
    }
  }, [journeyStages]);

  const leadRules = rules || [];

  const getTemplateName = (id: string) => templates?.find((t) => t.id === id)?.name;

  const handleSave = async (data: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const now = new Date().toISOString();
      if (editing) {
        await mutations.update.mutateAsync({ id: editing.id, ...data, createdAt: editing.createdAt, updatedAt: now });
        showToast('Rule updated.', 'success');
      } else {
        await mutations.create.mutateAsync({ ...data, createdAt: now, updatedAt: now });
        showToast('Rule created.', 'success');
      }
      setModalOpen(false);
      setEditing(null);
    } catch {
      showToast('Failed to save rule.', 'error');
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await mutations.toggle.mutateAsync({ id, enabled });
      showToast(`Rule ${enabled ? 'enabled' : 'disabled'}.`, 'success');
    } catch {
      showToast('Failed to update rule.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await mutations.remove.mutateAsync(id);
      showToast('Rule deleted.', 'info');
    } catch {
      showToast('Failed to delete rule.', 'error');
    }
  };

  const handleSaveJourney = async () => {
    try {
      await journeyMutations.updateStages.mutateAsync(localJourney);
      setJourneyDirty(false);
      showToast('Journey stages saved.', 'success');
    } catch {
      showToast('Failed to save journey.', 'error');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-slate-900">Automation Sequences</h3>
          <p className="text-xs text-slate-500 mt-1">Create rules that trigger messages based on status changes and time delays.</p>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> New Rule
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
        </div>
      ) : rules && rules.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center">
          <Zap className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">No automation rules yet. Create your first rule above.</p>
        </div>
      ) : (
        <>
          {/* Lead Nurture */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-black text-slate-700">Lead Nurture Rules</h4>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{leadRules.length}</span>
            </div>
            {leadRules.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center">
                <p className="text-xs text-slate-500">No lead nurture rules. These rules fire when a lead&apos;s status changes or stays the same.</p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {leadRules.map((r, i) => (
                  <RuleCard
                    key={r.id}
                    rule={r}
                    templateName={r.templateId ? getTemplateName(r.templateId) : undefined}
                    onToggle={handleToggle}
                    onEdit={(r) => { setEditing(r); setModalOpen(true); }}
                    onDelete={handleDelete}
                    index={i}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Customer Journey */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Route className="w-4 h-4 text-emerald-600" />
                <h4 className="text-sm font-black text-slate-700">Customer Journey</h4>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{localJourney.length} stages</span>
              </div>
              {journeyDirty && (
                <button
                  onClick={handleSaveJourney}
                  disabled={journeyMutations.updateStages.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                >
                  {journeyMutations.updateStages.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Journey
                </button>
              )}
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-sm">
              <CustomerJourneyEditor
                stages={localJourney}
                onChange={(stages) => { setLocalJourney(stages); setJourneyDirty(true); }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">
              Stages fire in order when a lead becomes a customer. Each stage waits the specified number of days before sending.
            </p>
          </section>
        </>
      )}

      <RuleWizardModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
        rule={editing}
        templates={templates}
        isLoading={mutations.create.isPending || mutations.update.isPending}
      />
    </div>
  );
}
