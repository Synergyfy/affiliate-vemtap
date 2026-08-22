'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Plus, Loader2 } from 'lucide-react';
import CampaignCard from '@/components/admin/communication/CampaignCard';
import CampaignWizardModal from '@/components/admin/communication/CampaignWizardModal';
import { useCampaigns, useCampaignMutations } from '@/services/useCommunicationHooks';
import { useToast } from '@/hooks/toast';
import { Campaign } from '@/types/communication';

export default function CampaignsTab() {
  const { showToast } = useToast();
  const { data: campaigns, isLoading } = useCampaigns();
  const mutations = useCampaignMutations();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);

  const handleSave = async (data: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editing) {
        await mutations.update.mutateAsync({ id: editing.id, ...data });
        showToast('Campaign updated.', 'success');
      } else {
        await mutations.create.mutateAsync(data);
        showToast('Campaign created.', 'success');
      }
      setModalOpen(false);
      setEditing(null);
    } catch {
      showToast('Failed to save campaign.', 'error');
    }
  };

  const handleStatusChange = async (id: string, status: Campaign['status']) => {
    try {
      await mutations.updateStatus.mutateAsync({ id, status });
      showToast(`Campaign ${status.toLowerCase()}.`, 'success');
    } catch {
      showToast('Failed to update campaign.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await mutations.remove.mutateAsync(id);
      showToast('Campaign deleted.', 'info');
    } catch {
      showToast('Failed to delete campaign.', 'error');
    }
  };

  const active = campaigns?.filter((c) => c.status === 'ACTIVE') || [];
  const drafts = campaigns?.filter((c) => c.status === 'DRAFT') || [];
  const ended = campaigns?.filter((c) => c.status === 'COMPLETED' || c.status === 'PAUSED' || c.status === 'CANCELLED') || [];

  return (
    <div className="space-y-4 sm:space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-slate-900">Campaigns</h3>
          <p className="text-xs text-slate-500 mt-1">Create promotions for specific audiences across WhatsApp and SMS.</p>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-100 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
        </div>
      ) : campaigns && campaigns.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center">
          <Megaphone className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">No campaigns yet. Create your first promotion above.</p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <section>
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Active</h4>
              <div className="grid gap-4 md:grid-cols-2">
                {active.map((c, i) => (
                  <CampaignCard key={c.id} campaign={c} index={i} onEdit={(c) => { setEditing(c); setModalOpen(true); }} onStatusChange={handleStatusChange} onDelete={handleDelete} />
                ))}
              </div>
            </section>
          )}
          {drafts.length > 0 && (
            <section>
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Drafts</h4>
              <div className="grid gap-4 md:grid-cols-2">
                {drafts.map((c, i) => (
                  <CampaignCard key={c.id} campaign={c} index={i} onEdit={(c) => { setEditing(c); setModalOpen(true); }} onStatusChange={handleStatusChange} onDelete={handleDelete} />
                ))}
              </div>
            </section>
          )}
          {ended.length > 0 && (
            <section>
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Past</h4>
              <div className="grid gap-4 md:grid-cols-2">
                {ended.map((c, i) => (
                  <CampaignCard key={c.id} campaign={c} index={i} onEdit={(c) => { setEditing(c); setModalOpen(true); }} onStatusChange={handleStatusChange} onDelete={handleDelete} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <CampaignWizardModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
        campaign={editing}
        isLoading={mutations.create.isPending || mutations.update.isPending}
      />
    </div>
  );
}
