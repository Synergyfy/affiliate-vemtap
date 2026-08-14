'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  useAdminUser,
  useUserLeads,
  useUserReports,
  useUserLocations,
  useUserHistory,
  useUserTeam,
} from '@/services/useAdminHooks';
import { cn } from '@/lib/utils';
import type {
  AdminActivity,
  AdminLocationAssignment,
  AdminPerformanceReport,
  AdminTeamMember,
  User,
  Lead,
  Business,
  MarketMappingVisit,
  AdminTargetAdjustmentLog,
  AdminAgreementSignature,
} from '@/types/api';
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  History,
  Loader2,
  MapPin,
  RefreshCw,
  Target,
  Users,
  Wallet,
  Building2,
  Phone,
  Mail,
  Shield,
  FileCheck,
  Search,
  Filter,
  Navigation,
  UserCheck,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import WorkMetricReports from '@/components/reports/WorkMetricReports';

type Tab = 'overview' | 'leads' | 'reports' | 'locations' | 'history' | 'team';
type LeadFilterTab = 'all' | 'leads' | 'visits' | 'businesses';

/**
 * Combined count of leads, field visits and referred businesses shown on the
 * "Leads & Businesses" tab. Field visits are the visited subset of leads (the
 * same unified Lead records), so they are counted once via the leads list.
 */
function countUniqueLeadItems(
  leadsData: ReturnType<typeof useUserLeads>['data'],
): number {
  const leads = leadsData?.leads ?? [];
  const businesses = leadsData?.businesses ?? [];
  return leads.length + businesses.length;
}

export default function AffiliateDetailPage() {
  const params = useParams<{ affiliateId: string }>();
  const router = useRouter();
  const affiliateId = params.affiliateId;
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const userQuery = useAdminUser(affiliateId);
  const leadsQuery = useUserLeads(affiliateId);
  const reportsQuery = useUserReports(affiliateId);
  const locationsQuery = useUserLocations(affiliateId);
  const historyQuery = useUserHistory(affiliateId);
  const teamQuery = useUserTeam(affiliateId);

  const retry = () => {
    userQuery.refetch();
    leadsQuery.refetch();
    reportsQuery.refetch();
    locationsQuery.refetch();
    historyQuery.refetch();
    teamQuery.refetch();
  };

  const error =
    userQuery.error ||
    leadsQuery.error ||
    reportsQuery.error ||
    locationsQuery.error ||
    historyQuery.error ||
    teamQuery.error;

  if (userQuery.isLoading)
    return (
      <AdminLayout>
        <PageState loading message="Loading affiliate profile..." />
      </AdminLayout>
    );
  if (userQuery.error)
    return (
      <AdminLayout>
        <PageState
          message={
            userQuery.error instanceof Error
              ? userQuery.error.message
              : 'Unable to load affiliate.'
          }
          retry={retry}
        />
      </AdminLayout>
    );
  if (!userQuery.data)
    return (
      <AdminLayout>
        <PageState message="Affiliate not found." notFound />
      </AdminLayout>
    );

  const user = userQuery.data;
  const isManagerOrSupervisor =
    user.role === 'MANAGER' ||
    user.role === 'SUPERVISOR' ||
    (teamQuery.data?.teamMembers && teamQuery.data.teamMembers.length > 0);

  const tabs: Tab[] = isManagerOrSupervisor
    ? ['overview', 'leads', 'reports', 'locations', 'history', 'team']
    : ['overview', 'leads', 'reports', 'locations', 'history'];

  const locations = locationsQuery.data?.marketMappingAssignments ?? [];
  const activities = historyQuery.data?.activities ?? [];
  const targetAdjustmentLogs = historyQuery.data?.targetAdjustmentLogs ?? [];
  const signatures = historyQuery.data?.signatures ?? [];
  const team = teamQuery.data?.teamMembers ?? [];
  const leadsData = leadsQuery.data;

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation back */}
        <button
          onClick={() => router.push('/admin/affiliates')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Affiliates
        </button>

        {/* Top Profile Banner */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 h-36" />
          <div className="px-8 pb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-end -mt-16 mb-6 gap-4">
              <div className="w-28 h-28 rounded-[32px] bg-white p-1 shadow-xl shrink-0">
                <div className="w-full h-full rounded-[28px] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-black">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="flex-1 pb-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl font-black text-slate-900 truncate">
                    {user.fullName}
                  </h1>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest bg-blue-100 text-blue-700">
                    {user.role === 'MANAGER'
                      ? 'Manager'
                      : user.role === 'SUPERVISOR'
                      ? 'Line Manager'
                      : user.role}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] font-bold px-2.5 py-1 rounded-full uppercase',
                      user.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    )}
                  >
                    {user.status}
                  </span>
                  {user.kycStatus && (
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2.5 py-1 rounded-full uppercase flex items-center gap-1',
                        user.kycStatus === 'VERIFIED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : user.kycStatus === 'REJECTED'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      )}
                    >
                      <Shield className="w-3 h-3" /> KYC: {user.kycStatus}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {user.email}
                  </span>
                  {user.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {user.phone}
                    </span>
                  )}
                  <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-bold">
                    Ref Code: {user.referralCode}
                  </span>
                </div>

                {(user.supervisor || user.manager) && (
                  <div className="mt-2 text-xs text-slate-600 flex items-center gap-3 flex-wrap">
                    {user.supervisor && (
                      <span className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                        Supervisor:{' '}
                        <strong className="text-slate-800">
                          {user.supervisor.fullName}
                        </strong>
                      </span>
                    )}
                    {user.manager && (
                      <span className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                        Manager:{' '}
                        <strong className="text-slate-800">
                          {user.manager.fullName}
                        </strong>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Stat
                icon={<Briefcase className="w-4 h-4 text-blue-600" />}
                label="Referred Businesses"
                value={
                  user._count?.businesses ??
                  leadsData?.stats?.totalReferredBusinesses ??
                  0
                }
              />
              <Stat
                icon={<Target className="w-4 h-4 text-violet-600" />}
                label="Leads Submitted"
                value={
                  user._count?.leads ?? leadsData?.stats?.totalLeads ?? 0
                }
              />
              <Stat
                icon={<MapPin className="w-4 h-4 text-emerald-600" />}
                label="Field Visits Captured"
                value={
                  leadsData?.stats?.totalVisits ??
                  0
                }
              />
              <Stat
                icon={<Wallet className="w-4 h-4 text-amber-600" />}
                label="Total Earnings"
                value={`₦${Number(user.totalEarnings || 0).toLocaleString()}`}
              />
            </div>
          </div>
        </div>

        {/* Detailed Profile Info Row */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-wrap gap-6 items-center">
          <Info
            icon={<Calendar className="w-4 h-4 text-slate-400" />}
            label="Registered On"
            value={new Date(user.createdAt).toLocaleDateString()}
          />
          <Info
            icon={<Target className="w-4 h-4 text-slate-400" />}
            label="Daily Target"
            value={
              user.dailyLeadTarget == null
                ? 'Not set'
                : `${user.dailyLeadTarget} leads`
            }
          />
          <Info
            icon={<TrendingUp className="w-4 h-4 text-slate-400" />}
            label="Monthly Target"
            value={
              user.monthlyConversionTarget == null
                ? 'Not set'
                : `${user.monthlyConversionTarget} convs`
            }
          />
          {user.bankName && user.accountNumber && (
            <Info
              icon={<Wallet className="w-4 h-4 text-slate-400" />}
              label="Bank Details"
              value={`${user.bankName} - ${user.accountNumber}`}
            />
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto gap-1.5 bg-white rounded-2xl border border-slate-200 p-1.5 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2.5 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-colors flex items-center gap-2',
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              {tab === 'leads' && <Target className="w-3.5 h-3.5" />}
              {tab === 'overview' && <Briefcase className="w-3.5 h-3.5" />}
              {tab === 'reports' && <TrendingUp className="w-3.5 h-3.5" />}
              {tab === 'locations' && <MapPin className="w-3.5 h-3.5" />}
              {tab === 'history' && <History className="w-3.5 h-3.5" />}
              {tab === 'team' && <Users className="w-3.5 h-3.5" />}
              {tab === 'leads' ? 'Leads & Businesses' : tab}
              {tab === 'leads' &&
                (leadsData?.stats?.totalLeads ?? 0) + (leadsData?.stats?.totalVisits ?? 0) >
                  0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-500 text-white">
                    {countUniqueLeadItems(leadsData)}
                  </span>
                )}
            </button>
          ))}
        </div>

        {error && (
          <InlineError
            message="Some affiliate data could not be loaded."
            onRetry={retry}
          />
        )}

        {/* Tab Contents */}
        {activeTab === 'overview' && (
          <Overview
            report={reportsQuery.data}
            user={user}
            activities={activities}
            leadsData={leadsData}
          />
        )}

        {activeTab === 'leads' && (
          <LeadsPanel leadsData={leadsData} loading={leadsQuery.isLoading} />
        )}

        {activeTab === 'reports' && (
          <WorkMetricReports
            userId={affiliateId}
            userName={user.fullName}
            userRole={user.role}
            backHref="/admin/affiliates"
          />
        )}

        {activeTab === 'locations' && (
          <Locations
            locations={locations}
            loading={locationsQuery.isLoading}
            affiliateId={affiliateId}
          />
        )}

        {activeTab === 'history' && (
          <HistoryPanel
            activities={activities}
            targetLogs={targetAdjustmentLogs}
            signatures={signatures}
            loading={historyQuery.isLoading}
            affiliateId={affiliateId}
          />
        )}

        {activeTab === 'team' && (
          <Team team={team} loading={teamQuery.isLoading} />
        )}
      </div>
    </AdminLayout>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          {label}
        </span>
      </div>
      <p className="text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-slate-400 p-2 bg-slate-50 rounded-xl">{icon}</span>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {label}
        </p>
        <p className="text-sm font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function Overview({
  report,
  user,
  activities,
  leadsData,
}: {
  report: AdminPerformanceReport | null | undefined;
  user: User;
  activities: AdminActivity[];
  leadsData: ReturnType<typeof useUserLeads>['data'];
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Performance Targets */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-black text-slate-900 mb-4 flex items-center gap-2 text-base">
          <Target className="w-5 h-5 text-violet-600" />
          Performance Targets &amp; Scores
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Daily lead target" value={user.dailyLeadTarget ?? 'Not set'} />
          <Metric label="Monthly conv target" value={user.monthlyConversionTarget ?? 'Not set'} />
          <Metric
            label="Reporting score"
            value={report ? `${report.reportingScore}%` : 'Unavailable'}
          />
          <Metric
            label="Attendance rate"
            value={report ? `${report.attendanceRate}%` : 'Unavailable'}
          />
        </div>
      </section>

      {/* Leads Summary Card */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-black text-slate-900 mb-4 flex items-center gap-2 text-base">
          <Briefcase className="w-5 h-5 text-blue-600" />
          Submitted Leads Overview
        </h2>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl text-center">
            <p className="text-lg font-black text-blue-700">
              {leadsData?.stats?.totalLeads ?? user._count?.leads ?? 0}
            </p>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Sales Leads</p>
          </div>
          <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl text-center">
            <p className="text-lg font-black text-emerald-700">
              {leadsData?.stats?.totalVisits ?? 0}
            </p>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Field Visits</p>
          </div>
          <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-2xl text-center">
            <p className="text-lg font-black text-purple-700">
              {leadsData?.stats?.totalReferredBusinesses ?? user._count?.businesses ?? 0}
            </p>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Referred Biz</p>
          </div>
        </div>
        {leadsData?.leads && leadsData.leads.length > 0 ? (
          <div className="space-y-2">
            {leadsData.leads.slice(0, 3).map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900">{lead.businessName}</p>
                  <p className="text-[11px] text-slate-500">{lead.phone} · {lead.location || 'No location'}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">
                  {lead.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic text-center py-4">No sales leads recorded yet.</p>
        )}
      </section>

      {/* Recent Activity */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:col-span-2">
        <h2 className="font-black text-slate-900 mb-4 flex items-center gap-2 text-base">
          <History className="w-5 h-5 text-amber-500" />
          Recent Activity Log
        </h2>
        {activities.length === 0 ? (
          <Empty message="No activity recorded yet." />
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {activities.slice(0, 6).map((activity) => (
              <ActivityRow key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function LeadsPanel({
  leadsData,
  loading,
}: {
  leadsData: ReturnType<typeof useUserLeads>['data'];
  loading: boolean;
}) {
  const [filterTab, setFilterTab] = useState<LeadFilterTab>('all');
  const [search, setSearch] = useState('');

  if (loading) return <CardState loading />;
  if (!leadsData) return <CardState message="No lead data available." />;

  const leads = leadsData.leads || [];
  const visits = leadsData.visits || [];
  const businesses = leadsData.businesses || [];

  const filteredLeads = leads.filter(
    (l) =>
      l.businessName.toLowerCase().includes(search.toLowerCase()) ||
      (l.contactName && l.contactName.toLowerCase().includes(search.toLowerCase())) ||
      (l.phone && l.phone.includes(search)) ||
      (l.location && l.location.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredVisits = visits.filter(
    (v) =>
      v.businessName.toLowerCase().includes(search.toLowerCase()) ||
      (v.contactName && v.contactName.toLowerCase().includes(search.toLowerCase())) ||
      (v.phone && v.phone.includes(search)) ||
      ((v.businessAddress || v.location || '') && (v.businessAddress || v.location || '').toLowerCase().includes(search.toLowerCase()))
  );

  const filteredBusinesses = businesses.filter(
    (b) =>
      b.businessName.toLowerCase().includes(search.toLowerCase()) ||
      b.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      b.phone.includes(search) ||
      b.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Affiliate Leads &amp; Business Captures
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review all sales leads, field captures, and referred paying/trial businesses submitted by this person.
          </p>
        </div>
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads, phone, location..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 border-b border-slate-100 pb-3 flex-wrap">
        <button
          onClick={() => setFilterTab('all')}
          className={cn(
            'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all',
            filterTab === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          )}
        >
          All Items ({countUniqueLeadItems(leadsData)})
        </button>
        <button
          onClick={() => setFilterTab('leads')}
          className={cn(
            'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all',
            filterTab === 'leads'
              ? 'bg-blue-600 text-white'
              : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
          )}
        >
          Sales Leads ({leads.length})
        </button>
        <button
          onClick={() => setFilterTab('visits')}
          className={cn(
            'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all',
            filterTab === 'visits'
              ? 'bg-emerald-600 text-white'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          )}
        >
          Field Visits ({visits.length})
        </button>
        <button
          onClick={() => setFilterTab('businesses')}
          className={cn(
            'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all',
            filterTab === 'businesses'
              ? 'bg-purple-600 text-white'
              : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
          )}
        >
          Referred Businesses ({businesses.length})
        </button>
      </div>

      {/* Sales Leads Listing */}
      {(filterTab === 'all' || filterTab === 'leads') && (
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-blue-600" /> Sales Leads Submitted ({filteredLeads.length})
          </h3>
          {filteredLeads.length === 0 ? (
            <p className="text-xs text-slate-400 italic p-4 bg-slate-50 rounded-2xl">
              No sales leads found.
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-200 transition-all space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{lead.businessName}</h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {lead.industry || 'General Industry'} · {lead.contactName || 'No contact specified'}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'text-[10px] font-black px-2 py-0.5 rounded-full uppercase',
                        lead.status === 'CUSTOMER'
                          ? 'bg-emerald-100 text-emerald-700'
                          : lead.status === 'INTERESTED'
                          ? 'bg-blue-100 text-blue-700'
                          : lead.status === 'CONTACTED'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-amber-100 text-amber-700'
                      )}
                    >
                      {lead.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-y-1 gap-x-3 text-xs text-slate-600 pt-1">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" /> {lead.phone}
                    </span>
                    {lead.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" /> {lead.email}
                      </span>
                    )}
                    {lead.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" /> {lead.location}
                      </span>
                    )}
                  </div>

                  {lead.comments && (
                    <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-xl border border-slate-100">
                      &quot;{lead.comments}&quot;
                    </p>
                  )}

                  <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                    <span>Priority: <strong>{lead.priority}</strong></span>
                    <span>Added {new Date(lead.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Field Visits Listing */}
      {filterTab === 'visits' && (
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-emerald-600" /> Captured Field Visits ({filteredVisits.length})
          </h3>
          {filteredVisits.length === 0 ? (
            <p className="text-xs text-slate-400 italic p-4 bg-slate-50 rounded-2xl">
              No field visits captured.
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {filteredVisits.map((visit) => (
                <div
                  key={visit.id}
                  className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{visit.businessName}</h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {visit.industry || 'Business'} · Owner: {visit.contactName || 'N/A'}
                      </p>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase bg-emerald-100 text-emerald-800">
                      {visit.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-y-1 gap-x-3 text-xs text-slate-600">
                    {visit.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-600" /> {visit.phone}
                      </span>
                    )}
                    {(visit.businessAddress || visit.location) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600" /> {visit.businessAddress || visit.location}
                      </span>
                    )}
                    {visit.gpsLat && visit.gpsLng && (
                      <span className="flex items-center gap-1 font-mono text-[10px] text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">
                        GPS: {Number(visit.gpsLat).toFixed(4)}, {Number(visit.gpsLng).toFixed(4)}
                      </span>
                    )}
                  </div>

                  {visit.comments && (
                    <p className="text-xs text-slate-600 bg-white/80 p-2 rounded-xl border border-emerald-100">
                      {visit.comments}
                    </p>
                  )}

                  <div className="text-[10px] text-slate-400 text-right pt-1">
                    Captured {new Date(visit.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Referred Businesses Listing */}
      {(filterTab === 'all' || filterTab === 'businesses') && (
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-purple-600" /> Referred Businesses ({filteredBusinesses.length})
          </h3>
          {filteredBusinesses.length === 0 ? (
            <p className="text-xs text-slate-400 italic p-4 bg-slate-50 rounded-2xl">
              No referred businesses recorded.
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {filteredBusinesses.map((biz) => (
                <div
                  key={biz.id}
                  className="p-4 bg-purple-50/40 rounded-2xl border border-purple-100 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{biz.businessName}</h4>
                      <p className="text-xs text-slate-500">Owner: {biz.ownerName} · Plan: {biz.planType}</p>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase bg-purple-100 text-purple-800">
                      {biz.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs text-slate-700 bg-white/80 p-2.5 rounded-xl border border-purple-100">
                    <span>Sub: <strong>₦{Number(biz.subscriptionAmount).toLocaleString()}</strong></span>
                    <span>Commission: <strong className="text-purple-700">₦{Number(biz.commissionAmount).toLocaleString()}</strong></span>
                  </div>

                  <div className="text-[10px] text-slate-400 text-right">
                    Created {new Date(biz.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Locations({
  locations,
  loading,
  affiliateId,
}: {
  locations: AdminLocationAssignment[];
  loading: boolean;
  affiliateId: string;
}) {
  if (loading) return <CardState loading />;
  if (!locations.length) return <CardState message="No locations assigned to this affiliate." />;

  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
      <h2 className="text-lg font-black text-slate-900 mb-5 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-blue-500" />
        Assigned Territory Locations ({locations.length})
      </h2>
      <div className="grid md:grid-cols-2 gap-4">
        {locations.map((location) => (
          <div key={location.id} className="p-5 bg-blue-50/60 rounded-2xl border border-blue-100 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">{location.cluster.name}</h3>
              <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-wider">{location.cluster.type} Territory</p>
              <div className="mt-4 space-y-1 text-xs text-slate-600">
                <p>Assigned Date: <strong>{new Date(location.assignedAt).toLocaleDateString()}</strong></p>
                {location.dailyLeadTarget > 0 && <p>Daily Target: <strong>{location.dailyLeadTarget} leads</strong></p>}
                {location.monthlyConversionTarget > 0 && <p>Monthly Target: <strong>{location.monthlyConversionTarget} convs</strong></p>}
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-blue-100/80 flex items-center justify-between">
              <Link
                href={`/admin/market-mapping/assign/${location.cluster.id}`}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                View territory location <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href={`/admin/affiliates/${affiliateId}/history?locationId=${location.cluster.id}`}
                className="text-xs font-bold text-slate-500 hover:text-slate-700"
              >
                Location history
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HistoryPanel({
  activities,
  targetLogs,
  signatures,
  loading,
  affiliateId,
}: {
  activities: AdminActivity[];
  targetLogs: AdminTargetAdjustmentLog[];
  signatures: AdminAgreementSignature[];
  loading: boolean;
  affiliateId: string;
}) {
  if (loading) return <CardState loading />;

  const hasItems = activities.length > 0 || targetLogs.length > 0 || signatures.length > 0;

  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-amber-500" />
            Activity &amp; Adjustment History
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit logs of actions, target changes, and agreement signatures.
          </p>
        </div>
        <Link
          href={`/admin/affiliates/${affiliateId}/history`}
          className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
        >
          View full history page <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {!hasItems ? (
        <Empty message="No activity recorded yet." />
      ) : (
        <div className="space-y-4">
          {/* Target Adjustment Logs */}
          {targetLogs.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-violet-600" /> Target Adjustments
              </h3>
              {targetLogs.map((log) => (
                <div key={log.id} className="p-3 bg-violet-50/50 rounded-xl border border-violet-100 flex items-start gap-3">
                  <Target className="w-4 h-4 text-violet-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Target Modified: Daily {log.oldDailyLeadTarget} → {log.newDailyLeadTarget}, Monthly {log.oldMonthlyConversionTarget} → {log.newMonthlyConversionTarget}
                    </p>
                    <p className="text-xs text-slate-600">Reason: {log.reason || 'Admin update'}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Agreement Signatures */}
          {signatures.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-emerald-600" /> Signed Agreements
              </h3>
              {signatures.map((sig) => (
                <div key={sig.id} className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Signed Affiliate Agreement (v{sig.version})
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">{new Date(sig.signedAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Activities */}
          {activities.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" /> Recent Actions
              </h3>
              <div className="space-y-2">
                {activities.map((activity) => (
                  <ActivityRow key={activity.id} activity={activity} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Team({
  team,
  loading,
}: {
  team: AdminTeamMember[];
  loading: boolean;
}) {
  if (loading) return <CardState loading />;
  if (!team.length)
    return <CardState message="No downline team members under this affiliate/manager." />;

  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
      <h2 className="text-lg font-black text-slate-900 mb-5 flex items-center gap-2">
        <Users className="w-5 h-5 text-blue-500" />
        Downline Team Members ({team.length})
      </h2>
      <div className="divide-y divide-slate-100">
        {team.map((member) => (
          <div key={member.id} className="py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                {member.fullName.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">{member.fullName}</p>
                <p className="text-xs text-slate-500">{member.email} · {member.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black px-2.5 py-1 rounded-lg uppercase bg-blue-50 text-blue-700 border border-blue-100">
                {member.role}
              </span>
              <Link
                href={`/admin/affiliates/${member.id}`}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                View profile <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ActivityRow({ activity }: { activity: AdminActivity }) {
  return (
    <div className="flex gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-100">
      <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-bold text-slate-900">{activity.title}</p>
        <p className="text-xs text-slate-600">
          {activity.description || activity.businessName || 'Activity recorded'}
        </p>
        <p className="text-[10px] text-slate-400 mt-1">
          {new Date(activity.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="p-3 bg-slate-50 rounded-xl">
      <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
      <p className="text-xl font-black text-slate-900 mt-1">{value}</p>
    </div>
  );
}

function Empty({ message }: { message: string }) {
  return <p className="text-sm text-slate-400 text-center py-8">{message}</p>;
}

function CardState({
  message,
  loading = false,
}: {
  message?: string;
  loading?: boolean;
}) {
  return (
    <section className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
      {loading ? (
        <Loader2 className="w-7 h-7 animate-spin text-blue-600 mx-auto" />
      ) : (
        <Empty message={message || 'No data available.'} />
      )}
    </section>
  );
}

function InlineError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-red-50 border border-red-100 text-sm text-red-700">
      <span className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        {message}
      </span>
      <button onClick={onRetry} className="flex items-center gap-1 font-bold">
        <RefreshCw className="w-3 h-3" />
        Retry
      </button>
    </div>
  );
}

function PageState({
  message,
  loading = false,
  notFound = false,
  retry,
}: {
  message: string;
  loading?: boolean;
  notFound?: boolean;
  retry?: () => void;
}) {
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
        {loading ? (
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        ) : (
          <AlertCircle className="w-8 h-8 text-red-400" />
        )}
      </div>
      <p className="text-lg font-bold text-slate-600">{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="mt-5 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold"
        >
          Retry
        </button>
      )}
      {notFound && (
        <Link href="/admin/affiliates" className="block mt-5 text-sm text-blue-600">
          Back to affiliates
        </Link>
      )}
    </div>
  );
}

