'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import ClusterDetailPanel from '@/components/admin/market-mapping/ClusterDetailPanel';
import { ArrowLeft, Search, MapPin, Users, Target, CheckCircle2, Plus, X, Loader2, Info, ToggleLeft, Eye, UserPlus, Clock, Building2, History, Edit3, ChevronRight, Save } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { mockClusterDetail } from '@/lib/market-mapping-mock';
import {
  useAdminClusterDetail,
  useAdminAssignments,
  useCreateAssignment,
  useUpdateAssignment,
  useDeleteAssignment,
  useAdminSubmissions
} from '@/services/useMarketMappingHooks';

// --- Mock data ---

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

const defaultTargets: AffiliateTarget = { daily: 20, weekly: 100, monthly: 400 };


const mockAffiliates: Affiliate[] = [
  {
    id: 'aff-1', name: 'Emmanuel Nnamdi', email: 'emmanuel@example.com', phone: '+234 801 234 5678',
    businesses: 45, customers: 20, score: 94, assignedAt: '2026-06-15',
    target: { daily: 20, weekly: 100, monthly: 400 },
    submissions: [
      { id: 'sub-1', businessName: 'Royal Gardens Supermarket', type: 'created', timestamp: '2026-07-28 09:15 AM', details: 'Added new business with contacts and photos' },
      { id: 'sub-2', businessName: 'Banex Electronics Hub', type: 'updated', timestamp: '2026-07-27 02:30 PM', details: 'Updated pipeline status from "Prospect" to "Negotiation"' },
      { id: 'sub-3', businessName: 'Freshmart Groceries', type: 'created', timestamp: '2026-07-25 11:00 AM', details: 'Completed business profile with owner details' },
      { id: 'sub-4', businessName: 'Royal Gardens Supermarket', type: 'updated', timestamp: '2026-07-24 04:45 PM', details: 'Updated customer count and added document upload' },
      { id: 'sub-5', businessName: 'Banex Tech Solutions', type: 'created', timestamp: '2026-07-22 10:30 AM', details: 'Added business from field visit' },
      { id: 'sub-6', businessName: 'Freshmart Groceries', type: 'updated', timestamp: '2026-07-20 01:15 PM', details: 'Added 3 new customer referrals' },
    ],
  },
  {
    id: 'aff-2', name: 'Sarah Okafor', email: 'sarah@example.com', phone: '+234 802 345 6789',
    businesses: 40, customers: 16, score: 88, assignedAt: '2026-06-20',
    target: { daily: 15, weekly: 75, monthly: 300 },
    submissions: [
      { id: 'sub-7', businessName: 'Wuse Fashion House', type: 'created', timestamp: '2026-07-27 10:00 AM', details: 'Filed new fashion boutique with inventory details' },
      { id: 'sub-8', businessName: 'Mega Pharmacy Wuse', type: 'updated', timestamp: '2026-07-26 03:20 PM', details: 'Updated contact number and added business hours' },
      { id: 'sub-9', businessName: 'Wuse Fashion House', type: 'updated', timestamp: '2026-07-25 09:45 AM', details: 'Changed status to "Interested" after follow-up visit' },
    ],
  },
  {
    id: 'aff-3', name: 'Chidi Bello', email: 'chidi@example.com', phone: '+234 803 456 7890',
    businesses: 35, customers: 12, score: 81, assignedAt: '2026-07-01',
    target: { daily: 12, weekly: 60, monthly: 240 },
    submissions: [
      { id: 'sub-10', businessName: 'AutoMart Banex', type: 'created', timestamp: '2026-07-26 12:00 PM', details: 'Registered auto parts dealer with photos' },
      { id: 'sub-11', businessName: 'Quick Eats Restaurant', type: 'created', timestamp: '2026-07-24 05:30 PM', details: 'Added restaurant and set initial pipeline status' },
    ],
  },
  {
    id: 'aff-4', name: 'Fatima Usman', email: 'fatima@example.com', phone: '+234 804 567 8901',
    businesses: 50, customers: 22, score: 91, assignedAt: '2026-06-10',
    target: { daily: 25, weekly: 125, monthly: 500 },
    submissions: [
      { id: 'sub-12', businessName: 'Al-Noor Shopping Center', type: 'created', timestamp: '2026-07-28 08:30 AM', details: 'Added anchor business with full documentation' },
      { id: 'sub-13', businessName: 'Halal Meat Shop', type: 'updated', timestamp: '2026-07-27 11:15 AM', details: 'Updated weekly revenue estimate' },
      { id: 'sub-14', businessName: 'Al-Noor Shopping Center', type: 'updated', timestamp: '2026-07-26 02:00 PM', details: 'Uploaded partnership agreement document' },
      { id: 'sub-15', businessName: 'Fashion & Fabrics Store', type: 'created', timestamp: '2026-07-24 10:45 AM', details: 'Added new business from area walkthrough' },
    ],
  },
  {
    id: 'aff-5', name: 'John Okafor', email: 'john@example.com', phone: '+234 805 678 9012',
    businesses: 0, customers: 0, score: 0, assignedAt: undefined,
    submissions: [],
  },
];

const locationsDb: LocationRecord[] = [
  { id: 'banex', name: 'Banex Plaza', area: 'Wuse', city: 'Abuja', businesses: 120, affiliates: 3, penetration: 40, assigned: ['aff-1', 'aff-2', 'aff-3'], targets: { daily: 20, weekly: 100, monthly: 400 }, allowUserEdit: true },
  { id: 'wuse-mkt', name: 'Wuse Main Market', area: 'Wuse', city: 'Abuja', businesses: 85, affiliates: 2, penetration: 37.6, assigned: ['aff-2', 'aff-4'], targets: { daily: 15, weekly: 75, monthly: 300 }, allowUserEdit: true },
  { id: 'garki-mkt', name: 'Garki Model Market', area: 'Garki', city: 'Abuja', businesses: 90, affiliates: 1, penetration: 27.7, assigned: ['aff-1'], targets: { daily: 10, weekly: 50, monthly: 200 }, allowUserEdit: false },
];

export default function LocationDetailPage() {
  const params = useParams();
  const [location, setLocation] = useState(locationsDb.find(l => l.id === params.id)!);

  const [selectedAffiliateIds, setSelectedAffiliateIds] = useState<string[]>([]);
  const [searchAffiliate, setSearchAffiliate] = useState('');
  const [dailyTarget, setDailyTarget] = useState(location?.targets?.daily ?? 20);
  const [weeklyTarget, setWeeklyTarget] = useState(location?.targets?.weekly ?? 100);
  const [monthlyTarget, setMonthlyTarget] = useState(location?.targets?.monthly ?? 20);
  const [allowUserEdit, setAllowUserEdit] = useState(location?.allowUserEdit ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Affiliate detail modal state
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [affiliateTab, setAffiliateTab] = useState<'history' | 'target'>('history');
  const [editAffTarget, setEditAffTarget] = useState<AffiliateTarget>({ daily: 0, weekly: 0, monthly: 0 });
  const [savingAffTarget, setSavingAffTarget] = useState(false);
  const [targetSaved, setTargetSaved] = useState(false);

  // For the "Add More" flow, we need to track new assignments
  const [assignedIds, setAssignedIds] = useState<string[]>(location?.assigned ?? []);

  const assignedAffiliates = useMemo(() =>
    mockAffiliates.filter(a => assignedIds.includes(a.id)),
    [assignedIds]
  );

  const unassignedAffiliates = useMemo(() =>
    mockAffiliates.filter(a => !assignedIds.includes(a.id)),
    [assignedIds]
  );

  const filteredUnassigned = unassignedAffiliates.filter(a =>
    a.name.toLowerCase().includes(searchAffiliate.toLowerCase())
  );

  if (!location) {
    return (
      <AdminLayout>
        <div className="max-w-3xl mx-auto text-center py-20">
          <p className="text-lg font-bold text-slate-500">Location not found</p>
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

  const handleAddAffiliates = () => {
    setSubmitting(true);
    setTimeout(() => {
      setAssignedIds(prev => [...prev, ...selectedAffiliateIds]);
      setSubmitting(false);
      setDone(true);
      setSelectedAffiliateIds([]);
      setShowAddForm(false);
      setTimeout(() => setDone(false), 2000);
    }, 600);
  };

  const handleSaveTargets = () => {
    setSubmitting(true);
    setTimeout(() => {
      setLocation(prev => ({ ...prev, targets: { daily: dailyTarget, weekly: weeklyTarget, monthly: monthlyTarget }, allowUserEdit }));
      setSubmitting(false);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    }, 600);
  };

  const openAffiliateDetail = (aff: Affiliate) => {
    setSelectedAffiliate(aff);
    setAffiliateTab('history');
    setEditAffTarget(aff.target ?? defaultTargets);
    setTargetSaved(false);
  };

  const handleSaveAffiliateTarget = () => {
    setSavingAffTarget(true);
    setTimeout(() => {
      setSavingAffTarget(false);
      setTargetSaved(true);
      setTimeout(() => setTargetSaved(false), 2000);
    }, 500);
  };

  const handleRemoveAssignment = (affId: string) => {
    setAssignedIds(prev => prev.filter(id => id !== affId));
    setSelectedAffiliate(null);
    setDone(true);
    setTimeout(() => setDone(false), 2000);
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/admin/market-mapping/assign" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              {location.name}
            </h1>
            <p className="text-xs text-slate-500 font-medium">{location.area}, {location.city} — {location.businesses} businesses, {location.penetration}% penetration</p>
          </div>
        </div>

        {/* Cluster Overview Card */}
        <ClusterDetailPanel
          cluster={{
            ...mockClusterDetail,
            name: location.name,
            areaName: location.area,
            cityName: location.city,
            assignedAffiliatesCount: assignedAffiliates.length,
            totalBusinesses: location.businesses,
            penetrationPercentage: location.penetration,
            assignedAffiliates: assignedAffiliates.map(a => ({
              id: a.id,
              fullName: a.name,
              businessesAssigned: a.businesses,
              businessesVisited: Math.round(a.businesses * 0.8),
              customersClosed: a.customers,
              performanceScore: a.score,
            })),
          }}
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
                <p className="text-xs text-blue-800">Select additional affiliates to assign to <strong>{location.name}</strong>. Assigned affiliates can visit businesses, capture data, and manage pipeline statuses for this location.</p>
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
            <p className="text-xs text-blue-800">These targets appear on each affiliate's dashboard as their daily, weekly, and monthly goals. If "Allow user edit" is on, affiliates can adjust these values themselves.</p>
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
              <p className="text-[10px] text-blue-600 leading-relaxed">Daily, weekly, and monthly targets appear on the affiliate's dashboard. Progress bars show how they're performing against these goals.</p>
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
                    <p className="text-xs text-blue-800">Showing the last {selectedAffiliate.submissions?.length ?? 0} activities for <strong>{selectedAffiliate.name}</strong> at this location. Includes both new business creations and updates to existing businesses.</p>
                  </div>

                  {selectedAffiliate.submissions && selectedAffiliate.submissions.length > 0 ? (
                    <div className="space-y-2">
                      {selectedAffiliate.submissions.map(sub => (
                        <div key={sub.id} className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                          <div className={cn("p-2 rounded-xl mt-0.5", sub.type === 'created' ? "bg-emerald-50" : "bg-blue-50")}>
                            {sub.type === 'created' ? <Building2 className="w-4 h-4 text-emerald-600" /> : <Edit3 className="w-4 h-4 text-blue-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold text-slate-900">{sub.businessName}</p>
                              <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-md", sub.type === 'created' ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700")}>
                                {sub.type === 'created' ? 'Created' : 'Updated'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5">{sub.details}</p>
                            <div className="flex items-center gap-1 mt-1.5">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span className="text-[10px] text-slate-400">{sub.timestamp}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Link
                        href={`/admin/affiliates/${selectedAffiliate.id}/history?locationId=${location.id}`}
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
