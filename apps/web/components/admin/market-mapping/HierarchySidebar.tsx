'use client';

import { useState } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Search, 
  MapPin, 
  Layers, 
  Globe, 
  Building, 
  MoreVertical, 
  Trash2, 
  Edit2, 
  Archive 
} from 'lucide-react';
import { GeographicHierarchyNode } from '@/types/market-mapping';
import { cn } from '@/lib/utils';

interface HierarchySidebarProps {
  nodes: GeographicHierarchyNode[];
  selectedNodeId: string;
  onSelectNode: (node: GeographicHierarchyNode) => void;
  onAddNode: (type: GeographicHierarchyNode['type'], parentId?: string) => void;
}

export default function HierarchySidebar({
  nodes,
  selectedNodeId,
  onSelectNode,
  onAddNode,
}: HierarchySidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    'ng': true,
    'fct': true,
    'abuja': true,
    'wuse': true,
  });

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getNodeIcon = (type: GeographicHierarchyNode['type']) => {
    switch (type) {
      case 'COUNTRY': return Globe;
      case 'STATE': return Building;
      case 'CITY': return MapPin;
      case 'AREA': return MapPin;
      case 'CLUSTER': return Layers;
      default: return MapPin;
    }
  };

  const filteredNodes = nodes.filter(n => 
    n.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getChildren = (parentId?: string | null) => {
    return nodes.filter(n => n.parentId === (parentId || null));
  };

  const calculateTotals = (nodeId: string): { biz: number, cust: number } => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { biz: 0, cust: 0 };
    
    const children = getChildren(nodeId);
    if (children.length > 0) {
      return children.reduce((acc, child) => {
        const childTotals = calculateTotals(child.id);
        return {
          biz: acc.biz + childTotals.biz,
          cust: acc.cust + childTotals.cust
        };
      }, { biz: 0, cust: 0 });
    }
    
    return {
      biz: node.totalBusinesses || 0,
      cust: node.totalCustomers || 0
    };
  };

  const renderNodeTree = (parentId: string | null = null, depth = 0) => {
    const children = nodes.filter(n => (parentId === null ? !n.parentId : n.parentId === parentId));

    if (children.length === 0) return null;

    return (
      <div className="space-y-1">
        {children.map(node => {
          const isExpanded = !!expandedIds[node.id];
          const isSelected = selectedNodeId === node.id;
          const nodeChildren = getChildren(node.id);
          const hasChildren = nodeChildren.length > 0;
          const Icon = getNodeIcon(node.type);

          return (
            <div key={node.id} className="select-none">
              <div 
                onClick={() => onSelectNode(node)}
                className={cn(
                  "flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition-all cursor-pointer group",
                  isSelected 
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" 
                    : "text-slate-700 hover:bg-slate-100"
                )}
                style={{ paddingLeft: `${Math.max(8, depth * 16)}px` }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {hasChildren ? (
                    <button 
                      onClick={(e) => toggleExpand(node.id, e)}
                      className={cn("p-0.5 rounded hover:bg-black/10 transition-colors", isSelected ? "text-white" : "text-slate-400")}
                    >
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                  ) : (
                    <span className="w-4" />
                  )}
                  <Icon className={cn("w-4 h-4 shrink-0", isSelected ? "text-white" : "text-blue-600")} />
                  <span className="truncate">{node.name}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {(() => {
                    const totals = calculateTotals(node.id);
                    const percentage = totals.biz > 0 ? Math.round((totals.cust / totals.biz) * 100) : 0;
                    return (
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap",
                        isSelected ? "bg-white/20 text-white" : "bg-blue-50 text-blue-700 border border-blue-100"
                      )}>
                        {percentage}% | {totals.biz} biz
                      </span>
                    );
                  })()}
                  <button 
                    onClick={(e) => { e.stopPropagation(); onAddNode(getNextType(node.type), node.id); }}
                    className={cn("opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-black/10 transition-opacity", isSelected ? "text-white" : "text-slate-500")}
                    title={`Add child under ${node.name}`}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {hasChildren && isExpanded && (
                <div className="mt-0.5">
                  {renderNodeTree(node.id, depth + 1)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const getNextType = (current: GeographicHierarchyNode['type']): GeographicHierarchyNode['type'] => {
    switch (current) {
      case 'COUNTRY': return 'STATE';
      case 'STATE': return 'CITY';
      case 'CITY': return 'AREA';
      case 'AREA': return 'CLUSTER';
      default: return 'CLUSTER';
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[750px] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600" />
            Market Hierarchy
          </h3>
          <button 
            onClick={() => onAddNode('COUNTRY')}
            className="flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search clusters or areas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-colors"
          />
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-grow p-3 overflow-y-auto custom-scrollbar">
        {searchQuery ? (
          <div className="space-y-1">
            {filteredNodes.map(node => (
              <div
                key={node.id}
                onClick={() => onSelectNode(node)}
                className={cn(
                  "p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-all",
                  selectedNodeId === node.id ? "bg-blue-600 text-white" : "hover:bg-slate-100 text-slate-800"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                    {node.type}
                  </span>
                  <span className="truncate">{node.name}</span>
                </div>
                {(() => {
                  const totals = calculateTotals(node.id);
                  const percentage = totals.biz > 0 ? Math.round((totals.cust / totals.biz) * 100) : 0;
                  return (
                    <span className="text-[10px] font-bold opacity-75">{percentage}% | {totals.biz} biz</span>
                  );
                })()}
              </div>
            ))}
          </div>
        ) : (
          renderNodeTree(null, 0)
        )}
      </div>
    </div>
  );
}
