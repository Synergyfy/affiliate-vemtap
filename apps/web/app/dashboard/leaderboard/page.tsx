'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Medal, 
  TrendingUp, 
  Users, 
  ArrowUpRight, 
  Star,
  Search,
  Filter,
  ChevronRight,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import Image from 'next/image';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useLeaderboard } from '@/services/useDashboardHooks';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'week' | 'month' | 'all'>('week');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: leaderboardData, isLoading } = useLeaderboard({ 
    limit: 50, 
    timeframe: activeTab 
  });

  const tabs: { label: string; value: 'week' | 'month' | 'all' }[] = [
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'All Time', value: 'all' },
  ];

  const displayData = (Array.isArray(leaderboardData) ? leaderboardData : []).filter(item => 
    item.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const topThree = displayData.slice(0, 3);
  
  const podium = [
    topThree[0] ? { ...topThree[0], displayEarnings: `₦${Number(topThree[0].totalEarnings).toLocaleString()}` } : null,
    topThree[1] ? { ...topThree[1], displayEarnings: `₦${Number(topThree[1].totalEarnings).toLocaleString()}` } : null,
    topThree[2] ? { ...topThree[2], displayEarnings: `₦${Number(topThree[2].totalEarnings).toLocaleString()}` } : null,
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-pulse text-slate-300" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Affiliate Leaderboard</h2>
              <p className="text-slate-500">See how you rank against the top earners in the network.</p>
            </div>
          <div className="flex bg-slate-100 p-1 rounded-2xl w-full md:w-auto">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "flex-grow md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                  activeTab === tab.value 
                    ? "bg-white text-blue-600 shadow-sm" 
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        </div>

        {/* Podium Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-10">
          {/* Rank 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="order-2 md:order-1 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm text-center relative"
          >
            <div className="absolute -top-10 left-1/2 -translate-x-1/2">
              <div className="relative">
                <Image 
                  src={podium[1]?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${podium[1]?.fullName || '2'}`} 
                  width={80} 
                  height={80} 
                  className="w-20 h-20 rounded-full border-4 border-slate-100 object-cover" 
                  alt="" 
                  referrerPolicy="no-referrer"
                  unoptimized
                />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-400 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 border-white">
                  2
                </div>
              </div>
            </div>
            <div className="mt-10">
              <h3 className="text-lg font-bold text-slate-900">{podium[1]?.fullName || '---'}</h3>
              <p className="text-2xl font-black text-blue-600 mt-2">{podium[1]?.displayEarnings || '₦0'}</p>
              <div className="flex items-center justify-center gap-2 mt-4 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full w-fit mx-auto">
                <TrendingUp className="w-3 h-3" />
                {podium[1]?.trend || 'stable'}
              </div>
            </div>
          </motion.div>

          {/* Rank 1 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="order-1 md:order-2 bg-blue-600 p-10 rounded-[40px] shadow-2xl shadow-blue-200 text-center relative md:scale-110 z-10"
          >
            <div className="absolute -top-12 left-1/2 -translate-x-1/2">
              <div className="relative">
                <Image 
                  src={podium[0]?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${podium[0]?.fullName || '1'}`} 
                  width={100} 
                  height={100} 
                  className="w-24 h-24 rounded-full border-4 border-blue-400 object-cover" 
                  alt="" 
                  referrerPolicy="no-referrer"
                  unoptimized
                />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 border-blue-600">
                  <Trophy className="w-5 h-5" />
                </div>
              </div>
            </div>
            <div className="mt-12 text-white">
              <h3 className="text-xl font-bold">{podium[0]?.fullName || '---'}</h3>
              <p className="text-3xl font-black mt-2">{podium[0]?.displayEarnings || '₦0'}</p>
              <div className="flex items-center justify-center gap-2 mt-4 text-xs font-bold text-blue-100 bg-white/10 px-3 py-1 rounded-full w-fit mx-auto">
                <Star className="w-3 h-3 fill-current" />
                Top Performer
              </div>
            </div>
          </motion.div>

          {/* Rank 3 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="order-3 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm text-center relative"
          >
            <div className="absolute -top-10 left-1/2 -translate-x-1/2">
              <div className="relative">
                <Image 
                  src={podium[2]?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${podium[2]?.fullName || '3'}`} 
                  width={80} 
                  height={80} 
                  className="w-20 h-20 rounded-full border-4 border-orange-100 object-cover" 
                  alt="" 
                  referrerPolicy="no-referrer"
                  unoptimized
                />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 border-white">
                  3
                </div>
              </div>
            </div>
            <div className="mt-10">
              <h3 className="text-lg font-bold text-slate-900">{podium[2]?.fullName || '---'}</h3>
              <p className="text-2xl font-black text-blue-600 mt-2">{podium[2]?.displayEarnings || '₦0'}</p>
              <div className="flex items-center justify-center gap-2 mt-4 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full w-fit mx-auto">
                <TrendingUp className="w-3 h-3" />
                {podium[2]?.trend || 'stable'}
              </div>
            </div>
          </motion.div>
        </div>

        {/* List Section */}
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-bold text-slate-900">Rankings</h3>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search affiliate..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Affiliate</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Referrals</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Earnings</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Trend</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayData.map((item) => (
                  <tr key={item.fullName} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-6">
                      <span className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
                        item.rank === 1 ? "bg-yellow-100 text-yellow-700" :
                        item.rank === 2 ? "bg-slate-100 text-slate-700" :
                        item.rank === 3 ? "bg-orange-100 text-orange-700" :
                        "text-slate-400"
                      )}>
                        #{item.rank}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                        <Image 
                          src={item.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${item.fullName}`} 
                          width={40} 
                          height={40} 
                          className="w-10 h-10 rounded-full object-cover" 
                          alt="" 
                          referrerPolicy="no-referrer"
                          unoptimized
                        />
                        <div>
                          <p className="text-sm font-bold text-slate-900">{item.fullName}</p>
                          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                            {item.rank <= 3 ? 'Top Performer' : item.rank <= 10 ? 'Senior Affiliate' : 'Affiliate'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-bold text-slate-700">{item.referralCount || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className="text-sm font-black text-slate-900">₦{Number(item.totalEarnings || 0).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase">
                        {item.trend || 'stable'}
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <Link href="/dashboard/tools" className="p-2 inline-block rounded-lg hover:bg-white hover:shadow-sm text-slate-400 hover:text-blue-600 transition-all">
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Your Rank Card */}
        <div className="bg-slate-900 rounded-[32px] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20 -mr-32 -mt-32" />
          <div className="flex items-center gap-6 relative z-10 text-center md:text-left flex-col md:flex-row">
            <div className="w-20 h-20 rounded-full border-4 border-white/10 flex items-center justify-center text-3xl font-black bg-white/5">
              {(Array.isArray(leaderboardData) ? leaderboardData : []).findIndex(item => item.fullName === user?.fullName) + 1 || '--'}
            </div>
            <div>
              <h3 className="text-xl font-bold">Your Current Rank</h3>
              <p className="text-slate-400">
                {(Array.isArray(leaderboardData) ? leaderboardData : []).findIndex(item => item.fullName === user?.fullName) !== -1 
                  ? "You are doing great! Keep it up." 
                  : "Start referring more businesses to climb the board!"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
            <div className="flex-grow md:flex-none bg-white/10 px-6 py-4 rounded-2xl text-center">
              <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-1">Total Earnings</p>
              <p className="text-xl font-black">₦{Number(user?.totalEarnings || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
