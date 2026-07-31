'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Save, 
  Eye, 
  Edit3,
  ShieldCheck,
  Info,
  ChevronLeft,
  Loader2,
  Plus,
  Check,
  UserCheck,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAdminAgreements, useCreateAgreementCustom, useUpdateAgreementCustom } from '@/services/useAgreementHooks';
import { Role } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import RichTextEditor from '@/components/admin/RichTextEditor';

export default function AgreementsWorkspace() {
  const { data: agreements, isLoading } = useAdminAgreements();
  const createAgreement = useCreateAgreementCustom();
  const updateAgreement = useUpdateAgreementCustom();
  const { showToast } = useToast();

  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null);
  const [isPreview, setIsPreview] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [isActive, setIsActive] = useState(true);

  // Initialize the workspace: select the first agreement if any exist
  useEffect(() => {
    if (agreements && agreements.length > 0 && !selectedAgreementId) {
      loadAgreementIntoForm(agreements[0]);
    }
  }, [agreements]);

  const loadAgreementIntoForm = (ag: any) => {
    setSelectedAgreementId(ag.id);
    setTitle(ag.title);
    setDescription(ag.description);
    setContent(ag.content);
    setSelectedRoles(ag.targetRoles);
    setIsActive(ag.isActive);
    setIsPreview(false);
  };

  const handleCreateNew = () => {
    setSelectedAgreementId(null);
    setTitle('');
    setDescription('');
    setContent('');
    setSelectedRoles([]);
    setIsActive(true);
    setIsPreview(false);
    showToast('Workspace cleared for new agreement creation.', 'info');
  };

  const handleRoleToggle = (role: Role) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const handleRoleAllToggle = () => {
    const allRoles: Role[] = ['AFFILIATE', 'AGENT', 'SUPERVISOR'];
    if (selectedRoles.length === allRoles.length) {
      setSelectedRoles([]);
    } else {
      setSelectedRoles(allRoles);
    }
  };

  const handleSave = async () => {
    if (!title || !description || !content || selectedRoles.length === 0) {
      showToast('Please specify a title, description, targeted roles, and content.', 'error');
      return;
    }

    try {
      if (selectedAgreementId) {
        // Update existing agreement
        const updated = await updateAgreement.mutateAsync({
          id: selectedAgreementId,
          payload: {
            title,
            description,
            content,
            targetRoles: selectedRoles,
            isActive,
          }
        });
        showToast(`Agreement terms updated successfully (now version ${updated.version}).`, 'success');
      } else {
        // Create new agreement
        const created = await createAgreement.mutateAsync({
          title,
          description,
          content,
          targetRoles: selectedRoles,
        });
        setSelectedAgreementId(created.id);
        showToast('New role-targeted agreement deployed and users notified!', 'success');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to save agreement. Please try again.';
      showToast(msg, 'error');
    }
  };

  const activeAgreementObj = agreements?.find(a => a.id === selectedAgreementId);
  const rolesAvailable: Role[] = ['AFFILIATE', 'AGENT', 'SUPERVISOR'];
  const roleLabels: Record<string, string> = {
    AFFILIATE: 'Affiliate',
    AGENT: 'Agent',
    SUPERVISOR: 'Line Manager',
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Breadcrumbs & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link href="/admin/settings" className="text-xs font-bold text-slate-500 flex items-center gap-1 hover:text-blue-600 transition-colors uppercase tracking-wider mb-2">
              <ChevronLeft className="w-3.5 h-3.5" /> Back to Settings
            </Link>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <div className="p-2.5 bg-slate-900 rounded-2xl text-white">
                <FileText className="w-5.5 h-5.5" />
              </div>
              Agreements Workspace Editor
            </h2>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {selectedAgreementId && (
              <Link
                href={`/admin/settings/agreement/${selectedAgreementId}`}
                className="inline-flex items-center gap-1.5 h-11 px-5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
              >
                <UserCheck className="w-4 h-4" /> View Signature Log <ArrowRight className="w-3 h-3 ml-0.5" />
              </Link>
            )}

            <Button 
              variant="outline" 
              onClick={() => setIsPreview(!isPreview)}
              className="h-11 border-slate-200 text-slate-600 font-bold px-5 rounded-xl"
            >
              {isPreview ? <Edit3 className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {isPreview ? "Edit Content" : "Live Preview"}
            </Button>

            <Button 
              onClick={handleSave}
              disabled={createAgreement.isPending || updateAgreement.isPending}
              className="h-11 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 font-bold px-7 rounded-xl"
            >
              {createAgreement.isPending || updateAgreement.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {selectedAgreementId ? 'Save Changes' : 'Deploy Agreement'}
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8 items-start">
          {/* Left Panel: Agreement Directory */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Agreements</span>
                <button
                  type="button"
                  onClick={handleCreateNew}
                  className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all active:scale-90"
                  title="Create New Agreement"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                </div>
              ) : agreements && agreements.length > 0 ? (
                <div className="space-y-2">
                  {agreements.map((ag) => (
                    <button
                      key={ag.id}
                      type="button"
                      onClick={() => loadAgreementIntoForm(ag)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all text-xs flex flex-col gap-1.5 ${
                        selectedAgreementId === ag.id
                          ? 'bg-slate-900 border-slate-900 text-white shadow-lg'
                          : 'bg-white border-slate-100 hover:bg-slate-50/80 text-slate-600'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full gap-2">
                        <span className="font-bold truncate max-w-[120px]">{ag.title}</span>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
                          selectedAgreementId === ag.id
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          v{ag.version}
                        </span>
                      </div>
                      <span className={`text-[9px] truncate max-w-[170px] ${selectedAgreementId === ag.id ? 'text-slate-300' : 'text-slate-400'}`}>
                        {ag.description}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-4 text-center">No agreements deployed.</p>
              )}
            </div>

            {/* Quick Tips */}
            <div className="bg-blue-50 p-6 rounded-[24px] border border-blue-100 space-y-2.5">
              <div className="flex items-center gap-2 text-blue-700">
                <Info className="w-5 h-5 shrink-0" />
                <h4 className="font-bold text-sm">Deployment Guide</h4>
              </div>
              <p className="text-[11px] text-blue-600 leading-normal">
                Deploying a new policy will broadcast in-app notifications and prompt targeted users on their next dashboard load.
              </p>
              <p className="text-[11px] text-blue-600 leading-normal">
                Updating title, description, or content triggers a **version bump**, prompting all active users to sign the latest version.
              </p>
            </div>
          </div>

          {/* Main Area: Rich Text Workspace */}
          <div className="lg:col-span-3 space-y-6">
            {/* Agreement Configuration Header details */}
            <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Agreement Specifications</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Agreement Title</label>
                  <Input 
                    placeholder="e.g. Sales Executive Terms and Conditions"
                    value={title}
                    disabled={isPreview}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="h-11 border-slate-200 rounded-xl text-xs font-medium focus:border-blue-500 disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Brief Summary / Changes description</label>
                  <Input 
                    placeholder="Brief description showing users what is contained or what changed."
                    value={description}
                    disabled={isPreview}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className="h-11 border-slate-200 rounded-xl text-xs font-medium focus:border-blue-500 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Target Roles and Active Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-2 border-t border-slate-50">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Target User Roles</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={isPreview}
                      onClick={handleRoleAllToggle}
                      className={`px-3.5 py-2 rounded-xl text-[11px] font-bold border transition-all ${
                        selectedRoles.length === rolesAvailable.length
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'bg-white border-slate-200 text-slate-600 disabled:opacity-50'
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
                          disabled={isPreview}
                          onClick={() => handleRoleToggle(role)}
                          className={`px-3.5 py-2 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1 ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                              : 'bg-white border-slate-200 text-slate-600 disabled:opacity-50'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 shrink-0" />}
                          {roleLabels[role] || role}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedAgreementId && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Policy Status</label>
                    <label className="flex items-center gap-2 cursor-pointer w-fit">
                      <input 
                        type="checkbox"
                        checked={isActive}
                        disabled={isPreview}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-slate-200 rounded focus:ring-blue-500 disabled:opacity-50"
                      />
                      <span className="text-xs font-bold text-slate-700">Keep agreement active</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Visual Editor Workspace */}
            <motion.div 
              layout
              className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col"
            >
              <div className="flex items-center justify-between px-8 py-4 bg-slate-50/50 border-b border-slate-100 shrink-0">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  {isPreview ? "Final Document Preview" : "Agreement Document Body (HTML allowed)"}
                </span>
                {!isPreview && content && (
                  <span className="text-[11px] font-mono text-slate-400">
                    {new TextEncoder().encode(content).length < 1024
                      ? `${new TextEncoder().encode(content).length} B`
                      : `${(new TextEncoder().encode(content).length / 1024).toFixed(1)} KB`}
                  </span>
                )}
              </div>

              {isLoading ? (
                <div className="flex-grow flex items-center justify-center min-h-[400px]">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                </div>
              ) : isPreview ? (
                <div className="flex-grow p-10 prose prose-slate max-w-none prose-h4:text-slate-900 prose-h4:font-black prose-p:text-slate-600 prose-strong:text-slate-900 overflow-y-auto max-h-[500px] scrollbar-thin">
                  <div className="mb-6 pb-6 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-900 mb-1">{title || 'Agreement Document'}</p>
                    <p className="text-xs text-slate-400">Between: Vemtap Team and Targeted Roles ({selectedRoles.join(', ') || 'None'})</p>
                  </div>
                  <div dangerouslySetInnerHTML={{ __html: content }} />
                  <div className="mt-12 pt-8 border-t border-slate-100 grid grid-cols-2 gap-8 opacity-45 grayscale">
                    <div className="h-24 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Digital Signature placeholder</span>
                    </div>
                    <div className="h-24 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Date placeholder</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 flex-grow flex flex-col min-h-[400px]">
                  <RichTextEditor 
                    value={content}
                    onChange={setContent}
                  />
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
