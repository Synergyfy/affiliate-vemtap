'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Phone, 
  MessageCircle, 
  Mail,
  AlertCircle,
  Clock,
  CheckCircle2,
  Building2,
  ChevronRight,
  ArrowRight,
  List,
  Columns,
  ExternalLink,
  Edit2,
  Trash2,
  Share2,
  Archive,
  Copy,
  Globe,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import LeadCreationModal from '@/components/dashboard/operations/LeadCreationModal';
import LeadDetailsDrawer from '@/components/leads/LeadDetailsDrawer';
import LeadActionConfirmationModal from '@/components/leads/LeadActionConfirmationModal';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { motion, AnimatePresence } from 'framer-motion';

import { useLeads, useUpdateLead, useDeleteLead } from '@/services/useLeadsHooks';
import { LeadStatus } from '@/types/api';

const statuses = [
  { id: 'POTENTIAL', name: 'Potential', color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-600' },
  { id: 'CONTACTED', name: 'Contacted', color: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-600' },
  { id: 'INTERESTED', name: 'Interested', color: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  { id: 'NOT_INTERESTED', name: 'Not Interested', color: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-600' },
  { id: 'COMPLETED', name: 'Completed', color: 'bg-slate-500', bg: 'bg-slate-100', text: 'text-slate-600' },
];

export default function AgentLeadsPage() {
  const [view, setView] = useState<'list' | 'pipeline'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [actionModal, setActionModal] = useState<{ isOpen: boolean, type: 'delete' | 'archive', lead: any }>({
    isOpen: false,
    type: 'delete',
    lead: null
  });
  
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const { showToast } = useToast();
  const { user } = useAuth();

  const { data: leads = [], isLoading } = useLeads({ search: searchQuery });
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();

  const handleStatusChange = async (id: string, newStatus: LeadStatus) => {
    try {
      await updateLead.mutateAsync({ id, data: { status: newStatus } });
      showToast(`Lead moved to ${newStatus.toLowerCase()}`, 'success');
    } catch (error) {
      showToast('Failed to update status', 'error');
    }
  };

  const copyPublicLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const agentId = user?.id || 'agent-default';
    const url = `${window.location.origin}/capture/${agentId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setIsCopied(true);
        showToast('Public Link Copied!', 'success');
        setTimeout(() => setIsCopied(false), 2000);
      });
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setIsCopied(true);
        showToast('Public Link Copied!', 'success');
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        showToast('Failed to copy', 'error');
      }
      document.body.removeChild(textArea);
    }
  };

  const openDetails = (lead: any) => {
    setSelectedLead(lead);
    setIsDrawerOpen(true);
  };

  const openActionModal = (type: 'delete' | 'archive', lead: any) => {
    setActionModal({ isOpen: true, type, lead });
    setActiveMenuId(null);
  };

  const handleActionConfirm = async (reason: string) => {
    if (actionModal.type === 'delete' && actionModal.lead) {
      try {
        await deleteLead.mutateAsync(actionModal.lead.id);
        showToast('Lead deleted successfully', 'success');
        setActionModal({ ...actionModal, isOpen: false });
      } catch (error) {
        showToast('Failed to delete lead', 'error');
      }
    } else {
      showToast(`${actionModal.type === 'delete' ? 'Delete' : 'Archive'} request sent for approval.`, 'info');
      setActionModal({ ...actionModal, isOpen: false });
    }
  };

  const filteredLeads = leads;

  return (
    <DashboardLayout>
      <div className="space-y-8" onClick={() => setActiveMenuId(null)}>
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h2 className="text-3xl font-black text-slate-900 leading-tight">Leads Dashboard</h2>
            <p className="text-xs text-slate-500 font-medium">Capture and track your business acquisitions with ease.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={copyPublicLink}
              className={cn(
                "h-12 px-6 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border",
                isCopied ? "bg-emerald-500 text-white border-emerald-500" : "bg-white border-slate-200 text-blue-600 hover:bg-blue-50"
              )}
            >
              {isCopied ? <Check className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
              {isCopied ? 'Copied!' : 'Get Public Link'}
            </button>

            <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 shadow-inner border border-slate-200">
              <button onClick={() => setView('list')} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", view === 'list' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                <List className="w-3.5 h-3.5" /> List
              </button>
              <button onClick={() => setView('pipeline')} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", view === 'pipeline' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                <Columns className="w-3.5 h-3.5" /> Pipeline
              </button>
            </div>
            <Button onClick={() => setIsModalOpen(true)} className="bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold h-12 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-slate-200 transition-all">
              <Plus className="w-4 h-4" /> New Lead
            </Button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search leads by name or contact..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all" />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={(e) => { e.stopPropagation(); showToast('Filter panel opening...', 'info'); }} variant="outline" className="border-slate-200 text-xs font-bold h-11 rounded-xl flex items-center gap-2 hover:bg-slate-50">
              <Filter className="w-3.5 h-3.5" /> Filter
            </Button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {view === 'list' ? (
            <motion.div key="list" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Business Info</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Added Date</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading your pipeline...</p>
                          </div>
                        </td>
                      </tr>
                    ) : filteredLeads.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-20 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No leads found</td>
                      </tr>
                    ) : filteredLeads.map((lead) => (
                      <tr key={lead.id} onClick={() => openDetails(lead)} className="group hover:bg-slate-50 transition-colors cursor-pointer">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                              <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900">{lead.businessName}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lead.industry}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div>
                            <p className="text-sm font-bold text-slate-700">{lead.contactName}</p>
                            <p className="text-xs text-slate-400">{lead.phone}</p>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div onClick={(e) => e.stopPropagation()}>
                            <select value={lead.status} onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)} className={cn("inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest outline-none border-transparent cursor-pointer shadow-sm", statuses.find(s => s.id === lead.status)?.bg, statuses.find(s => s.id === lead.status)?.text)}>
                              {statuses.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                            </select>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-slate-500">
                            <Clock className="w-4 h-4 text-blue-500" />
                            <div><p className="text-xs font-bold">{new Date(lead.createdAt).toLocaleDateString()}</p><p className="text-[10px] text-slate-400">{new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2 relative" onClick={(e) => e.stopPropagation()}>
                            <button onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); setSelectedLead(lead); }} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all shadow-sm"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === lead.id ? null : lead.id); }} className={cn("p-2 rounded-lg transition-all border", activeMenuId === lead.id ? "bg-slate-900 text-white border-slate-900" : "bg-slate-50 text-slate-400 hover:text-slate-600 border-slate-100")}><MoreHorizontal className="w-4 h-4" /></button>
                            <AnimatePresence>
                              {activeMenuId === lead.id && (
                                <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 overflow-hidden">
                                  <button onClick={() => showToast('Sharing lead...', 'info')} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all"><Share2 className="w-4 h-4" /> Share Lead</button>
                                  <button onClick={() => openActionModal('archive', lead)} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-orange-600 transition-all"><Archive className="w-4 h-4" /> Archive Lead</button>
                                  <div className="h-[1px] bg-slate-50 my-1" />
                                  <button onClick={() => openActionModal('delete', lead)} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 transition-all"><Trash2 className="w-4 h-4" /> Delete Lead</button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            <motion.div key="pipeline" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide -mx-4 px-4 min-h-[600px]">
              {statuses.map((status) => (
                <div key={status.id} className="flex-shrink-0 w-80 space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", status.color)} />
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{status.name}</h3>
                      <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">{filteredLeads.filter(l => l.status === status.id).length}</span>
                    </div>
                  </div>
                  <div className="space-y-4 min-h-[100px] bg-slate-50/50 p-2 rounded-[32px] border border-dashed border-slate-200/50">
                    <AnimatePresence mode="popLayout">
                      {filteredLeads.filter(lead => lead.status === status.id).map((lead) => (
                        <motion.div key={lead.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} onClick={() => openDetails(lead)} className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-blue-50/50 transition-all group relative overflow-hidden cursor-pointer">
                          <div className="space-y-4 relative z-10">
                            <div className="flex justify-between items-start">
                              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                                <Building2 className="w-5 h-5" />
                              </div>
                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <button onClick={(e) => { e.stopPropagation(); showToast(`Calling ${lead.contactName}...`, 'info'); }} className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"><Phone className="w-3.5 h-3.5" /></button>
                                <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === lead.id ? null : lead.id); }} className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-slate-600 transition-all"><MoreHorizontal className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-slate-900 mb-1 leading-tight group-hover:text-blue-600 transition-colors">{lead.businessName}</h4>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{lead.contactName} • {lead.industry}</p>
                            </div>
                            <div className="pt-4 border-t border-slate-50" onClick={(e) => e.stopPropagation()}>
                              <select value={lead.status} onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)} className={cn("w-full px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none border-transparent focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer", status.bg, status.text)}>
                                {statuses.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                              </select>
                            </div>
                          </div>
                          <div className={cn("absolute left-0 top-0 bottom-0 w-1", status.color)} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Guide */}
        <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-200">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 rounded-full text-blue-400 border border-blue-500/20">
                <CheckCircle2 className="w-4 h-4" /> <span className="text-[10px] font-black uppercase tracking-widest">Workflow Simplified</span>
              </div>
              <h3 className="text-2xl font-black">Capture Anywhere.</h3>
              <p className="text-slate-400 text-sm font-medium max-w-md leading-relaxed">Use your personal **Public Link** to capture leads offline or without logging in.</p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <button onClick={copyPublicLink} className={cn("h-14 px-8 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest transition-all shadow-xl", isCopied ? "bg-emerald-500 text-white shadow-emerald-200" : "bg-white text-slate-900 hover:bg-blue-50 shadow-slate-200")}>
                {isCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />} {isCopied ? 'Link Copied!' : 'Copy My Public Link'}
              </button>
            </div>
          </div>
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full" />
        </div>
      </div>

      {/* Modals & Drawer */}
      <LeadCreationModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedLead(null); }} 
        agentId={user?.id} 
      />
      
      <LeadDetailsDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        lead={selectedLead}
        onEdit={(lead) => {
          setIsDrawerOpen(false);
          setIsModalOpen(true);
          setSelectedLead(lead);
        }}
      />

      <LeadActionConfirmationModal 
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ ...actionModal, isOpen: false })}
        onConfirm={handleActionConfirm}
        type={actionModal.type}
        leadName={actionModal.lead?.businessName || ''}
      />
    </DashboardLayout>
  );
}
