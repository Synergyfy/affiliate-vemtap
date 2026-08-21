'use client';

import { useState, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import TopStats from '@/components/admin/market-mapping/TopStats';
import HierarchySidebar from '@/components/admin/market-mapping/HierarchySidebar';
import ClusterMap from '@/components/admin/market-mapping/ClusterMap';
import BusinessDrawer from '@/components/admin/market-mapping/BusinessDrawer';
import MarketMappingConfigEditor from '@/components/admin/market-mapping/MarketMappingConfigEditor';
import { GeographicHierarchyNode, MappedBusiness } from '@/types/market-mapping';
import { useAdminMarketStats, useAdminMarketHierarchy, useAdminClusterDetail, useCreateHierarchyNode, useAdminCapturedVisits } from '@/services/useMarketMappingHooks';
import { Globe2, Settings2, UserPlus, Building2, ChevronDown, ChevronRight, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type Tab = 'overview' | 'config';

const getCenterForNode = (nodeId: string): [number, number] => {
  switch (nodeId) {
    case 'ng': return [9.0820, 8.6753];
    case 'fct': return [8.8932, 7.1812];
    case 'abuja': return [9.0765, 7.3986];
    case 'wuse': return [9.0775, 7.4720];
    case 'banex': return [9.0765, 7.4898];
    case 'wuse-mkt': return [9.0780, 7.4700];
    case 'garki': return [9.0289, 7.4877];
    case 'garki-mkt': return [9.0300, 7.4880];
    default: return [9.0765, 7.3986];
  }
};

const getZoomForNode = (nodeId: string): number => {
  switch (nodeId) {
    case 'ng': return 6;
    case 'fct': return 9;
    case 'abuja': return 11;
    case 'wuse': return 14;
    case 'banex': return 16;
    case 'wuse-mkt': return 16;
    case 'garki': return 14;
    case 'garki-mkt': return 16;
    default: return 12;
  }
};

export default function MarketMappingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [selectedNodeId, setSelectedNodeId] = useState<string>();
  const [selectedBusiness, setSelectedBusiness] = useState<MappedBusiness | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showHierarchy, setShowHierarchy] = useState(false);

  const statsQuery = useAdminMarketStats();
  const hierarchyQuery = useAdminMarketHierarchy();
  const selectedClusterQuery = useAdminClusterDetail(selectedNodeId);
  const { data: captured = [] } = useAdminCapturedVisits();
  const createNode = useCreateHierarchyNode();

  const marketStats = statsQuery.data;
  const nodes: GeographicHierarchyNode[] = hierarchyQuery.data ?? [];
  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;
  const cluster = selectedClusterQuery.data?.cluster;
  const clusterBusinesses: MappedBusiness[] = (selectedClusterQuery.data?.businesses ?? []).map((business) => ({
    id: business.id ?? '', name: business.name ?? business.businessName ?? 'Unnamed business',
    category: business.category ?? 'Business', industry: business.industry ?? '', size: business.size ?? 'SMALL',
    status: business.status ?? 'PROSPECT', isAnchor: business.isAnchor ?? false, anchorScore: business.anchorScore ?? 0,
    influenceScore: business.influenceScore ?? 0, isVerified: business.isVerified ?? false, ownerName: business.ownerName ?? '',
    decisionMaker: business.decisionMaker ?? '', phone: business.phone ?? '', email: business.email ?? undefined,
    address: business.address ?? '', clusterId: business.clusterId ?? selectedNodeId ?? '',
    clusterName: business.clusterName ?? selectedNode?.name ?? '',
    latitude: business.latitude ?? 0, longitude: business.longitude ?? 0, dailyCustomers: business.dailyCustomers ?? 0,
    monthlyCustomers: business.monthlyCustomers ?? 0, openingHours: business.openingHours ?? undefined,
    assignedAffiliateId: business.assignedAffiliateId ?? undefined,
    assignedAffiliateName: business.assignedAffiliateName ?? undefined,
    priority: business.priority ?? 'LOW', source: business.source ?? 'BUSINESS',
    lastVisit: business.lastVisit ?? undefined, nextVisit: business.nextVisit ?? undefined,
    notes: business.notes ?? undefined,
  }));

  // Captured visits (with GPS) across all affiliates, deduped against cluster-scoped businesses.
  const businesses: MappedBusiness[] = [
    ...clusterBusinesses,
    ...captured.filter((capturedBusiness) => !clusterBusinesses.some((business) => business.id === capturedBusiness.id)),
  ];

  // Auto-fit the map to captured locations when no cluster node is selected.
  const capturedBounds = useMemo(() => {
    const points = captured.filter(
      (business) => Number.isFinite(business.latitude) && Number.isFinite(business.longitude) && business.latitude && business.longitude,
    );
    if (points.length === 0) return null;
    const lats = points.map((p) => p.latitude);
    const lngs = points.map((p) => p.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const span = Math.max(maxLat - minLat, maxLng - minLng);
    const zoom = span > 0.5 ? 11 : span > 0.1 ? 13 : 15;
    return { center: [(minLat + maxLat) / 2, (minLng + maxLng) / 2] as [number, number], zoom };
  }, [captured]);

  const mapCenter = selectedNodeId ? getCenterForNode(selectedNodeId) : (capturedBounds?.center ?? ([9.0765, 7.3986] as [number, number]));
  const mapZoom = selectedNodeId ? getZoomForNode(selectedNodeId) : (capturedBounds?.zoom ?? 12);

  const [addNodeModal, setAddNodeModal] = useState<{ isOpen: boolean, type: GeographicHierarchyNode['type'] | null, parentId?: string }>({ isOpen: false, type: null });
  const [newNodeName, setNewNodeName] = useState('');

  const handleSelectNode = (node: GeographicHierarchyNode) => {
    setSelectedNodeId(node.id);
  };

  const handleAddNode = (type: GeographicHierarchyNode['type'], parentId?: string) => {
    setAddNodeModal({ isOpen: true, type, parentId });
  };

  const submitAddNode = async () => {
    if (!newNodeName.trim() || !addNodeModal.type) return;
    try {
      await createNode.mutateAsync({
        name: newNodeName,
        type: addNodeModal.type,
        parentId: addNodeModal.parentId,
      });
      setNewNodeName('');
      setAddNodeModal({ isOpen: false, type: null });
    } catch {
      // Handled by react query / toast
    }
  };


  const handleSelectBusiness = (business: MappedBusiness) => {
    setSelectedBusiness(business);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedBusiness(null);
  };

  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: Globe2 },
    { id: 'config' as Tab, label: 'Configuration', icon: Settings2 },
  ];

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900">Market Mapping</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {activeTab === 'overview'
                ? 'Monitor clusters, assign affiliates, and review captured businesses'
                : 'Configure pipeline statuses, categories, and field defaults'}
            </p>
          </div>
          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-emerald-200">Live</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap",
                activeTab === tab.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900 mb-3">Key Metrics</h2>
               {statsQuery.isLoading && <p className="text-sm text-slate-500">Loading metrics...</p>}
               {statsQuery.isError && <RetryState message="Unable to load market metrics." onRetry={() => statsQuery.refetch()} />}
               {marketStats && <TopStats stats={marketStats} />}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Link
                href="/admin/market-mapping/assign"
                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-5 bg-white border border-slate-200 rounded-2xl sm:rounded-3xl hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-blue-50">
                  <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-sm sm:text-base">Assign Affiliates</h3>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 hidden sm:block">Create locations, assign affiliates, set targets and permissions</p>
                </div>
              </Link>
              <Link
                href="/admin/market-mapping/businesses"
                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-5 bg-white border border-slate-200 rounded-2xl sm:rounded-3xl hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-emerald-50">
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors text-sm sm:text-base">View Businesses</h3>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 hidden sm:block">Review all businesses captured by affiliates with full details</p>
                </div>
              </Link>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <button
                onClick={() => setShowHierarchy(!showHierarchy)}
                className="w-full flex items-center justify-between px-6 py-4 text-left"
              >
                <h2 className="text-sm font-bold text-slate-900">Hierarchy & Cluster Map</h2>
                {showHierarchy ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
              </button>
              {showHierarchy && (
                <div className="px-6 pb-6 space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-800 leading-relaxed">
                      The hierarchy tree defines how locations are structured (<strong>Country → State → City → Area → Cluster</strong>).
                      Affiliates and agents are assigned to clusters and work within these boundaries. Click a node to explore its
                      cluster map and assigned businesses below.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-3">
                      <HierarchySidebar
                        nodes={nodes}
                         selectedNodeId={selectedNodeId ?? ''}
                        onSelectNode={handleSelectNode}
                        onAddNode={handleAddNode}
                      />
                    </div>
                    <div className="lg:col-span-9">
                      <ClusterMap
                         cluster={cluster ? {
                           ...cluster, areaName: cluster.areaName ?? '', cityName: cluster.cityName ?? '', stateName: cluster.stateName ?? '', countryName: cluster.countryName ?? '',
                           totalBusinesses: cluster.totalBusinesses ?? clusterBusinesses.length, verifiedBusinesses: cluster.verifiedBusinesses ?? 0, customersCount: cluster.customersCount ?? 0,
                           prospectsCount: cluster.prospectsCount ?? 0, anchorBusinessesCount: cluster.anchorBusinessesCount ?? 0, assignedAffiliatesCount: cluster.assignedAffiliatesCount ?? 0,
                           penetrationPercentage: cluster.penetrationPercentage ?? 0, discoveryProgress: cluster.discoveryProgress ?? 0, verificationProgress: cluster.verificationProgress ?? 0,
                           salesContactProgress: cluster.salesContactProgress ?? 0, partnershipsProgress: cluster.partnershipsProgress ?? 0, overallCompletion: cluster.overallCompletion ?? 0,
                           currentStage: cluster.currentStage ?? 1, nextRecommendedAction: cluster.nextRecommendedAction ?? '', assignedAffiliates: cluster.assignedAffiliates ?? [], createdAt: cluster.createdAt ?? '', updatedAt: cluster.updatedAt ?? '',
                          } : { id: selectedNodeId ?? '', name: selectedNode?.name ?? 'Select a cluster', areaName: '', cityName: '', stateName: '', countryName: '', totalBusinesses: 0, verifiedBusinesses: 0, customersCount: 0, prospectsCount: 0, anchorBusinessesCount: 0, assignedAffiliatesCount: 0, penetrationPercentage: 0, discoveryProgress: 0, verificationProgress: 0, salesContactProgress: 0, partnershipsProgress: 0, overallCompletion: 0, currentStage: 1, nextRecommendedAction: '', assignedAffiliates: [], createdAt: '', updatedAt: ''}}
                         selectedNode={selectedNode}
                         childNodes={nodes.filter(n => n.parentId === selectedNodeId)}
                         businesses={businesses}
                        selectedBusinessId={selectedBusiness?.id}
                        onSelectBusiness={handleSelectBusiness}
                        onSelectNode={setSelectedNodeId}
                         mapCenter={mapCenter}
                         mapZoom={mapZoom}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'config' && <MarketMappingConfigEditor />}
      </div>

      <BusinessDrawer business={isDrawerOpen ? selectedBusiness : null} onClose={handleCloseDrawer} />

      {/* Add Node Modal */}
      {addNodeModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-[28px] sm:rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200">
            <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto mb-4 sm:hidden" />
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Add New {addNodeModal.type}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                  placeholder={`Enter ${addNodeModal.type?.toLowerCase()} name`}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setAddNodeModal({ isOpen: false, type: null })}
                  className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitAddNode}
                  disabled={!newNodeName.trim()}
                  className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-lg shadow-blue-600/20"
                >
                  Create {addNodeModal.type}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function RetryState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="flex items-center gap-3 text-sm text-red-600"><span>{message}</span><button onClick={onRetry} className="font-bold underline">Retry</button></div>;
}
