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
  Users,
  Map as MapIcon,
  ChevronDown
} from 'lucide-react';
import { MappedBusiness, ClusterDetail, GeographicHierarchyNode } from '@/types/market-mapping';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

const DynamicMap = dynamic(() => import('./DynamicMap'), { ssr: false });
const VectorMap = dynamic(() => import('./VectorMap'), { ssr: false });

interface ClusterMapProps {
  cluster: ClusterDetail;
  selectedNode: GeographicHierarchyNode | null;
  childNodes: GeographicHierarchyNode[];
  businesses: MappedBusiness[];
  selectedBusinessId?: string;
  onSelectBusiness: (business: MappedBusiness) => void;
  onSelectNode?: (nodeId: string) => void;
  mapCenter?: [number, number];
  mapZoom?: number;
}

export default function ClusterMap({
  cluster,
  selectedNode,
  childNodes,
  businesses,
  selectedBusinessId,
  onSelectBusiness,
  onSelectNode,
  mapCenter,
  mapZoom,
}: ClusterMapProps) {
  const [activeTab, setActiveTab] = useState<'DEFAULT' | 'VECTOR' | 'SATELLITE'>('DEFAULT');
  const [showAnchorsOnly, setShowAnchorsOnly] = useState(false);
  const [showMapTypeDropdown, setShowMapTypeDropdown] = useState(false);

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
            <h3 className="font-bold text-sm text-slate-100">{selectedNode ? `${selectedNode.name} ${selectedNode.type === 'CLUSTER' ? 'Cluster' : selectedNode.type}` : cluster.name}</h3>
            <p className="text-[11px] text-slate-400">{selectedNode ? `Showing details for this ${selectedNode.type.toLowerCase()}` : `${cluster.areaName}, ${cluster.cityName}`} • {businesses.length} Mapped Businesses</p>
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

          <div className="relative">
            <button 
              onClick={() => setShowMapTypeDropdown(!showMapTypeDropdown)}
              className="flex items-center gap-2 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-800 text-white text-xs font-bold transition-all shadow-lg"
            >
              <MapIcon className="w-3.5 h-3.5 text-blue-400" />
              {activeTab === 'DEFAULT' ? 'Map' : activeTab === 'VECTOR' ? 'Vector Map' : 'Satellite'}
              <ChevronDown className="w-3 h-3 text-slate-400 ml-1" />
            </button>

            {showMapTypeDropdown && (
              <div className="absolute top-full right-0 mt-2 w-40 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden z-50 py-1">
                <button
                  onClick={() => { setActiveTab('DEFAULT'); setShowMapTypeDropdown(false); }}
                  className={cn("w-full text-left px-4 py-2 text-xs font-bold hover:bg-slate-800 transition-colors", activeTab === 'DEFAULT' ? "text-blue-400" : "text-slate-300")}
                >
                  Map
                </button>
                <button
                  onClick={() => { setActiveTab('VECTOR'); setShowMapTypeDropdown(false); }}
                  className={cn("w-full text-left px-4 py-2 text-xs font-bold hover:bg-slate-800 transition-colors", activeTab === 'VECTOR' ? "text-blue-400" : "text-slate-300")}
                >
                  Vector Map
                </button>
                <button
                  onClick={() => { setActiveTab('SATELLITE'); setShowMapTypeDropdown(false); }}
                  className={cn("w-full text-left px-4 py-2 text-xs font-bold hover:bg-slate-800 transition-colors", activeTab === 'SATELLITE' ? "text-blue-400" : "text-slate-300")}
                >
                  Satellite
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map Interactive Canvas Simulation */}
      <div className="w-full flex-grow relative bg-slate-100 overflow-hidden flex items-center justify-center">
        {activeTab === 'VECTOR' ? (
          <VectorMap 
            selectedNode={selectedNode}
            childNodes={childNodes}
            businesses={businesses}
            onSelectBusiness={onSelectBusiness}
            onSelectNode={onSelectNode}
            selectedBusinessId={selectedBusinessId}
            showAnchorsOnly={showAnchorsOnly}
          />
        ) : (
          <DynamicMap 
            cluster={cluster} 
            selectedNode={selectedNode}
            childNodes={childNodes}
            businesses={businesses} 
            selectedBusinessId={selectedBusinessId} 
            onSelectBusiness={onSelectBusiness} 
            onSelectNode={onSelectNode}
            showAnchorsOnly={showAnchorsOnly} 
            mapCenter={mapCenter}
            mapZoom={mapZoom}
            mapType={activeTab}
          />
        )}
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
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-[11px] font-medium text-slate-300">Lost</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          Click any pin to inspect business ecosystem details
        </div>
      </div>
    </div>
  );
}
