'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import ClusterDetailPanel from '@/components/admin/market-mapping/ClusterDetailPanel';
import { ArrowLeft, Search, MapPin, Users, Target, CheckCircle2, Plus, X, Loader2, Info, ToggleLeft, Eye, UserPlus, Clock, Building2, History, Edit3, ChevronRight, Save } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useUsers } from '@/services/useAdminHooks';
import type { User } from '@/types/api';
import {
  useAdminClusterDetail,
  useAdminAssignments,
  useCreateAssignment,
  useUpdateAssignment,
  useDeleteAssignment,
  useAdminSubmissions
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
  businesses: number;
  customers: number;
  score: number;
  assignedAt?: string;
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

interface LocationRecord {
  id: string;
  name: string;
  area: string;
  city: string;
  businesses: number;
  affiliates: number;
  penetration: number;
  assigned: string[];
  targets: AffiliateTarget;
  allowUserEdit: boolean;
}

const defaultTargets: AffiliateTarget = { daily: 0, weekly: 0, monthly: 0 };

export default function LocationDetailPage() {
  const params = useParams<{ id: string }>();
  const clusterId = Array.isArray(params.id) ? params.id[0] : params.id;
  const clusterQuery = useAdminClusterDetail(clusterId);
  const assignmentsQuery = useAdminAssignments();
  const usersQuery = useUsers({ role: 'AFFILIATE' });
  const submissionsQuery = useAdminSubmissions(clusterId);
  const createAssignment = useCreateAssignment();
  const updateAssignment = useUpdateAssignment();
  const deleteAssignment = useDeleteAssignment();
  const location = clusterQuery.data?.cluster;
  const locationRecord = location ? { id: location.id, name: location.name, area: location.areaName ?? location.parent?.name ?? 'General', city: location.cityName ?? 'Unknown', businesses: location.totalBusinesses ?? clusterQuery.data?.businesses.length ?? 0, affiliates: 0, penetration: location.penetrationPercentage ?? 0, targets: defaultTargets, allowUserEdit: true } : null;

  const [selectedAffiliateIds, setSelectedAffiliateIds] = useState<string[]>([]);
  const [searchAffiliate, setSearchAffiliate] = useState('');
  const [dailyTarget, setDailyTarget] = useState(0);
  const [weeklyTarget, setWeeklyTarget] = useState(0);
  const [monthlyTarget, setMonthlyTarget] = useState(0);
  const [allowUserEdit, setAllowUserEdit] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Affiliate detail modal state
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [affiliateTab, setAffiliateTab] = useState<'history' | 'target'>('history');
  const [editAffTarget, setEditAffTarget] = useState<AffiliateTarget>({ daily: 0, weekly: 0, monthly: 0 });
  const [savingAffTarget, setSavingAffTarget] = useState(false);
  const [targetSaved, setTargetSaved] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  // For the "Add More" flow, we need to track new assignments
  const [assignedIds, setAssignedIds] = useState<string[]>([]);

  useEffect(() => {
    const clusterAssignments = (assignmentsQuery.data ?? []).filter(a => a.clusterId === clusterId);
    setAssignedIds(clusterAssignments.map(a => a.userId));
    const first = clusterAssignments[0];
    setDailyTarget(first?.dailyLeadTarget ?? 0);
    setWeeklyTarget(first?.weeklyLeadTarget ?? 0);
    setMonthlyTarget(first?.monthlyConversionTarget ?? 0);
    setAllowUserEdit(first?.allowUserEdit ?? true);
  }, [assignmentsQuery.data, clusterId]);

  const assignedAffiliates = useMemo(() =>
    (assignmentsQuery.data ?? []).filter(a => a.clusterId === clusterId).map(a => ({
      id: a.userId, name: a.user?.fullName ?? 'Unknown affiliate', email: a.user?.email ?? '', businesses: 0, customers: 0, score: 0,
      assignedAt: a.createdAt, target: { daily: a.dailyLeadTarget, weekly: a.weeklyLeadTarget, monthly: a.monthlyConversionTarget }, assignmentId: a.id,
    })), [assignmentsQuery.data, clusterId]
  );

  const unassignedAffiliates = useMemo(() =>
    (usersQuery.data?.data ?? []).filter((user: User) => !assignedIds.includes(user.id)).map(user => ({
      id: user.id, name: user.fullName, email: user.email, phone: user.phone, businesses: user._count?.businesses ?? 0, customers: 0, score: user.reportingScore ?? 0,
    })), [usersQuery.data, assignedIds]
  );

  const filteredUnassigned = unassignedAffiliates.filter(a =>
    a.name.toLowerCase().includes(searchAffiliate.toLowerCase())
  );

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

  const handleAddAffiliates = async () => {
    setSubmitting(true);
    setMutationError(null);
    try {
      for (const userId of selectedAffiliateIds) await createAssignment.mutateAsync({ userId, clusterId, dailyLeadTarget: dailyTarget, weeklyLeadTarget: weeklyTarget, monthlyConversionTarget: monthlyTarget, allowUserEdit });
      setDone(true); setSelectedAffiliateIds([]); setShowAddForm(false);
    } catch { setMutationError('Unable to assign one or more affiliates. Please retry.'); } finally { setSubmitting(false); }
  };

  const handleSaveTargets = async () => {
    setSubmitting(true);
    setMutationError(null);
    try {
      for (const assignment of (assignmentsQuery.data ?? []).filter(a => a.clusterId === clusterId)) await updateAssignment.mutateAsync({ id: assignment.id, dailyLeadTarget: dailyTarget, weeklyLeadTarget: weeklyTarget, monthlyConversionTarget: monthlyTarget, allowUserEdit });
      setDone(true);
    } catch { setMutationError('Unable to save targets. Please retry.'); } finally { setSubmitting(false); }
  };

  const openAffiliateDetail = (aff: Affiliate) => {
    setSelectedAffiliate(aff);
    setAffiliateTab('history');
    setEditAffTarget(aff.target ?? defaultTargets);
    setTargetSaved(false);
  };

  const handleSaveAffiliateTarget = async () => {
    setSavingAffTarget(true);
    setMutationError(null);
    setTargetSaved(false);
    const assignment = selectedAffiliate?.assignmentId ? (assignmentsQuery.data ?? []).find(a => a.id === selectedAffiliate.assignmentId) : undefined;
    try {
      if (!assignment) {
        setMutationError('The selected affiliate assignment is no longer available. Refresh and try again.');
        return;
      }
      await updateAssignment.mutateAsync({ id: assignment.id, dailyLeadTarget: editAffTarget.daily, weeklyLeadTarget: editAffTarget.weekly, monthlyConversionTarget: editAffTarget.monthly, allowUserEdit: assignment.allowUserEdit });
      setTargetSaved(true);
    } catch { setMutationError('Unable to save affiliate target. Please retry.'); }
    finally { setSavingAffTarget(false); }
  };

  const handleRemoveAssignment = async (affId: string) => {
    const assignment = (assignmentsQuery.data ?? []).find(a => a.clusterId === clusterId && a.userId === affId);
    try { if (assignment) await deleteAssignment.mutateAsync(assignment.id); } catch { setMutationError('Unable to remove assignment. Please retry.'); return; }
    setSelectedAffiliate(null); setDone(true);
  };

  return (
    <AdminLayout>
        <div className="max-w-4xl mx-auto space-y-6">
        {mutationError && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{mutationError}</div>}
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
            <p className="text-sm font-bold text-emerald-900">Changes saved successfully</p>
          </div>
        )}

        {/* Assigned Affiliates Section */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <h2 className="font-bold text-slate-900">Assigned Affiliates ({assignedAffiliates.length})</h2>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add More
            </button>
          </div>

          {assignedAffiliates.length > 0 ? (
            <div className="p-6 space-y-3">
              {assignedAffiliates.map(aff => (
                <div
                  key={aff.id}
                  onClick={() => openAffiliateDetail(aff)}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">{aff.name.charAt(0)}</div>
                    <div>
                      <p className="font-bold text-slate-900">{aff.name}</p>
                      <p className="text-xs text-slate-500">{aff.email} — {aff.businesses} businesses, {aff.customers} customers</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn("text-xs font-extrabold px-2 py-1 rounded-lg", aff.score >= 90 ? "bg-emerald-50 text-emerald-700" : aff.score >= 80 ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500")}>{aff.score}%</span>
                    {aff.assignedAt && <span className="text-[10px] text-slate-400">Since {aff.assignedAt}</span>}
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-500">No affiliates assigned yet</p>
              <p className="text-xs text-slate-400 mt-1">Click &quot;Add More&quot; to assign affiliates to this location</p>
            </div>
          )}

          {/* Add more affiliates form */}
          {showAddForm && (
            <div className="border-t border-slate-100 p-6 space-y-4">
              <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
               <p className="text-xs text-blue-800">Select additional affiliates to assign to <strong>{locationRecord.name}</strong>. Assigned affiliates can visit businesses, capture data, and manage pipeline statuses for this location.</p>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" value={searchAffiliate} onChange={e => setSearchAffiliate(e.target.value)} placeholder="Search unassigned affiliates..." className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 transition-all" />
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredUnassigned.length === 0 && <p className="text-xs text-slate-400 py-4 text-center">No unassigned affiliates found</p>}
                {filteredUnassigned.map(aff => {
                  const isSelected = selectedAffiliateIds.includes(aff.id);
                  return (
                    <button key={aff.id} onClick={() => toggleAffiliate(aff.id)} className={cn("w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all", isSelected ? "border-blue-300 bg-blue-50 ring-2 ring-blue-200" : "border-slate-200 hover:border-blue-200 bg-white")}>
                      <div className="flex items-center gap-3">
                        <div className={cn("w-5 h-5 rounded border-2 flex items-center justify-center transition-all", isSelected ? "bg-blue-600 border-blue-600" : "border-slate-300")}>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </div>
                        <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">{aff.name.charAt(0)}</div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{aff.name}</p>
                          <p className="text-xs text-slate-500">{aff.email}</p>
                        </div>
                      </div>
                      <span className={cn("text-xs font-extrabold px-2 py-1 rounded-lg", aff.score >= 90 ? "bg-emerald-50 text-emerald-700" : aff.score >= 80 ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500")}>{aff.score}%</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => { setShowAddForm(false); setSelectedAffiliateIds([]); }} className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900">Cancel</button>
                <button onClick={handleAddAffiliates} disabled={selectedAffiliateIds.length === 0 || submitting} className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-all">
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-pulse" /> : <UserPlus className="w-3.5 h-3.5" />}
                  Assign {selectedAffiliateIds.length > 0 ? `(${selectedAffiliateIds.length})` : ''}
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
             <p className="text-xs text-blue-800">These targets appear on each affiliate&apos;s dashboard as their daily, weekly, and monthly goals. If &quot;Allow user edit&quot; is on, affiliates can adjust these values themselves.</p>
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
                <p className="text-xs text-slate-500">When enabled, affiliates can adjust their own daily/weekly/monthly targets within their dashboard. Disable to lock targets to admin-set values.</p>
              </div>
            </div>
            <button onClick={() => setAllowUserEdit(!allowUserEdit)} className={cn("relative w-12 h-6 rounded-full transition-all", allowUserEdit ? "bg-blue-600" : "bg-slate-300")}>
              <div className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all", allowUserEdit ? "left-6" : "left-0.5")} />
            </button>
          </div>
          <div className="flex justify-end">
            <button onClick={handleSaveTargets} disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 disabled:opacity-40 transition-all">
              {submitting ? <Loader2 className="w-4 h-4 animate-pulse" /> : <CheckCircle2 className="w-4 h-4" />}
              Save Targets
            </button>
          </div>
        </div>

        {/* How this connects to affiliate dashboard */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-purple-600" />
            <h2 className="font-bold text-slate-900">Affiliate Dashboard View</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
              <p className="text-xs font-bold text-purple-700 mb-2">Pipeline Statuses</p>
              <p className="text-[10px] text-purple-600 leading-relaxed">Affiliates see the pipeline statuses you configure under <strong>Configuration</strong> tab. Each business they capture moves through these stages.</p>
            </div>
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-xs font-bold text-blue-700 mb-2">Performance Targets</p>
               <p className="text-[10px] text-blue-600 leading-relaxed">Daily, weekly, and monthly targets appear on the affiliate&apos;s dashboard. Progress bars show how they&apos;re performing against these goals.</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
              <p className="text-xs font-bold text-emerald-700 mb-2">Business Capture</p>
              <p className="text-[10px] text-emerald-600 leading-relaxed">Affiliates assigned to this location can add businesses, upload documents, and update pipeline statuses from their mobile dashboard.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Affiliate Detail Modal */}
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
                <span className={cn("text-xs font-extrabold px-2.5 py-1.5 rounded-lg", selectedAffiliate.score >= 90 ? "bg-emerald-50 text-emerald-700" : selectedAffiliate.score >= 80 ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500")}>{selectedAffiliate.score}%</span>
                <button onClick={() => setSelectedAffiliate(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 px-6">
              <button
                onClick={() => setAffiliateTab('history')}
                className={cn("flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition-all", affiliateTab === 'history' ? "text-blue-600 border-blue-600" : "text-slate-500 border-transparent hover:text-slate-700")}
              >
                <History className="w-3.5 h-3.5" /> Activity History
              </button>
              <button
                onClick={() => setAffiliateTab('target')}
                className={cn("flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition-all", affiliateTab === 'target' ? "text-blue-600 border-blue-600" : "text-slate-500 border-transparent hover:text-slate-700")}
              >
                <Target className="w-3.5 h-3.5" /> Targets
              </button>
            </div>

            <div className="p-6">
              {/* Activity History Tab */}
              {affiliateTab === 'history' && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                   <p className="text-xs text-blue-800">Showing the latest {submissionsQuery.data?.length ?? 0} submissions for <strong>{selectedAffiliate.name}</strong> at this location.</p>
                  </div>

                   {(submissionsQuery.data ?? []).length > 0 ? (
                    <div className="space-y-2">
                       {(submissionsQuery.data ?? []).map(sub => (
                        <div key={sub.id} className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                           <div className={cn("p-2 rounded-xl mt-0.5", sub.type === 'BUSINESS' ? "bg-emerald-50" : "bg-blue-50")}>
                             {sub.type === 'BUSINESS' ? <Building2 className="w-4 h-4 text-emerald-600" /> : <Edit3 className="w-4 h-4 text-blue-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                               <p className="text-sm font-bold text-slate-900">{sub.name}</p>
                               <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-md", sub.type === 'BUSINESS' ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700")}>
                                 {sub.type === 'BUSINESS' ? 'Business' : 'Lead'}
                              </span>
                            </div>
                           <p className="text-xs text-slate-600 mt-0.5">Submitted by {sub.submittedBy ?? 'Unknown'}</p>
                            <div className="flex items-center gap-1 mt-1.5">
                              <Clock className="w-3 h-3 text-slate-400" />
                               <span className="text-[10px] text-slate-400">{new Date(sub.date).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Link
                         href={`/admin/affiliates/${selectedAffiliate.id}/history?locationId=${clusterId}`}
                        className="flex items-center justify-center gap-2 w-full py-3 mt-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> View All History for {selectedAffiliate.name}
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-500">No activity yet</p>
                      <p className="text-xs text-slate-400 mt-1">This affiliate has not submitted any businesses at this location</p>
                    </div>
                  )}
                </div>
              )}

              {/* Targets Tab */}
              {affiliateTab === 'target' && (
                <div className="space-y-5">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-800">Set a custom target for <strong>{selectedAffiliate.name}</strong>. These values override the location default if filled in. Leave at 0 to use the location-level target.</p>
                  </div>

                  {targetSaved && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                      <p className="text-xs font-bold text-emerald-900">Target updated for {selectedAffiliate.name}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Daily Target</label>
                      <div className="relative">
                        <input type="number" value={editAffTarget.daily} onChange={e => setEditAffTarget(prev => ({ ...prev, daily: Number(e.target.value) }))} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium">businesses</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Weekly Target</label>
                      <div className="relative">
                        <input type="number" value={editAffTarget.weekly} onChange={e => setEditAffTarget(prev => ({ ...prev, weekly: Number(e.target.value) }))} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium">businesses</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Monthly Target</label>
                      <div className="relative">
                        <input type="number" value={editAffTarget.monthly} onChange={e => setEditAffTarget(prev => ({ ...prev, monthly: Number(e.target.value) }))} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium">businesses</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-100 rounded-xl">
                    <div className="flex items-start gap-3">
                      <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-amber-900">Per-affiliate override</p>
                        <p className="text-xs text-amber-700">Setting values here overrides the location-level targets for this affiliate only. Leave at 0 to fall back to the location defaults.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => handleRemoveAssignment(selectedAffiliate.id)}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <X className="w-3.5 h-3.5" /> Remove from location
                    </button>
                    <button
                      onClick={handleSaveAffiliateTarget}
                      disabled={savingAffTarget}
                      className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-40 transition-all"
                    >
                      {savingAffTarget ? <Loader2 className="w-4 h-4 animate-pulse" /> : <Save className="w-4 h-4" />}
                      Save Target
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
