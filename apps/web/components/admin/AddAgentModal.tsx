'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  X, User, Mail, Phone, Lock, Target, TrendingUp, Briefcase,
  Eye, EyeOff, AlertCircle, CheckCircle2
} from 'lucide-react';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/toast';
import { useCreateUser } from '@/services/useAdminHooks';

interface AddAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

// ─── Validation helpers ────────────────────────────────────────────────────
const validators = {
  fullName: (v: string) => {
    if (!v.trim()) return 'Full name is required';
    if (v.trim().length < 2) return 'Must be at least 2 characters';
    if (!/^[a-zA-Z\s'-]+$/.test(v.trim())) return 'Only letters, spaces, hyphens and apostrophes';
    return '';
  },
  email: (v: string) => {
    if (!v.trim()) return 'Email address is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address';
    return '';
  },
  phone: (v: string) => {
    if (!v.trim()) return 'Phone number is required';
    const digits = v.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) return 'Must be 10–15 digits';
    return '';
  },
  password: (v: string) => {
    if (!v) return 'Password is required';
    if (v.length < 8) return 'Minimum 8 characters';
    if (!/[A-Z]/.test(v)) return 'Include at least one uppercase letter';
    if (!/[0-9]/.test(v)) return 'Include at least one number';
    return '';
  },
};

type FormKey = keyof typeof validators;

// ─── Password strength ──────────────────────────────────────────────────────
function passwordStrength(v: string): { score: number; label: string; color: string } {
  let score = 0;
  if (v.length >= 8) score++;
  if (v.length >= 12) score++;
  if (/[A-Z]/.test(v)) score++;
  if (/[0-9]/.test(v)) score++;
  if (/[^A-Za-z0-9]/.test(v)) score++;
  if (score <= 1) return { score, label: 'Weak', color: 'bg-rose-400' };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-amber-400' };
  if (score <= 3) return { score, label: 'Good', color: 'bg-blue-400' };
  return { score, label: 'Strong', color: 'bg-emerald-400' };
}

// ─── Field component ────────────────────────────────────────────────────────
interface FieldProps {
  label: string;
  icon: React.ReactNode;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  placeholder?: string;
  error?: string;
  touched?: boolean;
  suffix?: React.ReactNode;
  hint?: string;
}

function Field({ label, icon, type = 'text', value, onChange, onBlur, placeholder, error, touched, suffix, hint }: FieldProps) {
  const isError = touched && !!error;
  const isOk = touched && !error && value.trim().length > 0;

  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
        {icon}
        {label}
        <span className="text-rose-400">*</span>
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`w-full px-4 py-3 pr-10 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 transition-all border ${
            isError
              ? 'bg-rose-50 border-rose-300 focus:ring-rose-500/20 focus:border-rose-400'
              : isOk
              ? 'bg-emerald-50 border-emerald-300 focus:ring-emerald-500/20 focus:border-emerald-400'
              : 'bg-slate-50 border-slate-200 focus:ring-violet-500/20 focus:border-violet-400'
          }`}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {suffix}
          </div>
        )}
        {!suffix && isError && (
          <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400" />
        )}
        {!suffix && isOk && (
          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
        )}
      </div>
      <AnimatePresence mode="wait">
        {isError ? (
          <motion.p
            key="err"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="text-[11px] font-semibold text-rose-500 flex items-center gap-1"
          >
            <AlertCircle className="w-3 h-3 shrink-0" />
            {error}
          </motion.p>
        ) : hint ? (
          <motion.p key="hint" className="text-[11px] text-slate-400 font-medium">{hint}</motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

// ─── Number stepper ─────────────────────────────────────────────────────────
interface NumberFieldProps {
  label: string;
  icon: React.ReactNode;
  value: number;
  onChange: (v: number) => void;
  description: string;
}

function NumberField({ label, icon, value, onChange, description }: NumberFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
        {icon}
        {label}
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-90 text-slate-600 font-black text-lg flex items-center justify-center transition-all select-none"
        >
          −
        </button>
        <input
          type="number"
          value={value}
          min={0}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
          className="flex-1 text-center px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all"
        />
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-90 text-slate-600 font-black text-lg flex items-center justify-center transition-all select-none"
        >
          +
        </button>
      </div>
      <p className="text-[10px] text-slate-400 font-medium">{description}</p>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function AddAgentModal({ isOpen, onClose, onCreated }: AddAgentModalProps) {
  const { showToast } = useToast();
  const createUser = useCreateUser();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    dailyLeadTarget: 5,
    monthlyConversionTarget: 20,
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPassword, setShowPassword] = useState(false);

  const errors: Record<string, string> = {
    fullName: validators.fullName(form.fullName),
    email: validators.email(form.email),
    phone: validators.phone(form.phone),
    password: validators.password(form.password),
  };

  const isFormValid = Object.values(errors).every((e) => e === '');

  const touch = useCallback((key: string) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
  }, []);

  const handleChange = (key: string) => (value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const touchAll = () => {
    setTouched({ fullName: true, email: true, phone: true, password: true });
  };

  const handleClose = () => {
    setForm({ fullName: '', email: '', phone: '', password: '', dailyLeadTarget: 5, monthlyConversionTarget: 20 });
    setTouched({});
    setShowPassword(false);
    onClose();
  };

  const handleSubmit = async () => {
    touchAll();
    if (!isFormValid) return;

    try {
      await createUser.mutateAsync({ ...form, role: 'AGENT' });
      showToast(`Agent "${form.fullName}" created successfully`, 'success');
      handleClose();
      onCreated?.();
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to create agent', 'error');
    }
  };

  const pwStrength = passwordStrength(form.password);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal — max-w-2xl for wider layout */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
          >
            {/* Header */}
            <div className="relative p-6 border-b border-slate-100 bg-gradient-to-r from-violet-600 to-purple-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Create Agent Account</h3>
                  <p className="text-xs text-violet-200 font-medium">Set up a marketer with performance targets</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="absolute top-5 right-5 p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>

            {/* Body — two-column layout */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* ─ Left column: Personal Info ─ */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                    <User className="w-3.5 h-3.5 text-violet-500" />
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Personal Information</h5>
                  </div>

                  <Field
                    label="Full Name"
                    icon={<User className="w-3 h-3" />}
                    value={form.fullName}
                    onChange={handleChange('fullName')}
                    onBlur={() => touch('fullName')}
                    placeholder="Jane Marketer"
                    error={errors.fullName}
                    touched={touched.fullName}
                  />

                  <Field
                    label="Email Address"
                    icon={<Mail className="w-3 h-3" />}
                    type="email"
                    value={form.email}
                    onChange={handleChange('email')}
                    onBlur={() => touch('email')}
                    placeholder="jane@example.com"
                    error={errors.email}
                    touched={touched.email}
                  />

                  <Field
                    label="Phone Number"
                    icon={<Phone className="w-3 h-3" />}
                    type="tel"
                    value={form.phone}
                    onChange={handleChange('phone')}
                    onBlur={() => touch('phone')}
                    placeholder="08012345678"
                    error={errors.phone}
                    touched={touched.phone}
                    hint="10–15 digits, any format"
                  />

                  {/* Password field with show/hide + strength */}
                  <div className="space-y-1.5">
                    <Field
                      label="Password"
                      icon={<Lock className="w-3 h-3" />}
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={handleChange('password')}
                      onBlur={() => touch('password')}
                      placeholder="Min. 8 chars, 1 uppercase, 1 number"
                      error={errors.password}
                      touched={touched.password}
                      suffix={
                        <button
                          type="button"
                          onClick={() => setShowPassword((p) => !p)}
                          className="text-slate-400 hover:text-slate-600 transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                    />

                    {/* Strength meter */}
                    {form.password.length > 0 && (
                      <div className="space-y-1 pt-0.5">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                                i <= pwStrength.score ? pwStrength.color : 'bg-slate-100'
                              }`}
                            />
                          ))}
                        </div>
                        <p className={`text-[10px] font-bold ${
                          pwStrength.score <= 1 ? 'text-rose-400' :
                          pwStrength.score <= 2 ? 'text-amber-400' :
                          pwStrength.score <= 3 ? 'text-blue-400' : 'text-emerald-500'
                        }`}>
                          {pwStrength.label} password
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ─ Right column: Targets ─ */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                    <Target className="w-3.5 h-3.5 text-amber-500" />
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance Targets</h5>
                  </div>

                  <NumberField
                    label="Daily Lead Target"
                    icon={<Target className="w-3 h-3" />}
                    value={form.dailyLeadTarget}
                    onChange={(v) => handleChange('dailyLeadTarget')(v)}
                    description="Leads this agent is expected to submit per day"
                  />

                  <NumberField
                    label="Monthly Conversions"
                    icon={<TrendingUp className="w-3 h-3" />}
                    value={form.monthlyConversionTarget}
                    onChange={(v) => handleChange('monthlyConversionTarget')(v)}
                    description="Leads expected to sign up on Vemtap and pay for a plan per month"
                  />

                  {/* Live target preview card */}
                  <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-4 border border-violet-100 mt-2">
                    <p className="text-[10px] font-black text-violet-500 uppercase tracking-widest mb-3">Target Summary</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-violet-50">
                        <p className="text-3xl font-black text-slate-900">{form.dailyLeadTarget}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Leads / Day</p>
                      </div>
                      <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-violet-50">
                        <p className="text-3xl font-black text-slate-900">{form.monthlyConversionTarget}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Converts / Mo</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-violet-100 text-center">
                      <p className="text-[10px] text-slate-400 font-medium">
                        Expected <span className="font-black text-slate-600">{form.dailyLeadTarget * 30}</span> leads/month
                        with <span className="font-black text-violet-600">{form.monthlyConversionTarget}</span> conversions
                      </p>
                    </div>
                  </div>

                  {/* Validation summary — shows on attempt if errors */}
                  {Object.values(touched).some(Boolean) && !isFormValid && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-rose-50 border border-rose-100 rounded-xl p-3 space-y-1.5"
                    >
                      <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Please fix the following
                      </p>
                      {(Object.keys(errors) as FormKey[]).map((key) =>
                        touched[key] && errors[key] ? (
                          <p key={key} className="text-[11px] text-rose-400 font-medium pl-4">• {errors[key]}</p>
                        ) : null
                      )}
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 pt-4 border-t border-slate-100 flex gap-3 bg-white">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 h-12 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                isLoading={createUser.isPending}
                disabled={createUser.isPending}
                className="flex-1 h-12 rounded-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-violet-200 disabled:opacity-50"
              >
                {isFormValid ? 'Create Agent' : 'Check Fields & Create'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
