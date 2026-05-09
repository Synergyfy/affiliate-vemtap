'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Layout,
  Layers,
  ChevronRight
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/toast';

import { 
  useAdminTrainingModules, 
  useCreateTrainingModule, 
  useUpdateTrainingModule, 
  useDeleteTrainingModule 
} from '@/services/useTrainingHooks';
import { Loader2 } from 'lucide-react';
import { TrainingModule, Quiz, Scenario } from '@/types/api';

export default function TrainingManagement() {
  const { showToast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<TrainingModule | null>(null);
  
  const { data: trainingResponse, isLoading: isTrainingLoading } = useAdminTrainingModules();
  const createModule = useCreateTrainingModule();
  const updateModule = useUpdateTrainingModule();
  const deleteModule = useDeleteTrainingModule();

  const [newModule, setNewModule] = useState<Partial<TrainingModule>>({
    title: '',
    description: '',
    category: 'Sales',
    content: '',
    videoUrl: '',
    pdfUrl: '',
    order: 1,
    isPublished: true,
    scenarios: [],
    quizzes: []
  });

  const [scenariosText, setScenariosText] = useState('[]');
  const [quizzesText, setQuizzesText] = useState('[]');

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Partial<TrainingModule> = {
        ...newModule,
        scenarios: JSON.parse(scenariosText),
        quizzes: JSON.parse(quizzesText),
        order: Number(newModule.order) || (trainingResponse?.data?.length || 0) + 1
      };

      if (isEditing && selectedCourse) {
        await updateModule.mutateAsync({ id: selectedCourse.id, ...payload });
        showToast('Course updated successfully!', 'success');
      } else {
        await createModule.mutateAsync(payload);
        showToast('Training course published successfully!', 'success');
      }
      
      setIsCreating(false);
      setIsEditing(false);
      setSelectedCourse(null);
      resetForm();
    } catch (error: any) {
      showToast(error.message || 'Failed to save course. Check JSON format.', 'error');
    }
  };

  const resetForm = () => {
    setNewModule({ title: '', description: '', category: 'Sales', content: '', videoUrl: '', pdfUrl: '', order: 1, isPublished: true, scenarios: [], quizzes: [] });
    setScenariosText('[]');
    setQuizzesText('[]');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this module?')) return;
    try {
      await deleteModule.mutateAsync(id);
      showToast('Module deleted successfully.', 'info');
      if (selectedCourse?.id === id) setSelectedCourse(null);
    } catch (error: any) {
      showToast(error.message || 'Failed to delete module.', 'error');
    }
  };

  const handleEditCourse = (course: TrainingModule) => {
    setSelectedCourse(course);
    setNewModule({
      title: course.title,
      description: course.description,
      category: course.category,
      content: course.content,
      videoUrl: course.videoUrl || '',
      pdfUrl: course.pdfUrl || '',
      order: course.order,
      isPublished: course.isPublished
    });
    setScenariosText(JSON.stringify(course.scenarios || [], null, 2));
    setQuizzesText(JSON.stringify(course.quizzes || [], null, 2));
    setIsEditing(true);
    setIsCreating(true);
  };

  const modulesList = trainingResponse?.data || [];

  if (isTrainingLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Training Academy Management</h2>
            <p className="text-sm text-slate-500 font-medium">Create and manage learning resources for your affiliates</p>
          </div>
          <button 
            onClick={() => { resetForm(); setIsEditing(false); setIsCreating(true); }}
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
                    <h3 className="text-xl font-bold text-slate-900">{isEditing ? 'Edit Module' : 'Create New Module'}</h3>
                  </div>
                  <button 
                    onClick={() => setIsCreating(false)}
                    className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSaveCourse} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-700">Course Title</label>
                       <input 
                         type="text" 
                         value={newModule.title}
                         onChange={(e) => setNewModule({...newModule, title: e.target.value})}
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                         required
                       />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Category</label>
                      <input 
                        type="text" 
                        value={newModule.category}
                        onChange={(e) => setNewModule({...newModule, category: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        placeholder="e.g. Sales, Marketing, Technical"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Video URL (Optional)</label>
                      <input 
                        type="url" 
                        value={newModule.videoUrl}
                        onChange={(e) => setNewModule({...newModule, videoUrl: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        placeholder="https://youtube.com/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">PDF URL (Optional)</label>
                      <input 
                        type="url" 
                        value={newModule.pdfUrl}
                        onChange={(e) => setNewModule({...newModule, pdfUrl: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        placeholder="https://drive.google.com/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Display Order</label>
                      <input 
                        type="number" 
                        value={newModule.order}
                        onChange={(e) => setNewModule({...newModule, order: Number(e.target.value)})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Short Description</label>
                    <textarea 
                      value={newModule.description}
                      onChange={(e) => setNewModule({...newModule, description: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      rows={2}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Course Content (HTML/Markdown)</label>
                    <textarea 
                      value={newModule.content}
                      onChange={(e) => setNewModule({...newModule, content: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      rows={10}
                      placeholder="Enter the full lesson content here..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Interactive Scenarios (JSON Array)</label>
                      <textarea 
                        value={scenariosText}
                        onChange={(e) => setScenariosText(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl"
                        rows={8}
                        placeholder='[{"title": "...", "situation": "...", "objection": "...", "idealResponse": "...", "order": 1}]'
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Final Quiz Questions (JSON Array)</label>
                      <textarea 
                        value={quizzesText}
                        onChange={(e) => setQuizzesText(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 text-blue-400 font-mono text-xs rounded-xl"
                        rows={8}
                        placeholder='[{"question": "...", "options": ["A", "B"], "correctAnswer": 0, "order": 1}]'
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-8">
                    <button 
                      type="button" 
                      onClick={() => { setIsCreating(false); setIsEditing(false); }}
                      className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={createModule.isPending || updateModule.isPending}
                      className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg"
                    >
                      {createModule.isPending || updateModule.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {isEditing ? 'Update Course' : 'Publish Course'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Existing Modules</h3>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{modulesList.length} Total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="p-4 font-bold text-slate-600 text-sm">Module Name</th>
                  <th className="p-4 font-bold text-slate-600 text-sm">Category</th>
                  <th className="p-4 font-bold text-slate-600 text-sm">Order</th>
                  <th className="p-4 font-bold text-slate-600 text-sm">Status</th>
                  <th className="p-4 font-bold text-slate-600 text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {modulesList.length > 0 ? modulesList.sort((a, b) => a.order - b.order).map((module, idx) => (
                  <tr key={module.id} className="hover:bg-slate-50/50 group transition-all">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                          {module.videoUrl ? <Video className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{module.title}</p>
                          <p className="text-xs text-slate-400 line-clamp-1">{module.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                        {module.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-bold text-slate-700">#{module.order}</span>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider",
                        module.isPublished ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"
                      )}>
                        {module.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => showToast(`Preview coming soon...`, "info")}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEditCourse(module)}
                          className="p-2 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition-all"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(module.id)}
                          className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400">
                      <Layers className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                      <p>No training modules found. Start by creating your first one!</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
