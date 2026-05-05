'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { 
  Play, 
  BookOpen, 
  MessageSquare, 
  CheckCircle2,
  ChevronRight,
  Zap,
  Trophy,
  Star,
  Target,
  Award,
  ArrowRight,
  Info,
  ThumbsUp,
  ThumbsDown,
  RefreshCcw,
  Clock,
  Users,
  FileText,
  Download
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';

// --- Components ---

export default function AcademyPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'learn' | 'practice' | 'test'>('learn');
  const [courses, setCourses] = useState<any[]>([]);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const practiceScenarios = courses[0]?.scenarios || [];
  const quizQuestions = courses[0]?.quizzes || [];
  
  // Practice State
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceFeedback, setPracticeFeedback] = useState<{ text: string, correct: boolean } | null>(null);
  const [practiceStats, setPracticeStats] = useState({ correct: 0, failed: 0 });
  const [isPracticeFinished, setIsPracticeFinished] = useState(false);

  // Quiz State
  const [quizStep, setQuizStep] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizStats, setQuizStats] = useState({ correct: 0, failed: 0 });
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  
  // Modal State
  const [selectedModule, setSelectedModule] = useState<any | null>(null);
  const [moduleView, setModuleView] = useState<'article' | 'video'>('article');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/training/modules');
        const modules = response.data || [];
        setCourses(modules);
        
        // Extract completed modules from progress records
        const completed = modules
          .filter((m: any) => m.progress?.[0]?.status === 'COMPLETED')
          .map((m: any) => m.id);
        setCompletedModules(completed);
      } catch (error) {
        console.error('Failed to fetch training data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Progress calculation
  const totalLessons = courses.length;
  const moduleProgress = totalLessons > 0 ? Math.round((completedModules.length / totalLessons) * 100) : 0;
  
  const getBadge = () => {
    const activeCourse = courses[0]; // Assuming first course for badge logic if needed
    const practiceScenarios = activeCourse?.scenarios || [];
    const totalPractice = practiceStats.correct + practiceStats.failed;
    const practiceDone = totalPractice > 0 && totalPractice >= practiceScenarios.length;
    
    if (moduleProgress === 100 && quizScore >= 90 && practiceDone && practiceStats.correct === practiceScenarios.length) return 'Closer';
    if (moduleProgress >= 70 && quizScore >= 70) return 'Sales Ready';
    if (moduleProgress >= 30) return 'Active Learner';
    return 'Beginner';
  };

  const getStatusText = () => {
    if (quizScore >= 90) return 'Certified Closer';
    if (quizScore >= 70) return 'Sales Ready';
    if (quizScore >= 40) return 'Learning';
    return 'Needs Review';
  };

  const handleModuleComplete = async (moduleId: string) => {
    try {
      await api.patch(`/training/modules/${moduleId}/progress`, {
        status: 'COMPLETED',
        completedAt: new Date().toISOString()
      });
      
      if (!completedModules.includes(moduleId)) {
        setCompletedModules([...completedModules, moduleId]);
        showToast(`Module completed!`, 'success');
      }
    } catch (error) {
      console.error('Failed to mark module as complete:', error);
      showToast('Failed to save progress', 'error');
    }
    setSelectedModule(null);
  };

  const handlePracticeOption = (correct: boolean, feedback: string) => {
    setPracticeFeedback({ text: feedback, correct });
    if (correct) {
      setPracticeStats(prev => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setPracticeStats(prev => ({ ...prev, failed: prev.failed + 1 }));
    }
  };

  const nextPractice = () => {
    setPracticeFeedback(null);
    if (practiceIndex < practiceScenarios.length - 1) {
      setPracticeIndex(practiceIndex + 1);
    } else {
      setIsPracticeFinished(true);
      showToast('Practice session complete!', 'success');
    }
  };

  const resetPractice = () => {
    setPracticeIndex(0);
    setPracticeFeedback(null);
    setPracticeStats({ correct: 0, failed: 0 });
    setIsPracticeFinished(false);
  };

  const handleQuizAnswer = (index: number) => {
    const quizQuestions = courses[0]?.quizzes || [];
    const isCorrect = index === quizQuestions[quizStep].correctAnswer;
    
    if (isCorrect) {
      setQuizStats(prev => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setQuizStats(prev => ({ ...prev, failed: prev.failed + 1 }));
    }
    
    if (quizStep < quizQuestions.length - 1) {
      setQuizStep(quizStep + 1);
    } else {
      const finalCorrect = isCorrect ? quizStats.correct + 1 : quizStats.correct;
      const score = Math.round((finalCorrect / quizQuestions.length) * 100);
      setQuizScore(score);
      setIsQuizFinished(true);
      
      // Save score to backend
      if (courses[0]?.id) {
        api.patch(`/training/modules/${courses[0].id}/progress`, {
          quizScore: score
        }).catch(console.error);
      }
    }
  };

  const resetQuiz = () => {
    setQuizStep(0);
    setQuizScore(0);
    setQuizStats({ correct: 0, failed: 0 });
    setIsQuizFinished(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header & Progress */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Vemtap Sales Academy</h2>
            <p className="text-slate-500">Learn, Practice, and Test your way to becoming a Top Closer.</p>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 w-full md:w-auto">
            <div className="relative w-16 h-16 shrink-0">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path className="text-slate-100" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                <path className="text-blue-600" strokeDasharray={`${moduleProgress}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-900">
                {moduleProgress}%
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Badge</p>
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-bold text-slate-900">{getBadge()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="space-y-6">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-fit">
            {(['learn', 'practice', 'test'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-grow md:flex-none px-8 py-3 rounded-xl text-sm font-bold transition-all capitalize",
                  activeTab === tab 
                    ? "bg-white text-blue-600 shadow-md" 
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Learn Mode Toggle - Only visible on Learn tab */}
          <AnimatePresence>
            {activeTab === 'learn' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-4"
              >
                <div className="flex bg-blue-50 p-1 rounded-xl border border-blue-100">
                  <button 
                    onClick={() => setModuleView('article')}
                    className={cn(
                      "px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                      moduleView === 'article' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Article Mode
                  </button>
                  <button 
                    onClick={() => setModuleView('video')}
                    className={cn(
                      "px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                      moduleView === 'video' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Video Mode
                  </button>
                </div>
                <p className="text-xs text-slate-400 font-medium hidden sm:block">
                  {moduleView === 'article' ? 'Read through our practical guides.' : 'Watch our expert sales training videos.'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === 'learn' && (
            <motion.div
              key="learn"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-48 bg-slate-100 rounded-[32px] animate-pulse" />
                  ))
                ) : courses.length > 0 ? courses.map((module) => (
                  <div 
                    key={module.id}
                    onClick={() => {
                      setSelectedModule(module);
                    }}
                    className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer relative overflow-hidden"
                  >
                    {completedModules.includes(module.id) && (
                      <div className="absolute top-4 right-4 bg-emerald-500 text-white p-1 rounded-full">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                      moduleView === 'article' ? "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white" : "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white"
                    )}>
                      {moduleView === 'article' ? <BookOpen className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{module.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2">{module.description}</p>
                    <div className={cn(
                      "mt-6 flex items-center text-xs font-bold transition-colors",
                      moduleView === 'article' ? "text-emerald-600" : "text-blue-600"
                    )}>
                      {moduleView === 'article' ? 'Read Article' : 'Watch Video'} <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full py-20 text-center bg-white rounded-[40px] border border-dashed border-slate-200">
                    <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900">No Academy Content Yet</h3>
                    <p className="text-slate-500 text-sm">Check back later for sales training and resources.</p>
                  </div>
                )}
              </div>

              {/* Module Modal Overlay */}
              <AnimatePresence>
                {selectedModule && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setSelectedModule(null)}
                      className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative bg-white w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                      >
                        {/* Modal Header */}
                        <div className="p-8 border-b border-slate-50 bg-white flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                              moduleView === 'article' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                            )}>
                              {moduleView === 'article' ? <BookOpen className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md">Module {selectedModule.id}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{moduleView === 'article' ? 'Article' : 'Video'}</span>
                              </div>
                              <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{selectedModule.title}</h3>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <a 
                              href={selectedModule.pdfUrl} 
                              download 
                              className="hidden sm:flex text-[10px] font-bold text-slate-500 hover:text-blue-600 items-center gap-2 bg-slate-50 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all"
                            >
                              <Download className="w-3.5 h-3.5" /> PDF
                            </a>
                            <button 
                              onClick={() => setSelectedModule(null)}
                              className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                            >
                              <RefreshCcw className="w-5 h-5 rotate-45" />
                            </button>
                          </div>
                        </div>

                      <div className="overflow-y-auto flex-grow">
                        {moduleView === 'video' ? (
                          <div className="aspect-video bg-slate-900 relative">
                            {selectedModule.videoUrl ? (
                              <iframe 
                                src={selectedModule.videoUrl.replace('watch?v=', 'embed/')} 
                                title={selectedModule.title}
                                className="absolute inset-0 w-full h-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-white font-medium">
                                No video available for this module.
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-8 sm:p-12 bg-white">
                            <div className="prose prose-slate prose-blue max-w-none 
                              prose-headings:font-black prose-headings:tracking-tight 
                              prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
                              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
                              prose-p:text-slate-600 prose-p:leading-relaxed prose-p:text-lg
                              prose-li:text-slate-600 prose-li:text-lg
                              prose-hr:my-12 prose-hr:border-slate-100
                              prose-blockquote:border-l-4 prose-blockquote:border-blue-600 prose-blockquote:bg-blue-50 prose-blockquote:p-6 prose-blockquote:rounded-r-2xl prose-blockquote:not-italic prose-blockquote:font-medium
                              prose-strong:text-slate-900 prose-strong:font-bold
                            ">
                              <ReactMarkdown>{selectedModule.content || 'Content coming soon...'}</ReactMarkdown>
                            </div>
                          </div>
                        )}

                        <div className="p-8 sm:p-12 pt-0">
                          <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100">
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                              <Zap className="w-4 h-4 text-blue-600" /> Module Description
                            </h4>
                            <p className="text-slate-600 font-medium leading-relaxed">
                              {selectedModule.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-8 border-t border-slate-100 bg-white flex gap-4">
                        <Button 
                          onClick={() => handleModuleComplete(selectedModule.id)}
                          className="flex-grow h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 font-bold text-lg shadow-xl shadow-blue-100"
                        >
                          Complete Module
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => setSelectedModule(null)}
                          className="h-16 px-10 rounded-2xl font-bold text-lg border-2"
                        >
                          Close
                        </Button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === 'practice' && (
            <motion.div
              key="practice"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              {courses.length > 0 && courses[0]?.scenarios?.length > 0 ? (
                !isPracticeFinished ? (
                  <div className="bg-white p-8 sm:p-12 rounded-[40px] border border-slate-200 shadow-xl text-center">
                    <div className="w-16 h-16 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-600 mx-auto mb-8">
                      <MessageSquare className="w-8 h-8" />
                    </div>
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">Scenario {practiceIndex + 1} of {practiceScenarios.length}</p>
                    <h4 className="text-lg font-black text-slate-900 mb-4">{practiceScenarios[practiceIndex].title}</h4>
                    <h3 className="text-xl font-bold text-slate-900 mb-10 leading-tight italic">
                      &quot;{practiceScenarios[practiceIndex].situation}&quot;
                    </h3>
                    <p className="text-sm text-slate-500 mb-8 font-medium">Objection: {practiceScenarios[practiceIndex].objection}</p>

                          <div className="space-y-4">
                            {[
                              { text: practiceScenarios[practiceIndex].idealResponse, correct: true, feedback: 'Perfect! This addresses the objection directly and keeps the door open.' },
                              { text: 'Let me talk to my manager and get back to you later.', correct: false, feedback: 'This sounds like you are avoiding the question. Try to handle it directly.' }
                            ].map((option: any, i: number) => (
                              <button
                                key={i}
                                disabled={!!practiceFeedback}
                                onClick={() => handlePracticeOption(option.correct, option.feedback)}
                                className={cn(
                                  "w-full p-6 rounded-2xl border-2 text-left transition-all font-bold",
                                  practiceFeedback 
                                    ? option.correct 
                                      ? "border-emerald-500 bg-emerald-50 text-emerald-700" 
                                      : "border-slate-100 bg-slate-50 text-slate-400"
                                    : "border-slate-100 hover:border-blue-600 hover:bg-blue-50 text-slate-700"
                                )}
                              >
                                <div className="flex justify-between items-center">
                                  <span>{option.text}</span>
                                  {practiceFeedback && option.correct && <ThumbsUp className="w-5 h-5" />}
                                </div>
                              </button>
                            ))}
                          </div>

                  <AnimatePresence>
                    {practiceFeedback && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-8 p-6 rounded-2xl bg-slate-900 text-white text-sm text-left"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {practiceFeedback.correct ? <ThumbsUp className="w-4 h-4 text-emerald-400" /> : <ThumbsDown className="w-4 h-4 text-red-400" />}
                          <span className={cn("font-bold", practiceFeedback.correct ? "text-emerald-400" : "text-red-400")}>
                            {practiceFeedback.correct ? 'Good Response!' : 'Try this instead...'}
                          </span>
                        </div>
                        <p className="text-slate-300">{practiceFeedback.text}</p>
                        <Button 
                          onClick={nextPractice}
                          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 font-bold"
                        >
                          {practiceIndex < practiceScenarios.length - 1 ? 'Next Scenario' : 'Finish Practice'}
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="bg-white p-8 sm:p-12 rounded-[40px] border border-slate-200 shadow-xl text-center">
                  <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center text-white mx-auto mb-8 shadow-2xl shadow-amber-200">
                    <MessageSquare className="w-10 h-10" />
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900 mb-2">Practice Complete!</h3>
                  <p className="text-slate-500 mb-10">You have completed all scenarios.</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-10">
                    <div className="bg-emerald-50 p-6 rounded-3xl">
                      <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Correct</p>
                      <p className="text-3xl font-black text-emerald-700">{practiceStats.correct}</p>
                    </div>
                    <div className="bg-red-50 p-6 rounded-3xl">
                      <p className="text-xs font-bold text-red-600 uppercase mb-1">Failed</p>
                      <p className="text-3xl font-black text-red-700">{practiceStats.failed}</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button 
                      onClick={resetPractice}
                      variant="outline"
                      className="flex-grow h-14 rounded-2xl font-bold"
                    >
                      <RefreshCcw className="w-4 h-4 mr-2" />
                      Retry Practice
                    </Button>
                    <Button 
                      onClick={() => setActiveTab('test')}
                      className="flex-grow h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 font-bold"
                    >
                      Take Final Test
                    </Button>
                  </div>
                </div>
              )) : null}
            </motion.div>
          )}

          {activeTab === 'test' && (
            <motion.div
              key="test"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              {courses.length > 0 && courses[0]?.quizzes?.length > 0 ? (
                !isQuizFinished ? (
                  <div className="bg-white p-8 sm:p-12 rounded-[40px] border border-slate-200 shadow-xl">
                    <div className="flex justify-between items-center mb-10">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-bold text-slate-900">Final Assessment</span>
                      </div>
                      <span className="text-xs font-bold text-slate-400">Question {quizStep + 1}/{quizQuestions.length}</span>
                    </div>

                    <div className="h-2 bg-slate-100 rounded-full mb-10 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${((quizStep + 1) / quizQuestions.length) * 100}%` }}
                        className="h-full bg-blue-600"
                      />
                    </div>

                    <h3 className="text-2xl font-bold text-slate-900 mb-8">{quizQuestions[quizStep].question}</h3>

                    <div className="space-y-4">
                      {quizQuestions[quizStep].options.map((option: any, i: number) => (
                        <button
                          key={i}
                          onClick={() => handleQuizAnswer(i)}
                          className="w-full p-5 rounded-2xl border-2 border-slate-100 hover:border-blue-600 hover:bg-blue-50 text-left font-bold text-slate-700 transition-all"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                <div className="bg-white p-8 sm:p-12 rounded-[40px] border border-slate-200 shadow-xl text-center">
                  <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white mx-auto mb-8 shadow-2xl shadow-blue-200">
                    <Award className="w-10 h-10" />
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900 mb-2">Quiz Completed!</h3>
                  <p className="text-slate-500 mb-10">You scored {quizScore}% on your final assessment.</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-emerald-50 p-6 rounded-3xl">
                      <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Correct</p>
                      <p className="text-3xl font-black text-emerald-700">{quizStats.correct}</p>
                    </div>
                    <div className="bg-red-50 p-6 rounded-3xl">
                      <p className="text-xs font-bold text-red-600 uppercase mb-1">Failed</p>
                      <p className="text-3xl font-black text-red-700">{quizStats.failed}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-8 rounded-3xl mb-10">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Your Status</p>
                    <h4 className={cn(
                      "text-2xl font-black",
                      quizScore >= 70 ? "text-emerald-600" : "text-amber-600"
                    )}>
                      {getStatusText()}
                    </h4>
                    <p className="text-sm text-slate-500 mt-2">
                      {quizScore >= 71 ? 'You have mastered the basics! Start referring businesses now.' : 'Review your modules and try again to improve your score.'}
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <Button 
                      onClick={resetQuiz}
                      variant="outline"
                      className="flex-grow h-14 rounded-2xl font-bold"
                    >
                      <RefreshCcw className="w-4 h-4 mr-2" />
                      Retake Quiz
                    </Button>
                    <Button 
                      onClick={() => setActiveTab('learn')}
                      className="flex-grow h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 font-bold"
                    >
                      Back to Academy
                    </Button>
                  </div>
                </div>
              )) : null}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Engagement Triggers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl flex gap-4">
            <Zap className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <h4 className="font-bold text-emerald-900">New Weekly Challenge</h4>
              <p className="text-sm text-emerald-700">Test your skills with our latest real-life scenario and earn bonus points.</p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl flex gap-4">
            <Star className="w-6 h-6 text-blue-600 shrink-0" />
            <div>
              <h4 className="font-bold text-blue-900">Unlock Better Commissions</h4>
              <p className="text-sm text-blue-700">Reach the &quot;Closer&quot; badge to unlock special bonus tiers and early campaign access.</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
