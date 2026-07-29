'use client';

import { MapPin, Map as MapIcon, Crown, User, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TerritoryMap() {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-6 relative">
      <div className="absolute top-4 left-4 z-10">
        <h3 className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800 shadow-sm flex items-center gap-2 border border-slate-200">
          <MapIcon className="w-4 h-4 text-blue-600" />
          Interactive Territory Map
        </h3>
      </div>
      
      {/* Mock Map Background (Placeholder) */}
      <div className="h-64 md:h-96 w-full bg-slate-100 relative overflow-hidden flex items-center justify-center">
        {/* Decorative roads/paths */}
        <svg className="absolute inset-0 w-full h-full text-slate-200" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 0,20 Q 30,30 50,50 T 100,80" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5"/>
          <path d="M 20,0 Q 40,40 50,50 T 80,100" fill="none" stroke="currentColor" strokeWidth="4"/>
        </svg>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">Map Legend</p>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <span className="w-3 h-3 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50" /> Anchor
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" /> Customer
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <span className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" /> Visited
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <span className="w-3 h-3 rounded-full border-2 border-slate-400 border-dashed" /> Placeholder
          </div>
        </div>

        {/* Mock Pins */}
        <div className="absolute top-[30%] left-[40%] group cursor-pointer transform hover:scale-110 transition-transform">
          <div className="relative flex items-center justify-center">
            <div className="absolute bg-orange-500 rounded-full w-4 h-4 animate-ping opacity-75" />
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-lg relative z-10 text-white">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Grand Square</div>
        </div>

        <div className="absolute top-[60%] left-[65%] group cursor-pointer transform hover:scale-110 transition-transform">
          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg relative z-10 text-white">
            <User className="w-4 h-4" />
          </div>
          <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Pharmacy</div>
        </div>

        <div className="absolute top-[20%] left-[70%] group cursor-pointer transform hover:scale-110 transition-transform">
          <div className="w-6 h-6 bg-white border-2 border-dashed border-slate-400 rounded-full flex items-center justify-center shadow-sm relative z-10 text-slate-400">
            <MapPin className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
}
