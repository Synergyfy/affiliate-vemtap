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
  Zap
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

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
  { name: 'Total Earnings', value: '₦124,500', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+12.5%', trendUp: true },
  { name: 'Available Balance', value: '₦45,200', icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'Ready', trendUp: true },
  { name: 'Businesses Referred', value: '12', icon: Briefcase, color: 'text-orange-600', bg: 'bg-orange-50', trend: '+2 this month', trendUp: true },
  { name: 'Active Subscriptions', value: '8', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50', trend: '75% retention', trendUp: true },
];

export default function DashboardOverview() {
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      showToast('New referral: Tech Solutions Ltd just signed up!', 'success');
    }, 3000);
    return () => clearTimeout(timer);
  }, [showToast]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome & Milestone Section */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold text-slate-900">Welcome back, {user?.fullName?.split(' ')[0] || 'John'}!</h2>
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
              <p className="text-blue-100 text-xs mb-4">Refer 3 more businesses to reach this level.</p>
              <div className="h-2 w-full bg-blue-700 rounded-full overflow-hidden mb-2">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '40%' }}
                  className="h-full bg-white"
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-blue-100">
                <span>2/5 Completed</span>
                <span>40%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
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
                  <AreaChart data={data}>
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

            {/* Smart Targeting Suggestions */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Target className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Nearby Business Ideas</h3>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { title: 'Local Shops', desc: 'Walk into 5 nearby shops today', icon: MapPin, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { title: 'Salons', desc: 'Visit 3 salons or barbershops', icon: Scissors, color: 'text-purple-600', bg: 'bg-purple-50' },
                  { title: 'POS Centers', desc: 'Talk to 2 POS operators', icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
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
            {/* Recent Activity */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Activity</h3>
              <div className="space-y-6">
                {[
                  { title: 'New Referral', desc: 'Tech Solutions Ltd signed up', time: '2 hours ago', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { title: 'Commission Earned', desc: '₦10,000 from Global Corp', time: '5 hours ago', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { title: 'Withdrawal Paid', desc: '₦25,000 to your bank', time: 'Yesterday', icon: Wallet, color: 'text-purple-600', bg: 'bg-purple-50' },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", item.bg)}>
                      <item.icon className={cn("w-5 h-5", item.color)} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500 mb-1">{item.desc}</p>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Leaderboard Preview */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900">Top Affiliates</h3>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">This Week</span>
              </div>
              <div className="space-y-4">
                {[
                  { name: 'Adekunle C.', earnings: '₦450,000', rank: 1, avatar: 'https://picsum.photos/seed/user1/100/100' },
                  { name: 'Blessing O.', earnings: '₦380,000', rank: 2, avatar: 'https://picsum.photos/seed/user2/100/100' },
                  { name: 'Chidi K.', earnings: '₦320,000', rank: 3, avatar: 'https://picsum.photos/seed/user3/100/100' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="relative">
                      <Image 
                        src={item.avatar} 
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
                      <p className="text-xs text-slate-500">{item.earnings} earned</p>
                    </div>
                  </div>
                ))}
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
    </DashboardLayout>
  );
}

function Scissors({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-3M9.5 9l.5-1 1 1-1 1-.5-1z" /></svg>;
}
