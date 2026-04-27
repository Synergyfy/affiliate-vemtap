'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '@/lib/api-client';
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

export default function TrainingManagement() {
  const { showToast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [contentType, setContentType] = useState<'article' | 'video' | 'both'>('article');
  const [modulesList, setModulesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newModule, setNewModule] = useState({
    title: '',
    description: '',
    duration: '15 mins',
    difficulty: 'Beginner',
    type: 'article',
    level: 'Beginner',
    scenarios: '[]',
    quiz: '[]'
  });

  const [lessonForm, setLessonForm] = useState({
    title: '',
    content: '',
    videoUrl: '',
    duration: '10 mins',
    order: 1,
    summary: ''
  });
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  const fetchModules = async () => {
    setLoading(true);
    try {
      const data = await api.get('/training');
      setModulesList(data || []);
    } catch (error) {
      console.error('Failed to fetch training modules:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...newModule,
        type: contentType,
        scenarios: JSON.parse(newModule.scenarios || '[]'),
        quiz: JSON.parse(newModule.quiz || '[]'),
        order: modulesList.length + 1
      };

      if (isEditing && selectedCourse) {
        await api.patch(`/training/${selectedCourse.id}`, payload);
        showToast('Course updated successfully!', 'success');
      } else {
        await api.post('/training', payload);
        showToast('Training course published successfully!', 'success');
      }
      
      setIsCreating(false);
      setIsEditing(false);
      setNewModule({ title: '', description: '', duration: '15 mins', difficulty: 'Beginner', type: 'article', level: 'Beginner', scenarios: '[]', quiz: '[]' });
      fetchModules();
    } catch (error) {
      showToast('Failed to save course. Check JSON format.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this module?')) return;
    try {
      await api.delete(`/training/${id}`);
      showToast('Module deleted successfully.', 'info');
      fetchModules();
    } catch (error) {
      showToast('Failed to delete module.', 'error');
    }
  };

  const handleEditCourse = (course: any) => {
    setSelectedCourse(course);
    setNewModule({
      title: course.title,
      description: course.description,
      duration: course.duration,
      difficulty: course.difficulty,
      type: course.type,
      level: course.level,
      scenarios: JSON.stringify(course.scenarios || [], null, 2),
      quiz: JSON.stringify(course.quiz || [], null, 2)
    });
    setLoading(false);
    setIsEditing(true);
    setIsCreating(true);
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      const payload = {
        ...lessonForm,
        summary: lessonForm.summary.split('\n').filter(s => s.trim())
      };

      if (editingLessonId) {
        await api.patch(`/training/lessons/${editingLessonId}`, payload);
        showToast('Lesson updated!', 'success');
      } else {
        await api.post(`/training/${selectedCourse.id}/lessons`, payload);
        showToast('Lesson added!', 'success');
      }
      
      setShowLessonForm(false);
      setEditingLessonId(null);
      setLessonForm({ title: '', content: '', videoUrl: '', duration: '10 mins', order: 1, summary: '' });
      fetchModules();
    } catch (error) {
      showToast('Failed to save lesson.', 'error');
    }
  };

  const handleDeleteLesson = async (id: string) => {
    if (!confirm('Delete this lesson?')) return;
    try {
      await api.delete(`/training/lessons/${id}`);
      showToast('Lesson deleted.', 'info');
      fetchModules();
    } catch (error) {
      showToast('Failed to delete lesson.', 'error');
    }
  };

  const handleEditLesson = (lesson: any) => {
    setEditingLessonId(lesson.id);
    setLessonForm({
      title: lesson.title,
      content: lesson.content,
      videoUrl: lesson.videoUrl || '',
      duration: lesson.duration,
      order: lesson.order,
      summary: (lesson.summary || []).join('\n')
    });
    setShowLessonForm(true);
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

                <form onSubmit={handleSaveCourse} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-700">Course Title</label>
                       <input 
                         type="text" 
                         value={newModule.title}
                         onChange={(e) => setNewModule({...newModule, title: e.target.value})}
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                         required
                       />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Course Type</label>
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Difficulty</label>
                      <input 
                        type="text" 
                        value={newModule.difficulty}
                        onChange={(e) => setNewModule({...newModule, difficulty: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Duration</label>
                      <input 
                        type="text" 
                        value={newModule.duration}
                        onChange={(e) => setNewModule({...newModule, duration: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Level</label>
                      <input 
                        type="text" 
                        value={newModule.level}
                        onChange={(e) => setNewModule({...newModule, level: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Description</label>
                    <textarea 
                      value={newModule.description}
                      onChange={(e) => setNewModule({...newModule, description: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Interactive Scenarios (JSON Array)</label>
                      <textarea 
                        value={newModule.scenarios}
                        onChange={(e) => setNewModule({...newModule, scenarios: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl"
                        rows={10}
                        placeholder='[{"question": "...", "options": ["...", "..."], "correct": 0, "feedback": "..."}]'
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Final Quiz Questions (JSON Array)</label>
                      <textarea 
                        value={newModule.quiz}
                        onChange={(e) => setNewModule({...newModule, quiz: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900 text-blue-400 font-mono text-xs rounded-xl"
                        rows={10}
                        placeholder='[{"question": "...", "options": ["...", "..."], "correct": 0}]'
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-8">
                    <button 
                      type="button" 
                      onClick={() => { setIsCreating(false); setIsEditing(false); }}
                      className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
                    >
                      <Save className="w-4 h-4" />
                      {isEditing ? 'Update Course' : 'Publish Course'}
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
                {modulesList.length > 0 ? modulesList.map((module, idx) => (
                  <tr key={module.id} className="hover:bg-slate-50/50 group transition-all">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                          <Video className="w-5 h-5" />
                        </div>
                        <p className="font-bold text-slate-900">{module.title}</p>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600 font-medium">{module.level || 'All'}</td>
                    <td className="p-4 text-sm text-slate-600 font-medium">{module.duration || 'N/A'}</td>
                    <td className="p-4">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider bg-green-100 text-green-600"
                      )}>
                        Published
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        <button 
                          onClick={() => showToast(`Previewing: ${module.title}`, "info")}
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
                          onClick={() => {
                            setSelectedCourse(module);
                            showToast("Now managing lessons", "info");
                          }}
                          className={cn(
                            "p-2 rounded-lg transition-all",
                            selectedCourse?.id === module.id ? "bg-blue-600 text-white" : "hover:bg-slate-100 text-slate-400 hover:text-slate-900"
                          )}
                          title="Manage Lessons"
                        >
                          <BookOpen className="w-4 h-4" />
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
                    <td colSpan={5} className="p-12 text-center text-slate-400">No training modules found. Creating one isn't supported yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selectedCourse && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 space-y-8"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Lessons for: <span className="text-blue-600">{selectedCourse.title}</span>
                </h3>
                <p className="text-sm text-slate-500">Add and manage chapters for this course</p>
              </div>
              <button 
                onClick={() => { setShowLessonForm(true); setEditingLessonId(null); }}
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Lesson
              </button>
            </div>

            {showLessonForm && (
              <div className="bg-white p-8 rounded-[32px] border-2 border-slate-200 shadow-xl">
                <form onSubmit={handleSaveLesson} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-700">Lesson Title</label>
                       <input 
                         type="text" 
                         value={lessonForm.title}
                         onChange={(e) => setLessonForm({...lessonForm, title: e.target.value})}
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                         required
                       />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Estimated Duration</label>
                      <input 
                        type="text" 
                        value={lessonForm.duration}
                        onChange={(e) => setLessonForm({...lessonForm, duration: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Video URL (Optional)</label>
                    <input 
                      type="url" 
                      value={lessonForm.videoUrl}
                      onChange={(e) => setLessonForm({...lessonForm, videoUrl: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                      placeholder="https://youtube.com/..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Article Content (Markdown)</label>
                    <textarea 
                      value={lessonForm.content}
                      onChange={(e) => setLessonForm({...lessonForm, content: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm"
                      rows={6}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Key Takeaways (One per line)</label>
                    <textarea 
                      value={lessonForm.summary}
                      onChange={(e) => setLessonForm({...lessonForm, summary: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                      rows={4}
                      placeholder="Enter each take-away on a new line"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button 
                      type="button" 
                      onClick={() => setShowLessonForm(false)}
                      className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold"
                    >
                      <Save className="w-4 h-4" />
                      {editingLessonId ? 'Update Lesson' : 'Add Lesson'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(selectedCourse.lessons || []).map((lesson: any, i: number) => (
                <div key={lesson.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{lesson.title}</h4>
                      <p className="text-xs text-slate-500">{lesson.duration}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEditLesson(lesson)}
                      className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteLesson(lesson.id)}
                      className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </AdminLayout>
  );
}
