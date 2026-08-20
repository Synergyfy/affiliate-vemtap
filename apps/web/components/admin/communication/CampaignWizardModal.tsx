'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Megaphone, Loader2, ChevronLeft, ChevronRight, Check, CalendarDays, Users,
  MessageSquareText, CheckCircle2, ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ModalShell from '@/components/ui/ModalShell';
import AudienceBuilder from '@/components/communication/AudienceBuilder';
import ChannelBadge from '@/components/communication/ChannelBadge';
import { EnhancedMultiSelect, SelectOption } from '@/components/ui/EnhancedSelect';
import { useTemplates } from '@/services/useCommunicationHooks';
import { Campaign, CampaignStatus, CommunicationChannel, EMPTY_AUDIENCE, AudienceFilter } from '@/types/communication';

interface CampaignWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>) => void;
  campaign?: Campaign | null;
  isLoading?: boolean;
}

const STEPS = [
  { id: 0, label: 'Basics', icon: Megaphone },
  { id: 1, label: 'Audience', icon: Users },
  { id: 2, label: 'Messages', icon: MessageSquareText },
  { id: 3, label: 'Schedule & Review', icon: ClipboardList },
] as const;

function ClickableDateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          const target = e.currentTarget.querySelector('input') as HTMLInputElement | null;
          try {
            target?.showPicker();
          } catch {
            target?.focus();
          }
        }}
        className="w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl border border-slate-200 bg-white text-left hover:border-slate-300 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all"
      >
        <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-sm font-medium text-slate-700 focus:outline-none"
        />
      </button>
    </div>
  );
}

function StepDot({ step, current, done, onClick }: { step: (typeof STEPS)[number]; current: number; done: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 group min-w-0"
    >
      <span
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all shrink-0',
          current === step.id
            ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-200'
            : done
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'bg-white border-slate-200 text-slate-400',
        )}
      >
        {done ? <Check className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
      </span>
      <span
        className={cn(
          'hidden sm:block text-xs font-bold uppercase tracking-wide truncate min-w-0',
          current === step.id ? 'text-purple-700' : done ? 'text-emerald-600' : 'text-slate-400',
        )}
      >
        {step.label}
      </span>
    </button>
  );
}

export default function CampaignWizardModal({ isOpen, onClose, onSave, campaign, isLoading }: CampaignWizardModalProps) {
  const { data: templates } = useTemplates();
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);

  const [name, setName] = useState('');
  const [filters, setFilters] = useState<AudienceFilter>(EMPTY_AUDIENCE);
  const [channels, setChannels] = useState<CommunicationChannel[]>(['WHATSAPP']);
  const [templateIds, setTemplateIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setMaxStep(0);
      if (campaign) {
        setName(campaign.name);
        setFilters(campaign.audience);
        setChannels(campaign.channels);
        setTemplateIds(campaign.templateIds);
        setStartDate(campaign.startDate.split('T')[0]);
        setEndDate(campaign.endDate.split('T')[0]);
      } else {
        setName('');
        setFilters(EMPTY_AUDIENCE);
        setChannels(['WHATSAPP']);
        setTemplateIds([]);
        setStartDate('');
        setEndDate('');
      }
    }
  }, [isOpen, campaign]);

  const templateOptions: SelectOption[] = useMemo(
    () => (templates || []).map((t) => ({ value: t.id, label: t.name, description: t.channel })),
    [templates],
  );

  const filteredTemplates = useMemo(
    () => (templates || []).filter((t) => channels.includes(t.channel)),
    [templates, channels],
  );

  const hasAudience =
    (filters.statuses?.length || 0) > 0 ||
    (filters.salespeople?.length || 0) > 0 ||
    (filters.locations?.length || 0) > 0 ||
    !!filters.dateAdded;

  const canNext = [
    name.trim().length > 0,
    hasAudience,
    channels.length > 0 && templateIds.length > 0,
    !!startDate && !!endDate && new Date(endDate) >= new Date(startDate),
  ][step];

  const canSave = name.trim() && hasAudience && channels.length > 0 && templateIds.length > 0 && startDate && endDate && new Date(endDate) >= new Date(startDate);

  const goTo = (target: number) => {
    if (target <= maxStep && target >= 0 && target <= 3) setStep(target);
  };

  const goNext = () => {
    if (!canNext) return;
    const next = step + 1;
    setMaxStep((m) => Math.max(m, next));
    setStep(next);
  };

  const toggleChannel = (ch: CommunicationChannel) => {
    const next = channels.includes(ch) ? channels.filter((c) => c !== ch) : [...channels, ch];
    setChannels(next);
    if (!next.includes(ch)) {
      setTemplateIds((ids) => ids.filter((id) => {
        const tpl = templates?.find((t) => t.id === id);
        return tpl && next.includes(tpl.channel);
      }));
    }
  };

  const selectedTemplates = filteredTemplates.filter((t) => templateIds.includes(t.id));

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      header={
        <div>
          <div className="flex items-center gap-3 p-5 sm:p-6 pr-14 pb-4">
            <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-600 shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-black text-slate-900">{campaign ? 'Edit Campaign' : 'Create Campaign'}</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {campaign ? 'Update any part of your promotion.' : 'Run a promotion across WhatsApp and SMS.'}
              </p>
            </div>
          </div>
          {/* Stepper */}
          <div className="flex items-center gap-1 sm:gap-4 px-5 sm:px-6 pb-4">
            {STEPS.map((s, idx) => (
              <div key={s.id} className="flex items-center gap-1 sm:gap-4 flex-1 last:flex-none min-w-0">
                <StepDot step={s} current={step} done={maxStep > idx || (idx < step)} onClick={() => goTo(s.id)} />
                {idx < STEPS.length - 1 && <div className={cn('h-0.5 flex-1 rounded-full min-w-2', idx < step ? 'bg-emerald-400' : 'bg-slate-200')} />}
              </div>
            ))}
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between gap-3 p-5 sm:p-6">
          <button
            onClick={() => (step === 0 ? onClose() : setStep(step - 1))}
            className="inline-flex items-center gap-1.5 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 0 ? 'Cancel' : 'Back'}
          </button>
          {step < 3 ? (
            <button
              onClick={goNext}
              disabled={!canNext}
              className={cn(
                'inline-flex items-center gap-1.5 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg',
                canNext
                  ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-purple-100'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none',
              )}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                if (!canSave) return;
                onSave({
                  name: name.trim(),
                  audience: filters,
                  channels,
                  templateIds,
                  startDate: new Date(startDate).toISOString(),
                  endDate: new Date(`${endDate}T23:59:59`).toISOString(),
                  status: campaign?.status || 'DRAFT',
                });
              }}
              disabled={!canSave || isLoading}
              className={cn(
                'inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg',
                canSave
                  ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-purple-100'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none',
              )}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {campaign ? 'Save Changes' : 'Create Campaign'}
            </button>
          )}
        </div>
      }
    >
      <div className="p-5 sm:p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.18 }}
          >
            {step === 0 && (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Campaign name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. August New Business Push"
                    autoFocus
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Give your promotion a clear name so your team knows what it’s for.
                </p>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-3">
                <AudienceBuilder filters={filters} onChange={setFilters} compact />
                <p className="text-xs text-slate-500 font-medium">
                  Campaigns target a specific audience. Choose at least one filter (status, salesperson, area or date).
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                {/* Channels */}
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Channels</p>
                  <div className="flex flex-wrap gap-2">
                    {(['WHATSAPP', 'SMS'] as const).map((ch) => (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => toggleChannel(ch)}
                        className={cn(
                          'px-4 py-2.5 rounded-xl text-xs font-bold border-2 transition-all',
                          channels.includes(ch)
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300',
                        )}
                      >
                        {ch === 'WHATSAPP' ? 'WhatsApp' : 'SMS'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Templates */}
                <div className="space-y-3">
                  <EnhancedMultiSelect
                    label="Message templates"
                    placeholder={`Select templates for ${channels.join(' + ') || '…'}`}
                    options={templateOptions.filter((o) => channels.some((ch) => (templates || []).find((t) => t.id === o.value)?.channel === ch))}
                    selected={templateIds}
                    onToggle={(value) => {
                      setTemplateIds((ids) => (ids.includes(value) ? ids.filter((i) => i !== value) : [...ids, value]));
                    }}
                    onClear={() => setTemplateIds([])}
                  />
                  {selectedTemplates.length > 0 && (
                    <div className="space-y-2">
                      {selectedTemplates.map((tpl) => (
                        <div key={tpl.id} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                          <ChannelBadge channel={tpl.channel} />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-700">{tpl.name}</p>
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{tpl.body}</p>
                          </div>
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        </div>
                      ))}
                    </div>
                  )}
                  {channels.length > 0 && templateIds.length === 0 && (
                    <p className="text-xs font-bold text-amber-600">Select at least one template to send.</p>
                  )}
                </div>

                {channels.length > 0 && filteredTemplates.length === 0 && (
                  <div className="text-xs text-slate-500 bg-slate-100 border border-dashed border-slate-200 rounded-2xl p-4">
                    No {channels.join(' + ')} templates yet. Create one in <strong>Manage Templates</strong> first.
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <ClickableDateField label="Start date" value={startDate} onChange={setStartDate} />
                  <ClickableDateField label="End date" value={endDate} onChange={setEndDate} />
                </div>
                {startDate && endDate && new Date(endDate) < new Date(startDate) && (
                  <p className="text-xs font-bold text-red-600">End date must not be before the start date.</p>
                )}

                {/* Review summary */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Review</p>
                  <SummaryRow icon={<Megaphone className="w-4 h-4 text-purple-500" />} label="Name" value={name} />
                  <SummaryRow
                    icon={<Users className="w-4 h-4 text-blue-500" />}
                    label="Audience"
                    value={
                      [
                        (filters.statuses || []).join(', '),
                        (filters.salespeople || []).join(', '),
                        (filters.locations || []).join(', '),
                        filters.dateAdded ? `Added ${filters.dateAdded.range}` : '',
                      ].filter(Boolean).join(' · ') || 'Not set'
                    }
                  />
                  <SummaryRow
                    icon={<MessageSquareText className="w-4 h-4 text-sky-500" />}
                    label="Channels"
                    value={channels.map((c) => (c === 'WHATSAPP' ? 'WhatsApp' : 'SMS')).join(', ')}
                  />
                  <SummaryRow
                    icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    label="Templates"
                    value={selectedTemplates.map((t) => t.name).join(', ') || 'None'}
                  />
                  <SummaryRow
                    icon={<CalendarDays className="w-4 h-4 text-amber-500" />}
                    label="Duration"
                    value={startDate && endDate ? `${startDate} → ${endDate}` : 'Not set'}
                  />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </ModalShell>
  );
}

function SummaryRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-slate-700 break-words">{value}</p>
      </div>
    </div>
  );
}