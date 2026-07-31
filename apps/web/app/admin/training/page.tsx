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
  Layout,
  Layers,
  ChevronRight,
  MessageSquare,
  HelpCircle,
  CheckCircle2,
  ListChecks,
  Users
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import RichTextEditor from '@/components/admin/RichTextEditor';
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

const AUDIENCE_OPTIONS = [
  { value: 'AGENT', label: 'Agents' },
  { value: 'AFFILIATE', label: 'Affiliates' },
  { value: 'LINE_MANAGER', label: 'Line Managers' },
];

function AudiencePicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (v: string) => {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      {AUDIENCE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => toggle(opt.value)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5",
            value.includes(opt.value)
              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
              : "bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600"
          )}
        >
          {value.includes(opt.value) && <CheckCircle2 className="w-3.5 h-3.5" />}
          {opt.label}
        </button>
      ))}
      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Leave all unselected to show to everyone</span>
    </div>
  );
}

function OptionsEditor({ 
  options, 
  correctIndex, 
  onOptionsChange, 
  onCorrectChange 
}: { 
  options: string[]; 
  correctIndex: number; 
  onOptionsChange: (v: string[]) => void; 
  onCorrectChange: (v: number) => void; 
}) {
  const updateOption = (i: number, val: string) => {
    const next = [...options];
    next[i] = val;
    onOptionsChange(next);
  };
  const removeOption = (i: number) => {
    const next = options.filter((_, idx) => idx !== i);
    onCorrectChange(correctIndex === i ? -1 : correctIndex > i ? correctIndex - 1 : correctIndex);
    onOptionsChange(next);
  };
  return (
    <div className="space-y-2">
      {options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onCorrectChange(i)}
            className={cn(
              "shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
              correctIndex === i ? "border-emerald-500 bg-emerald-500" : "border-slate-300 hover:border-emerald-400"
            )}
            title={correctIndex === i ? "Marked as correct answer" : "Mark as correct answer"}
          >
            {correctIndex === i && <CheckCircle2 className="w-4 h-4 text-white" />}
          </button>
          <input
            type="text"
            value={opt}
            onChange={(e) => updateOption(i, e.target.value)}
            placeholder={`Answer option ${i + 1}`}
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <button
            type="button"
            onClick={() => removeOption(i)}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            title="Remove option"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onOptionsChange([...options, ''])}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
      >
        <Plus className="w-4 h-4" /> Add option
      </button>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, required }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      />
    </div>
  );
}

function TextAreaField({ label, value, onChange, placeholder, rows = 2, required }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        required={required}
        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-y"
      />
    </div>
  );
}

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

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Partial<TrainingModule> = {
        ...newModule,
        content: newModule.content || '',
        scenarios: (newModule.scenarios || []).map((s, i) => ({
          title: s.title,
          situation: s.situation,
          objection: s.objection,
          idealResponse: s.idealResponse,
          options: s.options && s.options.length >= 2
            ? s.options
            : [s.idealResponse || 'Best response', 'Let me talk to my manager and get back to you later.'],
          correctAnswerIndex: s.options && s.options.length >= 2 && s.correctAnswerIndex != null ? s.correctAnswerIndex : 0,
          audience: s.audience || [],
          order: i + 1
        })),
        quizzes: (newModule.quizzes || []).map((q, i) => ({
          question: q.question,
          options: q.options || [],
          correctAnswer: q.correctAnswer ?? 0,
          explanation: q.explanation || '',
          audience: q.audience || [],
          order: i + 1
        })),
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
      showToast(error.message || 'Failed to save course. Please check your questions.', 'error');
    }
  };

  const resetForm = () => {
    setNewModule({ title: '', description: '', category: 'Sales', content: '', videoUrl: '', pdfUrl: '', order: 1, isPublished: true, scenarios: [], quizzes: [] });
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
      isPublished: course.isPublished,
      scenarios: course.scenarios || [],
      quizzes: course.quizzes || []
    });
    setIsEditing(true);
    setIsCreating(true);
  };

  const updateScenario = (index: number, patch: Partial<Scenario>) => {
    const next = [...(newModule.scenarios || [])];
    next[index] = { ...next[index], ...patch };
    setNewModule({ ...newModule, scenarios: next });
  };

  const addScenario = () => {
    setNewModule({ ...newModule, scenarios: [...(newModule.scenarios || []), { title: '', situation: '', objection: '', idealResponse: '', options: ['', ''], correctAnswerIndex: 0, audience: [], order: (newModule.scenarios?.length || 0) + 1 }] });
  };

  const removeScenario = (index: number) => {
    setNewModule({ ...newModule, scenarios: (newModule.scenarios || []).filter((_, i) => i !== index) });
  };

  const updateQuiz = (index: number, patch: Partial<Quiz>) => {
    const next = [...(newModule.quizzes || [])];
    next[index] = { ...next[index], ...patch };
    setNewModule({ ...newModule, quizzes: next });
  };

  const addQuiz = () => {
    setNewModule({ ...newModule, quizzes: [...(newModule.quizzes || []), { question: '', options: ['', ''], correctAnswer: 0, explanation: '', audience: [], order: (newModule.quizzes?.length || 0) + 1 }] });
  };

  const removeQuiz = (index: number) => {
    setNewModule({ ...newModule, quizzes: (newModule.quizzes || []).filter((_, i) => i !== index) });
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
                    <label className="text-sm font-bold text-slate-700">Course Content</label>
                    <RichTextEditor 
                      value={newModule.content || ''}
                      onChange={(content) => setNewModule({...newModule, content})}
                    />
                  </div>

                  {/* Practice Questions Builder */}
                  <div className="rounded-3xl border-2 border-amber-100 bg-gradient-to-br from-amber-50/50 to-orange-50/30 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-100 rounded-xl">
                          <MessageSquare className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">Practice Questions</h4>
                          <p className="text-xs text-slate-500">Build interactive scenarios with plain-English answers and choose who they show to.</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={addScenario}
                        className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-all text-sm"
                      >
                        <Plus className="w-4 h-4" /> Add Scenario
                      </button>
                    </div>

                    {(newModule.scenarios || []).length === 0 && (
                      <div className="text-center py-8 border-2 border-dashed border-amber-200 rounded-2xl">
                        <MessageSquare className="w-10 h-10 text-amber-300 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-400">No practice questions yet</p>
                        <p className="text-xs text-slate-400 mt-1">Click "Add Scenario" to create your first one.</p>
                      </div>
                    )}

                    {(newModule.scenarios || []).map((s, idx) => (
                      <div key={idx} className="bg-white rounded-2xl border border-amber-100 p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                            <Layers className="w-4 h-4" /> Scenario {idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeScenario(idx)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Remove scenario"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <InputField label="Title" value={s.title} onChange={(v) => updateScenario(idx, { title: v })} placeholder="e.g. Handling the 'Too Expensive' objection" required />
                          <InputField label="Objection / Trigger" value={s.objection} onChange={(v) => updateScenario(idx, { objection: v })} placeholder="e.g. Customer says it is too expensive" />
                        </div>
                        <TextAreaField label="Situation" value={s.situation} onChange={(v) => updateScenario(idx, { situation: v })} placeholder="Describe the customer situation in plain English..." rows={2} required />
                        <div>
                          <label className="text-xs font-bold text-slate-600 mb-1.5 block">Answer Choices <span className="text-rose-500">*</span></label>
                          <OptionsEditor
                            options={s.options || []}
                            correctIndex={s.correctAnswerIndex ?? 0}
                            onOptionsChange={(options) => updateScenario(idx, { options })}
                            onCorrectChange={(correctAnswerIndex) => updateScenario(idx, { correctAnswerIndex })}
                          />
                        </div>
                        <TextAreaField label="Ideal Response (shown in feedback)" value={s.idealResponse} onChange={(v) => updateScenario(idx, { idealResponse: v })} placeholder="The best way to answer this objection..." rows={2} />
                        <div>
                          <label className="text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Show to</label>
                          <AudiencePicker value={s.audience || []} onChange={(audience) => updateScenario(idx, { audience })} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Test Questions Builder */}
                  <div className="rounded-3xl border-2 border-blue-100 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-100 rounded-xl">
                          <ListChecks className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">Test Questions</h4>
                          <p className="text-xs text-slate-500">Build the final assessment with multiple-choice questions and target audiences.</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={addQuiz}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all text-sm"
                      >
                        <Plus className="w-4 h-4" /> Add Question
                      </button>
                    </div>

                    {(newModule.quizzes || []).length === 0 && (
                      <div className="text-center py-8 border-2 border-dashed border-blue-200 rounded-2xl">
                        <HelpCircle className="w-10 h-10 text-blue-300 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-400">No test questions yet</p>
                        <p className="text-xs text-slate-400 mt-1">Click "Add Question" to create your first one.</p>
                      </div>
                    )}

                    {(newModule.quizzes || []).map((q, idx) => (
                      <div key={idx} className="bg-white rounded-2xl border border-blue-100 p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                            <HelpCircle className="w-4 h-4" /> Question {idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeQuiz(idx)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Remove question"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <TextAreaField label="Question" value={q.question} onChange={(v) => updateQuiz(idx, { question: v })} placeholder="Ask the question in plain English..." rows={2} required />
                        <div>
                          <label className="text-xs font-bold text-slate-600 mb-1.5 block">Answer Choices <span className="text-rose-500">*</span></label>
                          <OptionsEditor
                            options={q.options || []}
                            correctIndex={q.correctAnswer ?? 0}
                            onOptionsChange={(options) => updateQuiz(idx, { options })}
                            onCorrectChange={(correctAnswer) => updateQuiz(idx, { correctAnswer })}
                          />
                        </div>
                        <TextAreaField label="Explanation (optional)" value={q.explanation || ''} onChange={(v) => updateQuiz(idx, { explanation: v })} placeholder="Short explanation shown after answering..." rows={2} />
                        <div>
                          <label className="text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Show to</label>
                          <AudiencePicker value={q.audience || []} onChange={(audience) => updateQuiz(idx, { audience })} />
                        </div>
                      </div>
                    ))}
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
                {modulesList.length > 0 ? modulesList.sort((a, b) => a.order - b.order).map((module) => (
                  <tr key={module.id} className="hover:bg-slate-50/50 group transition-all">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                          {module.videoUrl ? <Video className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{module.title}</p>
                          <p className="text-xs text-slate-400 line-clamp-1">{module.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" /> {module.scenarios?.length || 0}
                            </span>
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <HelpCircle className="w-3 h-3" /> {module.quizzes?.length || 0}
                            </span>
                          </div>
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
