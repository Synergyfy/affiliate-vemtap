'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { motion } from 'motion/react';
import { 
  Lock, 
  Users, 
  TrendingUp, 
  ChevronRight, 
  ShieldCheck,
  CheckCircle2,
  Info
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function NetworkPage() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const router = useRouter();
  
  const [stats, setStats] = useState<any>(null);
  const [subAffiliates, setSubAffiliates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dynamic counting
  const requiredCount = 5;
  const payingBusinessesCount = stats?.activeReferrals || 0;
  const progress = Math.min((payingBusinessesCount / requiredCount) * 100, 100);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [referralsData, statsData] = await Promise.all([
          api.get('/affiliates/referrals'),
          api.get('/affiliates/stats')
        ]);
        
        setStats(statsData);
        // Determine unlock status dynamically:
        if (statsData?.activeReferrals >= requiredCount) {
          setIsUnlocked(true);
        }
        
        // Network items if supported 
        setSubAffiliates(Array.isArray(referralsData) ? referralsData.filter(r => r.referredUser) : []);
      } catch (error) {
        console.error('Failed to fetch network data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [requiredCount]);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {!isUnlocked ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 md:p-16 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-slate-100">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-blue-600 transition-all duration-1000"
              />
            </div>
            
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-50 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8">
              <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Unlock Your Affiliate Network</h2>
            <p className="text-sm sm:text-base text-slate-500 max-w-lg mx-auto mb-8 sm:mb-12">
              Refer <span className="font-bold text-slate-900">5 paying businesses</span> to unlock your sub-affiliate network and earn an additional <span className="font-bold text-blue-600">5% indirect commission</span>.
            </p>

            <div className="max-w-md mx-auto space-y-6">
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs sm:text-sm font-bold text-slate-900">{payingBusinessesCount} / {requiredCount} Businesses</span>
                <span className="text-xs sm:text-sm font-bold text-blue-600">{Math.round(progress)}% Complete</span>
              </div>
              <div className="h-3 sm:h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5 sm:p-1">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-blue-600 rounded-full shadow-sm"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 sm:pt-8">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
                  <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 mb-2" />
                  <h4 className="text-sm sm:text-base font-bold text-slate-900">Verified Referrals</h4>
                  <p className="text-[10px] sm:text-xs text-slate-500">Only successful subscription payments count towards unlocking.</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mb-2" />
                  <h4 className="text-sm sm:text-base font-bold text-slate-900">Passive Income</h4>
                  <p className="text-[10px] sm:text-xs text-slate-500">Earn from every sale made by affiliates you bring into the network.</p>
                </div>
              </div>
              
              <Button className="w-full mt-6 sm:mt-8 text-sm sm:text-base" onClick={() => router.push('/dashboard/tools')}>
                Refer More Businesses
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Affiliate Network</h2>
                <p className="text-sm sm:text-base text-slate-500">You are earning 5% from these sub-affiliates.</p>
              </div>
              <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full text-xs sm:text-sm font-bold flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Network Unlocked
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs sm:text-sm font-medium text-slate-500 mb-1">Network Size</p>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{subAffiliates.length} Affiliates</h3>
              </div>
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs sm:text-sm font-medium text-slate-500 mb-1">Total Earnings</p>
                <h3 className="text-xl sm:text-2xl font-bold text-emerald-600">₦{Number(stats?.totalEarnings || 0).toLocaleString()}</h3>
              </div>
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs sm:text-sm font-medium text-slate-500 mb-1">Total Referrals</p>
                <h3 className="text-xl sm:text-2xl font-bold text-blue-600">{stats?.totalReferrals || 0} Businesses</h3>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Your Sub-Affiliates</h3>
                <Button variant="outline" size="sm" className="text-xs sm:text-sm">View All</Button>
              </div>
              <div className="divide-y divide-slate-100">
                {subAffiliates.map((affiliate) => (
                  <div key={affiliate.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm sm:text-base uppercase">
                        {(affiliate.referredUser?.firstName || 'A').charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900">
                          {affiliate.referredUser?.firstName} {affiliate.referredUser?.lastName}
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-500">Sub-affiliate</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm sm:text-base font-bold text-emerald-600">Active</p>
                      <p className="text-[10px] sm:text-xs text-slate-400">Your 5% share</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 sm:p-6 flex gap-3 sm:gap-4">
          <Info className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
          <div className="text-xs sm:text-sm text-blue-800">
            <p className="font-bold mb-1">How it works:</p>
            <p>Once you unlock the network, anyone who signs up using your referral link becomes your sub-affiliate. You earn a 5% commission on all their successful referrals for the first 3 months.</p>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
