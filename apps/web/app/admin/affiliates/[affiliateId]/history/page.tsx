'use client';

import { useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/components/admin/AdminLayout';
import { ArrowLeft, MapPin, Clock, Building2, Edit3, History, ChevronRight, Calendar, User, Search, Filter, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HistoryEntry {
  id: string;
  businessName: string;
  type: 'created' | 'updated';
  timestamp: string;
  details: string;
  locationId: string;
  locationName: string;
}

type LocationSummary = {
  id: string;
  name: string;
  area: string;
  city: string;
  totalActivities: number;
  businessesCreated: number;
  businessesUpdated: number;
  lastActive: string;
};

const affiliatesData: Record<string, { name: string; email: string; avatar: string }> = {
  'aff-1': { name: 'Emmanuel Nnamdi', email: 'emmanuel@example.com', avatar: 'E' },
  'aff-2': { name: 'Sarah Okafor', email: 'sarah@example.com', avatar: 'S' },
  'aff-3': { name: 'Chidi Bello', email: 'chidi@example.com', avatar: 'C' },
  'aff-4': { name: 'Fatima Usman', email: 'fatima@example.com', avatar: 'F' },
  'aff-5': { name: 'John Okafor', email: 'john@example.com', avatar: 'J' },
};

const locationsSummary: LocationSummary[] = [
  { id: 'banex', name: 'Banex Plaza', area: 'Wuse', city: 'Abuja', totalActivities: 16, businessesCreated: 7, businessesUpdated: 9, lastActive: '2026-07-28' },
  { id: 'wuse-mkt', name: 'Wuse Main Market', area: 'Wuse', city: 'Abuja', totalActivities: 10, businessesCreated: 4, businessesUpdated: 6, lastActive: '2026-07-27' },
  { id: 'garki-mkt', name: 'Garki Model Market', area: 'Garki', city: 'Abuja', totalActivities: 8, businessesCreated: 3, businessesUpdated: 5, lastActive: '2026-07-25' },
];

const affiliateLocationMap: Record<string, string[]> = {
  'aff-1': ['banex', 'garki-mkt'],
  'aff-2': ['banex', 'wuse-mkt'],
  'aff-3': ['banex'],
  'aff-4': ['wuse-mkt'],
  'aff-5': [],
};

const allHistory: Record<string, HistoryEntry[]> = {
  'aff-1': [
    { id: 'h-1', businessName: 'Royal Gardens Supermarket', type: 'created', timestamp: '2026-07-28 09:15 AM', details: 'Added new business with contacts and photos', locationId: 'banex', locationName: 'Banex Plaza' },
    { id: 'h-2', businessName: 'Banex Electronics Hub', type: 'updated', timestamp: '2026-07-27 02:30 PM', details: 'Updated pipeline status from Prospect to Negotiation', locationId: 'banex', locationName: 'Banex Plaza' },
    { id: 'h-3', businessName: 'Freshmart Groceries', type: 'created', timestamp: '2026-07-25 11:00 AM', details: 'Completed business profile with owner details', locationId: 'banex', locationName: 'Banex Plaza' },
    { id: 'h-4', businessName: 'Royal Gardens Supermarket', type: 'updated', timestamp: '2026-07-24 04:45 PM', details: 'Updated customer count and added document upload', locationId: 'banex', locationName: 'Banex Plaza' },
    { id: 'h-5', businessName: 'Banex Tech Solutions', type: 'created', timestamp: '2026-07-22 10:30 AM', details: 'Added business from field visit', locationId: 'banex', locationName: 'Banex Plaza' },
    { id: 'h-6', businessName: 'Freshmart Groceries', type: 'updated', timestamp: '2026-07-20 01:15 PM', details: 'Added 3 new customer referrals', locationId: 'banex', locationName: 'Banex Plaza' },
    { id: 'h-7', businessName: 'Garki Auto Parts', type: 'created', timestamp: '2026-07-19 09:30 AM', details: 'Registered auto parts dealer in Garki market', locationId: 'garki-mkt', locationName: 'Garki Model Market' },
    { id: 'h-8', businessName: 'Garki Fashion Store', type: 'updated', timestamp: '2026-07-18 11:45 AM', details: 'Updated inventory and added photos', locationId: 'garki-mkt', locationName: 'Garki Model Market' },
    { id: 'h-9', businessName: 'Banex Electronics Hub', type: 'created', timestamp: '2026-07-17 03:00 PM', details: 'New electronics business added to Banex cluster', locationId: 'banex', locationName: 'Banex Plaza' },
    { id: 'h-10', businessName: 'Garki Pharmacy', type: 'created', timestamp: '2026-07-16 10:15 AM', details: 'Registered pharmacy with license documents', locationId: 'garki-mkt', locationName: 'Garki Model Market' },
    { id: 'h-11', businessName: 'Garki Auto Parts', type: 'updated', timestamp: '2026-07-15 02:00 PM', details: 'Updated contact phone number', locationId: 'garki-mkt', locationName: 'Garki Model Market' },
    { id: 'h-12', businessName: 'Garki Fashion Store', type: 'created', timestamp: '2026-07-14 12:30 PM', details: 'New fashion boutique registered in Garki', locationId: 'garki-mkt', locationName: 'Garki Model Market' },
  ],
  'aff-2': [
    { id: 'h-13', businessName: 'Wuse Fashion House', type: 'created', timestamp: '2026-07-27 10:00 AM', details: 'Filed new fashion boutique with inventory details', locationId: 'wuse-mkt', locationName: 'Wuse Main Market' },
    { id: 'h-14', businessName: 'Mega Pharmacy Wuse', type: 'updated', timestamp: '2026-07-26 03:20 PM', details: 'Updated contact number and added business hours', locationId: 'wuse-mkt', locationName: 'Wuse Main Market' },
    { id: 'h-15', businessName: 'Wuse Fashion House', type: 'updated', timestamp: '2026-07-25 09:45 AM', details: 'Changed status to Interested after follow-up visit', locationId: 'wuse-mkt', locationName: 'Wuse Main Market' },
    { id: 'h-16', businessName: 'Grand Mega Supermarket', type: 'created', timestamp: '2026-07-24 11:00 AM', details: 'Added anchor supermarket to Banex cluster', locationId: 'banex', locationName: 'Banex Plaza' },
    { id: 'h-17', businessName: 'HealthPlus Pharmacy', type: 'updated', timestamp: '2026-07-23 04:15 PM', details: 'Updated demo status to completed', locationId: 'banex', locationName: 'Banex Plaza' },
  ],
};

export default function AffiliateHistoryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const affiliateId = params.affiliateId as string;
  const locationIdParam = searchParams.get('locationId');

  const affiliate = affiliatesData[affiliateId];
  const locationIds = affiliateLocationMap[affiliateId] || [];
  const [selectedLocation, setSelectedLocation] = useState<string | null>(locationIdParam);
  const [search, setSearch] = useState('');

  const locations = locationsSummary.filter(l => locationIds.includes(l.id));

  const filteredHistory = useMemo(() => {
    let entries = allHistory[affiliateId] || [];
    if (selectedLocation) {
      entries = entries.filter(e => e.locationId === selectedLocation);
    }
    if (search) {
      entries = entries.filter(e =>
        e.businessName.toLowerCase().includes(search.toLowerCase()) ||
        e.details.toLowerCase().includes(search.toLowerCase())
      );
    }
    return entries;
  }, [affiliateId, selectedLocation, search]);

  const locationStats = selectedLocation
    ? locationsSummary.find(l => l.id === selectedLocation)
    : null;

  if (!affiliate) {
    return (
      <AdminLayout>
        <div className="max-w-3xl mx-auto text-center py-20">
          <p className="text-lg font-bold text-slate-500">Affiliate not found</p>
          <Link href="/admin/affiliates" className="text-sm text-blue-600 hover:underline mt-2 inline-block">Back to affiliates</Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href={locationIdParam ? `/admin/market-mapping/assign/${locationIdParam}` : '/admin/affiliates'} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-lg">{affiliate.avatar}</div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{affiliate.name}</h1>
              <p className="text-xs text-slate-500">{affiliate.email} — Full Activity History</p>
            </div>
          </div>
        </div>

        {/* Location Tabs */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedLocation(null)}
            className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all", !selectedLocation ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
          >
            <History className="w-3.5 h-3.5 inline mr-1.5" />All Locations
          </button>
          {locations.map(loc => (
            <button
              key={loc.id}
              onClick={() => setSelectedLocation(loc.id)}
              className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all", selectedLocation === loc.id ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
            >
              <MapPin className="w-3.5 h-3.5 inline mr-1.5" />{loc.name}
            </button>
          ))}
        </div>

        {selectedLocation && locationStats && (
          <div className="grid grid-cols-4 gap-3">
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Total Activities</p>
              <p className="text-xl font-black text-blue-900">{locationStats.totalActivities}</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Businesses Created</p>
              <p className="text-xl font-black text-emerald-900">{locationStats.businessesCreated}</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Businesses Updated</p>
              <p className="text-xl font-black text-amber-900">{locationStats.businessesUpdated}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
              <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Last Active</p>
              <p className="text-xl font-black text-purple-900">{locationStats.lastActive}</p>
            </div>
          </div>
        )}

        {!selectedLocation && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {locations.map(loc => (
              <button
                key={loc.id}
                onClick={() => setSelectedLocation(loc.id)}
                className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-blue-300 hover:shadow-md transition-all text-left group"
              >
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{loc.name}</h3>
                </div>
                <p className="text-xs text-slate-500 mb-3">{loc.area}, {loc.city}</p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{loc.totalActivities} activities</span>
                  <span className="text-blue-600 font-bold flex items-center gap-1">View <ChevronRight className="w-3 h-3" /></span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by business name or details..." className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 transition-all" />
        </div>

        {/* History List */}
        <div className="space-y-2">
          {filteredHistory.length > 0 ? (
            filteredHistory.map(entry => (
              <div key={entry.id} className="flex items-start gap-3 p-4 bg-white border border-slate-100 rounded-xl hover:border-blue-200 transition-all">
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
                    {!selectedLocation && (
                      <Link href={`/admin/market-mapping/assign/${entry.locationId}`} className="flex items-center gap-1 text-[10px] text-blue-500 hover:underline">
                        <MapPin className="w-3 h-3" />{entry.locationName}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16">
              <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-500">No activity found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search or location filter</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
