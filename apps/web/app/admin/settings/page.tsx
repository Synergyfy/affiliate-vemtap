'use client';

import { motion } from 'framer-motion';
import { 
  Settings, 
  Percent, 
  Wallet, 
  Shield, 
  Save,
  Clock,
  Coins,
  Users,
  Briefcase,
  Loader2,
  Trophy,
  ShieldCheck,
} from 'lucide-react';
import type { ReactNode } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useToast } from '@/hooks/toast';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

import { useSettings, useUpdateSettings } from '@/services/useAdminHooks';
import { PlatformSettings } from '@/types/api';

type FieldKey =
  | 'directCommissionRate'
  | 'indirectCommissionRate'
  | 'earningDurationMonths'
  | 'subAffiliateUnlockCount'
  | 'fraudThresholdScore'
  | 'minWithdrawal'
  | 'reqAgentActiveDays'
  | 'reqAgentActiveBusinesses'
  | 'reqAgentMinReportingScore'
  | 'reqAgentMinAttendanceRate'
  | 'reqAffiliateActiveAgents'
  | 'reqAffiliateNetworkBusinesses'
  | 'reqSupervisorActiveAgents'
  | 'reqSupervisorActiveSupervisors'
  | 'reqSupervisorNetworkBusinesses'
  | 'recurringAgentCommission'
  | 'recurringAffiliateCommission'
  | 'recurringLineManagerCommission'
  | 'recurringDurationMonths'
  | 'recurringYear2Rate';

interface ValidationRule {
  min?: number;
  max?: number;
  requiredMsg: string;
  minMsg: string;
  maxMsg: string;
}

const FORM_FIELDS: FieldKey[] = [
  'directCommissionRate',
  'indirectCommissionRate',
  'earningDurationMonths',
  'subAffiliateUnlockCount',
  'fraudThresholdScore',
  'minWithdrawal',
  'reqAgentActiveDays',
  'reqAgentActiveBusinesses',
  'reqAgentMinReportingScore',
  'reqAgentMinAttendanceRate',
  'reqAffiliateActiveAgents',
  'reqAffiliateNetworkBusinesses',
  'reqSupervisorActiveAgents',
  'reqSupervisorActiveSupervisors',
  'reqSupervisorNetworkBusinesses',
  'recurringAgentCommission',
  'recurringAffiliateCommission',
  'recurringLineManagerCommission',
  'recurringDurationMonths',
  'recurringYear2Rate',
];

const DEFAULT_SETTINGS: Partial<PlatformSettings> = {
  directCommissionRate: 0.20,
  indirectCommissionRate: 0.05,
  earningDurationMonths: 3,
  subAffiliateUnlockCount: 30,
  fraudThresholdScore: 80,
  minWithdrawal: 5000,
  reqAgentActiveDays: 90,
  reqAgentActiveBusinesses: 40,
  reqAgentMinReportingScore: 85,
  reqAgentMinAttendanceRate: 90,
  reqAffiliateActiveAgents: 30,
  reqAffiliateNetworkBusinesses: 100,
  reqSupervisorActiveAgents: 10,
  reqSupervisorActiveSupervisors: 5,
  reqSupervisorNetworkBusinesses: 100,
  recurringAgentCommission: 5,
  recurringAffiliateCommission: 10,
  recurringLineManagerCommission: 3,
  recurringDurationMonths: 12,
  recurringYear2Rate: 50,
};

const VALIDATION_RULES: Partial<Record<FieldKey, ValidationRule>> = {
  directCommissionRate: { min: 0, max: 1, requiredMsg: 'Enter a valid percentage', minMsg: 'Must be at least 0%', maxMsg: 'Must be at most 100%' },
  indirectCommissionRate: { min: 0, max: 1, requiredMsg: 'Enter a valid percentage', minMsg: 'Must be at least 0%', maxMsg: 'Must be at most 100%' },
  minWithdrawal: { min: 0, requiredMsg: 'Enter a valid amount', minMsg: 'Must be at least 0', maxMsg: '' },
  subAffiliateUnlockCount: { min: 0, requiredMsg: 'Enter a valid number', minMsg: 'Must be at least 0', maxMsg: '' },
  fraudThresholdScore: { min: 0, max: 100, requiredMsg: 'Enter a valid score', minMsg: 'Must be at least 0', maxMsg: 'Must be at most 100' },
  earningDurationMonths: { min: 1, requiredMsg: 'Enter a valid number of months', minMsg: 'Must be at least 1 month', maxMsg: '' },
  reqAgentActiveDays: { min: 0, requiredMsg: 'Enter a valid number', minMsg: 'Must be at least 0', maxMsg: '' },
  reqAgentActiveBusinesses: { min: 0, requiredMsg: 'Enter a valid number', minMsg: 'Must be at least 0', maxMsg: '' },
  reqAgentMinReportingScore: { min: 0, max: 100, requiredMsg: 'Enter a valid score', minMsg: 'Must be at least 0', maxMsg: 'Must be at most 100' },
  reqAgentMinAttendanceRate: { min: 0, max: 100, requiredMsg: 'Enter a valid score', minMsg: 'Must be at least 0', maxMsg: 'Must be at most 100' },
  reqAffiliateActiveAgents: { min: 0, requiredMsg: 'Enter a valid number', minMsg: 'Must be at least 0', maxMsg: '' },
  reqAffiliateNetworkBusinesses: { min: 0, requiredMsg: 'Enter a valid number', minMsg: 'Must be at least 0', maxMsg: '' },
  reqSupervisorActiveAgents: { min: 0, requiredMsg: 'Enter a valid number', minMsg: 'Must be at least 0', maxMsg: '' },
  reqSupervisorActiveSupervisors: { min: 0, requiredMsg: 'Enter a valid number', minMsg: 'Must be at least 0', maxMsg: '' },
  reqSupervisorNetworkBusinesses: { min: 0, requiredMsg: 'Enter a valid number', minMsg: 'Must be at least 0', maxMsg: '' },
  recurringAgentCommission: { min: 0, max: 100, requiredMsg: 'Enter a valid percentage', minMsg: 'Must be at least 0%', maxMsg: 'Must be at most 100%' },
  recurringAffiliateCommission: { min: 0, max: 100, requiredMsg: 'Enter a valid percentage', minMsg: 'Must be at least 0%', maxMsg: 'Must be at most 100%' },
  recurringLineManagerCommission: { min: 0, max: 100, requiredMsg: 'Enter a valid percentage', minMsg: 'Must be at least 0%', maxMsg: 'Must be at most 100%' },
  recurringDurationMonths: { min: 1, requiredMsg: 'Enter a valid number of months', minMsg: 'Must be at least 1 month', maxMsg: '' },
  recurringYear2Rate: { min: 0, max: 100, requiredMsg: 'Enter a valid percentage', minMsg: 'Must be at least 0%', maxMsg: 'Must be at most 100%' },
};

const normalizeSettings = (data: PlatformSettings): Partial<PlatformSettings> => {
  const out: Partial<PlatformSettings> = {};
  for (const key of FORM_FIELDS) {
    const val = Number((data as any)[key]);
    out[key] = Number.isFinite(val) ? val : (DEFAULT_SETTINGS[key] ?? 0);
  }
  return out;
};

interface NumberFieldProps {
  label: string;
  hint?: string;
  helper?: string;
  icon?: ReactNode;
  value: number;
  onChange: (value: number) => void;
  displayFactor?: number;
  min?: number;
  max?: number;
  error?: string;
  compact?: boolean;
}

function NumberField({
  label,
  hint,
  helper,
  icon,
  value,
  onChange,
  displayFactor = 1,
  min,
  max,
  error,
  compact,
}: NumberFieldProps) {
  const displayValue = Number.isNaN(value) ? '' : parseFloat((value * displayFactor).toFixed(6));
  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
        {label}
        {hint && <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">{hint}</span>}
      </label>
      <div className="relative">
        <input
          type="number"
          value={displayValue}
          min={min}
          max={max}
          onChange={(e) => onChange(Number(e.target.value) / displayFactor)}
          className={cn(
            "w-full border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold",
            compact ? "px-4 py-2.5 bg-white" : "px-4 py-3 bg-slate-50",
            error ? "border-red-400 focus:ring-red-500/20" : "border-slate-200"
          )}
        />
        {icon && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {icon}
          </span>
        )}
      </div>
      {error ? (
        <p className="text-xs text-red-500 font-semibold">{error}</p>
      ) : (
        helper && <p className={cn("text-slate-400", compact ? "text-[10px]" : "text-xs")}>{helper}</p>
      )}
    </div>
  );
}

export default function SettingsManagement() {
  const { showToast } = useToast();
  const { data: settings, isLoading, isError, refetch } = useSettings();
  const updateSettings = useUpdateSettings();
  
  const [formData, setFormData] = useState<Partial<PlatformSettings>>({ ...DEFAULT_SETTINGS });
  const [original, setOriginal] = useState<Partial<PlatformSettings>>({ ...DEFAULT_SETTINGS });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings) {
      const normalized = normalizeSettings(settings);
      setFormData(normalized);
      setOriginal(normalized);
      setErrors({});
    }
  }, [settings]);

  const hasChanges = FORM_FIELDS.some((key) => formData[key] !== original[key]);

  const validateField = (key: FieldKey, value: number): string | null => {
    const rule = VALIDATION_RULES[key];
    if (!rule) return null;
    if (Number.isNaN(value)) return null;
    if (rule.min !== undefined && value < rule.min) return rule.minMsg;
    if (rule.max !== undefined && value > rule.max) return rule.maxMsg;
    return null;
  };

  const handleFieldChange = (key: FieldKey, value: number) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    const error = validateField(key, value);
    setErrors(prev => {
      const next = { ...prev };
      if (error) {
        next[key] = error;
      } else {
        delete next[key];
      }
      return next;
    });
  };

  const validateAll = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    for (const key of FORM_FIELDS) {
      const value = formData[key];
      const rule = VALIDATION_RULES[key];
      if (!rule) continue;
      if (value === undefined || Number.isNaN(value)) {
        newErrors[key] = rule.requiredMsg;
      } else if (rule.min !== undefined && value < rule.min) {
        newErrors[key] = rule.minMsg;
      } else if (rule.max !== undefined && value > rule.max) {
        newErrors[key] = rule.maxMsg;
      }
    }
    return newErrors;
  };

  const handleSave = async () => {
    const newErrors = validateAll();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      showToast("Please fix the highlighted fields before saving.", "error");
      return;
    }

    const payload: Partial<PlatformSettings> = {};
    for (const key of FORM_FIELDS) {
      if (formData[key] !== original[key]) {
        payload[key] = formData[key];
      }
    }
    if (Object.keys(payload).length === 0) {
      showToast("No changes to save.", "info");
      return;
    }

    try {
      const updated = await updateSettings.mutateAsync(payload);
      const normalized = normalizeSettings(updated);
      setFormData(normalized);
      setOriginal(normalized);
      setErrors({});
      showToast("System configuration saved successfully.", "success");
    } catch (error: any) {
      showToast(error.message || "Failed to save configuration.", "error");
    }
  };

  const handleDiscard = () => {
    setFormData({ ...original });
    setErrors({});
    showToast("Changes discarded.", "info");
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
        </div>
      </AdminLayout>
    );
  }

  if (isError || !settings) {
    return <AdminLayout><div className="flex flex-col items-center justify-center h-64 gap-3"><Shield className="w-8 h-8 text-red-500" /><p className="text-sm text-slate-600">Unable to load platform settings.</p><button onClick={() => refetch()} className="text-sm font-bold text-blue-600 hover:underline">Retry</button></div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-900 rounded-2xl">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Platform Settings</h2>
            <div className="flex items-center gap-2">
              <p className="text-sm text-slate-500 font-medium">Configure commission rates, payouts and system rules</p>
              <span>•</span>
              <Link href="/admin/settings/agreement" className="text-sm font-bold text-blue-600 hover:underline">Manage Targeted Agreements</Link>
            </div>
          </div>
        </div>

        <div className="grid gap-8">
          {/* Commission Settings */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-8">
              <Percent className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900">Commission Configuration</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <NumberField
                label="Direct Commission Rate (%)"
                hint="Default 20%"
                icon={<Percent className="w-4 h-4 text-slate-400" />}
                value={formData.directCommissionRate ?? 0}
                onChange={(v) => handleFieldChange('directCommissionRate', v)}
                displayFactor={100}
                min={0}
                max={100}
                error={errors.directCommissionRate}
                helper="Percentage earned from direct business referrals."
              />

              <NumberField
                label="Indirect Commission Rate (%)"
                hint="Default 5%"
                icon={<Percent className="w-4 h-4 text-slate-400" />}
                value={formData.indirectCommissionRate ?? 0}
                onChange={(v) => handleFieldChange('indirectCommissionRate', v)}
                displayFactor={100}
                min={0}
                max={100}
                error={errors.indirectCommissionRate}
                helper="Percentage earned from sub-affiliate referrals."
              />

              <div className="space-y-2 md:col-span-2">
                <NumberField
                  label="Subscription Earning Duration (Months)"
                  hint="Default 12"
                  icon={<Clock className="w-4 h-4 text-slate-400" />}
                  value={formData.earningDurationMonths ?? 0}
                  onChange={(v) => handleFieldChange('earningDurationMonths', v)}
                  min={1}
                  error={errors.earningDurationMonths}
                  helper="How long an affiliate continues to earn commissions from a business&apos;s recurring subscriptions."
                />
              </div>
            </div>
          </motion.div>

          {/* Recurring Subscription Commission */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-8">
              <Clock className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-bold text-slate-900">Recurring Subscription Commission</h3>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 mb-6">
              <p className="text-xs text-purple-800 leading-relaxed">
                <strong>Recurring</strong> means from month 2 onward if the business renews. Default is 12 months (1 month main sub + 11 months recurring). After 12 months, year 2 reduces to the set rate. Same applies to Line Manager indirect earnings.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <NumberField
                label="Agent Recurring (%)"
                hint="Default 5%"
                icon={<Percent className="w-4 h-4 text-slate-400" />}
                value={formData.recurringAgentCommission ?? 0}
                onChange={(v) => handleFieldChange('recurringAgentCommission', v)}
                min={0}
                max={100}
                error={errors.recurringAgentCommission}
                helper="Monthly recurring % for Agents from month 2."
              />
              <NumberField
                label="Affiliate Recurring (%)"
                hint="Default 10%"
                icon={<Percent className="w-4 h-4 text-slate-400" />}
                value={formData.recurringAffiliateCommission ?? 0}
                onChange={(v) => handleFieldChange('recurringAffiliateCommission', v)}
                min={0}
                max={100}
                error={errors.recurringAffiliateCommission}
                helper="Monthly recurring % for Affiliates from month 2."
              />
              <NumberField
                label="Line Manager Indirect Recurring (%)"
                hint="Default 3%"
                icon={<Percent className="w-4 h-4 text-slate-400" />}
                value={formData.recurringLineManagerCommission ?? 0}
                onChange={(v) => handleFieldChange('recurringLineManagerCommission', v)}
                min={0}
                max={100}
                error={errors.recurringLineManagerCommission}
                helper="Recurring % Line Managers earn from their team&apos;s recurring subscriptions."
              />
              <NumberField
                label="Recurring Duration (Months)"
                hint="Default 12"
                icon={<Clock className="w-4 h-4 text-slate-400" />}
                value={formData.recurringDurationMonths ?? 0}
                onChange={(v) => handleFieldChange('recurringDurationMonths', v)}
                min={1}
                error={errors.recurringDurationMonths}
                helper="Total months a business subscription earns recurring commission."
              />
              <NumberField
                label="Year 2+ Reduction Rate (%)"
                hint="Default 50%"
                icon={<Percent className="w-4 h-4 text-slate-400" />}
                value={formData.recurringYear2Rate ?? 0}
                onChange={(v) => handleFieldChange('recurringYear2Rate', v)}
                min={0}
                max={100}
                error={errors.recurringYear2Rate}
                helper="% of original recurring rate for subsequent years."
              />
            </div>
          </motion.div>

          {/* Withdrawal Settings */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-8">
              <Wallet className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-bold text-slate-900">Withdrawal & Payouts</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <NumberField
                label="Minimum Withdrawal Amount (₦)"
                icon={<Coins className="w-4 h-4 text-slate-400" />}
                value={formData.minWithdrawal ?? 0}
                onChange={(v) => handleFieldChange('minWithdrawal', v)}
                min={0}
                error={errors.minWithdrawal}
              />
            </div>
          </motion.div>

          {/* Fraud Thresholds */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-8">
              <Shield className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-bold text-slate-900">Security & Fraud Thresholds</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <NumberField
                label="Risk Score Threshold"
                value={formData.fraudThresholdScore ?? 0}
                onChange={(v) => handleFieldChange('fraudThresholdScore', v)}
                min={0}
                max={100}
                error={errors.fraudThresholdScore}
                helper="Flag accounts with a risk score above this threshold."
              />
            </div>
          </motion.div>

          {/* Line Manager Feature Settings */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-8">
              <Users className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-bold text-slate-900">Line Manager Feature Configuration</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <NumberField
                label="Required Active Affiliates"
                hint="Default 30"
                icon={<Users className="w-4 h-4 text-slate-400" />}
                value={formData.subAffiliateUnlockCount ?? 0}
                onChange={(v) => handleFieldChange('subAffiliateUnlockCount', v)}
                min={0}
                error={errors.subAffiliateUnlockCount}
                helper="Sub-affiliates needed for Line Manager upgrade."
              />
            </div>
          </motion.div>

          {/* Promotion & Career Path Rules */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-8">
              <Trophy className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-bold text-slate-900">Career Path & Promotion Targets</h3>
            </div>

            <div className="space-y-8">
              {/* Field Agent to Line Manager */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  Field Agent Promotion (Agent ➔ Line Manager)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <NumberField
                    compact
                    label="Active Operating Days"
                    value={formData.reqAgentActiveDays ?? 0}
                    onChange={(v) => handleFieldChange('reqAgentActiveDays', v)}
                    min={0}
                    error={errors.reqAgentActiveDays}
                    helper="Timeline threshold since selected for operational tasks."
                  />
                  <NumberField
                    compact
                    label="Personal Active Businesses"
                    value={formData.reqAgentActiveBusinesses ?? 0}
                    onChange={(v) => handleFieldChange('reqAgentActiveBusinesses', v)}
                    min={0}
                    error={errors.reqAgentActiveBusinesses}
                    helper="Total active business closures required."
                  />
                  <NumberField
                    compact
                    label="Daily Reporting Compliance Score (%)"
                    value={formData.reqAgentMinReportingScore ?? 0}
                    onChange={(v) => handleFieldChange('reqAgentMinReportingScore', v)}
                    min={0}
                    max={100}
                    error={errors.reqAgentMinReportingScore}
                    helper="Minimum daily task reporting score required."
                  />
                  <NumberField
                    compact
                    label="Minimum Attendance Rate (%)"
                    value={formData.reqAgentMinAttendanceRate ?? 0}
                    onChange={(v) => handleFieldChange('reqAgentMinAttendanceRate', v)}
                    min={0}
                    max={100}
                    error={errors.reqAgentMinAttendanceRate}
                    helper="Minimum attendance verification rate required."
                  />
                </div>
              </div>

              {/* Freelance Affiliate to Line Manager */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  Freelance Affiliate Promotion (Affiliate ➔ Line Manager)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <NumberField
                    compact
                    label="Direct Active Agents"
                    value={formData.reqAffiliateActiveAgents ?? 0}
                    onChange={(v) => handleFieldChange('reqAffiliateActiveAgents', v)}
                    min={0}
                    error={errors.reqAffiliateActiveAgents}
                    helper="Recruits with at least one active business referral."
                  />
                  <NumberField
                    compact
                    label="Total Network Closed Deals"
                    value={formData.reqAffiliateNetworkBusinesses ?? 0}
                    onChange={(v) => handleFieldChange('reqAffiliateNetworkBusinesses', v)}
                    min={0}
                    error={errors.reqAffiliateNetworkBusinesses}
                    helper="Cumulative direct and indirect closed deals inside network."
                  />
                </div>
              </div>

              {/* Line Manager to Manager */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Line Manager Leadership Promotion (Line Manager ➔ Manager)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <NumberField
                    compact
                    label="Direct Active Agents"
                    value={formData.reqSupervisorActiveAgents ?? 0}
                    onChange={(v) => handleFieldChange('reqSupervisorActiveAgents', v)}
                    min={0}
                    error={errors.reqSupervisorActiveAgents}
                    helper="Active operational agents directly referred."
                  />
                  <NumberField
                    compact
                    label="Direct Qualified Line Managers"
                    value={formData.reqSupervisorActiveSupervisors ?? 0}
                    onChange={(v) => handleFieldChange('reqSupervisorActiveSupervisors', v)}
                    min={0}
                    error={errors.reqSupervisorActiveSupervisors}
                    helper="Referred team members promoted to Line Manager."
                  />
                  <NumberField
                    compact
                    label="Cumulative Network Closed Deals"
                    value={formData.reqSupervisorNetworkBusinesses ?? 0}
                    onChange={(v) => handleFieldChange('reqSupervisorNetworkBusinesses', v)}
                    min={0}
                    error={errors.reqSupervisorNetworkBusinesses}
                    helper="Total businesses closed across the direct and sub-networks."
                  />
                </div>
              </div>
            </div>
          </motion.div>

          <div className="flex justify-end gap-3 pt-4">
            <button 
              onClick={handleDiscard}
              disabled={updateSettings.isPending || !hasChanges}
              className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              Discard Changes
            </button>
            <button 
              onClick={handleSave}
              disabled={updateSettings.isPending || !hasChanges}
              className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50"
            >
              {updateSettings.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {updateSettings.isPending ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
