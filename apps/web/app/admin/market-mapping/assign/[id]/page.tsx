'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import ClusterDetailPanel from '@/components/admin/market-mapping/ClusterDetailPanel';
import {
  ArrowLeft, Search, MapPin, Users, Target, CheckCircle2, Plus, X, Loader2, Info, ToggleLeft, Eye,
  UserPlus, Clock, Building2, History, Edit3, ChevronRight, Save, UserCheck, Calendar, RefreshCw, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useUsers } from '@/services/useAdminHooks';
import type { User } from '@/types/api';
import type { AssignmentDuration, AdminAssignment } from '@/types/market-mapping';
import {
  useAdminClusterDetail,
  useAdminAssignments,
  useCreateAssignment,
  useAssignLineManager,
  useReassignAssignment,
  useUpdateAssignment,
  useDeleteAssignment,
  useAdminSubmissions,
  useAdminLocations,
} from '@/services/useMarketMappingHooks';

interface SubmissionRecord {
  id: string;
  businessName: string;
  type: 'created' | 'updated';
  timestamp: string;
  details: string;
}

interface Affiliate {
  id: string;
  name: string;
  email: string;
  role?: string;
  businesses: number;
  customers: number;
  score: number;
  assignedAt?: string;
  duration?: AssignmentDuration;
  expiresAt?: string | null;
  assignedBy?: string | null;
  photoUrl?: string;
  phone?: string;
  target?: { daily: number; weekly: number; monthly: number };
  submissions?: SubmissionRecord[];
  assignmentId?: string;
}

interface AffiliateTarget {
  daily: number;
  weekly: number;
  monthly: number;
}

const defaultTargets: AffiliateTarget = { daily: 0, weekly: 0, monthly: 0 };

const durationOptions: { id: AssignmentDuration; label: string; description: string }[] = [
  { id: 'ONE_DAY', label: '1 Day', description: 'Expires in 24 hours' },
  { id: 'ONE_WEEK', label: '1 Week', description: 'Expires in 7 days' },
  { id: 'ONE_MONTH', label: '1 Month', description: 'Expires in 30 days' },
  { id: 'CUSTOM', label: 'Custom', description: 'Pick specific date or days' },
  { id: 'FOREVER', label: 'Forever', description: 'Non-expiring assignment' },
];

export default function LocationDetailPage() {
  const params = useParams<{ id: string }>();
  const clusterId = Array.isArray(params.id) ? params.id[0] : params.id;
  const clusterQuery = useAdminClusterDetail(clusterId);
  const assignmentsQuery = useAdminAssignments({ clusterId, includeExpired: true });
  const allAssignmentsQuery = useAdminAssignments({ includeExpired: true });
  const usersQuery = useUsers({});
  const locationsQuery = useAdminLocations();
  const submissionsQuery = useAdminSubmissions(clusterId);

  const createAssignment = useCreateAssignment();
  const assignLineManager = useAssignLineManager();
  const reassignAssignment = useReassignAssignment();
  const updateAssignment = useUpdateAssignment();
  const deleteAssignment = useDeleteAssignment();

  const location = clusterQuery.data?.cluster;
  const locationRecord = location ? {
    id: location.id,
    name: location.name,
    area: location.areaName ?? location.parent?.name ?? 'General',
    city: location.cityName ?? 'Unknown',
    businesses: location.totalBusinesses ?? clusterQuery.data?.businesses.length ?? 0,
    affiliates: 0,
    penetration: location.penetrationPercentage ?? 0,
    targets: defaultTargets,
    allowUserEdit: true,
  } : null;

  // State management
  const [assignMode, setAssignMode] = useState<'INDIVIDUAL' | 'LINE_MANAGER'>('INDIVIDUAL');
  const [selectedDuration, setSelectedDuration] = useState<AssignmentDuration>('ONE_WEEK');
  const [customDays, setCustomDays] = useState<number>(14);
  const [customExpiresAt, setCustomExpiresAt] = useState<string>('');

  const [selectedAffiliateIds, setSelectedAffiliateIds] = useState<string[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');
  const [includeTeamMembers, setIncludeTeamMembers] = useState(true);

  const [searchAffiliate, setSearchAffiliate] = useState('');
  const [dailyTarget, setDailyTarget] = useState(10);
  const [weeklyTarget, setWeeklyTarget] = useState(50);
  const [monthlyTarget, setMonthlyTarget] = useState(20);
  const [allowUserEdit, setAllowUserEdit] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Affiliate detail modal state
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [affiliateTab, setAffiliateTab] = useState<'history' | 'target' | 'reassign'>('history');
  const [editAffTarget, setEditAffTarget] = useState<AffiliateTarget>({ daily: 0, weekly: 0, monthly: 0 });
  const [editAffDuration, setEditAffDuration] = useState<AssignmentDuration>('FOREVER');
  const [reassignTargetClusterId, setReassignTargetClusterId] = useState<string>('');
  const [savingAffTarget, setSavingAffTarget] = useState(false);
  const [targetSaved, setTargetSaved] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const [assignedIds, setAssignedIds] = useState<string[]>([]);

  useEffect(() => {
    const clusterAssignments = (assignmentsQuery.data ?? []);
    setAssignedIds(clusterAssignments.map(a => a.userId));
    const first = clusterAssignments[0];
    if (first) {
      setDailyTarget(first.dailyLeadTarget ?? 10);
      setWeeklyTarget(first.weeklyLeadTarget ?? 50);
      setMonthlyTarget(first.monthlyConversionTarget ?? 20);
      setAllowUserEdit(first.allowUserEdit ?? true);
    }
  }, [assignmentsQuery.data]);

  const assignedAffiliates = useMemo(() =>
    (assignmentsQuery.data ?? []).map(a => {
      const isExpired = a.expiresAt && new Date(a.expiresAt) < new Date();
      return {
        id: a.userId,
        name: a.user?.fullName ?? 'Unknown user',
        email: a.user?.email ?? '',
        phone: a.user?.phone ?? '',
        role: a.user?.role ?? 'AFFILIATE',
        businesses: 0,
        customers: 0,
        score: 0,
        assignedAt: a.createdAt,
        duration: a.duration ?? 'FOREVER',
        expiresAt: a.expiresAt,
        assignedBy: a.assignedBy,
        target: { daily: a.dailyLeadTarget, weekly: a.weeklyLeadTarget, monthly: a.monthlyConversionTarget },
        assignmentId: a.id,
        isExpired: !!isExpired,
      };
    }), [assignmentsQuery.data]
  );

  const allUsers: User[] = usersQuery.data?.data ?? [];

  // Line Managers (users with MANAGER, SUPERVISOR, or ADMIN roles or who have managed users)
  const lineManagers = useMemo(() => {
    return allUsers.filter(u =>
      ['MANAGER', 'SUPERVISOR', 'ADMIN', 'SUPER_ADMIN', 'SALES_EXECUTIVE'].includes(u.role) ||
      allUsers.some(sub => sub.managerId === u.id || sub.supervisorId === u.id)
    );
  }, [allUsers]);

  // Unassigned individual affiliates
  const unassignedAffiliates = useMemo(() =>
    allUsers.filter(user => !assignedIds.includes(user.id)).map(user => ({
      id: user.id,
      name: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      businesses: user._count?.businesses ?? 0,
      customers: 0,
      score: user.reportingScore ?? 0,
    })), [allUsers, assignedIds]
  );

  const filteredUnassigned = unassignedAffiliates.filter(a =>
    a.name.toLowerCase().includes(searchAffiliate.toLowerCase()) ||
    a.email.toLowerCase().includes(searchAffiliate.toLowerCase())
  );

  // Selected manager details & managed team count
  const selectedManager = useMemo(() => {
    if (!selectedManagerId) return null;
    const mgr = allUsers.find(u => u.id === selectedManagerId);
    if (!mgr) return null;
    const teamMembers = allUsers.filter(u => u.managerId === mgr.id || u.supervisorId === mgr.id);
    return { ...mgr, teamMembers };
  }, [selectedManagerId, allUsers]);

  if (clusterQuery.isLoading) {
    return <AdminLayout><div className="py-20 text-center text-sm text-slate-500">Loading location...</div></AdminLayout>;
  }
  if (clusterQuery.isError || !location || !locationRecord) {
    return (
      <AdminLayout>
        <div className="max-w-3xl mx-auto text-center py-20">
          <p className="text-lg font-bold text-slate-500">{clusterQuery.isError ? 'Unable to load location' : 'Location not found'}</p>
          {clusterQuery.isError && <button onClick={() => clusterQuery.refetch()} className="text-sm text-blue-600 underline mt-2">Retry</button>}
          <Link href="/admin/market-mapping/assign" className="text-sm text-blue-600 hover:underline mt-2 inline-block">Back to locations</Link>
        </div>
      </AdminLayout>
    );
  }

  const toggleAffiliate = (id: string) => {
    setSelectedAffiliateIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const formatDurationBadge = (duration?: AssignmentDuration, expiresAt?: string | null) => {
    if (!duration || duration === 'FOREVER') return { label: 'Forever', color: 'bg-slate-100 text-slate-600' };
    if (expiresAt && new Date(expiresAt) < new Date()) {
      return { label: 'Expired', color: 'bg-red-50 text-red-700 font-bold' };
    }
    switch (duration) {
      case 'ONE_DAY': return { label: '1 Day', color: 'bg-amber-50 text-amber-700' };
      case 'ONE_WEEK': return { label: '1 Week', color: 'bg-blue-50 text-blue-700' };
      case 'ONE_MONTH': return { label: '1 Month', color: 'bg-emerald-50 text-emerald-700' };
      case 'CUSTOM': return { label: 'Custom', color: 'bg-purple-50 text-purple-700' };
      default: return { label: duration, color: 'bg-slate-100 text-slate-600' };
    }
  };

  const handleAddAssignments = async () => {
    setSubmitting(true);
    setMutationError(null);
    try {
      if (assignMode === 'INDIVIDUAL') {
        for (const userId of selectedAffiliateIds) {
          await createAssignment.mutateAsync({
            userId,
            clusterId,
            dailyLeadTarget: dailyTarget,
            weeklyLeadTarget: weeklyTarget,
            monthlyConversionTarget: monthlyTarget,
            allowUserEdit,
            duration: selectedDuration,
            customDays: selectedDuration === 'CUSTOM' ? customDays : undefined,
            customExpiresAt: selectedDuration === 'CUSTOM' && customExpiresAt ? new Date(customExpiresAt).toISOString() : undefined,
            reassignExisting: true,
          });
        }
      } else if (assignMode === 'LINE_MANAGER' && selectedManagerId) {
        await assignLineManager.mutateAsync({
          managerId: selectedManagerId,
          clusterId,
          dailyLeadTarget: dailyTarget,
          weeklyLeadTarget: weeklyTarget,
          monthlyConversionTarget: monthlyTarget,
          allowUserEdit,
          duration: selectedDuration,
          customDays: selectedDuration === 'CUSTOM' ? customDays : undefined,
          customExpiresAt: selectedDuration === 'CUSTOM' && customExpiresAt ? new Date(customExpiresAt).toISOString() : undefined,
          includeTeamMembers,
          reassignExisting: true,
        });
      }
      setDone(true);
      setSelectedAffiliateIds([]);
      setSelectedManagerId('');
      setShowAddForm(false);
    } catch {
      setMutationError('Unable to assign location. Please verify input data and retry.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveTargets = async () => {
    setSubmitting(true);
    setMutationError(null);
    try {
      for (const assignment of (assignmentsQuery.data ?? []).filter(a => a.clusterId === clusterId)) {
        await updateAssignment.mutateAsync({
          id: assignment.id,
          dailyLeadTarget: dailyTarget,
          weeklyLeadTarget: weeklyTarget,
          monthlyConversionTarget: monthlyTarget,
          allowUserEdit,
        });
      }
      setDone(true);
    } catch {
      setMutationError('Unable to save targets. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  const openAffiliateDetail = (aff: Affiliate) => {
    setSelectedAffiliate(aff);
    setAffiliateTab('history');
    setEditAffTarget(aff.target ?? defaultTargets);
    setEditAffDuration(aff.duration ?? 'FOREVER');
    setReassignTargetClusterId(clusterId);
    setTargetSaved(false);
  };

  const handleSaveAffiliateTarget = async () => {
    if (!selectedAffiliate?.assignmentId) return;
    setSavingAffTarget(true);
    setMutationError(null);
    setTargetSaved(false);
    try {
      await updateAssignment.mutateAsync({
        id: selectedAffiliate.assignmentId,
        dailyLeadTarget: editAffTarget.daily,
        weeklyLeadTarget: editAffTarget.weekly,
        monthlyConversionTarget: editAffTarget.monthly,
        duration: editAffDuration,
      });
      setTargetSaved(true);
    } catch {
      setMutationError('Unable to save affiliate target. Please retry.');
    } finally {
      setSavingAffTarget(false);
    }
  };

  const handleReassignClusterSubmit = async () => {
    if (!selectedAffiliate?.assignmentId || !reassignTargetClusterId) return;
    setSubmitting(true);
    setMutationError(null);
    try {
      await reassignAssignment.mutateAsync({
        id: selectedAffiliate.assignmentId,
        clusterId: reassignTargetClusterId,
        duration: editAffDuration,
      });
      setSelectedAffiliate(null);
      setDone(true);
    } catch {
      setMutationError('Unable to reassign affiliate to new location. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveAssignment = async (affId: string) => {
    const assignment = (assignmentsQuery.data ?? []).find(a => a.userId === affId);
    try {
      if (assignment) await deleteAssignment.mutateAsync(assignment.id);
    } catch {
      setMutationError('Unable to remove assignment. Please retry.');
      return;
    }
    setSelectedAffiliate(null);
    setDone(true);
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {mutationError && <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-sm text-red-700 font-medium flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{mutationError}</div>}

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/admin/market-mapping/assign" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              {locationRecord.name}
            </h1>
            <p className="text-xs text-slate-500 font-medium">{locationRecord.area}, {locationRecord.city} — {locationRecord.businesses} businesses, {locationRecord.penetration}% penetration</p>
          </div>
        </div>

        {/* Cluster Overview Card */}
        <ClusterDetailPanel
          cluster={{ ...location, assignedAffiliatesCount: assignedAffiliates.length, assignedAffiliates: assignedAffiliates.map(a => ({ id: a.id, fullName: a.name, businessesAssigned: a.businesses, businessesVisited: 0, customersClosed: a.customers, performanceScore: a.score })), totalBusinesses: locationRecord.businesses, penetrationPercentage: locationRecord.penetration, areaName: locationRecord.area, cityName: locationRecord.city, stateName: '', countryName: '', verifiedBusinesses: location.verifiedBusinesses ?? 0, customersCount: location.customersCount ?? 0, anchorBusinessesCount: location.anchorBusinessesCount ?? 0, prospectsCount: location.prospectsCount ?? 0, discoveryProgress: location.discoveryProgress ?? 0, verificationProgress: location.verificationProgress ?? 0, salesContactProgress: location.salesContactProgress ?? 0, partnershipsProgress: location.partnershipsProgress ?? 0, overallCompletion: location.overallCompletion ?? 0, currentStage: location.currentStage ?? 1, nextRecommendedAction: location.nextRecommendedAction ?? '', createdAt: location.createdAt ?? '', updatedAt: location.updatedAt ?? '' }}
          showActions={false}
        />

        {/* Success indicator */}
        {done && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
            <p className="text-sm font-bold text-emerald-900">Cluster assignments & duration saved successfully</p>
          </div>
        )}

        {/* Assigned Affiliates Section */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <h2 className="font-bold text-slate-900">Assigned Affiliates & Team Members ({assignedAffiliates.length})</h2>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Add / Assign Team
            </button>
          </div>

          {assignedAffiliates.length > 0 ? (
            <div className="p-6 space-y-3">
              {assignedAffiliates.map(aff => {
                const badge = formatDurationBadge(aff.duration, aff.expiresAt);
                return (
                  <div
                    key={aff.id}
                    onClick={() => openAffiliateDetail(aff)}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                        {aff.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900">{aff.name}</p>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200/60 text-slate-600 uppercase tracking-wider">{aff.role}</span>
                        </div>
                        <p className="text-xs text-slate-500">{aff.email} {aff.phone && `· ${aff.phone}`}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className={cn("inline-block text-[11px] font-bold px-2.5 py-1 rounded-lg", badge.color)}>
                          {badge.label}
                        </span>
                        {aff.expiresAt && !aff.isExpired && (
                          <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 justify-end">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {new Date(aff.expiresAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-600">No affiliates or line managers assigned yet</p>
              <p className="text-xs text-slate-400 mt-1">Click &quot;Add / Assign Team&quot; to assign affiliates or line managers with time durations.</p>
            </div>
          )}

          {/* Add / Assign Form */}
          {showAddForm && (
            <div className="border-t border-slate-200 p-6 space-y-6 bg-slate-50/50">

              {/* Mode Switcher */}
              <div className="flex bg-slate-200/80 p-1 rounded-xl w-fit">
                <button
                  type="button"
                  onClick={() => setAssignMode('INDIVIDUAL')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                    assignMode === 'INDIVIDUAL' ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <UserPlus className="w-3.5 h-3.5" /> Assign Affiliates/Agents
                </button>
                <button
                  type="button"
                  onClick={() => setAssignMode('LINE_MANAGER')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                    assignMode === 'LINE_MANAGER' ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" /> Assign Line Manager & Team
                </button>
              </div>

              {/* Duration Selector Section */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600" /> Assignment Duration
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {durationOptions.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedDuration(opt.id)}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all",
                        selectedDuration === opt.id
                          ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      )}
                    >
                      <p className={cn("text-xs font-bold", selectedDuration === opt.id ? "text-blue-900" : "text-slate-800")}>{opt.label}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{opt.description}</p>
                    </button>
                  ))}
                </div>

                {/* Custom duration inputs */}
                {selectedDuration === 'CUSTOM' && (
                  <div className="mt-3 p-3 bg-purple-50/50 border border-purple-100 rounded-xl space-y-3">
                    <p className="text-xs font-bold text-purple-900">Set Custom Expiration</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">Pick Expiration Date</label>
                        <input
                          type="date"
                          value={customExpiresAt}
                          onChange={e => setCustomExpiresAt(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-purple-400"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">Or Days Count</label>
                        <div className="flex gap-1.5">
                          {[3, 7, 14, 30, 60].map(days => (
                            <button
                              key={days}
                              type="button"
                              onClick={() => { setCustomDays(days); setCustomExpiresAt(''); }}
                              className={cn(
                                "px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all",
                                customDays === days && !customExpiresAt ? "bg-purple-600 text-white border-purple-600" : "bg-white border-slate-200 text-slate-700 hover:border-purple-300"
                              )}
                            >
                              {days}d
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* MODE 1: Individual Selection */}
              {assignMode === 'INDIVIDUAL' && (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-800">Select affiliates or agents to assign to <strong>{locationRecord.name}</strong> for <strong>{durationOptions.find(d => d.id === selectedDuration)?.label}</strong>.</p>
                  </div>

                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchAffiliate}
                      onChange={e => setSearchAffiliate(e.target.value)}
                      placeholder="Search unassigned affiliates or agents..."
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 transition-all"
                    />
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto bg-white p-2 border border-slate-200 rounded-xl">
                    {filteredUnassigned.length === 0 && <p className="text-xs text-slate-400 py-4 text-center">No unassigned affiliates found</p>}
                    {filteredUnassigned.map(aff => {
                      const isSelected = selectedAffiliateIds.includes(aff.id);
                      return (
                        <button
                          key={aff.id}
                          type="button"
                          onClick={() => toggleAffiliate(aff.id)}
                          className={cn("w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all", isSelected ? "border-blue-300 bg-blue-50/70 ring-2 ring-blue-200" : "border-slate-100 hover:border-blue-200 bg-white")}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn("w-5 h-5 rounded border-2 flex items-center justify-center transition-all", isSelected ? "bg-blue-600 border-blue-600" : "border-slate-300")}>
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                            </div>
                            <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">{aff.name.charAt(0)}</div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{aff.name}</p>
                              <p className="text-xs text-slate-500">{aff.email} · {aff.role}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* MODE 2: Line Manager Selection */}
              {assignMode === 'LINE_MANAGER' && (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-100 rounded-xl">
                    <Info className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-purple-900">Select a Line Manager to assign to <strong>{locationRecord.name}</strong>. All affiliates/agents under this line manager will automatically be assigned for the exact same duration.</p>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto bg-white p-2 border border-slate-200 rounded-xl">
                    {lineManagers.length === 0 && <p className="text-xs text-slate-400 py-4 text-center">No line managers found</p>}
                    {lineManagers.map(mgr => {
                      const isSelected = selectedManagerId === mgr.id;
                      const teamCount = allUsers.filter(u => u.managerId === mgr.id || u.supervisorId === mgr.id).length;
                      return (
                        <button
                          key={mgr.id}
                          type="button"
                          onClick={() => setSelectedManagerId(mgr.id)}
                          className={cn("w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all", isSelected ? "border-purple-400 bg-purple-50/70 ring-2 ring-purple-200" : "border-slate-100 hover:border-purple-200 bg-white")}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all", isSelected ? "bg-purple-600 border-purple-600" : "border-slate-300")}>
                              {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                            <div className="w-9 h-9 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-xs">{mgr.fullName.charAt(0)}</div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{mgr.fullName}</p>
                              <p className="text-xs text-slate-500">{mgr.email} · {mgr.role}</p>
                            </div>
                          </div>
                          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 flex items-center gap-1">
                            <Users className="w-3 h-3" /> {teamCount} Team Members
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {selectedManager && (
                    <div className="p-4 bg-white border border-purple-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-800">Cascade Options</p>
                        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={includeTeamMembers}
                            onChange={e => setIncludeTeamMembers(e.target.checked)}
                            className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                          />
                          Automatically assign all {selectedManager.teamMembers.length} team members under {selectedManager.fullName}
                        </label>
                      </div>

                      {includeTeamMembers && selectedManager.teamMembers.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {selectedManager.teamMembers.map(tm => (
                            <span key={tm.id} className="text-[11px] font-medium px-2 py-1 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                              {tm.fullName} ({tm.role})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddForm(false); setSelectedAffiliateIds([]); setSelectedManagerId(''); }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddAssignments}
                  disabled={
                    submitting ||
                    (assignMode === 'INDIVIDUAL' && selectedAffiliateIds.length === 0) ||
                    (assignMode === 'LINE_MANAGER' && !selectedManagerId)
                  }
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-all shadow-sm"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Confirm Assignment ({assignMode === 'INDIVIDUAL' ? selectedAffiliateIds.length : (selectedManager?.teamMembers.length ?? 0) + 1})
                </button>
              </div>

            </div>
          )}
        </div>

        {/* Targets & Permissions Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-600" />
            <h2 className="font-bold text-slate-900">Targets & Permissions</h2>
          </div>
          <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-800">These targets appear on each affiliate&apos;s dashboard as their daily, weekly, and monthly goals.</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Daily Target</label>
              <input type="number" value={dailyTarget} onChange={e => setDailyTarget(Number(e.target.value))} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Weekly Target</label>
              <input type="number" value={weeklyTarget} onChange={e => setWeeklyTarget(Number(e.target.value))} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Monthly Target</label>
              <input type="number" value={monthlyTarget} onChange={e => setMonthlyTarget(Number(e.target.value))} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-start gap-3">
              <ToggleLeft className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-slate-900">Allow affiliates to edit targets</p>
                <p className="text-xs text-slate-500">When enabled, affiliates can adjust their own daily/weekly/monthly targets within their dashboard.</p>
              </div>
            </div>
            <button onClick={() => setAllowUserEdit(!allowUserEdit)} className={cn("relative w-12 h-6 rounded-full transition-all", allowUserEdit ? "bg-blue-600" : "bg-slate-300")}>
              <div className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all", allowUserEdit ? "left-6" : "left-0.5")} />
            </button>
          </div>
          <div className="flex justify-end">
            <button onClick={handleSaveTargets} disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 disabled:opacity-40 transition-all">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Save Targets
            </button>
          </div>
        </div>
      </div>

      {/* Affiliate Detail & Reassignment Modal */}
      {selectedAffiliate && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedAffiliate(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10">
            {/* Modal header */}
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-base">{selectedAffiliate.name.charAt(0)}</div>
                <div>
                  <h3 className="font-bold text-slate-900">{selectedAffiliate.name}</h3>
                  <p className="text-xs text-slate-500">{selectedAffiliate.email} {selectedAffiliate.phone && `· ${selectedAffiliate.phone}`}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setSelectedAffiliate(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal tabs */}
            <div className="flex border-b border-slate-100 px-6 bg-slate-50">
              <button
                onClick={() => setAffiliateTab('history')}
                className={cn("px-4 py-3 text-xs font-bold border-b-2 transition-all", affiliateTab === 'history' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500")}
              >
                Submission History
              </button>
              <button
                onClick={() => setAffiliateTab('target')}
                className={cn("px-4 py-3 text-xs font-bold border-b-2 transition-all", affiliateTab === 'target' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500")}
              >
                Edit Duration & Targets
              </button>
              <button
                onClick={() => setAffiliateTab('reassign')}
                className={cn("px-4 py-3 text-xs font-bold border-b-2 transition-all", affiliateTab === 'reassign' ? "border-purple-600 text-purple-600" : "border-transparent text-slate-500")}
              >
                Reassign Location
              </button>
            </div>

            {/* Tab content */}
            <div className="p-6 space-y-4">
              {affiliateTab === 'history' && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-700">Submissions in this location</p>
                  {(submissionsQuery.data ?? []).length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">No submissions recorded yet for this location</p>
                  ) : (
                    (submissionsQuery.data ?? []).map(sub => (
                      <div key={sub.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-900">{sub.name}</p>
                          <p className="text-[10px] text-slate-500">Submitted by {sub.submittedBy ?? 'Affiliate'}</p>
                        </div>
                        <span className="text-[10px] text-slate-400">{sub.date}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {affiliateTab === 'target' && (
                <div className="space-y-4">
                  {targetSaved && <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold">Duration & Targets updated successfully!</div>}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Duration</label>
                    <select
                      value={editAffDuration}
                      onChange={e => setEditAffDuration(e.target.value as AssignmentDuration)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                    >
                      {durationOptions.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.label} — {opt.description}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Daily Target</label>
                      <input type="number" value={editAffTarget.daily} onChange={e => setEditAffTarget({ ...editAffTarget, daily: Number(e.target.value) })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Weekly Target</label>
                      <input type="number" value={editAffTarget.weekly} onChange={e => setEditAffTarget({ ...editAffTarget, weekly: Number(e.target.value) })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Monthly Target</label>
                      <input type="number" value={editAffTarget.monthly} onChange={e => setEditAffTarget({ ...editAffTarget, monthly: Number(e.target.value) })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs" />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button onClick={handleSaveAffiliateTarget} disabled={savingAffTarget} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all">
                      {savingAffTarget ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Save Updates
                    </button>
                  </div>
                </div>
              )}

              {affiliateTab === 'reassign' && (
                <div className="space-y-4">
                  <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-xs text-purple-900 leading-relaxed">
                    Intentionally reassign <strong>{selectedAffiliate.name}</strong> to a different location/cluster. Their active assignment will be transferred.
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Select New Location / Cluster</label>
                    <select
                      value={reassignTargetClusterId}
                      onChange={e => setReassignTargetClusterId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                    >
                      <option value="">-- Choose New Location --</option>
                      {(locationsQuery.data ?? []).map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.name} ({loc.parent?.name ?? 'General'})</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <button onClick={() => handleRemoveAssignment(selectedAffiliate.id)} className="text-xs font-bold text-red-600 hover:underline">
                      Unassign / Remove Assignment
                    </button>
                    <button onClick={handleReassignClusterSubmit} disabled={submitting || !reassignTargetClusterId || reassignTargetClusterId === clusterId} className="flex items-center gap-1.5 px-5 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 disabled:opacity-40 transition-all">
                      {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      Reassign Location
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
