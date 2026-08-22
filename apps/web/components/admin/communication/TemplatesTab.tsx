'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Plus, Loader2, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import TemplateCard from './TemplateCard';
import TemplateModal from './TemplateModal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/toast';
import {
  useTemplates,
  useCreateOrUpdateTemplate,
  useDeleteTemplate,
} from '@/services/useCommunicationHooks';
import {
  CommunicationChannel,
  MessageTemplate,
  TemplateStatus,
  CHANNEL_COLORS,
} from '@/types/communication';

const CHANNEL_FILTERS: { value: CommunicationChannel | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All channels' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'SMS', label: 'SMS' },
];

const STATUS_FILTERS: { value: TemplateStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'ARCHIVED', label: 'Archived' },
];

export default function TemplatesTab() {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState<CommunicationChannel | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<TemplateStatus | 'ALL'>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MessageTemplate | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MessageTemplate | null>(null);

  const { data: templates, isLoading } = useTemplates();
  const saveTemplate = useCreateOrUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();

  const filtered = useMemo(() => {
    let list = templates || [];
    if (channelFilter !== 'ALL') list = list.filter((t) => t.channel === channelFilter);
    if (statusFilter !== 'ALL') list = list.filter((t) => t.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.body.toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [templates, channelFilter, statusFilter, search]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (template: MessageTemplate) => {
    setEditing(template);
    setModalOpen(true);
  };

  const handleSubmit = async (data: Parameters<typeof saveTemplate.mutateAsync>[0]) => {
    try {
      await saveTemplate.mutateAsync(data);
      showToast(data.id ? 'Template updated.' : 'Template created.', 'success');
      setModalOpen(false);
      setEditing(null);
    } catch (error: any) {
      showToast(error?.message || 'Failed to save template.', 'error');
    }
  };

  const handleToggleStatus = async (template: MessageTemplate) => {
    setBusyId(template.id);
    try {
      await saveTemplate.mutateAsync({
        id: template.id,
        status: template.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
      });
      showToast(template.status === 'ACTIVE' ? 'Template deactivated.' : 'Template activated.', 'success');
    } catch (error: any) {
      showToast(error?.message || 'Failed to update status.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleArchive = async (template: MessageTemplate) => {
    setBusyId(template.id);
    try {
      await saveTemplate.mutateAsync({ id: template.id, status: 'ARCHIVED' });
      showToast('Template archived.', 'info');
    } catch (error: any) {
      showToast(error?.message || 'Failed to archive template.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTemplate.mutateAsync(deleteTarget.id);
      showToast(`${deleteTarget.name} deleted.`, 'success');
      setDeleteTarget(null);
    } catch (error: any) {
      showToast(error?.message || 'Failed to delete template.', 'error');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm">
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates…"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1.5 flex-wrap">
            {CHANNEL_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setChannelFilter(f.value)}
                className={cn(
                  'px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all',
                  channelFilter === f.value
                    ? f.value === 'SMS'
                      ? 'bg-sky-600 text-white border-sky-600 shadow-lg shadow-sky-100'
                      : f.value === 'WHATSAPP'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100'
                        : 'bg-slate-800 text-white border-slate-800'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          {channelFilter !== 'ALL' && (
            <button
              onClick={() => setChannelFilter('ALL')}
              className="text-xs font-black text-slate-400 hover:text-red-500 uppercase tracking-widest px-2 py-2"
            >
              Clear
            </button>
          )}
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 border-b border-slate-100 overflow-x-auto scrollbar-hide -mx-1 px-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              'relative px-5 py-3 text-sm font-bold transition-all',
              statusFilter === f.value ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {f.label}
            {statusFilter === f.value && (
              <motion.div layoutId="templateStatus" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {channelFilter === 'ALL' ? <Search className="w-6 h-6 text-slate-300" /> : <Plus className="w-6 h-6 text-slate-300" />}
          </div>
          <p className="text-sm font-medium text-slate-500">
            {search || statusFilter !== 'ALL' || channelFilter !== 'ALL'
              ? 'No templates match your filters.'
              : 'No templates yet. Create one to reuse messages.'}
          </p>
          {!search && statusFilter === 'ALL' && channelFilter === 'ALL' && (
            <button onClick={openCreate} className="mt-4 text-xs font-black text-blue-600 uppercase tracking-widest">
              Create template
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((template, idx) => (
            <TemplateCard
              key={template.id}
              template={template}
              index={idx}
              busy={busyId === template.id}
              onEdit={openEdit}
              onToggleStatus={handleToggleStatus}
              onArchive={handleArchive}
              onDelete={(t) => setDeleteTarget(t)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit modal */}
      <TemplateModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        initial={editing}
        submitting={saveTemplate.isPending}
        onSubmit={handleSubmit}
      />

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-[200]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteTarget(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="fixed inset-x-0 bottom-0 sm:inset-x-auto sm:top-1/2 sm:-translate-y-1/2 mx-auto w-full max-w-sm bg-white rounded-t-[28px] sm:rounded-3xl shadow-2xl p-6 z-[210]"
            >
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden" />
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-1">Delete template?</h3>
              <p className="text-sm text-slate-500 font-medium mb-6">
                “{deleteTarget.name}” will be permanently removed. Consider archiving instead to keep history.
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleDelete} isLoading={deleteTemplate.isPending}>
                  Delete
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}