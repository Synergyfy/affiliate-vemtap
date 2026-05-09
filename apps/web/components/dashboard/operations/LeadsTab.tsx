'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Phone, 
  Mail, 
  MessageCircle,
  Clock,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import LeadCreationModal from './LeadCreationModal';
import { useToast } from '@/hooks/use-toast';

const stages = [
  { id: 'new', name: 'New Lead', color: 'bg-blue-500' },
  { id: 'contacted', name: 'Contacted', color: 'bg-orange-500' },
  { id: 'interested', name: 'Interested', color: 'bg-purple-500' },
  { id: 'demo', name: 'Demo Scheduled', color: 'bg-indigo-500' },
  { id: 'proposal', name: 'Proposal Sent', color: 'bg-pink-500' },
  { id: 'negotiation', name: 'Negotiation', color: 'bg-yellow-500' },
  { id: 'won', name: 'Won', color: 'bg-emerald-500' },
];

const mockLeads = [
  { id: 1, name: 'Nexus Retail Group', contact: 'David Chen', stage: 'negotiation', score: 85, value: '₦450k', lastActivity: '2h ago' },
  { id: 2, name: 'Blue Diamond Hotels', contact: 'Sarah Miller', stage: 'new', score: 60, value: '₦1.2M', lastActivity: '5h ago' },
  { id: 3, name: 'Z-Global Logistics', contact: 'James Wilson', stage: 'contacted', score: 72, value: '₦800k', lastActivity: '1d ago' },
  { id: 4, name: 'Green Valley Farms', contact: 'Emma Thompson', stage: 'demo', score: 90, value: '₦350k', lastActivity: '3h ago' },
  { id: 5, name: 'Stellar Tech Corp', contact: 'Michael Ross', stage: 'interested', score: 65, value: '₦2.5M', lastActivity: '1h ago' },
];

interface LeadsTabProps {
  isAdmin?: boolean;
}

export default function LeadsTab({ isAdmin = false }: LeadsTabProps) {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <div className="relative flex-grow max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads, businesses, or contacts..."
            className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button 
            onClick={() => showToast('Filters overlay coming soon', 'info')}
            variant="outline" 
            className="flex-grow sm:flex-grow-0 border-slate-200 text-xs font-bold h-10 rounded-xl flex items-center gap-2"
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
          </Button>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="flex-grow sm:flex-grow-0 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold h-10 rounded-xl flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Lead
          </Button>
        </div>
      </div>

      <LeadCreationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        isAdmin={isAdmin}
      />

      {/* Kanban Board */}
      <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide min-h-[600px]">
        {stages.map((stage) => (
          <div key={stage.id} className="flex-shrink-0 w-80 flex flex-col">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", stage.color)} />
                <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                  {mockLeads.length}
                </span>
              </div>
              <button 
                onClick={() => showToast(`${stage.name} settings coming soon`, 'info')}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-grow space-y-4 bg-slate-50/50 p-2 rounded-2xl border border-dashed border-slate-200 min-h-[500px]">
              {mockLeads.filter(l => l.stage === stage.id).map((lead) => (
                <motion.div
                  key={lead.id}
                  whileHover={{ y: -2, shadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-1">
                      {[...Array(3)].map((_, i) => (
                        <div 
                          key={i} 
                          className={cn(
                            "w-1 h-3 rounded-full", 
                            i < (lead.score / 33) ? "bg-emerald-500" : "bg-slate-200"
                          )} 
                        />
                      ))}
                      <span className="text-[10px] font-bold text-slate-400 ml-1">Score: {lead.score}</span>
                    </div>
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{lead.value}</span>
                  </div>
                  
                  <h5 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{lead.name}</h5>
                  <p className="text-xs text-slate-500 mb-2">{lead.contact}</p>
                  
                  {isAdmin && (
                    <div className="mb-4 flex items-center gap-2 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-[8px] font-black text-blue-600">A</div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Agent: <span className="text-slate-600">John Doe</span></span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); showToast(`Calling ${lead.contact}...`, 'info'); }}
                        className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                      >
                        <Phone className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); showToast(`Opening WhatsApp for ${lead.contact}...`, 'info'); }}
                        className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                      >
                        <MessageCircle className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); showToast(`Drafting email to ${lead.contact}...`, 'info'); }}
                        className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                      >
                        <Mail className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                      <Clock className="w-3 h-3" />
                      {lead.lastActivity}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full py-3 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs font-bold hover:bg-white hover:border-slate-300 hover:text-slate-600 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Lead
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
