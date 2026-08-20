'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { Loader2, ChevronDown, Check, Copy, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Lead } from '@/types/api';
import { CommunicationChannel, MessageTemplate, TEMPLATE_VARIABLES } from '@/types/communication';
import { countSmsCharacters, substituteVariables } from '@/lib/communication';

interface MessageComposerProps {
  channel: CommunicationChannel;
  value: string;
  onChange: (value: string) => void;
  onPickTemplate?: (template: MessageTemplate) => void;
  templates?: MessageTemplate[];
  resolveLead?: Partial<Lead> | null;
  disabled?: boolean;
}

export default function MessageComposer({
  channel,
  value,
  onChange,
  onPickTemplate,
  templates,
  resolveLead,
  disabled,
}: MessageComposerProps) {
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsTemplateOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const resolved = useMemo(
    () => (resolveLead ? substituteVariables(value, resolveLead) : value),
    [value, resolveLead],
  );

  const charCount = useMemo(
    () => (channel === 'SMS' ? countSmsCharacters(resolved) : null),
    [channel, resolved],
  );

  const insertVariable = (token: string) => {
    onChange(value + (value && !value.endsWith(' ') ? ' ' : '') + token + ' ');
  };

  const copyResolved = async () => {
    try {
      await navigator.clipboard.writeText(resolved);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const hasOverLimit = charCount?.over ?? false;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {TEMPLATE_VARIABLES.map((v) => (
          <button
            key={v.token}
            type="button"
            disabled={disabled}
            onClick={() => insertVariable(v.token)}
            className="px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200 bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all disabled:opacity-50"
          >
            {v.token}
          </button>
        ))}

        {templates && templates.length > 0 && (
          <div className="relative w-full sm:w-auto" ref={dropdownRef}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => setIsTemplateOpen(!isTemplateOpen)}
              className="px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Zap className="w-3 h-3" />
              Use template
              <ChevronDown className="w-3 h-3" />
            </button>
            {isTemplateOpen && (
              <div className="absolute left-0 right-0 sm:right-auto top-full mt-2 w-full sm:w-80 sm:max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-2 overflow-hidden">
                <p className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 mb-1">
                  Saved templates
                </p>
                <div className="max-h-64 overflow-y-auto">
                  {templates.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => {
                        onChange(tpl.body);
                        onPickTemplate?.(tpl);
                        setIsTemplateOpen(false);
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-all"
                    >
                      <p className="text-xs font-bold text-slate-800 truncate">{tpl.name}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{tpl.body}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          disabled={disabled || !resolved}
          onClick={copyResolved}
          className="px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600 transition-all flex items-center gap-1.5 disabled:opacity-50"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            channel === 'WHATSAPP'
              ? 'Write your WhatsApp message…'
              : 'Write your SMS (max 160 characters)…'
          }
          rows={4}
          className="w-full px-4 py-3 bg-white border rounded-2xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all resize-none disabled:opacity-60"
        />
      </div>

      {/* SMS counter / resolved preview */}
      <div className="flex items-start justify-between gap-4">
        {channel === 'SMS' && charCount ? (
          <div className="space-y-1">
            <p
              className={cn(
                'text-xs font-bold',
                hasOverLimit ? 'text-red-600' : 'text-slate-500',
              )}
            >
              Characters: <span className={cn('font-black', hasOverLimit && 'text-red-600')}>{charCount.chars}</span> / 160
              {charCount.parts > 1 && <span className="ml-2 text-amber-600">· {charCount.parts} SMS parts</span>}
            </p>
            {hasOverLimit && (
              <p className="text-[11px] font-bold text-red-600">Message exceeds the 160-character limit.</p>
            )}
          </div>
        ) : (
          <span className="text-xs font-medium text-slate-400">
            Variables are replaced for each contact before sending.
          </span>
        )}
        {resolveLead && (
          <p className="text-[11px] font-medium text-slate-400 text-right max-w-xs truncate">
            Preview: “{resolved}”
          </p>
        )}
      </div>
    </div>
  );
}