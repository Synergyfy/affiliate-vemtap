'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Send, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  getReportComments,
  addReportComment,
  ReportComment,
} from '@/lib/report-comments';

interface ReportCommentsProps {
  reportKey: string;
  currentUser: { name: string; role: string } | null;
  className?: string;
  placeholder?: string;
}

export default function ReportComments({ reportKey, currentUser, className, placeholder }: ReportCommentsProps) {
  const { showToast } = useToast();
  const [comments, setComments] = useState<ReportComment[]>([]);
  const [draft, setDraft] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    setComments(getReportComments(reportKey));
  }, [reportKey]);

  const handleSubmit = () => {
    const text = draft.trim();
    if (!text) return;
    if (!currentUser) {
      showToast('Sign in to add a comment', 'error');
      return;
    }
    addReportComment(reportKey, {
      author: currentUser.name,
      role: currentUser.role,
      text,
    });
    setDraft('');
    setIsAdding(false);
    setComments(getReportComments(reportKey));
    showToast('Comment saved and attached to the report', 'success');
  };

  return (
    <div className={cn("p-4 rounded-xl bg-white border border-slate-200", className)}>
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4 text-orange-600" />
        <span className="text-xs font-bold text-slate-900">Comments</span>
        {comments.length > 0 && (
          <span className="ml-auto text-[10px] font-bold text-slate-400">{comments.length}</span>
        )}
      </div>

      <div className="space-y-2">
        {comments.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">No comments yet. Add your comments.</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50">
              <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3 h-3" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-700">{c.text}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {c.author} · {c.role} · {new Date(c.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {isAdding ? (
        <div className="mt-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder={placeholder || 'Add a note, reason, or comment about this report...'}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
          />
          <div className="flex items-center gap-2 mt-2 justify-end">
            <button
              onClick={() => { setDraft(''); setIsAdding(false); }}
              className="px-3 py-2 text-[11px] font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!draft.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-3 h-3" /> Save Comment
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="mt-3 w-full py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-xs font-bold text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          + Add note or comment
        </button>
      )}
    </div>
  );
}
