'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Plus, 
  Settings, 
  Loader2, 
  Check, 
  X, 
  ShieldCheck, 
  UserCheck,
  Calendar,
  Layers,
  ArrowRight,
  Eye,
  Edit2
} from 'lucide-react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAdminAgreements, useCreateAgreementCustom, useUpdateAgreementCustom } from '@/services/useAgreementHooks';
import { Role } from '@/types/api';
import { useToast } from '@/hooks/use-toast';

export default function AdminAgreementsDashboard() {
  const { data: agreements, isLoading } = useAdminAgreements();
  const { showToast } = useToast();
  const createAgreement = useCreateAgreementCustom();
  const updateAgreement = useUpdateAgreementCustom();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgreement, setEditingAgreement] = useState<any | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setContent('');
    setSelectedRoles([]);
    setIsActive(true);
    setEditingAgreement(null);
  };

  const handleRoleToggle = (role: Role) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const handleRoleAllToggle = () => {
    const allRoles: Role[] = ['AFFILIATE', 'AGENT', 'SUPERVISOR', 'MANAGER'];
    if (selectedRoles.length === allRoles.length) {
      setSelectedRoles([]);
    } else {
      setSelectedRoles(allRoles);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (ag: any) => {
    setEditingAgreement(ag);
    setTitle(ag.title);
    setDescription(ag.description);
    setContent(ag.content);
    setSelectedRoles(ag.targetRoles);
    setIsActive(ag.isActive);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !content || selectedRoles.length === 0) {
      showToast('Please fill in all fields and select at least one role', 'error');
      return;
    }

    try {
      if (editingAgreement) {
        // Update
        await updateAgreement.mutateAsync({
          id: editingAgreement.id,
          payload: {
            title,
            description,
            content,
            targetRoles: selectedRoles,
            isActive,
          }
        });
        showToast('Agreement updated successfully', 'success');
      } else {
        // Create
        await createAgreement.mutateAsync({
          title,
          description,
          content,
          targetRoles: selectedRoles,
        });
        showToast('Agreement created and matching users notified', 'success');
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Action failed. Please try again.';
      showToast(msg, 'error');
    }
  };

  const toggleAgreementStatus = async (ag: any) => {
    try {
      await updateAgreement.mutateAsync({
        id: ag.id,
        payload: { isActive: !ag.isActive }
      });
      showToast(`Agreement status changed to ${!ag.isActive ? 'Active' : 'Inactive'}`, 'success');
    } catch {
      showToast('Failed to toggle status', 'error');
    }
  };

  const rolesAvailable: Role[] = ['AFFILIATE', 'AGENT', 'SUPERVISOR', 'MANAGER'];

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-900 rounded-2xl text-white">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Targeted Agreements</h2>
              <p className="text-sm text-slate-500 font-medium">
                Configure customized agreements targeted at specific roles and trace signature logs.
              </p>
            </div>
          </div>
          <Button 
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-100"
          >
            <Plus className="w-5 h-5" /> Deploy New Agreement
          </Button>
        </div>

        {/* Content list */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-[32px] shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin text-slate-350 mb-3" />
            <p className="text-slate-500 font-bold text-sm">Fetching agreement configurations...</p>
          </div>
        ) : agreements && agreements.length > 0 ? (
          <div className="grid gap-6">
            {agreements.map((ag) => (
              <motion.div 
                key={ag.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 sm:p-8 border border-slate-200 shadow-sm rounded-[32px] flex flex-col md:flex-row justify-between gap-6 items-start"
              >
                <div className="space-y-4 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200/50 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Version {ag.version}
                    </span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      ag.isActive 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}>
                      {ag.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                      <Calendar className="w-3 h-3" /> 
                      {new Date(ag.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight">{ag.title}</h3>
                    <p className="text-xs font-semibold text-slate-500 leading-normal mt-1.5">{ag.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {ag.targetRoles.map((role) => (
                      <span key={role} className="text-[9px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded font-black tracking-wider uppercase">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions Panel */}
                <div className="flex flex-wrap md:flex-col gap-2 shrink-0 w-full md:w-auto">
                  <Link 
                    href={`/admin/settings/agreements/${ag.id}`}
                    className="flex-grow md:flex-grow-0 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md hover:bg-slate-800 transition-colors active:scale-98"
                  >
                    <UserCheck className="w-4 h-4" /> Signature Log <ArrowRight className="w-3 h-3 ml-0.5" />
                  </Link>
                  
                  <div className="flex gap-2 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={() => openEditModal(ag)}
                      className="flex-grow flex items-center justify-center gap-1.5 px-3 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => toggleAgreementStatus(ag)}
                      className={`flex-grow px-3 py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        ag.isActive 
                          ? 'border-red-150 hover:bg-red-50 text-red-600'
                          : 'border-emerald-150 hover:bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      {ag.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-[32px] shadow-sm">
            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-lg text-slate-800">No Custom Agreements</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto leading-relaxed">
              Targeted agreements have not been deployed yet. Deploy one to establish role-targeted policies.
            </p>
          </div>
        )}

        {/* Wizard Form Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 overflow-y-auto">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
                onClick={() => setIsModalOpen(false)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="relative w-full max-w-2xl bg-white rounded-[32px] border border-slate-100 shadow-2xl p-6 sm:p-8 space-y-6 my-auto max-h-[90vh] flex flex-col"
              >
                {/* Header */}
                <div className="shrink-0 flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-lg font-black text-slate-900">
                    {editingAgreement ? 'Update Agreement Terms' : 'Deploy New Role-Targeted Agreement'}
                  </h3>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form scroll container */}
                <form onSubmit={handleSubmit} className="overflow-y-auto flex-grow space-y-5 pr-1 scrollbar-thin">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Agreement Title</label>
                    <Input 
                      placeholder="e.g. Sales Executive Terms and Conditions"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="h-11 border-slate-200 rounded-xl text-xs font-medium focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Brief Description / Change Summary</label>
                    <Input 
                      placeholder="Briefly summarize what this agreement covers or why it's updated."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      className="h-11 border-slate-200 rounded-xl text-xs font-medium focus:border-blue-500"
                    />
                  </div>

                  {/* Targeted Roles multi-select */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Target User Roles</label>
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={handleRoleAllToggle}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                          selectedRoles.length === rolesAvailable.length
                            ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                        }`}
                      >
                        All Roles
                      </button>
                      
                      {rolesAvailable.map((role) => {
                        const isSelected = selectedRoles.includes(role);
                        return (
                          <button
                            key={role}
                            type="button"
                            onClick={() => handleRoleToggle(role)}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 ${
                              isSelected
                                ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-50'
                                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                            {role}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* HTML/Markdown Editor */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Agreement Document Body (HTML allowed)</label>
                    <textarea 
                      placeholder="<h4>1. Independent Contractor Status</h4><p>The Affiliate agrees that they are...</p>"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                      rows={6}
                      className="w-full p-4 border border-slate-200 focus:border-blue-500 rounded-2xl outline-none font-mono text-xs leading-relaxed focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  {editingAgreement && (
                    <div className="space-y-2 pt-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Active Status</label>
                      <label className="flex items-center gap-2 cursor-pointer w-fit">
                        <input 
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                          className="w-4.5 h-4.5 text-blue-600 border-slate-200 focus:ring-blue-500 rounded"
                        />
                        <span className="text-xs font-bold text-slate-700">Keep agreement active (targeted users are prompted to sign)</span>
                      </label>
                    </div>
                  )}

                  {!editingAgreement && (
                    <div className="flex items-center gap-2.5 p-4 bg-blue-50 rounded-2xl border border-blue-100 text-blue-800 text-[10px] font-medium leading-relaxed">
                      <ShieldCheck className="w-5 h-5 shrink-0 text-blue-600" />
                      Deploying this agreement will immediately notify all matching active users upon their next dashboard load.
                    </div>
                  )}

                  {editingAgreement && (
                    <div className="flex items-center gap-2.5 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-800 text-[10px] font-medium leading-relaxed">
                      <ShieldCheck className="w-5 h-5 shrink-0 text-amber-600" />
                      Updating this agreement&apos;s title, description, targeted roles, or text will trigger a **version increment (to version {editingAgreement.version + 1})**. All targeted users (even those who signed the previous version) will be prompted to sign the updated version.
                    </div>
                  )}
                </form>

                {/* Footer buttons */}
                <div className="shrink-0 flex gap-3 pt-3 border-t border-slate-100">
                  <Button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="w-1/2 h-12 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="button"
                    onClick={handleSubmit}
                    isLoading={createAgreement.isPending || updateAgreement.isPending}
                    disabled={createAgreement.isPending || updateAgreement.isPending}
                    className="w-1/2 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-50"
                  >
                    {editingAgreement ? 'Save & Deploy Version' : 'Deploy Agreement'}
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}
