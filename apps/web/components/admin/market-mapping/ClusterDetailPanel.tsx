'use client';

import { 
  Layers, 
  Users, 
  Crown, 
  TrendingUp, 
  UserCheck, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  FileText, 
  Download, 
  UserPlus, 
  Edit3, 
  Sparkles 
} from 'lucide-react';
import { ClusterDetail, ExpansionStageInfo } from '@/types/market-mapping';
import { cn } from '@/lib/utils';

interface ClusterDetailPanelProps {
  cluster: ClusterDetail;
  stages: ExpansionStageInfo[];
  onAssignAffiliate: () => void;
  onViewBusinesses: () => void;
}

export default function ClusterDetailPanel({
  cluster,
  stages,
  onAssignAffiliate,
  onViewBusinesses,
}: ClusterDetailPanelProps) {
  const currentStageInfo = stages.find(s => s.stage === cluster.currentStage) || stages[0];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border border-blue-100">
              Commercial Cluster
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {cluster.areaName} • {cluster.cityName}, {cluster.stateName}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">{cluster.name}</h2>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button 
            onClick={onAssignAffiliate}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-lg shadow-blue-600/20 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Assign Affiliate
          </button>
          <button 
            onClick={onViewBusinesses}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-2xl transition-all"
          >
            View Businesses ({cluster.totalBusinesses})
          </button>
        </div>
      </div>

      {/* Recommended Action Prompt Box (The Core Execution Engine) */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 rounded-2xl shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10">
          <Sparkles className="w-48 h-48 text-white" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-amber-950 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
              Next Strategic Action
            </span>
            <span className="text-xs text-blue-200 font-bold">Stage {cluster.currentStage}: {currentStageInfo.name}</span>
          </div>
          <p className="text-sm font-bold text-white leading-relaxed">
            "{cluster.nextRecommendedAction}"
          </p>
        </div>
      </div>

      {/* 10-Stage Expansion Pipeline Stepper */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Cluster Maturity Pipeline (Stage {cluster.currentStage} of 10)
          </h4>
          <span className="text-xs font-bold text-blue-600">{cluster.overallCompletion}% Complete</span>
        </div>

        <div className="grid grid-cols-5 md:grid-cols-10 gap-1.5">
          {stages.map((stage) => {
            const isDone = stage.stage <= cluster.currentStage;
            const isCurrent = stage.stage === cluster.currentStage;

            return (
              <div 
                key={stage.stage}
                className={cn(
                  "p-2 rounded-xl border text-center transition-all relative group cursor-pointer",
                  isCurrent ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/30 ring-2 ring-blue-600/30" :
                  isDone ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
                  "bg-slate-50 border-slate-200 text-slate-400"
                )}
              >
                <span className="text-[10px] font-black block">S{stage.stage}</span>
                <span className="text-[9px] font-semibold truncate block max-w-full">
                  {stage.name.split(' ')[0]}
                </span>

                {/* Hover Stage Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-slate-900 text-white p-3 rounded-2xl text-xs z-30 shadow-2xl pointer-events-none">
                  <p className="font-bold text-amber-400">Stage {stage.stage}: {stage.name}</p>
                  <p className="text-[10px] text-slate-300 mt-1">{stage.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <p className="text-xs text-slate-500 font-bold mb-1">Total Businesses</p>
          <h4 className="text-xl font-black text-slate-900">{cluster.totalBusinesses}</h4>
          <p className="text-[10px] text-emerald-600 font-bold mt-1">{cluster.verifiedBusinesses} Verified</p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
          <p className="text-xs text-emerald-700 font-bold mb-1">Vemtap Customers</p>
          <h4 className="text-xl font-black text-emerald-900">{cluster.customersCount}</h4>
          <p className="text-[10px] text-emerald-700 font-bold mt-1">{cluster.penetrationPercentage}% Penetration</p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100">
          <p className="text-xs text-amber-800 font-bold mb-1">Anchor Businesses</p>
          <h4 className="text-xl font-black text-amber-900">{cluster.anchorBusinessesCount}</h4>
          <p className="text-[10px] text-amber-700 font-bold mt-1">High Influence Hubs</p>
        </div>

        <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100">
          <p className="text-xs text-purple-700 font-bold mb-1">Assigned Affiliates</p>
          <h4 className="text-xl font-black text-purple-900">{cluster.assignedAffiliatesCount}</h4>
          <p className="text-[10px] text-purple-700 font-bold mt-1">Active Coverage</p>
        </div>
      </div>

      {/* Assigned Field Affiliates */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
          Assigned Territory Affiliates
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {cluster.assignedAffiliates.map(aff => (
            <div key={aff.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                  {aff.fullName.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{aff.fullName}</p>
                  <p className="text-[10px] text-slate-500">{aff.businessesVisited} Visited • {aff.customersClosed} Closed</p>
                </div>
              </div>
              <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                {aff.performanceScore}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
