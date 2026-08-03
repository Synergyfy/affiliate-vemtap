'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
  Target,
  Link as LinkIcon,
  Briefcase,
  Wallet,
  Users,
  BookOpen,
  Trophy,
  TrendingUp,
  ArrowRight,
  MessageCircle,
  CheckSquare,
  BarChart3,
  FileText,
  Calculator,
  HelpCircle,
  Download
} from 'lucide-react';
import DashboardLayout, { useDashboard } from '@/components/dashboard/DashboardLayout';
import AgentTargetTracker from '@/components/dashboard/AgentTargetTracker';
import { useAuth } from '@/hooks/use-auth';
import { useAffiliateStats } from '@/services/useDashboardHooks';
import { usePwaInstall } from '@/components/PwaInstallPrompt';
import { useState, useEffect } from 'react';

const gridItems = [
  { name: 'Market Mapping', icon: Target, color: 'from-blue-500 to-blue-700', href: '/dashboard/market-mapping' },
  { name: 'Pipeline', icon: BarChart3, color: 'from-indigo-500 to-purple-600', href: '/dashboard/market-mapping/pipeline' },
  { name: 'My Reports', icon: FileText, color: 'from-blue-500 to-cyan-500', href: '/dashboard/market-mapping/insights/reports' },
  { name: 'Earnings Calculator', icon: Calculator, color: 'from-emerald-400 to-green-600', href: '/dashboard/earnings-calculator' },
  { name: 'Referral Tools', icon: LinkIcon, color: 'from-emerald-400 to-teal-500', href: '/dashboard/tools' },
  { name: 'My Businesses', icon: Briefcase, color: 'from-orange-400 to-amber-500', href: '/dashboard/businesses' },
  { name: 'Wallet & Earnings', icon: Wallet, color: 'from-purple-500 to-indigo-600', href: '/dashboard/wallet' },
  { name: 'Line Manager', icon: Users, color: 'from-sky-400 to-blue-500', href: '/dashboard/network' },
  { name: 'Sales Academy', icon: BookOpen, color: 'from-indigo-400 to-purple-500', href: '/dashboard/training' },
  { name: 'Leaderboard', icon: Trophy, color: 'from-yellow-400 to-orange-500', href: '/dashboard/leaderboard' },
  { name: 'FAQ', icon: HelpCircle, color: 'from-teal-400 to-cyan-500', href: '/dashboard/faq' },
];

export default function MobileFirstDashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useAffiliateStats();
  const { openPrompt } = usePwaInstall();
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
  }, []);

  return (
    <DashboardLayout>
      <HomeContent user={user} stats={stats} isLoading={isLoading} openPrompt={openPrompt} isStandalone={isStandalone} />
    </DashboardLayout>
  );
}

function HomeContent({ user, stats, isLoading, openPrompt, isStandalone }: any) {
  const { startTour } = useDashboard();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Banner Section */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-900 to-blue-900 p-8 text-white shadow-2xl shadow-blue-200">
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            {isLoading ? (
              <div className="w-20 h-3 bg-white/20 animate-pulse rounded" />
            ) : (
              user?.isManagerMode ? 'Line Manager' : stats?.currentLevel || 'Novice Affiliate'
            )}
          </div>
          <h1 className="text-3xl font-black leading-tight">Welcome,<br />{user?.firstName || user?.fullName?.split(' ')[0] || 'Affiliate'}!</h1>
          <p className="text-sm text-blue-100/80 font-medium max-w-[240px]">Plan your mission, execute visits, and grow your business network.</p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/dashboard/market-mapping" className="bg-white text-slate-900 px-6 py-3 rounded-2xl text-xs font-black shadow-lg shadow-white/10 active:scale-95 transition-transform">
              Market Mapping
            </Link>
            <Link href="/dashboard/wallet" className="bg-blue-600/50 backdrop-blur-md text-white border border-white/20 px-6 py-3 rounded-2xl text-xs font-black active:scale-95 transition-transform">
              Withdraw
            </Link>
            <button
              onClick={startTour}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-4 py-3 rounded-2xl text-xs font-black active:scale-95 transition-transform"
            >
              Take a Tour
            </button>
          </div>
        </div>

        <div className="absolute -right-12 -top-12 w-48 h-48 bg-blue-500/20 blur-[80px] rounded-full" />
        <div className="absolute right-8 bottom-8 opacity-20 rotate-12">
          <Target className="w-32 h-32" />
        </div>
      </div>

      {/* Action Grid */}
      <div className="grid grid-cols-4 gap-y-10 gap-x-4 px-2">
        {gridItems
          .filter((item) => {
            if (item.name === 'Line Manager') {
              return user?.role === 'SUPERVISOR' || user?.role === 'MANAGER' || user?.isManagerMode;
            }
            if (item.name === 'Referral Tools') {
              return user?.role !== 'AGENT';
            }
            return true;
          })
          .map((item, idx) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="flex flex-col items-center gap-3 group"
          >
            <Link href={item.href} className="flex flex-col items-center">
              <div className={cn(
                "w-16 h-16 rounded-3xl bg-gradient-to-br flex items-center justify-center shadow-lg group-active:scale-90 transition-all relative overflow-hidden",
                item.color
              )}>
                <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 -skew-y-12 translate-y-[-50%]" />
                <item.icon className="w-8 h-8 text-white relative z-10" />
              </div>
              <span className="text-[10px] font-black text-slate-700 text-center leading-tight mt-3 break-words max-w-[70px]">
                {item.name}
              </span>
            </Link>
          </motion.div>
        ))}

        {!isStandalone && (
          <motion.div
            key="install-app"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: gridItems.length * 0.05 }}
            className="flex flex-col items-center gap-3 group"
          >
            <button onClick={openPrompt} className="flex flex-col items-center">
              <div className={cn(
                "w-16 h-16 rounded-3xl bg-gradient-to-br flex items-center justify-center shadow-lg group-active:scale-90 transition-all relative overflow-hidden",
                "from-blue-600 to-indigo-700"
              )}>
                <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 -skew-y-12 translate-y-[-50%]" />
                <Download className="w-8 h-8 text-white relative z-10" />
              </div>
              <span className="text-[10px] font-black text-slate-700 text-center leading-tight mt-3 break-words max-w-[70px]">
                Install App
              </span>
            </button>
          </motion.div>
        )}
      </div>

      {/* Agent Target Tracker */}
      {user?.role === 'AGENT' && stats && (
        <AgentTargetTracker stats={stats} />
      )}

      {/* Quick Stats */}
      <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Today&apos;s Profit</p>
            {isLoading ? (
              <div className="w-24 h-6 bg-slate-100 animate-pulse rounded-lg mt-1" />
            ) : (
              <h4 className="text-xl font-black text-slate-900">
                ₦{Number(stats?.todayEarnings || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h4>
            )}
          </div>
        </div>
        <Link href="/dashboard/wallet" className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-blue-600 transition-all">
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      {/* Contact Support Banner */}
      <Link href="/support" className="block bg-blue-50 border border-blue-100 rounded-[32px] p-6 flex items-center gap-4 active:scale-[0.98] transition-transform">
        <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-blue-600 shrink-0">
          <MessageCircle className="w-7 h-7" />
        </div>
        <div className="flex-grow min-w-0">
          <h5 className="text-sm font-black text-slate-900 leading-none mb-1">Direct Assistance</h5>
          <p className="text-xs text-slate-500 font-medium">Need help with a lead? <span className="text-blue-600 font-bold">Contact Support</span></p>
        </div>
        <ArrowRight className="w-5 h-5 text-blue-400 shrink-0" />
      </Link>
    </div>
  );
}
