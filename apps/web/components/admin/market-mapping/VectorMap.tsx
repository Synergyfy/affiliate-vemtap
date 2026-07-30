'use client';

import { MappedBusiness, GeographicHierarchyNode } from '@/types/market-mapping';
import { Crown, MapPin, Building2, Map } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VectorMapProps {
  selectedNode: GeographicHierarchyNode | null;
  childNodes: GeographicHierarchyNode[];
  businesses: MappedBusiness[];
  selectedBusinessId?: string;
  onSelectBusiness: (business: MappedBusiness) => void;
  onSelectNode?: (nodeId: string) => void;
  showAnchorsOnly: boolean;
}

export default function VectorMap({
  selectedNode,
  childNodes,
  businesses,
  selectedBusinessId,
  onSelectBusiness,
  onSelectNode,
  showAnchorsOnly
}: VectorMapProps) {

  const displayedBusinesses = showAnchorsOnly 
    ? businesses.filter(b => b.isAnchor) 
    : businesses;

  const isCluster = !selectedNode || selectedNode.type === 'CLUSTER';

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
    <div className="w-full h-full relative bg-slate-950 overflow-hidden flex items-center justify-center">
      {/* Grid pattern background */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px]" />
      
      {/* Cluster Boundary Polyline Visual Representation */}
      <div className="absolute inset-16 border-2 border-dashed border-blue-500/50 rounded-3xl bg-blue-950/10 backdrop-blur-[1px] pointer-events-none flex items-start justify-end p-4">
        <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-widest bg-blue-900/60 px-2 py-1 rounded-lg border border-blue-700/50">
          Bounds • {selectedNode?.name || 'Cluster'}
        </span>
      </div>

      {/* Isometric Container */}
      <div 
        className="relative w-[600px] h-[600px] transition-transform duration-700 ease-in-out"
        style={{ transform: 'rotateX(60deg) rotateZ(-45deg)' }}
      >
        <div className="absolute inset-0 border border-blue-500/20 rounded-2xl bg-blue-950/20 backdrop-blur-sm" />
        
        {isCluster ? (
          /* Render Businesses */
          displayedBusinesses.map((biz, idx) => {
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
                  "absolute cursor-pointer transition-all duration-300 z-10 group",
                  isSelected ? "scale-125 z-30" : "hover:scale-110"
                )}
              >
                <div 
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-xl border shadow-2xl font-bold text-xs transform -translate-x-1/2 -translate-y-full transition-transform",
                    style.bg,
                    isSelected && "ring-4 ring-white ring-offset-2 ring-offset-slate-950 -translate-y-[120%]"
                  )}
                  style={{ transformStyle: 'preserve-3d', transform: 'rotateZ(45deg) rotateX(-60deg)' }}
                >
                  {biz.isAnchor ? (
                    <Crown className="w-5 h-5 text-amber-950 mb-1" />
                  ) : (
                    <MapPin className="w-5 h-5 mb-1" />
                  )}
                  <span className="max-w-[100px] truncate text-center leading-tight">{biz.name}</span>
                </div>
              </div>
            );
          })
        ) : (
          /* Render Child Nodes */
          childNodes.map((node, idx) => {
            const topOffset = 20 + ((idx * 25) % 60);
            const leftOffset = 20 + ((idx * 30) % 60);
            const percentage = node.totalBusinesses ? Math.round(((node.totalCustomers || 0) / node.totalBusinesses) * 100) : 0;

            return (
              <div
                key={node.id}
                onClick={() => onSelectNode && onSelectNode(node.id)}
                style={{ top: `${topOffset}%`, left: `${leftOffset}%` }}
                className="absolute transition-all duration-300 z-10 hover:scale-110 group cursor-pointer"
              >
                <div 
                  className="flex flex-col items-center justify-center p-3 rounded-2xl border border-blue-400 bg-slate-800 text-white shadow-2xl font-bold text-xs transform -translate-x-1/2 -translate-y-full"
                  style={{ transformStyle: 'preserve-3d', transform: 'rotateZ(45deg) rotateX(-60deg)' }}
                >
                  <Map className="w-6 h-6 text-blue-400 mb-1" />
                  <span className="max-w-[120px] truncate text-center text-sm">{node.name}</span>
                  <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">{node.type}</span>
                  <div className="mt-2 bg-slate-900 px-2 py-1 rounded-lg text-[10px]">
                    <span className="text-emerald-400">{percentage}% Subscribed</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
