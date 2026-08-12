'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/toast';
import { useState, useEffect } from 'react';
import {
  Save,
  Loader2,
  Plus,
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useAdminEditorConfig, useUpdateAdminEditorConfig } from '@/services/useMarketMappingHooks';
import { PlatformSettings, MarketMappingConfig } from '@/types/api';

export default function MarketMappingConfigEditor() {
  const { showToast } = useToast();
  const { data: editorConfig, isLoading, isError, refetch } = useAdminEditorConfig();
  const updateEditorConfig = useUpdateAdminEditorConfig();

  const [newCategory, setNewCategory] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [showCategories, setShowCategories] = useState(true);
  const [showOpeningDays, setShowOpeningDays] = useState(true);
  const [showCustomerRanges, setShowCustomerRanges] = useState(true);
  const [showBusinessSizes, setShowBusinessSizes] = useState(true);
  const [showPositions, setShowPositions] = useState(true);
  const [showPipeline, setShowPipeline] = useState(true);
  const [showInterest, setShowInterest] = useState(true);
  const [showPlanTypes, setShowPlanTypes] = useState(true);
  const [showFaqs, setShowFaqs] = useState(true);
  const [showTickets, setShowTickets] = useState(true);
  const [showStatuses, setShowStatuses] = useState(true);
  const [showTargets, setShowTargets] = useState(true);
  const [formData, setFormData] = useState<Partial<PlatformSettings>>({});

  useEffect(() => {
    if (editorConfig) {
      setFormData({
        marketMappingConfig: {
          businessCategories: editorConfig.categories || editorConfig.businessCategories || [],
          openingDays: editorConfig.openingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          customerRanges: editorConfig.customerRanges || [],
          businessSizes: editorConfig.businessSizes || [],
          contactPositions: editorConfig.contactPositions || [],
          pipelineStatuses: (editorConfig.pipelineStatuses || []).map((s: any) =>
            typeof s === 'string' ? { id: s, name: s, color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-600' } : s
          ),
          interestOptions: editorConfig.interestOptions || [],
          planTypes: editorConfig.planTypes || [],
          faqs: editorConfig.faqs || [],
          ticketStatuses: editorConfig.ticketStatuses || [],
          businessStatuses: editorConfig.businessStatuses || [],
          paymentStatuses: editorConfig.paymentStatuses || [],
          dailyTarget: editorConfig.dailyTarget || 5,
          weeklyTarget: editorConfig.weeklyTarget || 25,
          monthlyTarget: editorConfig.monthlyTarget || 20,
        },
      });
    }
  }, [editorConfig]);

  const handleSave = async () => {
    try {
      const config = formData.marketMappingConfig;
      if (!config) return;
      await updateEditorConfig.mutateAsync({
        categories: config.businessCategories,
        businessCategories: config.businessCategories,
        openingDays: config.openingDays,
        customerRanges: config.customerRanges,
        businessSizes: config.businessSizes,
        contactPositions: config.contactPositions,
        pipelineStatuses: config.pipelineStatuses,
        interestOptions: config.interestOptions,
        faqs: config.faqs,
        ticketStatuses: config.ticketStatuses,
        businessStatuses: config.businessStatuses,
        paymentStatuses: config.paymentStatuses,
        dailyTarget: config.dailyTarget,
        weeklyTarget: config.weeklyTarget,
        monthlyTarget: config.monthlyTarget,
      });
      showToast('Market mapping configuration saved.', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to save.', 'error');
    }
  };

  const mmConfig = formData.marketMappingConfig as MarketMappingConfig | undefined;

  const setMmConfig = (updater: (prev: MarketMappingConfig) => MarketMappingConfig) => {
    setFormData(prev => ({
      ...prev,
      marketMappingConfig: updater(prev.marketMappingConfig || {
        businessCategories: [],
        openingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        customerRanges: [],
        businessSizes: [],
        contactPositions: [],
        pipelineStatuses: [],
        interestOptions: [],
        planTypes: [],
        faqs: [],
        ticketStatuses: [],
        businessStatuses: [],
        paymentStatuses: [],
        dailyTarget: 5,
        weeklyTarget: 25,
        monthlyTarget: 20,
      }),
    }));
  };

  const addCategory = () => {
    if (!newCategory.trim() || mmConfig?.businessCategories.includes(newCategory.trim())) return;
    setMmConfig(prev => ({ ...prev, businessCategories: [...prev.businessCategories, newCategory.trim()] }));
    setNewCategory('');
  };

  const removeCategory = (idx: number) => {
    setMmConfig(prev => ({ ...prev, businessCategories: prev.businessCategories.filter((_, i) => i !== idx) }));
  };

  const addPosition = () => {
    if (!newPosition.trim() || mmConfig?.contactPositions.includes(newPosition.trim())) return;
    setMmConfig(prev => ({ ...prev, contactPositions: [...prev.contactPositions, newPosition.trim()] }));
    setNewPosition('');
  };

  const removePosition = (idx: number) => {
    setMmConfig(prev => ({ ...prev, contactPositions: prev.contactPositions.filter((_, i) => i !== idx) }));
  };

  const toggleOpeningDay = (day: string) => {
    if (!mmConfig) return;
    const exists = mmConfig.openingDays.includes(day);
    setMmConfig(prev => ({
      ...prev,
      openingDays: exists ? prev.openingDays.filter(d => d !== day) : [...prev.openingDays, day],
    }));
  };

  const Section = ({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) => (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-5 py-3.5 text-left">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="px-5 pb-5 space-y-4">{children}</div>}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-pulse text-slate-300" />
      </div>
    );
  }

  if (isError || !editorConfig) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-sm text-red-500">Unable to load market mapping editor configuration.</p>
        <button onClick={() => refetch()} className="text-sm font-bold text-blue-600 hover:underline">
          Retry
        </button>
      </div>
    );
  }

  if (!mmConfig) return null;

  const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-4">
      <Section title="Business Categories" open={showCategories} onToggle={() => setShowCategories(!showCategories)}>
        <div className="flex flex-wrap gap-2">
          {mmConfig.businessCategories.map((cat, idx) => (
            <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-full text-xs font-semibold text-slate-700">
              {cat}
              <button type="button" onClick={() => removeCategory(idx)} className="text-slate-400 hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCategory()} placeholder="Add category..." className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          <button type="button" onClick={addCategory} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
      </Section>

      <Section title="Opening Days" open={showOpeningDays} onToggle={() => setShowOpeningDays(!showOpeningDays)}>
        <div className="flex flex-wrap gap-2">
          {allDays.map(day => (
            <button key={day} type="button" onClick={() => toggleOpeningDay(day)} className={cn("px-3 py-1.5 rounded-full text-xs font-bold transition-all", mmConfig.openingDays.includes(day) ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500")}>
              {day}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Customer Ranges" open={showCustomerRanges} onToggle={() => setShowCustomerRanges(!showCustomerRanges)}>
        <div className="space-y-2">
          {mmConfig.customerRanges.map((r, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <input value={r.value} onChange={e => { const next = [...mmConfig.customerRanges]; next[idx] = { ...next[idx], value: e.target.value }; setMmConfig(prev => ({ ...prev, customerRanges: next })); }} className="w-28 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              <input value={r.label} onChange={e => { const next = [...mmConfig.customerRanges]; next[idx] = { ...next[idx], label: e.target.value }; setMmConfig(prev => ({ ...prev, customerRanges: next })); }} className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Business Sizes" open={showBusinessSizes} onToggle={() => setShowBusinessSizes(!showBusinessSizes)}>
        <div className="space-y-2">
          {mmConfig.businessSizes.map((s, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <input value={s.value} onChange={e => { const next = [...mmConfig.businessSizes]; next[idx] = { ...next[idx], value: e.target.value }; setMmConfig(prev => ({ ...prev, businessSizes: next })); }} className="w-28 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              <input value={s.label} onChange={e => { const next = [...mmConfig.businessSizes]; next[idx] = { ...next[idx], label: e.target.value }; setMmConfig(prev => ({ ...prev, businessSizes: next })); }} className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Contact Positions" open={showPositions} onToggle={() => setShowPositions(!showPositions)}>
        <div className="flex flex-wrap gap-2 mb-4">
          {mmConfig.contactPositions.map((pos, idx) => (
            <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-700">
              {pos}
              <button type="button" onClick={() => removePosition(idx)} className="text-slate-400 hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={newPosition} onChange={e => setNewPosition(e.target.value)} onKeyDown={e => e.key === 'Enter' && addPosition()} placeholder="Add position..." className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          <button type="button" onClick={addPosition} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
      </Section>

      <Section title="Pipeline Statuses" open={showPipeline} onToggle={() => setShowPipeline(!showPipeline)}>
        <div className="space-y-2">
          {mmConfig.pipelineStatuses.map((s, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <input value={s.name || s.id} onChange={e => { const next = [...mmConfig.pipelineStatuses]; next[idx] = { ...next[idx], name: e.target.value }; setMmConfig(prev => ({ ...prev, pipelineStatuses: next })); }} className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              <input value={s.id} onChange={e => { const next = [...mmConfig.pipelineStatuses]; next[idx] = { ...next[idx], id: e.target.value }; setMmConfig(prev => ({ ...prev, pipelineStatuses: next })); }} className="w-28 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              <div className={cn("w-4 h-4 rounded-full", s.color || "bg-blue-500")} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Interest Options" open={showInterest} onToggle={() => setShowInterest(!showInterest)}>
        <div className="space-y-2">
          {mmConfig.interestOptions.map((o, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <input value={o.value} onChange={e => { const next = [...mmConfig.interestOptions]; next[idx] = { ...next[idx], value: e.target.value }; setMmConfig(prev => ({ ...prev, interestOptions: next })); }} className="w-28 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              <input value={o.label} onChange={e => { const next = [...mmConfig.interestOptions]; next[idx] = { ...next[idx], label: e.target.value }; setMmConfig(prev => ({ ...prev, interestOptions: next })); }} className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Business Plan Types" open={showPlanTypes} onToggle={() => setShowPlanTypes(!showPlanTypes)}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-slate-500">Available subscription plans (synced automatically from VemTap backend API).</p>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold uppercase tracking-wider">
            Live Sync
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {mmConfig.planTypes.map((p, idx) => (
            <div key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <span className="font-mono font-bold text-slate-700">{p.value}</span>
              <span className="text-slate-400">|</span>
              <span className="font-medium text-slate-600">{p.label}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="FAQ Manager" open={showFaqs} onToggle={() => setShowFaqs(!showFaqs)}>
        <p className="text-xs text-slate-500">These FAQs appear on the support page and dashboard FAQ page.</p>
        <div className="space-y-4">
          {mmConfig.faqs.map((faq, idx) => (
            <div key={faq.id || idx} className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2">
              <div className="flex gap-2">
                <input value={faq.question} onChange={e => { const next = [...mmConfig.faqs]; next[idx] = { ...next[idx], question: e.target.value }; setMmConfig(prev => ({ ...prev, faqs: next })); }} className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                <input value={faq.category} onChange={e => { const next = [...mmConfig.faqs]; next[idx] = { ...next[idx], category: e.target.value }; setMmConfig(prev => ({ ...prev, faqs: next })); }} className="w-28 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Category" />
              </div>
              <textarea value={faq.answer} onChange={e => { const next = [...mmConfig.faqs]; next[idx] = { ...next[idx], answer: e.target.value }; setMmConfig(prev => ({ ...prev, faqs: next })); }} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 h-16 resize-none" />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Default Performance Targets" open={showTargets} onToggle={() => setShowTargets(!showTargets)}>
        <p className="text-xs text-slate-500">Used when an affiliate has not set custom targets in their mission plan.</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Daily</label>
            <input type="number" value={mmConfig.dailyTarget} onChange={e => setMmConfig(prev => ({ ...prev, dailyTarget: Number(e.target.value) }))} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Weekly</label>
            <input type="number" value={mmConfig.weeklyTarget} onChange={e => setMmConfig(prev => ({ ...prev, weeklyTarget: Number(e.target.value) }))} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Monthly</label>
            <input type="number" value={mmConfig.monthlyTarget} onChange={e => setMmConfig(prev => ({ ...prev, monthlyTarget: Number(e.target.value) }))} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
        </div>
      </Section>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={updateEditorConfig.isPending}
          className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50"
        >
          {updateEditorConfig.isPending ? <Loader2 className="w-4 h-4 animate-pulse" /> : <Save className="w-4 h-4" />}
          {updateEditorConfig.isPending ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
}
