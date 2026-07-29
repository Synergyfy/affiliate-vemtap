'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlannedVisit, VisitStatus } from '@/types/affiliate-market-mapping';
import { cn } from '@/lib/utils';
import { Building2, Phone, MoreHorizontal } from 'lucide-react';
import { useMarketMapping } from '@/components/dashboard/market-mapping/MarketMappingContext';

const pipelineStatuses: { id: VisitStatus; name: string; color: string; bg: string; text: string }[] = [
  { id: 'NOT_YET', name: 'To Visit', color: 'bg-slate-500', bg: 'bg-slate-50', text: 'text-slate-600' },
  { id: 'VISITED', name: 'Visited', color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-600' },
  { id: 'CONTACTED', name: 'Contacted', color: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-600' },
  { id: 'INTERESTED', name: 'Interested', color: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  { id: 'NOT_INTERESTED', name: 'Not Interested', color: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-600' },
  { id: 'CUSTOMER', name: 'Customer', color: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-600' },
];

interface PipelineViewProps {
  visits: PlannedVisit[];
  onSelectVisit: (visit: PlannedVisit) => void;
}

export default function PipelineView({ visits, onSelectVisit }: PipelineViewProps) {
  const { saveCapture } = useMarketMapping();
  
  const handleStatusChange = (visit: PlannedVisit, newStatus: VisitStatus) => {
    saveCapture({ ...visit, status: newStatus });
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-8 scrollbar-hide -mx-4 px-4 min-h-[500px]">
      {pipelineStatuses.map((status) => {
        const columnVisits = visits.filter(v => v.status === status.id);
        
        return (
          <div key={status.id} className="flex-shrink-0 w-72 space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", status.color)} />
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{status.name}</h3>
                <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">{columnVisits.length}</span>
              </div>
            </div>
            
            <div className="space-y-3 min-h-[100px] bg-slate-50/50 p-2 rounded-[24px] border border-dashed border-slate-200/50">
              <AnimatePresence mode="popLayout">
                {columnVisits.map((visit) => (
                  <motion.div 
                    key={visit.id} 
                    layout 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.95 }} 
                    onClick={() => onSelectVisit(visit)} 
                    className="bg-white p-4 rounded-[20px] shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all group relative overflow-hidden cursor-pointer"
                  >
                    <div className="space-y-3 relative z-10">
                      <div className="flex justify-between items-start">
                        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shadow-inner">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"><Phone className="w-3.5 h-3.5" /></button>
                          <button className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-slate-600 transition-all"><MoreHorizontal className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-black text-slate-900 mb-0.5 leading-tight truncate">{visit.name}</h4>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">
                          {visit.isPlaceholder ? 'Placeholder' : visit.category}
                        </p>
                      </div>
                      
                      <div className="pt-3 border-t border-slate-50" onClick={(e) => e.stopPropagation()}>
                        <select 
                          value={visit.status} 
                          onChange={(e) => handleStatusChange(visit, e.target.value as VisitStatus)} 
                          className={cn("w-full px-2 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest outline-none border-transparent cursor-pointer", status.bg, status.text)}
                        >
                          {pipelineStatuses.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className={cn("absolute left-0 top-0 bottom-0 w-1", status.color)} />
                  </motion.div>
                ))}
                
                {columnVisits.length === 0 && (
                  <div className="py-8 text-center text-[9px] font-bold uppercase tracking-widest text-slate-400">
                    Empty
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
}
