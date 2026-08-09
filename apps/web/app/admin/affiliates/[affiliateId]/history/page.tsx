'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdminUser, useUserHistory, useUserLocations } from '@/services/useAdminHooks';
import { cn } from '@/lib/utils';
import { AlertCircle, ArrowLeft, Building2, Clock, Edit3, History, Loader2, MapPin, Search } from 'lucide-react';

export default function AffiliateHistoryPage() {
  const params = useParams<{ affiliateId: string }>();
  const searchParams = useSearchParams();
  const affiliateId = params.affiliateId;
  const locationIdParam = searchParams.get('locationId');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(locationIdParam);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setSelectedLocation(locationIdParam);
  }, [locationIdParam]);

  const userQuery = useAdminUser(affiliateId);
  const locationsQuery = useUserLocations(affiliateId);
  const historyQuery = useUserHistory(affiliateId);
  const isLoading = userQuery.isLoading || locationsQuery.isLoading || historyQuery.isLoading;
  const error = userQuery.error || locationsQuery.error || historyQuery.error;

  const locations = locationsQuery.data?.marketMappingAssignments ?? [];
  const entries = useMemo(() => {
    const activities = (historyQuery.data?.activities ?? []).map(activity => ({
      id: activity.id,
      type: activity.type.toLowerCase().includes('create') ? 'created' : 'updated',
      businessName: activity.businessName || activity.title,
      details: activity.description || activity.title,
      createdAt: activity.createdAt,
      locationId: undefined as string | undefined,
      locationName: undefined as string | undefined,
    }));
    const targetLogs = (historyQuery.data?.targetAdjustmentLogs ?? []).map(log => ({
      id: log.id,
      type: 'updated',
      businessName: 'Performance targets',
      details: log.reason || `Daily target ${log.oldDailyLeadTarget} -> ${log.newDailyLeadTarget}; monthly target ${log.oldMonthlyConversionTarget} -> ${log.newMonthlyConversionTarget}`,
      createdAt: log.createdAt,
      locationId: undefined as string | undefined,
      locationName: undefined as string | undefined,
    }));
    return [...activities, ...targetLogs]
      // The activity endpoint does not attach activities to a cluster, so do not
      // hide valid global activity when a location tab is selected.
      .filter(entry => !selectedLocation || !entry.locationId || entry.locationId === selectedLocation)
      .filter(entry => `${entry.businessName} ${entry.details}`.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [historyQuery.data, search, selectedLocation]);

  if (isLoading) return <AdminLayout><State message="Loading activity history..." loading /></AdminLayout>;
  if (error) return <AdminLayout><State message={error instanceof Error ? error.message : 'Unable to load activity history.'} onRetry={() => { userQuery.refetch(); locationsQuery.refetch(); historyQuery.refetch(); }} /></AdminLayout>;
  if (!userQuery.data) return <AdminLayout><State message="Affiliate not found." notFound /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/affiliates" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-lg">{userQuery.data.fullName.charAt(0)}</div>
          <div><h1 className="text-xl font-bold text-slate-900">{userQuery.data.fullName}</h1><p className="text-xs text-slate-500">{userQuery.data.email} - Full Activity History</p></div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setSelectedLocation(null)} className={cn('px-4 py-2 rounded-xl text-xs font-bold', !selectedLocation ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600')}><History className="w-3.5 h-3.5 inline mr-1.5" />All Locations</button>
          {locations.map(location => <button key={location.id} onClick={() => setSelectedLocation(location.cluster.id)} className={cn('px-4 py-2 rounded-xl text-xs font-bold', selectedLocation === location.cluster.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600')}><MapPin className="w-3.5 h-3.5 inline mr-1.5" />{location.cluster.name}</button>)}
        </div>

        <div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search activity..." className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm" /></div>

        {entries.length === 0 ? <div className="text-center py-16"><History className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-sm font-bold text-slate-500">No activity found</p><p className="text-xs text-slate-400 mt-1">There is no recorded activity matching the current filters.</p></div> :
          <div className="space-y-2">{entries.map(entry => <div key={entry.id} className="flex items-start gap-3 p-4 bg-white border border-slate-100 rounded-xl">
            <div className={cn('p-2 rounded-xl mt-0.5', entry.type === 'created' ? 'bg-emerald-50' : 'bg-blue-50')}>{entry.type === 'created' ? <Building2 className="w-4 h-4 text-emerald-600" /> : <Edit3 className="w-4 h-4 text-blue-600" />}</div>
            <div className="flex-1"><div className="flex items-center gap-2"><p className="text-sm font-bold text-slate-900">{entry.businessName}</p><span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700">{entry.type === 'created' ? 'Created' : 'Updated'}</span></div><p className="text-xs text-slate-600 mt-0.5">{entry.details}</p><span className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-400"><Clock className="w-3 h-3" />{new Date(entry.createdAt).toLocaleString()}</span></div>
          </div>)}</div>}
      </div>
    </AdminLayout>
  );
}

function State({ message, loading = false, notFound = false, onRetry }: { message: string; loading?: boolean; notFound?: boolean; onRetry?: () => void }) {
  return <div className="max-w-3xl mx-auto text-center py-20"><div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4">{loading ? <Loader2 className="w-8 h-8 animate-spin text-blue-600" /> : notFound ? <History className="w-8 h-8 text-slate-400" /> : <AlertCircle className="w-8 h-8 text-red-400" />}</div><p className="text-lg font-bold text-slate-600">{message}</p>{onRetry && <button onClick={onRetry} className="mt-5 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold">Retry</button>}{notFound && <Link href="/admin/affiliates" className="block mt-5 text-sm text-blue-600 hover:underline">Back to affiliates</Link>}</div>;
}
