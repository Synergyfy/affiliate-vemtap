'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Zap, Loader2, ChevronLeft, ChevronRight, Check,
  MessageSquareText, Target, CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ModalShell from '@/components/ui/ModalShell';
import { EnhancedSingleSelect, SelectOption } from '@/components/ui/EnhancedSelect';
import { AutomationRule, CommunicationChannel, LeadStatus, MessageTemplate } from '@/types/communication';

interface RuleWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<AutomationRule, 'id'>) => void;
  rule?: AutomationRule | null;
  templates?: MessageTemplate[];
  isLoading?: boolean;
}

const STEPS = [
  { id: 0, label: 'Basics', icon: Target },
  { id: 1, label: 'Trigger', icon: Zap },
  { id: 2, label: 'Message', icon: MessageSquareText },
  { id: 3, label: 'Review', icon: CheckCircle2 },
] as const;

const TRIGGER_TYPES = [
  { value: 'STATUS_CHANGED', label: 'Status changes to…', desc: 'Fires when a lead moves to a specific status.' },
  { value: 'STATUS_STILL_AFTER_DAYS', label: 'Still in status after N days…', desc: 'Fires if a lead hasn\'t progressed after a set time.' },
  { value: 'SUBSCRIBED', label: 'Lead subscribes / becomes customer', desc: 'Fires when a lead is marked as a customer.' },
] as const;

const STATUSES: SelectOption[] = [
  { value: 'INTERESTED', label: 'Interested' },
  { value: 'VISITED', label: 'Visited' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'NOT_INTERESTED', label: 'Not Interested' },
  { value: 'CUSTOMER', label: 'Customer' },
];

const TRIGGER_LABELS: Record<string, string> = {
  STATUS_CHANGED: 'Status change',
  STATUS_STILL_AFTER_DAYS: 'Time delay',
  SUBSCRIBED: 'Subscription',
};

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
            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
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
          current === step.id ? 'text-indigo-700' : done ? 'text-emerald-600' : 'text-slate-400',
        )}
      >
        {step.label}
      </span>
    </button>
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

export default function RuleWizardModal({ isOpen, onClose, onSave, rule, templates, isLoading }: RuleWizardModalProps) {
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);

  const [name, setName] = useState('');
  const [target, setTarget] = useState<'LEAD' | 'CUSTOMER'>('LEAD');
  const [triggerType, setTriggerType] = useState<string>('STATUS_CHANGED');
  const [toStatus, setToStatus] = useState<LeadStatus>('INTERESTED');
  const [stillStatus, setStillStatus] = useState<LeadStatus>('INTERESTED');
  const [waitDays, setWaitDays] = useState(3);
  const [andNotSubscribed, setAndNotSubscribed] = useState(true);
  const [channel, setChannel] = useState<CommunicationChannel>('SMS');
  const [templateId, setTemplateId] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setMaxStep(0);
      if (rule) {
        setName(rule.name);
        setTarget(rule.target);
        setChannel(rule.channel);
        setTemplateId(rule.templateId);
        setTriggerType(rule.trigger.type);
        if (rule.trigger.type === 'STATUS_CHANGED') setToStatus(rule.trigger.toStatus);
        if (rule.trigger.type === 'STATUS_STILL_AFTER_DAYS') {
          setStillStatus(rule.trigger.status);
          setWaitDays(rule.trigger.waitDays);
          setAndNotSubscribed(rule.trigger.andNotSubscribed);
        }
        setMaxStep(3);
      } else {
        setName('');
        setTarget('LEAD');
        setTriggerType('STATUS_CHANGED');
        setToStatus('INTERESTED');
        setStillStatus('INTERESTED');
        setWaitDays(3);
        setAndNotSubscribed(true);
        setChannel('SMS');
        setTemplateId('');
      }
    }
  }, [rule, isOpen]);

  const channelTemplates = (templates || []).filter((t) => t.channel === channel);
  const templateOptions: SelectOption[] = useMemo(
    () => channelTemplates.map((t) => ({ value: t.id, label: t.name, description: t.body.slice(0, 60) + (t.body.length > 60 ? '…' : '') })),
    [channelTemplates],
  );
  const selectedTemplate = channelTemplates.find((t) => t.id === templateId);

  const canNext = [
    name.trim().length > 0,
    triggerType === 'SUBSCRIBED' || (triggerType === 'STATUS_CHANGED' ? true : true),
    channel && (triggerType === 'SUBSCRIBED' || templateId),
    true,
  ][step];

  const canSave = name.trim() && channel && (triggerType === 'SUBSCRIBED' || templateId);

  const goTo = (target: number) => {
    if (target <= maxStep && target >= 0 && target <= 3) setStep(target);
  };

  const goNext = () => {
    if (!canNext) return;
    const next = step + 1;
    setMaxStep((m) => Math.max(m, next));
    setStep(next);
  };

  const buildTrigger = (): AutomationRule['trigger'] => {
    if (triggerType === 'STATUS_CHANGED') return { type: 'STATUS_CHANGED', toStatus };
    if (triggerType === 'STATUS_STILL_AFTER_DAYS') return { type: 'STATUS_STILL_AFTER_DAYS', status: stillStatus, waitDays, andNotSubscribed };
    return { type: 'SUBSCRIBED' };
  };

  const triggerDescription = (() => {
    if (triggerType === 'STATUS_CHANGED') {
      const label = STATUSES.find((s) => s.value === toStatus)?.label || toStatus;
      return `When status changes to "${label}"`;
    }
    if (triggerType === 'STATUS_STILL_AFTER_DAYS') {
      const label = STATUSES.find((s) => s.value === stillStatus)?.label || stillStatus;
      return `If stuck in "${label}" for ${waitDays} day${waitDays !== 1 ? 's' : ''}${andNotSubscribed ? ' (excluding customers)' : ''}`;
    }
    return 'When lead becomes a customer';
  })();

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      header={
        <div>
          <div className="flex items-center gap-3 p-5 sm:p-6 pr-14 pb-4">
            <div className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-600 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-black text-slate-900">{rule ? 'Edit Rule' : 'Create Rule'}</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {rule ? 'Update your automation settings.' : 'Automate messages based on lead activity.'}
              </p>
            </div>
          </div>
          {/* Stepper */}
          <div className="flex items-center gap-1 sm:gap-4 px-5 sm:px-6 pb-4">
            {STEPS.map((s, idx) => (
              <div key={s.id} className="flex items-center gap-1 sm:gap-4 flex-1 last:flex-none min-w-0">
                <StepDot step={s} current={step} done={maxStep > idx || idx < step} onClick={() => goTo(s.id)} />
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
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
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
                  target,
                  trigger: buildTrigger(),
                  channel,
                  templateId,
                  enabled: rule?.enabled ?? true,
                });
              }}
              disabled={!canSave || isLoading}
              className={cn(
                'inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg',
                canSave
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none',
              )}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {rule ? 'Save Changes' : 'Create Rule'}
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
                    <div className="space-y-6">
                      {/* Rule name */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rule name</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Welcome Interested Leads"
                          autoFocus
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>

                      {/* Target */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Who is this for?</label>
                        <div className="grid grid-cols-2 gap-3">
                          {(['LEAD', 'CUSTOMER'] as const).map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setTarget(t)}
                              className={cn(
                                'flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all text-center',
                                target === t
                                  ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100'
                                  : 'border-slate-200 bg-white hover:border-slate-300',
                              )}
                            >
                              <div className={cn(
                                'w-10 h-10 rounded-xl flex items-center justify-center',
                                target === t ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500',
                              )}>
                                {t === 'LEAD' ? <Target className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                              </div>
                              <div>
                                <p className={cn('text-sm font-bold', target === t ? 'text-indigo-700' : 'text-slate-700')}>
                                  {t === 'LEAD' ? 'Lead Nurture' : 'Customer Journey'}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  {t === 'LEAD' ? 'Prospect follow-up' : 'Post-sale engagement'}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <div className="space-y-5">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">When should this fire?</p>

                      <div className="space-y-2">
                        {TRIGGER_TYPES.map((tt) => (
                          <label
                            key={tt.value}
                            className={cn(
                              'flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all',
                              triggerType === tt.value
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-slate-200 hover:border-slate-300 bg-white',
                            )}
                          >
                            <input
                              type="radio"
                              name="triggerType"
                              checked={triggerType === tt.value}
                              onChange={() => setTriggerType(tt.value)}
                              className="accent-indigo-600 mt-0.5"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-700">{tt.label}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">{tt.desc}</p>
                            </div>
                          </label>
                        ))}
                      </div>

                      {triggerType === 'STATUS_CHANGED' && (
                        <EnhancedSingleSelect
                          label="Target status"
                          placeholder="Pick a status…"
                          options={STATUSES}
                          value={toStatus}
                          onChange={(v) => setToStatus(v as LeadStatus)}
                        />
                      )}

                      {triggerType === 'STATUS_STILL_AFTER_DAYS' && (
                        <div className="space-y-4">
                          <EnhancedSingleSelect
                            label="Stuck in status"
                            placeholder="Pick a status…"
                            options={STATUSES}
                            value={stillStatus}
                            onChange={(v) => setStillStatus(v as LeadStatus)}
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Wait days</label>
                              <input
                                type="number"
                                min={1}
                                max={90}
                                value={waitDays}
                                onChange={(e) => setWaitDays(parseInt(e.target.value) || 1)}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              />
                            </div>
                            <div className="flex items-end pb-1">
                              <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={andNotSubscribed}
                                  onChange={(e) => setAndNotSubscribed(e.target.checked)}
                                  className="accent-indigo-600 w-4 h-4"
                                />
                                Only non-customers
                              </label>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-6">
                      {/* Channel chips */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Channel</label>
                        <div className="flex gap-2">
                          {(['WHATSAPP', 'SMS'] as const).map((ch) => (
                            <button
                              key={ch}
                              type="button"
                              onClick={() => { setChannel(ch); setTemplateId(''); }}
                              className={cn(
                                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border-2 transition-all',
                                channel === ch
                                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300',
                              )}
                            >
                              {ch === 'WHATSAPP' ? 'WhatsApp' : 'SMS'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Template picker */}
                      <EnhancedSingleSelect
                        label="Message template"
                        placeholder={channelTemplates.length > 0 ? 'Select a template…' : `No ${channel === 'WHATSAPP' ? 'WhatsApp' : 'SMS'} templates yet`}
                        options={templateOptions}
                        value={templateId || null}
                        onChange={setTemplateId}
                        onClear={() => setTemplateId('')}
                      />

                      {channelTemplates.length === 0 && (
                        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                          <p className="text-xs font-bold text-amber-700">
                            No {channel === 'WHATSAPP' ? 'WhatsApp' : 'SMS'} templates yet. Create one in <strong>Manage Templates</strong> first.
                          </p>
                        </div>
                      )}

                      {/* Selected template preview */}
                      {selectedTemplate && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-2xl bg-slate-50 border border-slate-100"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preview</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-indigo-200 bg-indigo-50 text-indigo-600">
                              {selectedTemplate.channel}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedTemplate.body}</p>
                          {selectedTemplate.variables.length > 0 && (
                            <p className="text-[11px] text-slate-400 mt-2">
                              Variables: {selectedTemplate.variables.map((v) => `{{${v.token}}}`).join(', ')}
                            </p>
                          )}
                        </motion.div>
                      )}
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-5">
                      {/* Visual flow */}
                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-[10px] font-bold text-indigo-600 uppercase">
                            {TRIGGER_LABELS[triggerType]}
                          </span>
                          <span className="text-xs font-bold text-slate-500">→</span>
                          <span className="px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-[10px] font-bold text-indigo-600 uppercase">
                            Send {channel === 'WHATSAPP' ? 'WhatsApp' : 'SMS'}
                          </span>
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Summary</p>
                        <SummaryRow
                          icon={<Zap className="w-4 h-4 text-indigo-500" />}
                          label="Name"
                          value={name}
                        />
                        <SummaryRow
                          icon={<Target className="w-4 h-4 text-blue-500" />}
                          label="Target"
                          value={target === 'LEAD' ? 'Lead Nurture' : 'Customer Journey'}
                        />
                        <SummaryRow
                          icon={<Zap className="w-4 h-4 text-amber-500" />}
                          label="Trigger"
                          value={triggerDescription}
                        />
                        <SummaryRow
                          icon={<MessageSquareText className="w-4 h-4 text-sky-500" />}
                          label="Channel"
                          value={channel === 'WHATSAPP' ? 'WhatsApp' : 'SMS'}
                        />
                        <SummaryRow
                          icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                          label="Template"
                          value={selectedTemplate?.name || 'None selected'}
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