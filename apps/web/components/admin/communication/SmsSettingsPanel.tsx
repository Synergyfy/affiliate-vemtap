'use client';

import { useState, useEffect } from 'react';
import { Loader2, Save, Info } from 'lucide-react';
import { useToast } from '@/hooks/toast';
import { useCommunicationSettings, useUpdateCommunicationSettings } from '@/services/useCommunicationHooks';
import { CommunicationSettings, NotInterestedPolicy } from '@/types/communication';
import { cn } from '@/lib/utils';

const POLICY_OPTIONS: { value: NotInterestedPolicy; label: string; description: string }[] = [
  { value: 'NO_MESSAGES', label: 'No Messages', description: 'Stop all messages immediately.' },
  { value: 'RE_ENGAGEMENT', label: 'Re-engagement', description: 'Low-frequency re-engagement attempts later.' },
];

export default function SmsSettingsPanel() {
  const { showToast } = useToast();
  const { data: settings, isLoading } = useCommunicationSettings();
  const updateSettings = useUpdateCommunicationSettings();

  const [form, setForm] = useState<Partial<CommunicationSettings>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        smsEnabled: settings.smsEnabled,
        smsDailyCap: settings.smsDailyCap,
        whatsappEnabled: settings.whatsappEnabled,
        minIntervalHours: settings.minIntervalHours,
        maxMessagesPerContactPerDay: settings.maxMessagesPerContactPerDay,
        maxMessagesPerContactPerWeek: settings.maxMessagesPerContactPerWeek,
        notInterestedPolicy: settings.notInterestedPolicy,
        reEngagementDelayDays: settings.reEngagementDelayDays,
        welcomeChannel: settings.welcomeChannel,
      });
    }
  }, [settings]);

  const update = <K extends keyof CommunicationSettings>(key: K, value: CommunicationSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(form);
      setHasChanges(false);
      showToast('Settings saved.', 'success');
    } catch {
      showToast('Failed to save settings.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Master switches */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6">
        <h3 className="text-lg font-bold text-slate-900">Global controls</h3>

        <ToggleRow
          label="SMS sending enabled"
          description="Master switch — when off, no SMS can be sent or scheduled."
          checked={form.smsEnabled ?? true}
          onChange={(v) => update('smsEnabled', v)}
        />

        <ToggleRow
          label="WhatsApp enabled"
          description="Enable or disable WhatsApp messaging across the platform."
          checked={form.whatsappEnabled ?? true}
          onChange={(v) => update('whatsappEnabled', v)}
        />

        <div className="flex items-center gap-3 pt-2">
          <div className={cn(
            'px-3 py-1.5 rounded-full text-xs font-bold border',
            settings?.smsProvider
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-slate-100 text-slate-500 border-slate-200',
          )}>
            {settings?.smsProvider ? `Provider: ${settings.smsProvider}` : 'Provider not configured'}
          </div>
        </div>
      </section>

      {/* Frequency limits */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Frequency limits</h3>
          <p className="text-xs text-slate-500 mt-1">Prevent over-messaging by capping how often each contact hears from you.</p>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600">Max per day</label>
            <input
              type="number"
              min={1}
              max={20}
              value={form.maxMessagesPerContactPerDay ?? 3}
              onChange={(e) => update('maxMessagesPerContactPerDay', parseInt(e.target.value) || 3)}
              className="w-24 px-3 py-2 rounded-xl text-sm font-medium border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600">Max per week</label>
            <input
              type="number"
              min={1}
              max={50}
              value={form.maxMessagesPerContactPerWeek ?? 10}
              onChange={(e) => update('maxMessagesPerContactPerWeek', parseInt(e.target.value) || 10)}
              className="w-24 px-3 py-2 rounded-xl text-sm font-medium border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600">Min interval (hours)</label>
            <input
              type="number"
              min={1}
              max={72}
              value={form.minIntervalHours ?? 4}
              onChange={(e) => update('minIntervalHours', parseInt(e.target.value) || 4)}
              className="w-24 px-3 py-2 rounded-xl text-sm font-medium border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600">SMS daily cap</label>
            <input
              type="number"
              min={10}
              max={5000}
              value={form.smsDailyCap ?? 500}
              onChange={(e) => update('smsDailyCap', parseInt(e.target.value) || 500)}
              className="w-24 px-3 py-2 rounded-xl text-sm font-medium border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex items-start gap-2 bg-slate-50 rounded-xl p-3">
          <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Each contact will receive at most <strong>{form.maxMessagesPerContactPerDay ?? 3} messages/day</strong> and <strong>{form.maxMessagesPerContactPerWeek ?? 10} messages/week</strong> across both WhatsApp and SMS.
          </p>
        </div>
      </section>

      {/* Not-interested policy */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Not-interested policy</h3>
          <p className="text-xs text-slate-500 mt-1">Control what happens to contacts marked as not interested.</p>
        </div>

        <div className="space-y-3">
          {POLICY_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={cn(
                'flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all',
                form.notInterestedPolicy === opt.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 bg-white hover:border-slate-300',
              )}
            >
              <input
                type="radio"
                name="notInterestedPolicy"
                checked={form.notInterestedPolicy === opt.value}
                onChange={() => update('notInterestedPolicy', opt.value)}
                className="mt-1 accent-blue-600"
              />
              <div>
                <p className="text-sm font-bold text-slate-800">{opt.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{opt.description}</p>
              </div>
            </label>
          ))}
        </div>

        {form.notInterestedPolicy === 'RE_ENGAGEMENT' && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600">Re-engagement delay (days)</label>
            <input
              type="number"
              min={7}
              max={90}
              value={form.reEngagementDelayDays ?? 30}
              onChange={(e) => update('reEngagementDelayDays', parseInt(e.target.value) || 30)}
              className="w-32 px-3 py-2 rounded-xl text-sm font-medium border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </section>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={!hasChanges || updateSettings.isPending}
          className={cn(
            'inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-lg',
            hasChanges
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none',
          )}
        >
          {updateSettings.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Settings
        </button>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div>
          <p className="text-sm font-bold text-slate-800">{label}</p>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors shrink-0 mt-0.5',
          checked ? 'bg-blue-600' : 'bg-slate-300',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </button>
    </div>
  );
}
