'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { GripVertical, Plus, Trash2, ChevronUp, ChevronDown, Route, ToggleLeft, ToggleRight } from 'lucide-react';
import ChannelBadge from '@/components/communication/ChannelBadge';
import { EnhancedSingleSelect, SelectOption } from '@/components/ui/EnhancedSelect';
import { useTemplates } from '@/services/useCommunicationHooks';
import { CustomerJourneyStage, CommunicationChannel, DEFAULT_JOURNEY_STAGES } from '@/types/communication';
import { cn } from '@/lib/utils';

interface CustomerJourneyEditorProps {
  stages: CustomerJourneyStage[];
  onChange: (stages: CustomerJourneyStage[]) => void;
}

export default function CustomerJourneyEditor({ stages, onChange }: CustomerJourneyEditorProps) {
  const { data: templates } = useTemplates();

  const moveStage = (index: number, direction: -1 | 1) => {
    const next = [...stages];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const updateStage = (id: string, patch: Partial<CustomerJourneyStage>) => {
    onChange(stages.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const removeStage = (id: string) => {
    onChange(stages.filter((s) => s.id !== id));
  };

  const addStage = () => {
    const idx = stages.length;
    const preset = DEFAULT_JOURNEY_STAGES[idx];
    onChange([
      ...stages,
      {
        id: `stage-${Date.now()}`,
        name: preset?.name || `Stage ${idx + 1}`,
        waitDays: preset?.waitDays ?? 7,
        channel: preset?.channel || 'SMS',
        templateId: '',
        enabled: true,
      },
    ]);
  };

  const channelTemplates = useMemo(
    () => (templateId: string) => {
      const stage = stages.find((s) => s.id === templateId);
      return (templates || []).filter((t) => t.channel === (stage?.channel || 'SMS'));
    },
    [templates, stages],
  );

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {stages.map((stage, idx) => {
          const tplOptions: SelectOption[] = (templates || [])
            .filter((t) => t.channel === stage.channel)
            .map((t) => ({ value: t.id, label: t.name }));

          return (
            <motion.div
              key={stage.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              className={cn(
                'bg-white border rounded-2xl p-4 transition-all',
                stage.enabled ? 'border-slate-200 shadow-sm' : 'border-slate-100 opacity-60',
              )}
            >
              <div className="flex items-start gap-3">
                {/* Reorder controls */}
                <div className="flex flex-col items-center gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => moveStage(idx, -1)}
                    disabled={idx === 0}
                    aria-label="Move stage up"
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] font-black text-slate-300">{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => moveStage(idx, 1)}
                    disabled={idx === stages.length - 1}
                    aria-label="Move stage down"
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Stage content */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{stage.name}</p>
                      <ChannelBadge channel={stage.channel} />
                    </div>
                    <button
                      type="button"
                      onClick={() => updateStage(stage.id, { enabled: !stage.enabled })}
                      className="shrink-0"
                    >
                      {stage.enabled ? (
                        <ToggleRight className="w-7 h-7 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="w-7 h-7 text-slate-300" />
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Wait days */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Wait days</label>
                      <input
                        type="number"
                        min={0}
                        max={365}
                        value={stage.waitDays}
                        onChange={(e) => updateStage(stage.id, { waitDays: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    {/* Channel toggle */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Channel</label>
                      <div className="flex gap-1">
                        {(['WHATSAPP', 'SMS'] as const).map((ch) => (
                          <button
                            key={ch}
                            type="button"
                            onClick={() => updateStage(stage.id, { channel: ch, templateId: '' })}
                            className={cn(
                              'flex-1 px-2 py-2 rounded-lg text-[10px] font-bold border transition-all',
                              stage.channel === ch
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300',
                            )}
                          >
                            {ch === 'WHATSAPP' ? 'WA' : 'SMS'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Template select */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Template</label>
                      <EnhancedSingleSelect
                        placeholder="Select…"
                        options={tplOptions}
                        value={stage.templateId || null}
                        onChange={(v) => updateStage(stage.id, { templateId: v })}
                        onClear={() => updateStage(stage.id, { templateId: '' })}
                      />
                    </div>
                  </div>
                </div>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => removeStage(stage.id)}
                  aria-label="Delete stage"
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0 mt-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <button
        type="button"
        onClick={addStage}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-slate-200 text-xs font-bold text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all"
      >
        <Plus className="w-4 h-4" />
        Add stage
      </button>
    </div>
  );
}