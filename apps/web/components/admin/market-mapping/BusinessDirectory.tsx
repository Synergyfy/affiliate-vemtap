'use client';

import { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Crown, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  ChevronDown, 
  MoreHorizontal, 
  UserCheck, 
  Calendar,
  ArrowUpDown
} from 'lucide-react';
import { MappedBusiness } from '@/types/market-mapping';
import { cn } from '@/lib/utils';

interface BusinessDirectoryProps {
  businesses: MappedBusiness[];
  selectedBusinessId?: string;
  onSelectBusiness: (business: MappedBusiness) => void;
}

export default function BusinessDirectory({
  businesses,
  selectedBusinessId,
  onSelectBusiness,
}: BusinessDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [anchorFilter, setAnchorFilter] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const categories = [...new Set(businesses.map(b => b.category))];

  const filtered = businesses.filter(biz => {
    if (searchQuery && !biz.name.toLowerCase().includes(searchQuery.toLowerCase()) && !biz.ownerName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter !== 'ALL' && biz.status !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && biz.category !== categoryFilter) return false;
    if (anchorFilter === 'ANCHOR' && !biz.isAnchor) return false;
    if (anchorFilter === 'NON_ANCHOR' && biz.isAnchor) return false;
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(b => b.id)));
    }
  };

  const getStatusBadge = (status: MappedBusiness['status']) => {
    switch (status) {
      case 'CUSTOMER': return { label: 'Customer', classes: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'MEETING': return { label: 'Meeting', classes: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'NEGOTIATING': return { label: 'Negotiating', classes: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'PROSPECT': return { label: 'Prospect', classes: 'bg-slate-100 text-slate-700 border-slate-200' };
      case 'LOST': return { label: 'Lost', classes: 'bg-red-100 text-red-700 border-red-200' };
      default: return { label: status, classes: 'bg-slate-100 text-slate-500' };
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 space-y-4">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
          <h3 className="font-extrabold text-slate-900 text-base">
            Business Directory <span className="text-slate-400 font-semibold text-sm ml-1">({filtered.length})</span>
          </h3>

          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                <span className="text-xs font-bold text-blue-700">{selectedIds.size} Selected</span>
                <button className="text-[10px] font-bold text-blue-600 hover:underline">Assign Affiliate</button>
                <button className="text-[10px] font-bold text-blue-600 hover:underline">Change Status</button>
                <button className="text-[10px] font-bold text-blue-600 hover:underline">Export</button>
              </div>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all border",
                showFilters ? "bg-blue-600 text-white border-blue-600" : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              )}
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition-all">
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by business name, owner, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-colors"
          />
        </div>

        {/* Filters Row */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-600"
            >
              <option value="ALL">All Statuses</option>
              <option value="CUSTOMER">Customer</option>
              <option value="MEETING">Meeting</option>
              <option value="NEGOTIATING">Negotiating</option>
              <option value="PROSPECT">Prospect</option>
              <option value="LOST">Lost</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-600"
            >
              <option value="ALL">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={anchorFilter}
              onChange={(e) => setAnchorFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-600"
            >
              <option value="ALL">All Businesses</option>
              <option value="ANCHOR">Anchors Only</option>
              <option value="NON_ANCHOR">Non-Anchors</option>
            </select>

            <button 
              onClick={() => { setStatusFilter('ALL'); setCategoryFilter('ALL'); setAnchorFilter('ALL'); setSearchQuery(''); }}
              className="text-xs font-bold text-red-500 hover:underline"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-3 text-left">
                <input 
                  type="checkbox" 
                  checked={selectedIds.size === filtered.length && filtered.length > 0} 
                  onChange={toggleSelectAll} 
                  className="w-3.5 h-3.5 rounded border-slate-300 accent-blue-600" 
                />
              </th>
              <th className="p-3 text-left font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Business</th>
              <th className="p-3 text-left font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Category</th>
              <th className="p-3 text-left font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Status</th>
              <th className="p-3 text-center font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Anchor</th>
              <th className="p-3 text-left font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Owner</th>
              <th className="p-3 text-left font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Affiliate</th>
              <th className="p-3 text-left font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Priority</th>
              <th className="p-3 text-left font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Last Visit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((biz) => {
              const statusBadge = getStatusBadge(biz.status);
              const isSelected = selectedBusinessId === biz.id;

              return (
                <tr
                  key={biz.id}
                  onClick={() => onSelectBusiness(biz)}
                  className={cn(
                    "hover:bg-blue-50/50 cursor-pointer transition-colors",
                    isSelected && "bg-blue-50 border-l-4 border-l-blue-600"
                  )}
                >
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(biz.id)} 
                      onChange={() => toggleSelect(biz.id)} 
                      className="w-3.5 h-3.5 rounded border-slate-300 accent-blue-600" 
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {biz.isAnchor && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{biz.name}</p>
                        <p className="text-[10px] text-slate-400">{biz.size}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-slate-600 font-medium">{biz.category}</td>
                  <td className="p-3">
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", statusBadge.classes)}>
                      {statusBadge.label}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {biz.isAnchor ? (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-amber-200">{biz.anchorScore}</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="p-3 text-slate-700 font-medium">{biz.ownerName}</td>
                  <td className="p-3 text-slate-600">{biz.assignedAffiliateName || '—'}</td>
                  <td className="p-3">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full",
                      biz.priority === 'HIGH' ? "bg-red-50 text-red-700 border border-red-200" :
                      biz.priority === 'MEDIUM' ? "bg-amber-50 text-amber-700 border border-amber-200" :
                      "bg-slate-50 text-slate-500 border border-slate-200"
                    )}>
                      {biz.priority}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500">{biz.lastVisit || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="p-12 text-center text-sm text-slate-400">
          No businesses found matching the applied filters.
        </div>
      )}
    </div>
  );
}
