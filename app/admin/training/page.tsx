'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Plus, 
  Video, 
  FileText, 
  MoreHorizontal, 
  Edit3, 
  Trash2, 
  Eye,
  Save,
  X,
  Type,
  Link as LinkIcon,
  ChevronDown,
  Layout
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const existingModules = [
  { id: 1, title: 'What is Vemtap?', type: 'Article + Video', duration: '5 mins', status: 'Published' },
  { id: 2, title: 'Who to Talk To', type: 'Article', duration: '8 mins', status: 'Published' },
  { id: 3, title: 'How to Approach', type: 'Video', duration: '12 mins', status: 'Draft' },
];

export default function TrainingManagement() {
  const { showToast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [contentType, setContentType] = useState<'article' | 'video' | 'both'>('article');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Training module saved successfully.", "success");
    setIsCreating(false);
  };

  const handleDelete = (title: string) => {
    showToast(`Module "${title}" deleted.`, "info");
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Training Academy Management</h2>
            <p className="text-sm text-slate-500 font-medium">Create and manage learning resources for your affiliates</p>
          </div>
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-5 h-5" />
            Create New Module
          </button>
        </div>

        <AnimatePresence>
          {isCreating && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white p-8 rounded-[32px] border-2 border-blue-100 shadow-xl shadow-blue-600/5 mb-8">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 rounded-2xl">
                      <Layout className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Create New Module</h3>
                  </div>
                  <button 
                    onClick={() => setIsCreating(false)}
                    className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Module Title</label>
                      <div className="relative">
                        <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="e.g. Mastering the QR Pitch"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Content Type</label>
                      <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                        {(['article', 'video', 'both'] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setContentType(t)}
                            className={cn(
                              "flex-grow py-2 rounded-lg text-xs font-bold transition-all capitalize",
                              contentType === t ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"
                            )}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Short Description</label>
                    <textarea 
                      placeholder="Brief overview of what this module covers..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      rows={2}
                    ></textarea>
                  </div>

                  {(contentType === 'video' || contentType === 'both') && (
                    <div className="space-y-2 p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                      <label className="text-sm font-bold text-blue-900 flex items-center gap-2">
                        <Video className="w-4 h-4" /> Video URL (YouTube/Vimeo)
                      </label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                        <input 
                          type="url" 
                          placeholder="https://youtube.com/watch?v=..."
                          className="w-full pl-10 pr-4 py-3 bg-white border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>
                  )}

                  {(contentType === 'article' || contentType === 'both') && (
                    <div className="space-y-2 p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                      <label className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Article Content (Markdown)
                      </label>
                      <textarea 
                        placeholder="### Introduction..."
                        className="w-full px-4 py-3 bg-white border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono text-sm"
                        rows={8}
                      ></textarea>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4">
                    <button 
                      type="button" 
                      onClick={() => setIsCreating(false)}
                      className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all"
                    >
                      Discard
                    </button>
                    <button 
                      type="submit"
                      className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg"
                    >
                      <Save className="w-4 h-4" />
                      Publish Module
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-900">Existing Modules</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="p-4 font-bold text-slate-600 text-sm">Module Name</th>
                  <th className="p-4 font-bold text-slate-600 text-sm">Type</th>
                  <th className="p-4 font-bold text-slate-600 text-sm">Est. Time</th>
                  <th className="p-4 font-bold text-slate-600 text-sm">Status</th>
                  <th className="p-4 font-bold text-slate-600 text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {existingModules.map((module, idx) => (
                  <tr key={module.id} className="hover:bg-slate-50/50 group transition-all">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                          {module.type.includes('Video') ? <Video className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                        </div>
                        <p className="font-bold text-slate-900">{module.title}</p>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600 font-medium">{module.type}</td>
                    <td className="p-4 text-sm text-slate-600 font-medium">{module.duration}</td>
                    <td className="p-4">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider",
                        module.status === 'Published' ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-500"
                      )}>
                        {module.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        <button 
                          onClick={() => showToast(`Previewing: ${module.title}`, "info")}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all title='Preview'"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setIsCreating(true);
                            showToast("Editing mode enabled", "info");
                          }}
                          className="p-2 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition-all title='Edit'"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(module.title)}
                          className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-all title='Delete'"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => showToast("More options", "info")}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
