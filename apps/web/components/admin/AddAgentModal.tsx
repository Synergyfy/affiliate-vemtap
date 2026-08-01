'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  X, User, Mail, Phone, Lock, Target, TrendingUp, Briefcase,
  Eye, EyeOff, AlertCircle, CheckCircle2, ShieldCheck, Users, ChevronRight, ChevronLeft, UserCog
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

type RoleOption = 'AGENT' | 'AFFILIATE' | 'SUPERVISOR' | 'MANAGER';

const roleOptions: { value: RoleOption; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: 'AGENT', label: 'Agent', desc: 'Field marketer who captures businesses and leads', icon: <Briefcase className="w-4 h-4" /> },
  { value: 'AFFILIATE', label: 'Affiliate', desc: 'Can recruit agents and manage business relationships', icon: <Users className="w-4 h-4" /> },
  { value: 'SUPERVISOR', label: 'Line Manager', desc: 'Oversees agents/affiliates and reviews their work', icon: <ShieldCheck className="w-4 h-4" /> },
  { value: 'MANAGER', label: 'Manager', desc: 'Full management access over teams and operations', icon: <UserCog className="w-4 h-4" /> },
];

const mockUsers = [
  { id: 'u-1', name: 'Adekunle Silver', role: 'SUPERVISOR' },
  { id: 'u-2', name: 'Bisi Adeyemi', role: 'MANAGER' },
  { id: 'u-3', name: 'Chioma Okafor', role: 'SUPERVISOR' },
  { id: 'u-4', name: 'David Mark', role: 'MANAGER' },
  { id: 'u-5', name: 'Emeka Nwosu', role: 'SUPERVISOR' },
];

const validators = {
  fullName: (v: string) => {
    if (!v.trim()) return 'Full name is required';
    if (v.trim().length < 2) return 'Must be at least 2 characters';
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
}

function Field({ label, icon, type = 'text', value, onChange, onBlur, placeholder, error, touched, suffix }: FieldProps) {
  const isError = touched && !!error;
  const isOk = touched && !error && value.trim().length > 0;
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">{icon}{label}<span className="text-rose-400">*</span></label>
      <div className="relative">
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} placeholder={placeholder}
          className={`w-full px-4 py-3 pr-10 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 transition-all border ${
            isError ? 'bg-rose-50 border-rose-300 focus:ring-rose-500/20' : isOk ? 'bg-emerald-50 border-emerald-300 focus:ring-emerald-500/20' : 'bg-slate-50 border-slate-200 focus:ring-violet-500/20'
          }`}
        />
        {suffix && <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>}
        {!suffix && isError && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400" />}
        {!suffix && isOk && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />}
      </div>
      {isError && <p className="text-[11px] font-semibold text-rose-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
    </div>
  );
}

interface NumberFieldProps {
  label: string;
  icon: React.ReactNode;
  value: number;
  onChange: (v: number) => void;
  description: string;
  bg?: string;
}

function NumberField({ label, icon, value, onChange, description, bg = 'bg-slate-50' }: NumberFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">{icon}{label}</label>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onChange(Math.max(0, value - 1))} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-90 text-slate-600 font-black text-lg flex items-center justify-center transition-all select-none">−</button>
        <input type="number" value={value} min={0} onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
          className="flex-1 text-center px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all"
        />
        <button type="button" onClick={() => onChange(value + 1)} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-90 text-slate-600 font-black text-lg flex items-center justify-center transition-all select-none">+</button>
      </div>
      <p className="text-[10px] text-slate-400 font-medium">{description}</p>
    </div>
  );
}

export default function AddAgentModal({ isOpen, onClose, onCreated }: AddAgentModalProps) {
  const { showToast } = useToast();
  const createUser = useCreateUser();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', password: '',
    dailyLeadTarget: 5, monthlyConversionTarget: 20,
    workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'] as string[],
    role: 'AGENT' as RoleOption,
    supervisorId: '', managerId: '',
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [supervisorSearch, setSupervisorSearch] = useState('');
  const [managerSearch, setManagerSearch] = useState('');

  const errors = {
    fullName: validators.fullName(form.fullName),
    email: validators.email(form.email),
    phone: validators.phone(form.phone),
    password: validators.password(form.password),
  };

  const isStep1Valid = !errors.fullName && !errors.email && !errors.phone && !errors.password
    && form.fullName.trim() && form.email.trim() && form.phone.trim() && form.password;
  const isStep3Valid = form.role !== 'AGENT' || (form.supervisorId && form.managerId);

  const touch = useCallback((key: string) => setTouched(prev => ({ ...prev, [key]: true })), []);
  const handleChange = (key: string) => (value: string | number | RoleOption) => setForm(prev => ({ ...prev, [key]: value }));
  const touchAll = () => setTouched({ fullName: true, email: true, phone: true, password: true });

  const handleClose = () => {
    setForm({ fullName: '', email: '', phone: '', password: '', dailyLeadTarget: 5, monthlyConversionTarget: 20, workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'], role: 'AGENT', supervisorId: '', managerId: '' });
    setTouched({}); setShowPassword(false); setStep(1); onClose();
  };

  const handleSubmit = async () => {
    try {
      await createUser.mutateAsync({
        ...form,
        role: form.role,
        dailyLeadTarget: form.dailyLeadTarget,
        monthlyConversionTarget: form.monthlyConversionTarget,
      });
      showToast(`${form.role.charAt(0) + form.role.slice(1).toLowerCase()} "${form.fullName}" created successfully`, 'success');
      handleClose();
      onCreated?.();
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to create user', 'error');
    }
  };

  const pwStrength = passwordStrength(form.password);
  const supervisors = mockUsers.filter(u => u.role === 'SUPERVISOR');
  const managers = mockUsers.filter(u => u.role === 'MANAGER');
  const filteredSupervisors = supervisors.filter(s => s.name.toLowerCase().includes(supervisorSearch.toLowerCase()));
  const filteredManagers = managers.filter(m => m.name.toLowerCase().includes(managerSearch.toLowerCase()));

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleClose} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[92svh] flex flex-col"
          >
            {/* Header */}
            <div className="relative p-6 border-b border-slate-100 bg-gradient-to-r from-violet-600 to-purple-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Create User Account</h3>
                  <p className="text-xs text-violet-200 font-medium">
                    Step {step} of 3: {step === 1 ? 'Personal Info' : step === 2 ? 'Performance Targets' : 'Role & Assignment'}
                  </p>
                </div>
              </div>
              <button onClick={handleClose} className="absolute top-5 right-5 p-2 hover:bg-white/20 rounded-xl transition-colors"><X className="w-5 h-5 text-white/70" /></button>
              {/* Step indicators */}
              <div className="flex gap-2 mt-4">
                {[1, 2, 3].map(s => (
                  <div key={s} className={`flex-1 h-1 rounded-full transition-all ${s <= step ? 'bg-white' : 'bg-white/20'}`} />
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <AnimatePresence mode="wait">
                {/* Step 1: Personal Information */}
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-5">
                      <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                        <User className="w-3.5 h-3.5 text-violet-500" />
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Personal Information</h5>
                      </div>
                      <Field label="Full Name" icon={<User className="w-3 h-3" />} value={form.fullName} onChange={handleChange('fullName')} onBlur={() => touch('fullName')} placeholder="Jane Marketer" error={errors.fullName} touched={touched.fullName} />
                      <Field label="Email Address" icon={<Mail className="w-3 h-3" />} type="email" value={form.email} onChange={handleChange('email')} onBlur={() => touch('email')} placeholder="jane@example.com" error={errors.email} touched={touched.email} />
                      <Field label="Phone Number" icon={<Phone className="w-3 h-3" />} type="tel" value={form.phone} onChange={handleChange('phone')} onBlur={() => touch('phone')} placeholder="08012345678" error={errors.phone} touched={touched.phone} />
                    </div>
                    <div className="space-y-5">
                      <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                        <Lock className="w-3.5 h-3.5 text-violet-500" />
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Security</h5>
                      </div>
                      <Field label="Password" icon={<Lock className="w-3 h-3" />} type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange('password')} onBlur={() => touch('password')} placeholder="Min. 8 chars, 1 uppercase, 1 number" error={errors.password} touched={touched.password}
                        suffix={<button type="button" onClick={() => setShowPassword(p => !p)} className="text-slate-400 hover:text-slate-600 transition-colors tabIndex={-1}">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>}
                      />
                      {form.password.length > 0 && (
                        <div className="space-y-1">
                          <div className="flex gap-1">{[1, 2, 3, 4].map(i => <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-300 ${i <= pwStrength.score ? pwStrength.color : 'bg-slate-100'}`} />)}</div>
                          <p className={`text-[10px] font-bold ${pwStrength.score <= 1 ? 'text-rose-400' : pwStrength.score <= 2 ? 'text-amber-400' : pwStrength.score <= 3 ? 'text-blue-400' : 'text-emerald-500'}`}>{pwStrength.label} password</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Performance Targets */}
                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="max-w-lg mx-auto space-y-6">
                    <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                      <Target className="w-3.5 h-3.5 text-amber-500" />
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance Targets</h5>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-100">
                      <div className="grid grid-cols-2 gap-4">
                        <NumberField label="Daily Lead Target" icon={<Target className="w-3 h-3" />} value={form.dailyLeadTarget} onChange={handleChange('dailyLeadTarget')} description="Leads expected per day" />
                        <NumberField label="Monthly Conversions" icon={<TrendingUp className="w-3 h-3" />} value={form.monthlyConversionTarget} onChange={handleChange('monthlyConversionTarget')} description="Conversions expected per month" />
                      </div>
                    </div>

                    {/* Working Days */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Working Days</p>
                        <p className="text-[10px] text-slate-400">{form.workingDays.length} day{form.workingDays.length !== 1 ? 's' : ''} selected</p>
                      </div>
                      <div className="flex gap-2">
                        {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => {
                          const checked = form.workingDays.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => setForm(prev => ({
                                ...prev,
                                workingDays: checked ? prev.workingDays.filter(d => d !== day) : [...prev.workingDays, day],
                              }))}
                              className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold transition-all ${
                                checked ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              } ${day === 'SAT' || day === 'SUN' ? 'opacity-80' : ''}`}
                            >
                              {day.slice(0, 3)}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-slate-400">Saturday and Sunday are off by default. Admin can override.</p>
                    </div>

                    <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-5 border border-violet-100">
                      <p className="text-[10px] font-black text-violet-500 uppercase tracking-widest mb-3">Target Summary</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-violet-50">
                          <p className="text-3xl font-black text-slate-900">{form.dailyLeadTarget}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Leads / Day</p>
                        </div>
                        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-violet-50">
                          <p className="text-3xl font-black text-slate-900">{form.monthlyConversionTarget}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Converts / Mo</p>
                        </div>
                        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-violet-50">
                          <p className="text-3xl font-black text-slate-900">{form.dailyLeadTarget * form.workingDays.length * 4}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Est. Leads / Mo</p>
                        </div>
                      </div>
                    </div>

                    {form.dailyLeadTarget > 0 && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                        <p className="text-xs text-emerald-800 font-medium text-center">
                          At <span className="font-black">{form.dailyLeadTarget} leads/day</span> × <span className="font-black">{form.workingDays.length} days/week</span> with <span className="font-black">{form.monthlyConversionTarget} conversions/mo</span>,
                          ~<span className="font-black">{form.dailyLeadTarget * form.workingDays.length * 4}</span> leads expected monthly
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Step 3: Role & Assignment */}
                {step === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                    <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                      <ShieldCheck className="w-3.5 h-3.5 text-violet-500" />
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Role & Assignment</h5>
                    </div>

                    {/* Role selection */}
                    <div>
                      <p className="text-xs font-bold text-slate-600 mb-3">Select Role</p>
                      <div className="grid grid-cols-2 gap-3">
                        {roleOptions.map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => setForm(prev => ({ ...prev, role: opt.value }))}
                            className={`p-4 rounded-2xl border-2 text-left transition-all ${
                              form.role === opt.value ? 'border-violet-500 bg-violet-50' : 'border-slate-200 hover:border-violet-200 bg-white'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${form.role === opt.value ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                              {opt.icon}
                            </div>
                            <p className="font-bold text-slate-900 text-sm">{opt.label}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Supervisor dropdown */}
                    <div>
                      <p className="text-xs font-bold text-slate-600 mb-2">
                        Assign to Line Manager
                        {form.role === 'AGENT' && <span className="text-rose-500 ml-1">*</span>}
                      </p>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenDropdown(openDropdown === 'supervisor' ? null : 'supervisor')}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all ${form.supervisorId ? 'border-violet-300 bg-violet-50 text-slate-900' : 'border-slate-200 bg-white text-slate-400'}`}
                        >
                          {form.supervisorId ? supervisors.find(s => s.id === form.supervisorId)?.name || 'Select line manager' : 'Select line manager'}
                          <ChevronRight className={`w-4 h-4 transition-transform ${openDropdown === 'supervisor' ? 'rotate-90' : ''}`} />
                        </button>
                        {openDropdown === 'supervisor' && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden">
                            <div className="p-2 border-b border-slate-100">
                              <input
                                type="text"
                                value={supervisorSearch}
                                onChange={e => setSupervisorSearch(e.target.value)}
                                placeholder="Search line managers..."
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-violet-400"
                                autoFocus
                              />
                            </div>
                            <div className="max-h-48 overflow-y-auto p-1">
                              {filteredSupervisors.length === 0 ? (
                                <p className="text-xs text-slate-400 text-center py-4">No line managers found</p>
                              ) : filteredSupervisors.map(sup => (
                                <button
                                  key={sup.id}
                                  type="button"
                                  onClick={() => { setForm(prev => ({ ...prev, supervisorId: sup.id })); setOpenDropdown(null); setSupervisorSearch(''); }}
                                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${form.supervisorId === sup.id ? 'bg-violet-50 text-violet-900' : 'hover:bg-slate-50 text-slate-700'}`}
                                >
                                  <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 font-bold flex items-center justify-center text-xs">{sup.name.charAt(0)}</div>
                                  <div>
                                    <p className="font-bold text-sm">{sup.name}</p>
                                    <p className="text-[10px] text-violet-500 font-semibold">Line Manager</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {form.role === 'AGENT' && !form.supervisorId && (
                        <p className="text-[10px] text-rose-500 mt-1">A supervisor is required for Agent role</p>
                      )}
                    </div>

                    {/* Manager dropdown */}
                    <div>
                      <p className="text-xs font-bold text-slate-600 mb-2">
                        Assign to Manager
                        {form.role === 'AGENT' && <span className="text-rose-500 ml-1">*</span>}
                      </p>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenDropdown(openDropdown === 'manager' ? null : 'manager')}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all ${form.managerId ? 'border-emerald-300 bg-emerald-50 text-slate-900' : 'border-slate-200 bg-white text-slate-400'}`}
                        >
                          {form.managerId ? managers.find(m => m.id === form.managerId)?.name || 'Select manager' : 'Select manager'}
                          <ChevronRight className={`w-4 h-4 transition-transform ${openDropdown === 'manager' ? 'rotate-90' : ''}`} />
                        </button>
                        {openDropdown === 'manager' && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden">
                            <div className="p-2 border-b border-slate-100">
                              <input
                                type="text"
                                value={managerSearch}
                                onChange={e => setManagerSearch(e.target.value)}
                                placeholder="Search managers..."
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-400"
                                autoFocus
                              />
                            </div>
                            <div className="max-h-48 overflow-y-auto p-1">
                              {filteredManagers.length === 0 ? (
                                <p className="text-xs text-slate-400 text-center py-4">No managers found</p>
                              ) : filteredManagers.map(mgr => (
                                <button
                                  key={mgr.id}
                                  type="button"
                                  onClick={() => { setForm(prev => ({ ...prev, managerId: mgr.id })); setOpenDropdown(null); setManagerSearch(''); }}
                                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${form.managerId === mgr.id ? 'bg-emerald-50 text-emerald-900' : 'hover:bg-slate-50 text-slate-700'}`}
                                >
                                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">{mgr.name.charAt(0)}</div>
                                  <div>
                                    <p className="font-bold text-sm">{mgr.name}</p>
                                    <p className="text-[10px] text-emerald-500 font-semibold">Manager</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {form.role === 'AGENT' && !form.managerId && (
                        <p className="text-[10px] text-rose-500 mt-1">A manager is required for Agent role</p>
                      )}
                    </div>

                    {/* Summary */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Summary</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                        <p><span className="font-semibold text-slate-500">Name:</span> <span className="font-bold text-slate-900">{form.fullName || '—'}</span></p>
                        <p><span className="font-semibold text-slate-500">Role:</span> <span className="font-bold text-slate-900">{form.role}</span></p>
                        <p><span className="font-semibold text-slate-500">Daily Target:</span> <span className="font-bold text-slate-900">{form.dailyLeadTarget}</span></p>
                        <p><span className="font-semibold text-slate-500">Monthly Target:</span> <span className="font-bold text-slate-900">{form.monthlyConversionTarget}</span></p>
                        <p><span className="font-semibold text-slate-500">Working Days:</span> <span className="font-bold text-slate-900">{form.workingDays.length} days</span></p>
                        <p><span className="font-semibold text-slate-500">Line Manager:</span> <span className="font-bold text-slate-900">{supervisors.find(s => s.id === form.supervisorId)?.name || '—'}</span></p>
                        <p className="col-span-2"><span className="font-semibold text-slate-500">Manager:</span> <span className="font-bold text-slate-900">{managers.find(m => m.id === form.managerId)?.name || '—'}</span></p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 pt-4 border-t border-slate-100 flex gap-3 bg-white">
              {step > 1 ? (
                <Button variant="outline" onClick={() => setStep(step - 1)} className="flex items-center gap-2 flex-1 h-12 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50">
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
              ) : (
                <Button variant="outline" onClick={handleClose} className="flex-1 h-12 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</Button>
              )}
              {step < 3 ? (
                <Button onClick={() => { if (step === 1) touchAll(); if (step === 1 && !isStep1Valid) return; setStep(step + 1); }} className="flex items-center gap-2 flex-1 h-12 rounded-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-violet-200">
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} isLoading={createUser.isPending} disabled={createUser.isPending || !isStep3Valid} className="flex-1 h-12 rounded-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-violet-200 disabled:opacity-50">
                  Create {form.role.charAt(0) + form.role.slice(1).toLowerCase()}
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
