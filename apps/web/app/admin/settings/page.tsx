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
import AdminLayout from '@/components/admin/AdminLayout';
import { useToast } from '@/hooks/toast';
import { useState, useEffect } from 'react';
import Link from 'next/link';

import { useSettings, useUpdateSettings } from '@/services/useAdminHooks';
import { PlatformSettings } from '@/types/api';

export default function SettingsManagement() {
  const { showToast } = useToast();
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  
  const [formData, setFormData] = useState<Partial<PlatformSettings>>({
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
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        directCommissionRate: settings.directCommissionRate,
        indirectCommissionRate: settings.indirectCommissionRate,
        earningDurationMonths: settings.earningDurationMonths,
        subAffiliateUnlockCount: settings.subAffiliateUnlockCount,
        fraudThresholdScore: settings.fraudThresholdScore,
        minWithdrawal: settings.minWithdrawal,
        reqAgentActiveDays: settings.reqAgentActiveDays ?? 90,
        reqAgentActiveBusinesses: settings.reqAgentActiveBusinesses ?? 40,
        reqAgentMinReportingScore: settings.reqAgentMinReportingScore ?? 85,
        reqAgentMinAttendanceRate: settings.reqAgentMinAttendanceRate ?? 90,
        reqAffiliateActiveAgents: settings.reqAffiliateActiveAgents ?? 30,
        reqAffiliateNetworkBusinesses: settings.reqAffiliateNetworkBusinesses ?? 100,
        reqSupervisorActiveAgents: settings.reqSupervisorActiveAgents ?? 10,
        reqSupervisorActiveSupervisors: settings.reqSupervisorActiveSupervisors ?? 5,
        reqSupervisorNetworkBusinesses: settings.reqSupervisorNetworkBusinesses ?? 100,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(formData);
      showToast("System configuration saved successfully.", "success");
    } catch (error: any) {
      showToast(error.message || "Failed to save configuration.", "error");
    }
  };

  const handleDiscard = () => {
    if (settings) {
      setFormData(settings);
    }
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

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header omitted for brevity in replace context, but keep it in full file */}
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
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  Direct Commission Rate (%)
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">Default 20%</span>
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={Math.round((formData.directCommissionRate || 0) * 100)}
                    onChange={(e) => setFormData(prev => ({ ...prev, directCommissionRate: Number(e.target.value) / 100 }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                  />
                  <Percent className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
                <p className="text-xs text-slate-400">Percentage earned from direct business referrals.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  Indirect Commission Rate (%)
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">Default 5%</span>
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={Math.round((formData.indirectCommissionRate || 0) * 100)}
                    onChange={(e) => setFormData(prev => ({ ...prev, indirectCommissionRate: Number(e.target.value) / 100 }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                  />
                  <Percent className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
                <p className="text-xs text-slate-400">Percentage earned from sub-affiliate referrals.</p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  Subscription Earning Duration (Months)
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">Default 12</span>
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={formData.earningDurationMonths}
                    onChange={(e) => setFormData(prev => ({ ...prev, earningDurationMonths: Number(e.target.value) }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                  />
                  <Clock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                <p className="text-xs text-slate-400">How long an affiliate continues to earn commissions from a business&apos;s recurring subscriptions.</p>
              </div>
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
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  Minimum Withdrawal Amount (₦)
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={formData.minWithdrawal}
                    onChange={(e) => setFormData(prev => ({ ...prev, minWithdrawal: Number(e.target.value) }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                  />
                  <Coins className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>
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
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Risk Score Threshold</label>
                <input 
                  type="number" 
                  value={formData.fraudThresholdScore}
                  onChange={(e) => setFormData(prev => ({ ...prev, fraudThresholdScore: Number(e.target.value) }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                />
                <p className="text-xs text-slate-400">Flag accounts with a risk score above this threshold.</p>
              </div>
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
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  Required Active Affiliates
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">Default 30</span>
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={formData.subAffiliateUnlockCount}
                    onChange={(e) => setFormData(prev => ({ ...prev, subAffiliateUnlockCount: Number(e.target.value) }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                  />
                  <Users className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
                <p className="text-xs text-slate-400">Sub-affiliates needed for Line Manager upgrade.</p>
              </div>
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
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">Active Operating Days</label>
                    <input 
                      type="number" 
                      value={formData.reqAgentActiveDays ?? 90}
                      onChange={(e) => setFormData(prev => ({ ...prev, reqAgentActiveDays: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                    />
                    <p className="text-[10px] text-slate-400">Timeline threshold since selected for operational tasks.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">Personal Active Businesses</label>
                    <input 
                      type="number" 
                      value={formData.reqAgentActiveBusinesses ?? 40}
                      onChange={(e) => setFormData(prev => ({ ...prev, reqAgentActiveBusinesses: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                    />
                    <p className="text-[10px] text-slate-400">Total active business closures required.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">Daily Reporting Compliance Score (%)</label>
                    <input 
                      type="number" 
                      value={formData.reqAgentMinReportingScore ?? 85}
                      onChange={(e) => setFormData(prev => ({ ...prev, reqAgentMinReportingScore: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                    />
                    <p className="text-[10px] text-slate-400">Minimum daily task reporting score required.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">Minimum Attendance Rate (%)</label>
                    <input 
                      type="number" 
                      value={formData.reqAgentMinAttendanceRate ?? 90}
                      onChange={(e) => setFormData(prev => ({ ...prev, reqAgentMinAttendanceRate: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                    />
                    <p className="text-[10px] text-slate-400">Minimum attendance verification rate required.</p>
                  </div>
                </div>
              </div>

              {/* Freelance Affiliate to Line Manager */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  Freelance Affiliate Promotion (Affiliate ➔ Line Manager)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">Direct Active Agents</label>
                    <input 
                      type="number" 
                      value={formData.reqAffiliateActiveAgents ?? 30}
                      onChange={(e) => setFormData(prev => ({ ...prev, reqAffiliateActiveAgents: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                    />
                    <p className="text-[10px] text-slate-400">Recruits with at least one active business referral.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">Total Network Closed Deals</label>
                    <input 
                      type="number" 
                      value={formData.reqAffiliateNetworkBusinesses ?? 100}
                      onChange={(e) => setFormData(prev => ({ ...prev, reqAffiliateNetworkBusinesses: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                    />
                    <p className="text-[10px] text-slate-400">Cumulative direct and indirect closed deals inside network.</p>
                  </div>
                </div>
              </div>

              {/* Line Manager to Manager */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Line Manager Leadership Promotion (Line Manager ➔ Manager)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">Direct Active Agents</label>
                    <input 
                      type="number" 
                      value={formData.reqSupervisorActiveAgents ?? 10}
                      onChange={(e) => setFormData(prev => ({ ...prev, reqSupervisorActiveAgents: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                    />
                    <p className="text-[10px] text-slate-400">Active operational agents directly referred.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">Direct Qualified Line Managers</label>
                    <input 
                      type="number" 
                      value={formData.reqSupervisorActiveSupervisors ?? 5}
                      onChange={(e) => setFormData(prev => ({ ...prev, reqSupervisorActiveSupervisors: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                    />
                    <p className="text-[10px] text-slate-400">Referred team members promoted to Line Manager.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">Cumulative Network Closed Deals</label>
                    <input 
                      type="number" 
                      value={formData.reqSupervisorNetworkBusinesses ?? 100}
                      onChange={(e) => setFormData(prev => ({ ...prev, reqSupervisorNetworkBusinesses: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                    />
                    <p className="text-[10px] text-slate-400">Total businesses closed across the direct and sub-networks.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="flex justify-end gap-3 pt-4">
            <button 
              onClick={handleDiscard}
              className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all"
            >
              Discard Changes
            </button>
            <button 
              onClick={handleSave}
              disabled={updateSettings.isPending}
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
