'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, 
  Medal, 
  TrendingUp, 
  Users, 
  ArrowUpRight, 
  Star,
  Search,
  Filter,
  ChevronRight
} from 'lucide-react';
import Image from 'next/image';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { cn } from '@/lib/utils';

const leaderboardData = [
  { id: 1, name: 'Adekunle Chinedu', earnings: '₦450,000', referrals: 42, rank: 1, avatar: 'https://picsum.photos/seed/user1/100/100', trend: '+12%' },
  { id: 2, name: 'Blessing Okoro', earnings: '₦380,000', referrals: 35, rank: 2, avatar: 'https://picsum.photos/seed/user2/100/100', trend: '+8%' },
  { id: 3, name: 'Chidi Kalu', earnings: '₦320,000', rank: 3, referrals: 28, avatar: 'https://picsum.photos/seed/user3/100/100', trend: '+15%' },
  { id: 4, name: 'Sarah Williams', earnings: '₦280,000', rank: 4, referrals: 25, avatar: 'https://picsum.photos/seed/user4/100/100', trend: '+5%' },
  { id: 5, name: 'Emeka Obi', earnings: '₦250,000', rank: 5, referrals: 22, avatar: 'https://picsum.photos/seed/user5/100/100', trend: '+10%' },
  { id: 6, name: 'Fatima Yusuf', earnings: '₦210,000', rank: 6, referrals: 18, avatar: 'https://picsum.photos/seed/user6/100/100', trend: '+3%' },
  { id: 7, name: 'John Doe', earnings: '₦195,000', rank: 7, referrals: 15, avatar: 'https://picsum.photos/seed/user7/100/100', trend: '+7%' },
  { id: 8, name: 'Grace Amen', earnings: '₦180,000', rank: 8, referrals: 12, avatar: 'https://picsum.photos/seed/user8/100/100', trend: '+2%' },
];

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState('This Week');

  const tabs = ['This Week', 'This Month', 'All Time'];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Affiliate Leaderboard</h2>
            <p className="text-slate-500">See how you rank against the top earners in the network.</p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-2xl w-full md:w-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-grow md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                  activeTab === tab 
                    ? "bg-white text-blue-600 shadow-sm" 
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {tab}
              </button>
            ))}
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
                  src={leaderboardData[1].avatar} 
                  width={80} 
                  height={80} 
                  className="w-20 h-20 rounded-full border-4 border-slate-100 object-cover" 
                  alt="" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-400 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 border-white">
                  2
                </div>
              </div>
            </div>
            <div className="mt-10">
              <h3 className="text-lg font-bold text-slate-900">{leaderboardData[1].name}</h3>
              <p className="text-2xl font-black text-blue-600 mt-2">{leaderboardData[1].earnings}</p>
              <div className="flex items-center justify-center gap-2 mt-4 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full w-fit mx-auto">
                <TrendingUp className="w-3 h-3" />
                {leaderboardData[1].trend}
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
                  src={leaderboardData[0].avatar} 
                  width={100} 
                  height={100} 
                  className="w-24 h-24 rounded-full border-4 border-blue-400 object-cover" 
                  alt="" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 border-blue-600">
                  <Trophy className="w-5 h-5" />
                </div>
              </div>
            </div>
            <div className="mt-12 text-white">
              <h3 className="text-xl font-bold">{leaderboardData[0].name}</h3>
              <p className="text-3xl font-black mt-2">{leaderboardData[0].earnings}</p>
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
                  src={leaderboardData[2].avatar} 
                  width={80} 
                  height={80} 
                  className="w-20 h-20 rounded-full border-4 border-orange-100 object-cover" 
                  alt="" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 border-white">
                  3
                </div>
              </div>
            </div>
            <div className="mt-10">
              <h3 className="text-lg font-bold text-slate-900">{leaderboardData[2].name}</h3>
              <p className="text-2xl font-black text-blue-600 mt-2">{leaderboardData[2].earnings}</p>
              <div className="flex items-center justify-center gap-2 mt-4 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full w-fit mx-auto">
                <TrendingUp className="w-3 h-3" />
                {leaderboardData[2].trend}
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
                {leaderboardData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
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
                          src={item.avatar} 
                          width={40} 
                          height={40} 
                          className="w-10 h-10 rounded-full object-cover" 
                          alt="" 
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="text-sm font-bold text-slate-900">{item.name}</p>
                          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Level {item.rank < 5 ? '2' : '1'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-bold text-slate-700">{item.referrals}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className="text-sm font-black text-slate-900">{item.earnings}</span>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                        <ArrowUpRight className="w-3 h-3" />
                        {item.trend}
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <button className="p-2 rounded-lg hover:bg-white hover:shadow-sm text-slate-400 hover:text-blue-600 transition-all">
                        <ChevronRight className="w-5 h-5" />
                      </button>
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
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-20 h-20 rounded-full border-4 border-white/10 flex items-center justify-center text-3xl font-black bg-white/5">
              12
            </div>
            <div>
              <h3 className="text-xl font-bold">Your Current Rank</h3>
              <p className="text-slate-400">You are in the top 15% of affiliates this week!</p>
            </div>
          </div>
          <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
            <div className="flex-grow md:flex-none bg-white/10 px-6 py-4 rounded-2xl text-center">
              <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-1">Earnings</p>
              <p className="text-xl font-black">₦124,500</p>
            </div>
            <div className="flex-grow md:flex-none bg-blue-600 px-6 py-4 rounded-2xl text-center shadow-xl shadow-blue-500/20">
              <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest mb-1">Next Rank</p>
              <p className="text-xl font-black">₦150,000</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
