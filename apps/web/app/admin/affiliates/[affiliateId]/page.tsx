'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/components/admin/AdminLayout';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, User, Mail, Phone, Calendar, Briefcase, Wallet,
  Users, UserPlus, Activity, MapPin, History, ChevronRight,
  TrendingUp, Target, CheckCircle2, Clock, Building2, Edit3,
  Loader2, Eye, Star, AlertCircle, ArrowUp, ArrowDown,
  BarChart3, LineChart, PieChart, Download
} from 'lucide-react';
import type { User as UserType } from '@/types/api';

type Tab = 'overview' | 'daily' | 'weekly' | 'monthly' | 'locations' | 'history' | 'team';

interface DailyReport {
  date: string;
  leadsCollected: number;
  conversions: number;
  businessesVisited: number;
  meetingsScheduled: number;
  completionRate: number;
}

interface WeeklyReport {
  week: string;
  startDate: string;
  endDate: string;
  totalLeads: number;
  totalConversions: number;
  totalVisits: number;
  avgCompletionRate: number;
  topBusiness: string;
}

interface MonthlyReport {
  month: string;
  year: number;
  totalLeads: number;
  totalConversions: number;
  conversionRate: number;
  totalBusinesses: number;
  totalEarnings: number;
  avgDailyLeads: number;
  performanceScore: number;
}

const mockDailyReports: Record<string, DailyReport[]> = {
  'aff-1': [
    { date: '2026-07-28', leadsCollected: 5, conversions: 2, businessesVisited: 8, meetingsScheduled: 3, completionRate: 85 },
    { date: '2026-07-27', leadsCollected: 3, conversions: 1, businessesVisited: 6, meetingsScheduled: 2, completionRate: 72 },
    { date: '2026-07-26', leadsCollected: 7, conversions: 3, businessesVisited: 10, meetingsScheduled: 4, completionRate: 90 },
    { date: '2026-07-25', leadsCollected: 4, conversions: 0, businessesVisited: 5, meetingsScheduled: 1, completionRate: 60 },
    { date: '2026-07-24', leadsCollected: 6, conversions: 2, businessesVisited: 9, meetingsScheduled: 3, completionRate: 78 },
    { date: '2026-07-23', leadsCollected: 8, conversions: 4, businessesVisited: 12, meetingsScheduled: 5, completionRate: 95 },
    { date: '2026-07-22', leadsCollected: 2, conversions: 1, businessesVisited: 4, meetingsScheduled: 1, completionRate: 55 },
  ],
  'aff-2': [
    { date: '2026-07-28', leadsCollected: 4, conversions: 1, businessesVisited: 7, meetingsScheduled: 2, completionRate: 80 },
    { date: '2026-07-27', leadsCollected: 6, conversions: 2, businessesVisited: 9, meetingsScheduled: 4, completionRate: 88 },
    { date: '2026-07-26', leadsCollected: 3, conversions: 0, businessesVisited: 5, meetingsScheduled: 1, completionRate: 65 },
  ],
};

const mockWeeklyReports: Record<string, WeeklyReport[]> = {
  'aff-1': [
    { week: 'Week 4', startDate: '2026-07-22', endDate: '2026-07-28', totalLeads: 35, totalConversions: 13, totalVisits: 54, avgCompletionRate: 76, topBusiness: 'Royal Gardens Supermarket' },
    { week: 'Week 3', startDate: '2026-07-15', endDate: '2026-07-21', totalLeads: 28, totalConversions: 10, totalVisits: 45, avgCompletionRate: 71, topBusiness: 'Banex Electronics Hub' },
    { week: 'Week 2', startDate: '2026-07-08', endDate: '2026-07-14', totalLeads: 32, totalConversions: 12, totalVisits: 48, avgCompletionRate: 74, topBusiness: 'Freshmart Groceries' },
    { week: 'Week 1', startDate: '2026-07-01', endDate: '2026-07-07', totalLeads: 22, totalConversions: 8, totalVisits: 38, avgCompletionRate: 68, topBusiness: 'Garki Auto Parts' },
  ],
  'aff-2': [
    { week: 'Week 4', startDate: '2026-07-22', endDate: '2026-07-28', totalLeads: 30, totalConversions: 10, totalVisits: 48, avgCompletionRate: 78, topBusiness: 'Wuse Fashion House' },
    { week: 'Week 3', startDate: '2026-07-15', endDate: '2026-07-21', totalLeads: 25, totalConversions: 9, totalVisits: 40, avgCompletionRate: 72, topBusiness: 'Mega Pharmacy Wuse' },
  ],
};

const mockMonthlyReports: Record<string, MonthlyReport[]> = {
  'aff-1': [
    { month: 'July', year: 2026, totalLeads: 117, totalConversions: 43, conversionRate: 36.8, totalBusinesses: 25, totalEarnings: 425000, avgDailyLeads: 5.6, performanceScore: 88 },
    { month: 'June', year: 2026, totalLeads: 98, totalConversions: 35, conversionRate: 35.7, totalBusinesses: 20, totalEarnings: 350000, avgDailyLeads: 4.9, performanceScore: 82 },
    { month: 'May', year: 2026, totalLeads: 85, totalConversions: 28, conversionRate: 32.9, totalBusinesses: 18, totalEarnings: 280000, avgDailyLeads: 4.3, performanceScore: 75 },
  ],
  'aff-2': [
    { month: 'July', year: 2026, totalLeads: 105, totalConversions: 38, conversionRate: 36.2, totalBusinesses: 22, totalEarnings: 380000, avgDailyLeads: 5.0, performanceScore: 84 },
  ],
};

const affiliateLocations: Record<string, { id: string; name: string; area: string; city: string; businesses: number; lastActive: string }[]> = {
  'aff-1': [
    { id: 'banex', name: 'Banex Plaza', area: 'Wuse', city: 'Abuja', businesses: 12, lastActive: '2026-07-28' },
    { id: 'garki-mkt', name: 'Garki Model Market', area: 'Garki', city: 'Abuja', businesses: 5, lastActive: '2026-07-25' },
  ],
  'aff-2': [
    { id: 'banex', name: 'Banex Plaza', area: 'Wuse', city: 'Abuja', businesses: 8, lastActive: '2026-07-28' },
    { id: 'wuse-mkt', name: 'Wuse Main Market', area: 'Wuse', city: 'Abuja', businesses: 6, lastActive: '2026-07-27' },
  ],
  'aff-3': [
    { id: 'banex', name: 'Banex Plaza', area: 'Wuse', city: 'Abuja', businesses: 4, lastActive: '2026-07-24' },
  ],
  'aff-4': [
    { id: 'wuse-mkt', name: 'Wuse Main Market', area: 'Wuse', city: 'Abuja', businesses: 7, lastActive: '2026-07-26' },
  ],
};

const mockHistory: Record<string, { id: string; businessName: string; type: 'created' | 'updated'; timestamp: string; details: string; locationName: string }[]> = {
  'aff-1': [
    { id: 'h-1', businessName: 'Royal Gardens Supermarket', type: 'created', timestamp: '2026-07-28 09:15 AM', details: 'Added new business with contacts and photos', locationName: 'Banex Plaza' },
    { id: 'h-2', businessName: 'Banex Electronics Hub', type: 'updated', timestamp: '2026-07-27 02:30 PM', details: 'Updated pipeline status from Prospect to Negotiation', locationName: 'Banex Plaza' },
    { id: 'h-3', businessName: 'Freshmart Groceries', type: 'created', timestamp: '2026-07-25 11:00 AM', details: 'Completed business profile with owner details', locationName: 'Banex Plaza' },
    { id: 'h-4', businessName: 'Garki Auto Parts', type: 'created', timestamp: '2026-07-19 09:30 AM', details: 'Registered auto parts dealer in Garki market', locationName: 'Garki Model Market' },
    { id: 'h-5', businessName: 'Garki Pharmacy', type: 'created', timestamp: '2026-07-16 10:15 AM', details: 'Registered pharmacy with license documents', locationName: 'Garki Model Market' },
  ],
  'aff-2': [
    { id: 'h-13', businessName: 'Wuse Fashion House', type: 'created', timestamp: '2026-07-27 10:00 AM', details: 'Filed new fashion boutique with inventory details', locationName: 'Wuse Main Market' },
    { id: 'h-14', businessName: 'Mega Pharmacy Wuse', type: 'updated', timestamp: '2026-07-26 03:20 PM', details: 'Updated contact number and added business hours', locationName: 'Wuse Main Market' },
    { id: 'h-15', businessName: 'Grand Mega Supermarket', type: 'created', timestamp: '2026-07-24 11:00 AM', details: 'Added anchor supermarket to Banex cluster', locationName: 'Banex Plaza' },
  ],
};

const affiliatesData: Record<string, { name: string; email: string }> = {
  'aff-1': { name: 'Emmanuel Nnamdi', email: 'emmanuel@example.com' },
  'aff-2': { name: 'Sarah Okafor', email: 'sarah@example.com' },
  'aff-3': { name: 'Chidi Bello', email: 'chidi@example.com' },
  'aff-4': { name: 'Fatima Usman', email: 'fatima@example.com' },
  'aff-5': { name: 'John Okafor', email: 'john@example.com' },
};

const tabIcons: Record<Tab, React.ReactNode> = {
  overview: <Eye className="w-4 h-4" />,
  daily: <BarChart3 className="w-4 h-4" />,
  weekly: <LineChart className="w-4 h-4" />,
  monthly: <PieChart className="w-4 h-4" />,
  locations: <MapPin className="w-4 h-4" />,
  history: <History className="w-4 h-4" />,
  team: <Users className="w-4 h-4" />,
};

const tabLabels: Record<Tab, string> = {
  overview: 'Overview',
  daily: 'Daily Reports',
  weekly: 'Weekly Reports',
  monthly: 'Monthly Reports',
  locations: 'Locations',
  history: 'History',
  team: 'Team',
};

interface TeamMemberEntry {
  id: string;
  name: string;
  role: 'AGENT' | 'AFFILIATE';
  email: string;
  status: string;
  dailyLeads: number;
  weeklyLeads: number;
  monthlyConversions: number;
  completionRate: number;
  earnings: number;
  lastActive: string;
}

const mockTeamMembers: Record<string, TeamMemberEntry[]> = {
  'supervisor-1': [
    { id: 'agt-1', name: 'Chioma Okafor', role: 'AGENT', email: 'chioma.o@example.com', status: 'ACTIVE', dailyLeads: 5, weeklyLeads: 28, monthlyConversions: 12, completionRate: 85, earnings: 125000, lastActive: '2026-07-28' },
    { id: 'agt-2', name: 'Emeka Nwosu', role: 'AGENT', email: 'emeka.n@example.com', status: 'ACTIVE', dailyLeads: 3, weeklyLeads: 18, monthlyConversions: 8, completionRate: 72, earnings: 85000, lastActive: '2026-07-27' },
    { id: 'aff-3', name: 'Bisi Adeyemi', role: 'AFFILIATE', email: 'bisi.a@example.com', status: 'ACTIVE', dailyLeads: 7, weeklyLeads: 35, monthlyConversions: 15, completionRate: 90, earnings: 210000, lastActive: '2026-07-28' },
    { id: 'agt-4', name: 'David Mark', role: 'AGENT', email: 'david.m@example.com', status: 'ACTIVE', dailyLeads: 4, weeklyLeads: 22, monthlyConversions: 10, completionRate: 78, earnings: 98000, lastActive: '2026-07-26' },
    { id: 'aff-5', name: 'Fatima Usman', role: 'AFFILIATE', email: 'fatima.u@example.com', status: 'ACTIVE', dailyLeads: 6, weeklyLeads: 30, monthlyConversions: 14, completionRate: 88, earnings: 175000, lastActive: '2026-07-28' },
  ],
};

export default function AffiliateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const affiliateId = params.affiliateId as string;

  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get(`/users/${affiliateId}`);
        setUser(data);
      } catch {
        const fallback = affiliatesData[affiliateId];
        if (fallback) {
          setUser({
            id: affiliateId,
            fullName: fallback.name,
            email: fallback.email,
            phone: '+2348012345678',
            role: 'AFFILIATE',
            status: 'ACTIVE',
            referralCode: '',
            createdAt: '2026-01-15T00:00:00Z',
            totalEarnings: 425000,
            dailyLeadTarget: 10,
            monthlyConversionTarget: 20,
            _count: { referrals: 3, businesses: 12, leads: 45 },
          });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [affiliateId]);

  const dailyReports = mockDailyReports[affiliateId] || [];
  const weeklyReports = mockWeeklyReports[affiliateId] || [];
  const monthlyReports = mockMonthlyReports[affiliateId] || [];
  const locations = affiliateLocations[affiliateId] || [];
  const historyEntries = mockHistory[affiliateId] || [];

  const teamMembers = mockTeamMembers[affiliateId] || [];
  const isManagerRole = !!(user?.role === 'SUPERVISOR' || user?.role === 'MANAGER' || user?.isManagerMode);
  const teamTabs: Tab[] = isManagerRole ? ['overview', 'daily', 'weekly', 'monthly', 'locations', 'history', 'team'] : ['overview', 'daily', 'weekly', 'monthly', 'locations', 'history'];

  const recentDailyReports = useMemo(() => dailyReports.slice(0, 5), [dailyReports]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="max-w-3xl mx-auto text-center py-20">
          <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-lg font-bold text-slate-500">Affiliate not found</p>
          <p className="text-sm text-slate-400 mt-1">The user you are looking for does not exist or has been removed.</p>
          <Link href="/admin/affiliates" className="inline-block mt-6 px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all">
            Back to Affiliates
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const roleLabel = user.isManagerMode ? 'Line Manager' : user.role;
  const roleColor = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? 'purple' :
    user.role === 'MANAGER' ? 'emerald' :
    user.isManagerMode ? 'blue' : 'slate';

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Back button */}
        <button onClick={() => router.push('/admin/affiliates')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Affiliates
        </button>

        {/* Profile Header */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-32" />
          <div className="px-8 pb-8">
            <div className="flex items-end -mt-16 mb-6">
              <div className="w-28 h-28 rounded-[32px] bg-white p-1 shadow-xl">
                <div className="w-full h-full rounded-[28px] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-black">
                  {user.fullName?.charAt(0) || 'A'}
                </div>
              </div>
              <div className="ml-5 pb-2 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-black text-slate-900">{user.fullName}</h1>
                  <span className={cn(
                    "text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border",
                    roleColor === 'purple' ? "bg-purple-100 text-purple-600 border-purple-200" :
                    roleColor === 'emerald' ? "bg-emerald-100 text-emerald-600 border-emerald-200" :
                    roleColor === 'blue' ? "bg-blue-100 text-blue-600 border-blue-200" :
                    "bg-slate-100 text-slate-500"
                  )}>
                    {roleLabel}
                  </span>
                  <span className={cn(
                    "text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider",
                    user.status === 'ACTIVE' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                  )}>
                    {user.status}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1 font-mono">{user.email}</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 text-purple-600 mb-1">
                  <Briefcase className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Businesses</span>
                </div>
                <p className="text-2xl font-black text-slate-900">{user._count?.businesses ?? 0}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Referrals</span>
                </div>
                <p className="text-2xl font-black text-slate-900">{user._count?.referrals ?? 0}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 text-amber-600 mb-1">
                  <Target className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Leads</span>
                </div>
                <p className="text-2xl font-black text-slate-900">{user._count?.leads ?? 0}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 text-emerald-600 mb-1">
                  <Wallet className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Earnings</span>
                </div>
                <p className="text-2xl font-black text-slate-900">₦{Number(user.totalEarnings || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info Bar */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</p>
              <p className="text-sm font-bold text-slate-900">{user.email}</p>
            </div>
          </div>
          <div className="w-px h-10 bg-slate-200" />
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone</p>
              <p className="text-sm font-bold text-slate-900">{user.phone}</p>
            </div>
          </div>
          <div className="w-px h-10 bg-slate-200" />
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registered</p>
              <p className="text-sm font-bold text-slate-900">{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="w-px h-10 bg-slate-200" />
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Active</p>
              <p className="text-sm font-bold text-slate-900">2 hours ago</p>
            </div>
          </div>
          {user.dailyLeadTarget !== undefined && user.dailyLeadTarget > 0 && (
            <>
              <div className="w-px h-10 bg-slate-200" />
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-violet-400" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Daily Target</p>
                  <p className="text-sm font-bold text-slate-900">{user.dailyLeadTarget} leads</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto gap-1 bg-white rounded-2xl border border-slate-200 p-1.5 shadow-sm">
          {(teamTabs as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                activeTab === tab
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              )}
            >
              {tabIcons[tab]}
              {tabLabels[tab]}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Performance Targets */}
                {(user.dailyLeadTarget || user.monthlyConversionTarget) && (
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-violet-500" /> Performance Targets
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-violet-50 rounded-2xl border border-violet-100">
                        <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Daily Lead Target</p>
                        <p className="text-3xl font-black text-violet-900 mt-1">{user.dailyLeadTarget ?? '—'}</p>
                        <p className="text-xs text-violet-600 mt-1">leads per day</p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Monthly Conversion Target</p>
                        <p className="text-3xl font-black text-blue-900 mt-1">{user.monthlyConversionTarget ?? '—'}</p>
                        <p className="text-xs text-blue-600 mt-1">conversions per month</p>
                      </div>
                      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Performance Score</p>
                        <p className="text-3xl font-black text-emerald-900 mt-1">{user.reportingScore ?? 88}%</p>
                        <p className="text-xs text-emerald-600 mt-1">overall rating</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Daily Reports */}
                {recentDailyReports.length > 0 && (
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-blue-500" /> Recent Daily Reports
                      </h3>
                      <button onClick={() => setActiveTab('daily')} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                        View All <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-slate-100">
                            <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                            <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Leads</th>
                            <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Conversions</th>
                            <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Visits</th>
                            <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Meetings</th>
                            <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Rate</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {recentDailyReports.map(report => (
                            <tr key={report.date} className="hover:bg-slate-50/50 transition-all">
                              <td className="py-3 text-sm font-bold text-slate-900">{new Date(report.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                              <td className="py-3 text-center text-sm font-bold text-slate-900">{report.leadsCollected}</td>
                              <td className="py-3 text-center text-sm font-bold text-emerald-600">{report.conversions}</td>
                              <td className="py-3 text-center text-sm font-bold text-slate-900">{report.businessesVisited}</td>
                              <td className="py-3 text-center text-sm font-bold text-slate-900">{report.meetingsScheduled}</td>
                              <td className="py-3 text-center">
                                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", report.completionRate >= 80 ? "bg-emerald-100 text-emerald-700" : report.completionRate >= 60 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>
                                  {report.completionRate}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Monthly Stats Summary */}
                {monthlyReports.length > 0 && (
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-purple-500" /> Monthly Performance
                      </h3>
                      <button onClick={() => setActiveTab('monthly')} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                        View All <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {monthlyReports.slice(0, 3).map(report => (
                        <div key={`${report.month}-${report.year}`} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-xs font-bold text-slate-400 mb-3">{report.month} {report.year}</p>
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-500">Leads</span>
                              <span className="font-bold text-slate-900">{report.totalLeads}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-500">Conversions</span>
                              <span className="font-bold text-emerald-600">{report.totalConversions}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-500">Conversion Rate</span>
                              <span className="font-bold text-blue-600">{report.conversionRate}%</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-500">Earnings</span>
                              <span className="font-bold text-emerald-600">₦{report.totalEarnings.toLocaleString()}</span>
                            </div>
                            <div className="mt-2 pt-2 border-t border-slate-200">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-slate-400">Score</span>
                                <span className={cn("text-sm font-black", report.performanceScore >= 80 ? "text-emerald-600" : report.performanceScore >= 60 ? "text-amber-600" : "text-red-600")}>
                                  {report.performanceScore}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Links */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link
                    href={`/admin/affiliates/${affiliateId}/history`}
                    className="flex items-center gap-4 p-5 bg-white rounded-3xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group"
                  >
                    <div className="p-3 bg-amber-50 rounded-2xl">
                      <History className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">Full Activity History</p>
                      <p className="text-xs text-slate-500">View all location activity and changes</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-amber-500 transition-all group-hover:translate-x-1" />
                  </Link>
                  <div className="flex items-center gap-4 p-5 bg-white rounded-3xl border border-slate-200 shadow-sm">
                    <div className="p-3 bg-blue-50 rounded-2xl">
                      <Target className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Edit Targets</p>
                      <p className="text-xs text-slate-500">Update daily and monthly performance goals</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'daily' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" /> Daily Reports
                </h3>
                {dailyReports.length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-500">No daily reports yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                          <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Leads</th>
                          <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Conversions</th>
                          <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Visits</th>
                          <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Meetings</th>
                          <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Rate</th>
                          <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Trend</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {dailyReports.map((report, idx) => {
                          const prev = dailyReports[idx + 1];
                          const leadDiff = prev ? report.leadsCollected - prev.leadsCollected : 0;
                          return (
                            <tr key={report.date} className="hover:bg-slate-50/50 transition-all">
                              <td className="py-3.5 text-sm font-bold text-slate-900">{new Date(report.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                              <td className="py-3.5 text-center text-sm font-bold text-slate-900">{report.leadsCollected}</td>
                              <td className="py-3.5 text-center text-sm font-bold text-emerald-600">{report.conversions}</td>
                              <td className="py-3.5 text-center text-sm font-bold text-slate-900">{report.businessesVisited}</td>
                              <td className="py-3.5 text-center text-sm font-bold text-slate-900">{report.meetingsScheduled}</td>
                              <td className="py-3.5 text-center">
                                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", report.completionRate >= 80 ? "bg-emerald-100 text-emerald-700" : report.completionRate >= 60 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>
                                  {report.completionRate}%
                                </span>
                              </td>
                              <td className="py-3.5 text-center">
                                {leadDiff > 0 ? (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600"><ArrowUp className="w-3 h-3" /> {leadDiff}</span>
                                ) : leadDiff < 0 ? (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-600"><ArrowDown className="w-3 h-3" /> {Math.abs(leadDiff)}</span>
                                ) : (
                                  <span className="text-[10px] text-slate-400">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'weekly' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                  <LineChart className="w-5 h-5 text-indigo-500" /> Weekly Reports
                </h3>
                {weeklyReports.length === 0 ? (
                  <div className="text-center py-12">
                    <LineChart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-500">No weekly reports yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {weeklyReports.map(report => (
                      <div key={report.week} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-sm font-black text-slate-900">{report.week}</p>
                          <span className="text-[10px] text-slate-400">{new Date(report.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(report.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Total Leads</p>
                            <p className="text-xl font-black text-slate-900">{report.totalLeads}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Conversions</p>
                            <p className="text-xl font-black text-emerald-600">{report.totalConversions}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Total Visits</p>
                            <p className="text-xl font-black text-slate-900">{report.totalVisits}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Avg Rate</p>
                            <p className="text-xl font-black text-blue-600">{report.avgCompletionRate}%</p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <p className="text-[10px] text-slate-400">Top Business: <span className="font-bold text-slate-700">{report.topBusiness}</span></p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'monthly' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-purple-500" /> Monthly Reports
                </h3>
                {monthlyReports.length === 0 ? (
                  <div className="text-center py-12">
                    <PieChart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-500">No monthly reports yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {monthlyReports.map(report => (
                      <div key={`${report.month}-${report.year}`} className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center justify-between mb-5">
                          <h4 className="text-lg font-black text-slate-900">{report.month} {report.year}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400">Performance</span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star key={star} className={cn("w-3.5 h-3.5", star <= Math.round(report.performanceScore / 20) ? "text-amber-400 fill-amber-400" : "text-slate-300")} />
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-3 bg-white rounded-xl border border-slate-200">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Total Leads</p>
                            <p className="text-xl font-black text-slate-900">{report.totalLeads}</p>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-slate-200">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Conversions</p>
                            <p className="text-xl font-black text-emerald-600">{report.totalConversions}</p>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-slate-200">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Conv. Rate</p>
                            <p className="text-xl font-black text-blue-600">{report.conversionRate}%</p>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-slate-200">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Businesses</p>
                            <p className="text-xl font-black text-slate-900">{report.totalBusinesses}</p>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-slate-200">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Avg Daily Leads</p>
                            <p className="text-xl font-black text-slate-900">{report.avgDailyLeads}</p>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-slate-200">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Earnings</p>
                            <p className="text-xl font-black text-emerald-600">₦{report.totalEarnings.toLocaleString()}</p>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-slate-200">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Score</p>
                            <p className={cn("text-xl font-black", report.performanceScore >= 80 ? "text-emerald-600" : report.performanceScore >= 60 ? "text-amber-600" : "text-red-600")}>{report.performanceScore}%</p>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-slate-200">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Est. Income</p>
                            <p className="text-xl font-black text-purple-600">₦{Math.round(report.totalEarnings * 0.15).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'locations' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-500" /> Assigned Locations
                </h3>
                {locations.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-500">No locations assigned</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {locations.map(loc => (
                      <div key={loc.id} className="p-5 bg-blue-50 rounded-2xl border border-blue-100 hover:border-blue-300 hover:shadow-md transition-all group">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-blue-600" />
                            <div>
                              <h4 className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{loc.name}</h4>
                              <p className="text-xs text-slate-500">{loc.area}, {loc.city}</p>
                            </div>
                          </div>
                          <Link
                            href={`/admin/affiliates/${affiliateId}/history?locationId=${loc.id}`}
                            className="p-2 hover:bg-blue-100 rounded-lg text-blue-400 hover:text-blue-600 transition-all"
                            title="View location history"
                          >
                            <History className="w-4 h-4" />
                          </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-white rounded-xl border border-blue-50">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Businesses</p>
                            <p className="text-lg font-black text-slate-900">{loc.businesses}</p>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-blue-50">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Last Active</p>
                            <p className="text-lg font-black text-slate-900">{new Date(loc.lastActive).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Link
                            href={`/admin/market-mapping/assign/${loc.id}`}
                            className="flex-1 text-center px-3 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-bold hover:bg-blue-700 transition-all"
                          >
                            View Location
                          </Link>
                          <Link
                            href={`/admin/affiliates/${affiliateId}/history?locationId=${loc.id}`}
                            className="flex-1 text-center px-3 py-2 bg-white text-blue-600 border border-blue-200 rounded-xl text-[10px] font-bold hover:bg-blue-50 transition-all"
                          >
                            Activity History
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <History className="w-5 h-5 text-amber-500" /> Activity History
                  </h3>
                  <Link
                    href={`/admin/affiliates/${affiliateId}/history`}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    Full History <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                {historyEntries.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-500">No activity recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {historyEntries.map(entry => (
                      <div key={entry.id} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-amber-200 transition-all">
                        <div className={cn("p-2 rounded-xl mt-0.5", entry.type === 'created' ? "bg-emerald-50" : "bg-blue-50")}>
                          {entry.type === 'created' ? <Building2 className="w-4 h-4 text-emerald-600" /> : <Edit3 className="w-4 h-4 text-blue-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-slate-900">{entry.businessName}</p>
                            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-md", entry.type === 'created' ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700")}>
                              {entry.type === 'created' ? 'Created' : 'Updated'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">{entry.details}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" /><span className="text-[10px] text-slate-400">{entry.timestamp}</span></span>
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" /><span className="text-[10px] text-slate-400">{entry.locationName}</span></span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'team' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      {user?.fullName}'s Team
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Agents and affiliates under this Line Manager</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-slate-400">{teamMembers.length} members</span>
                    <span className="font-bold text-emerald-600">₦{teamMembers.reduce((s, m) => s + m.earnings, 0).toLocaleString()}</span>
                    <span className="text-slate-400">team earnings</span>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-50/50">
                  <div className="p-4 bg-white rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Agents</p>
                    <p className="text-2xl font-black text-slate-900">{teamMembers.filter(m => m.role === 'AGENT').length}</p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Affiliates</p>
                    <p className="text-2xl font-black text-slate-900">{teamMembers.filter(m => m.role === 'AFFILIATE').length}</p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Weekly Leads</p>
                    <p className="text-2xl font-black text-blue-600">{teamMembers.reduce((s, m) => s + m.weeklyLeads, 0)}</p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Completion Rate</p>
                    <p className="text-2xl font-black text-purple-600">{teamMembers.length > 0 ? Math.round(teamMembers.reduce((s, m) => s + m.completionRate, 0) / teamMembers.length) : 0}%</p>
                  </div>
                </div>

                {/* Team Member List */}
                {teamMembers.length > 0 ? (
                  <div className="divide-y divide-slate-50">
                    {teamMembers.map(member => (
                      <Link
                        key={member.id}
                        href={`/admin/affiliates/${member.id}`}
                        className="flex items-center justify-between p-4 hover:bg-slate-50 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm", member.role === 'AGENT' ? "bg-gradient-to-br from-violet-400 to-indigo-600" : "bg-gradient-to-br from-blue-400 to-cyan-600")}>
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{member.name}</p>
                              <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest", member.role === 'AGENT' ? "bg-violet-100 text-violet-600" : "bg-blue-100 text-blue-600")}>{member.role}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-[10px] text-slate-400">{member.dailyLeads} leads/d</span>
                              <span className="text-[10px] text-emerald-600 font-bold">₦{member.earnings.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="hidden sm:flex items-center gap-3 text-[10px]">
                            <span className="text-slate-400">{member.weeklyLeads} wk leads</span>
                            <span className={cn("font-bold px-2 py-0.5 rounded-full", member.completionRate >= 80 ? "bg-emerald-50 text-emerald-600" : member.completionRate >= 60 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600")}>{member.completionRate}%</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-400">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="text-sm font-bold">No team members under this Line Manager</p>
                    <p className="text-xs text-slate-400 mt-1">Team members will appear here when agents and affiliates are assigned</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}
