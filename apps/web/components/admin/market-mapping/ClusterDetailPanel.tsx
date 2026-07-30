'use client';

import { Users, Building2, Crown, UserCheck, MapPin, Info } from 'lucide-react';
import { ClusterDetail } from '@/types/market-mapping';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ClusterDetailPanelProps {
  cluster: ClusterDetail;
  onAssignAffiliate?: () => void;
  onViewBusinesses?: () => void;
  showActions?: boolean;
}

export default function ClusterDetailPanel({ cluster, onAssignAffiliate, onViewBusinesses, showActions = true }: ClusterDetailPanelProps) {
  const metrics = [
    { label: 'Total Businesses', value: cluster.totalBusinesses, sub: `${cluster.verifiedBusinesses} verified`, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Vemtap Customers', value: cluster.customersCount, sub: `${cluster.penetrationPercentage}% penetration`, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Anchor Businesses', value: cluster.anchorBusinessesCount, sub: 'High influence hubs', icon: Crown, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Assigned Affiliates', value: cluster.assignedAffiliatesCount, sub: 'Active coverage', icon: UserCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-blue-600" />
          <div>
            <h2 className="text-lg font-bold text-slate-900">{cluster.name}</h2>
            <p className="text-xs text-slate-500">{cluster.areaName}, {cluster.cityName} — {cluster.stateName}</p>
          </div>
        </div>
        {showActions && (
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={onAssignAffiliate} className="flex-1 md:flex-initial px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all">
              Assign Affiliate
            </button>
            <button onClick={onViewBusinesses} className="flex-1 md:flex-initial px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-all">
              View Businesses
            </button>
          </div>
        )}
      </div>

      {/* Info / Guidelines */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-800 leading-relaxed">
          This cluster is part of the <strong>{cluster.areaName}</strong> area. Affiliates assigned here can capture businesses,
          track visits, and manage pipeline statuses. The overall completion is <strong>{cluster.overallCompletion}%</strong>.
        </p>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="font-bold text-slate-700">Overall Completion</span>
          <span className="font-bold text-blue-600">{cluster.overallCompletion}%</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all" style={{ width: `${cluster.overallCompletion}%` }} />
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map(m => (
          <div key={m.label} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100">
            <div className={cn(m.bg, 'p-2 rounded-xl')}>
              <m.icon className={cn('w-4 h-4', m.color)} />
            </div>
            <div>
              <p className="text-lg font-extrabold text-slate-900 leading-tight">{m.value}</p>
              <p className="text-[10px] font-semibold text-slate-500">{m.label}</p>
              <p className="text-[9px] text-slate-400">{m.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Assigned Affiliates */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-600">Assigned Affiliates ({cluster.assignedAffiliates.length})</h4>
        {cluster.assignedAffiliates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {cluster.assignedAffiliates.map(aff => (
              <div key={aff.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                    {aff.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{aff.fullName}</p>
                    <p className="text-[10px] text-slate-500">{aff.businessesAssigned} assigned · {aff.customersClosed} closed</p>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{aff.performanceScore}%</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-2">No affiliates assigned yet. Use the button above to assign.</p>
        )}
      </div>
    </div>
  );
}
