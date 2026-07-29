'use client';

import { useState } from 'react';
import { 
  Crown, 
  MapPin, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Filter, 
  Eye, 
  Edit3, 
  Scissors, 
  Ruler,
  Users
} from 'lucide-react';
import { MappedBusiness, ClusterDetail } from '@/types/market-mapping';
import { cn } from '@/lib/utils';

interface ClusterMapProps {
  cluster: ClusterDetail;
  businesses: MappedBusiness[];
  selectedBusinessId?: string;
  onSelectBusiness: (business: MappedBusiness) => void;
}

export default function ClusterMap({
  cluster,
  businesses,
  selectedBusinessId,
  onSelectBusiness,
}: ClusterMapProps) {
  const [activeTab, setActiveTab] = useState<'MAP' | 'SATELLITE'>('MAP');
  const [showAnchorsOnly, setShowAnchorsOnly] = useState(false);

  const displayedBusinesses = showAnchorsOnly 
    ? businesses.filter(b => b.isAnchor) 
    : businesses;

  const getPinStyle = (status: MappedBusiness['status'], isAnchor: boolean) => {
    if (isAnchor) {
      return { bg: 'bg-amber-400 text-amber-950 border-amber-300 shadow-amber-400/50', label: 'Anchor' };
    }
    switch (status) {
      case 'CUSTOMER': return { bg: 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/30', label: 'Customer' };
      case 'MEETING': return { bg: 'bg-blue-500 text-white border-blue-400 shadow-blue-500/30', label: 'Meeting' };
      case 'NEGOTIATING': return { bg: 'bg-amber-500 text-white border-amber-400 shadow-amber-500/30', label: 'Negotiating' };
      case 'PROSPECT': return { bg: 'bg-slate-400 text-white border-slate-300 shadow-slate-400/20', label: 'Prospect' };
      case 'LOST': return { bg: 'bg-red-500 text-white border-red-400 shadow-red-500/30', label: 'Lost' };
      default: return { bg: 'bg-slate-500 text-white border-slate-400', label: 'Other' };
    }
  };

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden relative flex flex-col h-[750px]">
      {/* Map Header Overlay Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-800 text-white shadow-lg pointer-events-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100">{cluster.name}</h3>
            <p className="text-[11px] text-slate-400">{cluster.areaName}, {cluster.cityName} • {businesses.length} Mapped Businesses</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button 
            onClick={() => setShowAnchorsOnly(!showAnchorsOnly)}
            className={cn(
              "px-3 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 backdrop-blur-md transition-all border",
              showAnchorsOnly 
                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20" 
                : "bg-slate-900/80 text-amber-400 border-slate-800 hover:bg-slate-800"
            )}
          >
            <Crown className="w-3.5 h-3.5" />
            Anchors Only ({businesses.filter(b => b.isAnchor).length})
          </button>

          <div className="bg-slate-900/80 backdrop-blur-md p-1 rounded-2xl border border-slate-800 flex items-center gap-1">
            <button 
              onClick={() => setActiveTab('MAP')}
              className={cn("px-3 py-1.5 rounded-xl text-xs font-bold transition-colors", activeTab === 'MAP' ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200")}
            >
              Vector Map
            </button>
            <button 
              onClick={() => setActiveTab('SATELLITE')}
              className={cn("px-3 py-1.5 rounded-xl text-xs font-bold transition-colors", activeTab === 'SATELLITE' ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200")}
            >
              Satellite
            </button>
          </div>
        </div>
      </div>

      {/* Map Interactive Canvas Simulation */}
      <div className="w-full flex-grow relative bg-slate-950 overflow-hidden flex items-center justify-center">
        {/* Grid pattern background */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px]" />
        
        {/* Cluster Boundary Polyline Visual Representation */}
        <div className="absolute inset-16 border-2 border-dashed border-blue-500/50 rounded-3xl bg-blue-950/10 backdrop-blur-[1px] pointer-events-none flex items-start justify-end p-4">
          <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-widest bg-blue-900/60 px-2 py-1 rounded-lg border border-blue-700/50">
            Cluster Bounds • {cluster.name}
          </span>
        </div>

        {/* Simulated Map Pins */}
        <div className="absolute inset-20 relative w-full h-full p-8">
          {displayedBusinesses.map((biz, idx) => {
            const isSelected = selectedBusinessId === biz.id;
            const style = getPinStyle(biz.status, biz.isAnchor);
            
            // Generate visual scatter coordinates for demonstration layout
            const topOffset = 15 + ((idx * 14) % 70);
            const leftOffset = 10 + ((idx * 18) % 78);

            return (
              <div
                key={biz.id}
                onClick={() => onSelectBusiness(biz)}
                style={{ top: `${topOffset}%`, left: `${leftOffset}%` }}
                className={cn(
                  "absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 z-10 group",
                  isSelected ? "scale-125 z-30" : "hover:scale-110"
                )}
              >
                <div className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border shadow-lg font-bold text-xs",
                  style.bg,
                  isSelected && "ring-4 ring-white ring-offset-2 ring-offset-slate-950"
                )}>
                  {biz.isAnchor ? (
                    <Crown className="w-3.5 h-3.5 text-amber-950" />
                  ) : (
                    <MapPin className="w-3.5 h-3.5" />
                  )}
                  <span className="max-w-[120px] truncate">{biz.name}</span>
                </div>

                {/* Tooltip Hover Preview */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-48 bg-slate-900 text-white p-3 rounded-2xl border border-slate-700 shadow-2xl z-40 text-xs">
                  <p className="font-bold text-slate-100 mb-1">{biz.name}</p>
                  <p className="text-[10px] text-slate-400 mb-2">{biz.category} • {biz.size}</p>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Traffic:</span>
                    <span className="font-bold text-emerald-400">{biz.dailyCustomers}/day</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] mt-1">
                    <span className="text-slate-400">Status:</span>
                    <span className="font-bold uppercase tracking-wider text-blue-400">{biz.status}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Map Bottom Legend Bar */}
      <div className="bg-slate-900/90 backdrop-blur-md px-6 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-4">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Legend:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-amber-400/30" />
            <span className="text-[11px] font-medium text-slate-300">Anchor Business</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-medium text-slate-300">Vemtap Customer</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-[11px] font-medium text-slate-300">Meeting Scheduled</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-[11px] font-medium text-slate-300">Negotiating</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <span className="text-[11px] font-medium text-slate-300">Prospect</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          Click any pin to inspect business ecosystem details
        </div>
      </div>
    </div>
  );
}
