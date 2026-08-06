'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MappedBusiness, ClusterDetail, GeographicHierarchyNode } from '@/types/market-mapping';
import { Crown, MapPin, Building2, ExternalLink, UserCheck, Calendar, Map as MapIcon } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

// Fix for default leaflet icons not loading in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface DynamicMapProps {
  cluster: ClusterDetail;
  selectedNode?: GeographicHierarchyNode | null;
  childNodes?: GeographicHierarchyNode[];
  businesses: MappedBusiness[];
  selectedBusinessId?: string;
  onSelectBusiness: (business: MappedBusiness) => void;
  onSelectNode?: (nodeId: string) => void;
  showAnchorsOnly: boolean;
  mapCenter?: [number, number];
  mapZoom?: number;
  mapType?: 'DEFAULT' | 'VECTOR' | 'SATELLITE';
  forceCluster?: boolean;
}

// Map Updater Component to change view dynamically
function MapUpdater({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, {
      duration: 1.5,
      easeLinearity: 0.25,
    });
  }, [center, zoom, map]);
  return null;
}

// Get status badge color classes for the popup
const getStatusBadgeClasses = (status: MappedBusiness['status']) => {
  switch (status) {
    case 'CUSTOMER': return 'background:#10b981;color:#fff;';
    case 'MEETING': return 'background:#3b82f6;color:#fff;';
    case 'NEGOTIATING': return 'background:#f59e0b;color:#fff;';
    case 'PROSPECT': return 'background:#94a3b8;color:#fff;';
    case 'LOST': return 'background:#ef4444;color:#fff;';
    default: return 'background:#64748b;color:#fff;';
  }
};

// Helper to render lucide icons to div icon HTML
const createCustomIcon = (status: MappedBusiness['status'], isAnchor: boolean, isSelected: boolean) => {
  let bgColor = 'bg-slate-500';
  let borderColor = 'border-slate-400';
  let textColor = 'text-white';
  let Icon = MapPin;

  if (isAnchor) {
    bgColor = 'bg-amber-400';
    borderColor = 'border-amber-300';
    textColor = 'text-amber-950';
    Icon = Crown;
  } else {
    switch (status) {
      case 'CUSTOMER': bgColor = 'bg-emerald-500'; borderColor = 'border-emerald-400'; break;
      case 'MEETING': bgColor = 'bg-blue-500'; borderColor = 'border-blue-400'; break;
      case 'NEGOTIATING': bgColor = 'bg-amber-500'; borderColor = 'border-amber-400'; break;
      case 'PROSPECT': bgColor = 'bg-slate-400'; borderColor = 'border-slate-300'; break;
      case 'LOST': bgColor = 'bg-red-500'; borderColor = 'border-red-400'; break;
    }
  }

  const selectedRing = isSelected ? 'ring-4 ring-white ring-offset-2 ring-offset-slate-900 scale-125 z-50' : 'hover:scale-110';
  
  // Anchor businesses get a pulsing outer ring
  const anchorPulse = isAnchor
    ? `<div style="position:absolute;inset:-6px;border-radius:9999px;border:2px solid #fbbf24;opacity:0.5;animation:anchorPulse 2s ease-in-out infinite;"></div>`
    : '';

  const iconHtml = renderToStaticMarkup(
    <div className={`flex items-center justify-center w-8 h-8 rounded-full border shadow-lg transition-transform ${bgColor} ${borderColor} ${textColor} ${selectedRing}`}>
      <Icon className="w-4 h-4" />
    </div>
  );

  const html = `<div style="position:relative;width:32px;height:32px;">${anchorPulse}${iconHtml}</div>`;

  return L.divIcon({
    html,
    className: 'custom-leaflet-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};


export default function DynamicMap({
  cluster,
  selectedNode,
  childNodes = [],
  businesses,
  selectedBusinessId,
  onSelectBusiness,
  onSelectNode,
  showAnchorsOnly,
  mapCenter,
  mapZoom,
  mapType = 'DEFAULT',
  forceCluster = false
}: DynamicMapProps) {
  const isCluster = forceCluster || !selectedNode || selectedNode.type === 'CLUSTER';
  
  // Center map on the provided center or default
  const center: [number, number] = mapCenter || [9.0765, 7.4898];
  const zoom = mapZoom || 15;

  const displayedBusinesses = showAnchorsOnly 
    ? businesses.filter(b => b.isAnchor) 
    : businesses;

  let tileUrl = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'; // Google Maps Default
  if (mapType === 'VECTOR') {
    tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'; // Carto Dark Vector
  } else if (mapType === 'SATELLITE') {
    tileUrl = 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'; // Google Satellite
  }

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={tileUrl}
        />
        <MapUpdater center={center} zoom={zoom} />

        {isCluster ? (
          displayedBusinesses.map((biz, idx) => {
            // Use actual business coordinates or fallback if missing
            const lat = biz.latitude || 9.0765 + (idx * 0.001);
            const lng = biz.longitude || 7.4898 + (idx * 0.001);
            const isSelected = selectedBusinessId === biz.id;
            const hasBeenVisited = !!biz.lastVisit;

            return (
              <Marker 
                key={biz.id} 
                position={[lat, lng]} 
                icon={createCustomIcon(biz.status, biz.isAnchor, isSelected)}
                eventHandlers={{
                  click: () => onSelectBusiness(biz),
                }}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="p-1 min-w-[240px]">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                      <div className={`p-1.5 rounded-lg ${biz.isAnchor ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-900 text-sm leading-tight">{biz.name}</h4>
                        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{biz.category}</span>
                      </div>
                    </div>

                  {/* Tags row */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '6px', ...Object.fromEntries(getStatusBadgeClasses(biz.status).split(';').filter(Boolean).map(s => { const [k,v] = s.split(':'); return [k.trim(), v.trim()]; })) }}>
                      {biz.status}
                    </span>
                    {biz.isAnchor && (
                      <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '6px', background: '#fbbf24', color: '#451a03' }}>
                        ⭐ ANCHOR
                      </span>
                    )}
                    {biz.source === 'CAPTURE' && (
                      <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '6px', background: '#dbeafe', color: '#1e40af' }}>
                        Captured
                      </span>
                    )}
                    {hasBeenVisited ? (
                      <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '6px', background: '#d1fae5', color: '#065f46' }}>
                        ✓ Visited
                      </span>
                    ) : (
                      <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '6px', background: '#fee2e2', color: '#991b1b' }}>
                        Not Visited
                      </span>
                    )}
                    {biz.isVerified && (
                      <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '6px', background: '#ede9fe', color: '#5b21b6' }}>
                        Verified
                      </span>
                    )}
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Traffic</span>
                      <span className="text-xs font-bold text-slate-700">{biz.dailyCustomers}/day</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Priority</span>
                      <span className="text-xs font-bold text-slate-700">{biz.priority}</span>
                    </div>
                  </div>

                  {/* Agent Info */}
                  {biz.assignedAffiliateName && (
                    <div className="flex items-center gap-1.5 mb-2 p-1.5 bg-slate-50 rounded-lg">
                      <UserCheck className="w-3 h-3 text-blue-600 shrink-0" />
                      <span className="text-[10px] text-slate-600">
                        <span className="font-bold">Agent:</span> {biz.assignedAffiliateName}
                      </span>
                    </div>
                  )}

                  {/* Last Visit */}
                  {biz.lastVisit && (
                    <div className="flex items-center gap-1.5 mb-3 text-[10px] text-slate-500">
                      <Calendar className="w-3 h-3 shrink-0" />
                      Last visit: {biz.lastVisit}
                    </div>
                  )}

                  <button 
                    onClick={() => onSelectBusiness(biz)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold transition-colors"
                  >
                    View Full Details
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })
        ) : (
          childNodes.map((node, idx) => {
            const lat = node.latitude || 9.0765 + (idx * 0.01);
            const lng = node.longitude || 7.3986 + (idx * 0.01);
            const percentage = node.totalBusinesses ? Math.round(((node.totalCustomers || 0) / node.totalBusinesses) * 100) : 0;
            
            const nodeIconHtml = renderToStaticMarkup(
              <div className="flex flex-col items-center justify-center">
                <div className="bg-slate-900 text-white px-3 py-1.5 rounded-2xl shadow-xl border border-slate-700 font-bold text-xs flex items-center gap-2">
                  <MapIcon className="w-4 h-4 text-blue-400" />
                  <span>{node.name}</span>
                  <span className="bg-slate-700 px-1.5 py-0.5 rounded-lg text-[9px] text-slate-300">{node.type}</span>
                </div>
                <div className="bg-blue-600 text-white px-2 py-0.5 rounded-b-lg shadow-md text-[10px] font-bold">
                  {percentage}% | {node.totalBusinesses || 0} biz
                </div>
                <div className="w-3 h-3 bg-blue-600 rotate-45 transform -translate-y-1.5 z-[-1]" />
              </div>
            );

            const nodeIcon = L.divIcon({
              html: nodeIconHtml,
              className: 'custom-leaflet-icon',
              iconSize: [120, 60],
              iconAnchor: [60, 60],
            });

            return (
              <Marker
                key={node.id}
                position={[lat, lng]}
                icon={nodeIcon}
                eventHandlers={{
                  click: () => onSelectNode && onSelectNode(node.id)
                }}
              />
            );
          })
        )}
      </MapContainer>
      
      {/* Custom styles for leaflet popups to match UI */}
      <style jsx global>{`
        .custom-leaflet-icon {
          background: transparent;
          border: none;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 1rem;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }
        .leaflet-popup-content {
          margin: 12px;
        }
        .leaflet-container {
          font-family: inherit;
        }
        .leaflet-control-attribution {
          font-size: 10px !important;
          color: #94a3b8 !important;
          background: rgba(255,255,255,0.8) !important;
        }
        @keyframes anchorPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}
