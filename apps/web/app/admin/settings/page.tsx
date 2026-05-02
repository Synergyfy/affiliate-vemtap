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
  Briefcase
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { api } from '@/lib/api-client';

export default function SettingsManagement() {
  const { showToast } = useToast();
  const [directRate, setDirectRate] = useState(20);
  const [indirectRate, setIndirectRate] = useState(5);
  const [earningDuration, setEarningDuration] = useState('3months');
  const [timeLimitDays, setTimeLimitDays] = useState(90);
  const [managerAffiliateTarget, setManagerAffiliateTarget] = useState(30);
  const [managerBusinessTarget, setManagerBusinessTarget] = useState(100);
  const [rewardDuration, setRewardDuration] = useState('1year');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.patch('/affiliates/admin/settings', { 
        directRate: Number(directRate), 
        indirectRate: Number(indirectRate),
        earningDuration,
        timeLimitDays: Number(timeLimitDays),
        managerAffiliateTarget: Number(managerAffiliateTarget),
        managerBusinessTarget: Number(managerBusinessTarget),
        rewardDuration
      });
      showToast("System configuration saved successfully.", "success");
    } catch (error) {
      showToast("Failed to save configuration.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDiscard = () => {
    showToast("Changes discarded.", "info");
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-900 rounded-2xl">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Platform Settings</h2>
            <p className="text-sm text-slate-500 font-medium">Configure commission rates, payouts and system rules</p>
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
                    value={directRate}
                    onChange={(e) => setDirectRate(Number(e.target.value))}
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
                    value={indirectRate}
                    onChange={(e) => setIndirectRate(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                  />
                  <Percent className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
                <p className="text-xs text-slate-400">Percentage earned from sub-affiliate referrals.</p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  Subscription Earning Duration
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">Default 3 Months</span>
                </label>
                <div className="relative">
                  <select 
                    value={earningDuration}
                    onChange={(e) => setEarningDuration(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold appearance-none cursor-pointer"
                  >
                    <option value="3months">3 Months</option>
                    <option value="6months">6 Months</option>
                    <option value="1year">1 Year</option>
                    <option value="forever">Forever (Lifetime)</option>
                  </select>
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
                    type="text" 
                    defaultValue="5,000"
                    readOnly
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold opacity-70"
                  />
                  <Coins className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
                <p className="text-xs text-slate-400">Fixed for this release.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Payout Frequency</label>
                <select disabled className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-sm appearance-none opacity-70">
                  <option>Weekly (Mondays)</option>
                </select>
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
                <label className="text-sm font-bold text-slate-700">Max IP Usage (Accounts)</label>
                <input 
                  type="number" 
                  defaultValue={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                />
                <p className="text-xs text-slate-400">Flag after X accounts created from same IP.</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <p className="text-sm font-bold text-slate-900">Automatic Fraud Flagging</p>
                  <p className="text-xs text-slate-500">Enable AI-based detection</p>
                </div>
                <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer" onClick={() => showToast("Automatic flagging toggled", "info")}>
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Platform Timing Settings */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-8">
              <Clock className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-bold text-slate-900">Platform Timing & Limits</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  Affiliate Time Limit (Days)
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">Default 90</span>
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={timeLimitDays}
                    onChange={(e) => setTimeLimitDays(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                  />
                  <Clock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
                <p className="text-xs text-slate-400">The window an affiliate has to reach manager status before their link expires.</p>
              </div>
            </div>
          </motion.div>

          {/* Manager Feature Settings */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-8">
              <Users className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-bold text-slate-900">Manager Feature Configuration</h3>
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
                    value={managerAffiliateTarget}
                    onChange={(e) => setManagerAffiliateTarget(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                  />
                  <Users className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
                <p className="text-xs text-slate-400">Sub-affiliates needed for Manager upgrade.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  Required Closed Businesses
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">Default 100</span>
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={managerBusinessTarget}
                    onChange={(e) => setManagerBusinessTarget(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                  />
                  <Briefcase className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
                <p className="text-xs text-slate-400">Direct business deals needed for Manager upgrade.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  Reward Duration
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">Default 1 Year</span>
                </label>
                <div className="relative">
                  <select 
                    value={rewardDuration}
                    onChange={(e) => setRewardDuration(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold appearance-none cursor-pointer"
                  >
                    <option value="3months">3 Months</option>
                    <option value="6months">6 Months</option>
                    <option value="1year">1 Year</option>
                    <option value="2years">2 Years</option>
                    <option value="forever">Forever (Lifetime)</option>
                  </select>
                  <Coins className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                <p className="text-xs text-slate-400">The length of the &quot;Extended Earnings Mode&quot; reward for Managers.</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <p className="text-sm font-bold text-slate-900">Enable Manager Network</p>
                  <p className="text-xs text-slate-500">Allow sub-affiliate recruiting</p>
                </div>
                <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer" onClick={() => showToast("Manager network toggled", "info")}>
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
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
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
