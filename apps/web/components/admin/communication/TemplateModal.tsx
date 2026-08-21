'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import ModalShell from '@/components/ui/ModalShell';
import MessageComposer from '@/components/communication/MessageComposer';
import ChannelBadge from '@/components/communication/ChannelBadge';
import {
  CommunicationChannel,
  MessageTemplate,
  TemplateStatus,
  CHANNEL_COLORS,
} from '@/types/communication';
import { countSmsCharacters } from '@/lib/communication';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initial?: MessageTemplate | null;
  submitting?: boolean;
  onSubmit: (data: {
    id?: string;
    name: string;
    channel: CommunicationChannel;
    body: string;
    status: TemplateStatus;
    description?: string;
  }) => void;
}

const CHANNEL_TABS: { value: CommunicationChannel; label: string }[] = [
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'SMS', label: 'SMS' },
];

export default function TemplateModal({ isOpen, onClose, initial, submitting, onSubmit }: TemplateModalProps) {
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [channel, setChannel] = useState<CommunicationChannel>(initial?.channel || 'WHATSAPP');
  const [body, setBody] = useState(initial?.body || '');

  const charCount = channel === 'SMS' ? countSmsCharacters(body) : null;
  const canSubmit = name.trim().length > 0 && body.trim().length > 0 && !(charCount?.over ?? false);

  const handlePickedTemplate = (tpl: MessageTemplate) => {
    setBody(tpl.body);
    setChannel(tpl.channel);
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      header={
        <div className="p-5 sm:p-6 pr-14">
          <h3 className="text-lg font-black text-slate-900">{initial ? 'Edit Template' : 'New Template'}</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {initial ? 'Update name, channel or message.' : 'Save a reusable message for follow-ups.'}
          </p>
        </div>
      }
      footer={
        <div className="flex items-center justify-end gap-3 p-5 sm:p-6">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              onSubmit({
                id: initial?.id,
                name: name.trim(),
                channel,
                body: body.trim(),
                description: description.trim() || undefined,
                status: initial?.status || 'INACTIVE',
              })
            }
            isLoading={submitting}
            disabled={!canSubmit}
          >
            {initial ? 'Save changes' : 'Create template'}
          </Button>
        </div>
      }
    >
      <div className="p-5 sm:p-6 space-y-5">
        {/* Channel tabs */}
        <div className="flex gap-2">
          {CHANNEL_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setChannel(tab.value)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all',
                channel === tab.value
                  ? cn('text-white border-transparent shadow-lg', CHANNEL_COLORS[tab.value].bg.replace('50', '600'))
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Template name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Interested Lead – First Follow-up"
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description (optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Why and when is this used?"
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Message</label>
            <ChannelBadge channel={channel} />
          </div>
          <MessageComposer
            channel={channel}
            value={body}
            onChange={setBody}
            onPickTemplate={handlePickedTemplate}
            resolveLead={null}
          />
        </div>
      </div>
    </ModalShell>
  );
}