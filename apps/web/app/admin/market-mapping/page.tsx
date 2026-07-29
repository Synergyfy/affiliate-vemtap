'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import TopStats from '@/components/admin/market-mapping/TopStats';
import HierarchySidebar from '@/components/admin/market-mapping/HierarchySidebar';
import ClusterMap from '@/components/admin/market-mapping/ClusterMap';
import ClusterDetailPanel from '@/components/admin/market-mapping/ClusterDetailPanel';
import BusinessDirectory from '@/components/admin/market-mapping/BusinessDirectory';
import BusinessDrawer from '@/components/admin/market-mapping/BusinessDrawer';
import { GeographicHierarchyNode, MappedBusiness } from '@/types/market-mapping';
import {
  mockMarketStats,
  mockHierarchy,
  mockClusterDetail,
  mockBusinesses,
  mockExpansionStages,
} from '@/lib/market-mapping-mock';
import { Loader2, Sparkles, Route, BarChart3, Flame, Compass } from 'lucide-react';

export default function MarketMappingPage() {
  const [selectedNodeId, setSelectedNodeId] = useState('banex');
  const [selectedBusiness, setSelectedBusiness] = useState<MappedBusiness | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleSelectNode = (node: GeographicHierarchyNode) => {
    setSelectedNodeId(node.id);
  };

  const handleAddNode = (type: GeographicHierarchyNode['type'], parentId?: string) => {
    console.log('Add node', type, 'under', parentId);
    // TODO: Open modal to create new geographic hierarchy node
  };

  const handleSelectBusiness = (business: MappedBusiness) => {
    setSelectedBusiness(business);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedBusiness(null), 300);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Market Mapping</h1>
            <p className="text-sm text-slate-500 mt-1">
              Command center for systematic commercial cluster expansion
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-emerald-200">
              Live
            </span>
          </div>
        </div>

        {/* Section 1 — Top Statistics Cards */}
        <TopStats stats={mockMarketStats} />

        {/* Sections 2 + 3 — Hierarchy Sidebar + Interactive Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar — Market Hierarchy Navigator (Section 2) */}
          <div className="lg:col-span-3">
            <HierarchySidebar
              nodes={mockHierarchy}
              selectedNodeId={selectedNodeId}
              onSelectNode={handleSelectNode}
              onAddNode={handleAddNode}
            />
          </div>

          {/* Center — Interactive Cluster Map (Section 3) */}
          <div className="lg:col-span-9">
            <ClusterMap
              cluster={mockClusterDetail}
              businesses={mockBusinesses}
              selectedBusinessId={selectedBusiness?.id}
              onSelectBusiness={handleSelectBusiness}
            />
          </div>
        </div>

        {/* Section 4 — Cluster Detail Panel + Expansion Pipeline */}
        <ClusterDetailPanel
          cluster={mockClusterDetail}
          stages={mockExpansionStages}
          onAssignAffiliate={() => console.log('Assign affiliate modal')}
          onViewBusinesses={() => {
            const el = document.getElementById('business-directory');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* Section 5 — Business Directory Table */}
        <div id="business-directory">
          <BusinessDirectory
            businesses={mockBusinesses}
            selectedBusinessId={selectedBusiness?.id}
            onSelectBusiness={handleSelectBusiness}
          />
        </div>

        {/* Future AI & Analytics Placeholder Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Sparkles, title: 'AI Opportunity Recommendations', desc: 'Automated opportunity scoring and next-action suggestions powered by ML.' },
            { icon: Route, title: 'Smart Route Planning', desc: 'Optimal daily visit routes for field affiliates based on priority and proximity.' },
            { icon: BarChart3, title: 'Predictive Market Penetration', desc: 'Forecast cluster growth trajectories and revenue potential.' },
            { icon: Flame, title: 'Customer Movement Heatmaps', desc: 'Visualize how customers flow between businesses in a cluster.' },
          ].map((item) => (
            <div
              key={item.title}
              className="p-5 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-center space-y-2 hover:border-blue-200 transition-colors cursor-default"
            >
              <item.icon className="w-8 h-8 text-slate-300 mx-auto" />
              <h4 className="text-xs font-bold text-slate-500">{item.title}</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">{item.desc}</p>
              <span className="inline-block bg-slate-200 text-slate-500 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md">
                Coming Soon
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Business Profile Side Drawer */}
      <BusinessDrawer
        business={isDrawerOpen ? selectedBusiness : null}
        onClose={handleCloseDrawer}
      />
    </AdminLayout>
  );
}
