'use client';

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  Target,
  Trophy,
  Star,
  MapPin,
  ChevronRight,
  Zap,
  UserPlus,
  Bell,
  AlertTriangle,
  LineChart as LineChartIcon,
  BarChart3,
  TrendingDown,
  ShieldCheck,
  LayoutDashboard
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import AffiliateAgreementModal from '@/components/dashboard/AffiliateAgreementModal';
import OnboardingModal from '@/components/dashboard/OnboardingModal';
import WhatsAppGroupModal from '@/components/dashboard/WhatsAppGroupModal';

const data = [
  { name: 'Jan', earnings: 4000 },
  { name: 'Feb', earnings: 3000 },
  { name: 'Mar', earnings: 2000 },
  { name: 'Apr', earnings: 2780 },
  { name: 'May', earnings: 1890 },
  { name: 'Jun', earnings: 2390 },
  { name: 'Jul', earnings: 3490 },
];

const stats = [
  { name: 'Monthly Earnings', value: '₦12,500', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+12.5%', trendUp: true },
  { name: 'Total Earnings', value: '₦124,500', icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '₦45,200 Bal', trendUp: true },
  { name: 'Active Businesses', value: '12', icon: Briefcase, color: 'text-orange-600', bg: 'bg-orange-50', trend: '+2 this week', trendUp: true },
  { name: 'Active Affiliates', value: '8', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50', trend: 'Manager Only', trendUp: true, isManagerOnly: true },
];

const chartData = [
  { name: 'Jan', earnings: 4000 },
  { name: 'Feb', earnings: 3000 },
  { name: 'Mar', earnings: 2000 },
  { name: 'Apr', earnings: 2780 },
  { name: 'May', earnings: 1890 },
  { name: 'Jun', earnings: 2390 },
  { name: 'Jul', earnings: 3490 },
];

const recentActivity = [
  { title: 'New Business', desc: 'Tech Solutions signed up', type: 'referral', time: new Date().toISOString() },
  { title: 'Commission Paid', desc: '₦5,000 for April referrals', type: 'commission', time: new Date().toISOString() },
];

const topAffiliates = [
  { name: 'Alex Johnson', earnings: 45000, rank: 1, avatar: '' },
  { name: 'Sarah Smith', earnings: 38000, rank: 2, avatar: '' },
  { name: 'David Lee', earnings: 32000, rank: 3, avatar: '' },
];

export default function DashboardOverview() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  // Milestone logic
  const currentProgress = 12;
  const milestoneGoal = 20;
  const progressPercent = (currentProgress / milestoneGoal) * 100;

  const displayStats = stats;

  useEffect(() => {
    const timer = setTimeout(() => {
      showToast('New referral: Tech Solutions Ltd just signed up!', 'success');
    }, 3000);
    return () => clearTimeout(timer);
  }, [showToast]);

  const handleSignAgreement = (name: string, date: string) => {
    updateUser({ hasSignedAgreement: true });
    showToast('Agreement signed successfully!', 'success');
    setShowWhatsAppModal(true);
  };

  const handleJoinWhatsApp = () => {
    setShowWhatsAppModal(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome & Milestone Section */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold text-slate-900">Welcome back, {user?.firstName || 'Affiliate'}!</h2>
            <p className="text-slate-500">Here&apos;s what&apos;s happening with your affiliate account today.</p>
          </div>
          
          {/* Milestone Tracker */}
          <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Trophy className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-blue-100">Next Milestone</span>
                <span className="bg-white/20 px-2 py-1 rounded-lg text-[10px] font-bold">₦2,000 BONUS</span>
              </div>
              <h4 className="text-lg font-bold mb-1">Unlock &quot;Active Earner&quot;</h4>
              <p className="text-blue-100 text-xs mb-4">
                {currentProgress >= milestoneGoal 
                  ? "Milestone reached! Bonus applied." 
                  : `Refer ${milestoneGoal - currentProgress} more businesses to reach this level.`}
              </p>
              <div className="h-2 w-full bg-blue-700 rounded-full overflow-hidden mb-2">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  className="h-full bg-white"
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-blue-100">
                <span>{currentProgress}/{milestoneGoal} Completed</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {displayStats.map((stat: any, idx: number) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow",
                stat.isManagerOnly && "opacity-60 grayscale-[0.5] cursor-not-allowed"
              )}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-0 mb-3 sm:mb-4">
                <div className={cn("p-2 sm:p-3 rounded-lg sm:rounded-xl", stat.bg)}>
                  <stat.icon className={cn("w-5 h-5 sm:w-6 sm:h-6", stat.color)} />
                </div>
                <div className={cn(
                  "flex items-center text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full",
                  stat.trendUp ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50"
                )}>
                  {stat.trendUp ? <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" /> : <ArrowDownRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />}
                  {stat.trend}
                </div>
              </div>
              <p className="text-[10px] sm:text-sm font-medium text-slate-500 mb-0.5 sm:mb-1">{stat.name}</p>
              <h3 className="text-lg sm:text-2xl font-black text-slate-900">{stat.value}</h3>
              {stat.isManagerOnly && <p className="text-[10px] font-bold text-blue-600 mt-2">Unlock Manager Status</p>}
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Earnings Chart */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-bold text-slate-900">Earnings Overview</h3>
                <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 12 months</option>
                </select>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      tickFormatter={(value) => `₦${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        borderRadius: '12px', 
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="earnings" 
                      stroke="#2563eb" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorEarnings)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Section F: Earnings Forecast */}
            <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12 transition-transform group-hover:scale-110">
                <LineChartIcon className="w-32 h-32 text-slate-900" />
              </div>
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Earnings Forecast</h3>
                  <p className="text-xs text-slate-500 mt-1">Projected income based on 12 active businesses</p>
                </div>
                <div className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100">
                  Estimated
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expected Next Month</p>
                      <h4 className="text-2xl font-black text-slate-900">₦28,400</h4>
                    </div>
                  </div>
                  <div className="p-4 bg-blue-600 rounded-2xl shadow-xl shadow-blue-100 text-white">
                    <p className="text-[10px] font-black opacity-80 uppercase tracking-widest mb-1">Potential Total (12 Months)</p>
                    <h4 className="text-2xl font-black">₦340,800</h4>
                    <p className="text-[10px] opacity-70 mt-2 font-medium italic">*Projected earnings if you reach Manager status</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-2">
                    <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Trophy className="w-3 h-3 text-blue-600" />
                      Manager Potential
                    </h5>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                      Reach targets <span className="text-blue-600 font-bold underline">within 90 days</span> to unlock these indirect earnings from your team.
                    </p>
                  </div>
                  <div className="space-y-3 px-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Network Size</span>
                      <span className="text-slate-900 font-bold">12 Affiliates</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Avg. Manager Share</span>
                      <span className="text-slate-900 font-bold">₦2,366</span>
                    </div>
                    <div className="h-[1px] bg-slate-200 my-1" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-900 font-black uppercase tracking-widest">Monthly Projection</span>
                      <span className="text-sm text-blue-600 font-black">₦28,400</span>
                    </div>
                  </div>
                  <Link href="/dashboard/network">
                    <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest h-10 shadow-lg shadow-blue-100">
                      Become a Manager
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Section G: Daily Action Panel */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Daily Action Panel</h3>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { title: 'Recruit Affiliates', desc: 'Find 5 new potential affiliates', icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { title: 'Follow up Businesses', desc: 'Check in on 3 pending deals', icon: Briefcase, color: 'text-orange-600', bg: 'bg-orange-50' },
                  { title: 'Activate Affiliates', desc: 'Nudge 2 inactive team members', icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors group cursor-pointer">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", item.bg)}>
                      <item.icon className={cn("w-5 h-5", item.color)} />
                    </div>
                    <p className="text-sm font-bold text-slate-900 mb-1">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Sections */}
          <div className="space-y-8">
            {/* Section C: Active Business Tracker */}
            <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm overflow-hidden relative">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900">Business Tracker</h3>
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <Briefcase className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
              
              <div className="space-y-5">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-blue-600 shadow-sm">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-600">Total Active</span>
                  </div>
                  <span className="text-lg font-black text-slate-900">42</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-3 h-3 text-emerald-600" />
                      <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">New</span>
                    </div>
                    <p className="text-xl font-black text-emerald-600">+8</p>
                    <p className="text-[10px] text-emerald-600/70 font-bold">This Week</p>
                  </div>
                  <div className="p-4 bg-red-50/50 rounded-2xl border border-red-100/50">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingDown className="w-3 h-3 text-red-600" />
                      <span className="text-[10px] font-black text-red-700 uppercase tracking-widest">Lost</span>
                    </div>
                    <p className="text-xl font-black text-red-600">3</p>
                    <p className="text-[10px] text-red-600/70 font-bold">Inactive</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section H: Alert System */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900">System Alerts</h3>
                <Bell className="w-5 h-5 text-slate-400" />
              </div>
              <div className="space-y-4">
                {[
                  { title: 'Milestone Alert', desc: 'You are 10 businesses away (90-day limit)', type: 'info', icon: Target, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { title: 'Inactivity Alert', desc: '15 businesses inactive this week', type: 'warning', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
                ].map((item, idx) => (
                  <div key={idx} className={cn("p-4 rounded-xl border flex gap-4 items-start", item.bg, item.type === 'info' ? 'border-blue-100' : 'border-orange-100')}>
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", item.bg)}>
                      <item.icon className={cn("w-4 h-4", item.color)} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Activity</h3>
              <div className="space-y-6">
                {recentActivity && recentActivity.length > 0 ? recentActivity.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      item.type === 'referral' ? "bg-blue-50" : 
                      item.type === 'commission' ? "bg-emerald-50" : "bg-purple-50"
                    )}>
                      {item.type === 'referral' ? <Users className="w-5 h-5 text-blue-600" /> : 
                       item.type === 'commission' ? <TrendingUp className="w-5 h-5 text-emerald-600" /> : 
                       <Wallet className="w-5 h-5 text-purple-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500 mb-1">{item.desc}</p>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{new Date(item.time).toLocaleDateString()}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-slate-400">No recent activity found.</p>
                )}
              </div>
            </div>

            {/* Leaderboard Preview */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900">Top Affiliates</h3>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">This Week</span>
              </div>
              <div className="space-y-4">
                {topAffiliates.length > 0 ? topAffiliates.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="relative">
                      <Image 
                        src={item.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${item.name}`} 
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover" 
                        alt={item.name} 
                        referrerPolicy="no-referrer"
                      />
                      <div className={cn(
                        "absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white",
                        idx === 0 ? "bg-yellow-500" : idx === 1 ? "bg-slate-400" : "bg-orange-500"
                      )}>
                        {item.rank}
                      </div>
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm font-bold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">₦{item.earnings?.toLocaleString()} earned</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-slate-400">No leaders yet.</p>
                )}
              </div>
              <Link href="/dashboard/leaderboard" className="block w-full">
                <Button variant="outline" className="w-full mt-6 border-slate-100 text-slate-600 text-xs font-bold">
                  View Full Leaderboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <AffiliateAgreementModal 
        isOpen={user !== null && !user.hasSignedAgreement} 
        onSign={handleSignAgreement} 
      />
      <WhatsAppGroupModal 
        isOpen={showWhatsAppModal} 
        onJoin={handleJoinWhatsApp} 
      />
      {user?.hasSignedAgreement && !showWhatsAppModal && <OnboardingModal />}
    </DashboardLayout>
  );
}

function Scissors({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-3M9.5 9l.5-1 1 1-1 1-.5-1z" /></svg>;
}
