'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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

// --- Data Definitions ---

const modules = [
  { 
    id: 1,
    title: 'What is Vemtap?', 
    desc: 'Simple explanation of the product and who needs it.',
    videoUrl: 'https://picsum.photos/seed/mod1/800/450',
    pdfUrl: '#',
    articleContent: `
### The Future of Customer Retention in Nigeria

Vemtap is a revolutionary customer retention tool designed specifically for **offline businesses** in Nigeria. In a world where digital tracking is easy for websites but hard for physical shops, Vemtap bridges the gap.

---

## 🚀 How it Works

1. **QR Code Placement**
   The business places a unique Vemtap QR code at their checkout, on tables, or at the entrance.

2. **Customer Scan**
   Customers scan the code using their phone camera. **No app download is required**, making it fast and frictionless.

3. **Data Capture**
   The business automatically captures the customer's contact details (Name, Phone Number, Email) as they join the loyalty program or view the digital menu.

4. **Retention & Growth**
   The business can now see who their most loyal customers are and send them targeted offers via WhatsApp or SMS to bring them back.

---

## 🎯 Who Needs It?
Any business that has physical foot traffic and wants to grow by keeping their existing customers coming back.

*   **Restaurants & Bars**
*   **Salons & Spas**
*   **Supermarkets**
*   **Fashion Boutiques**
*   **Pharmacies**

> **Pro Tip:** Focus on businesses that have a steady flow of customers but don't know their names or phone numbers!
    `,
    summary: [
      'Vemtap is a customer retention tool for offline businesses.',
      'Businesses use QR codes to capture customer contacts.',
      'It helps them see who is coming back and reach out to them.'
    ]
  },
  { 
    id: 2,
    title: 'Who to Talk To', 
    desc: 'Identifying the best businesses for Vemtap.',
    videoUrl: 'https://picsum.photos/seed/mod2/800/450',
    pdfUrl: '#',
    articleContent: `
### Identifying High-Potential Targets

Not every business is a perfect fit for Vemtap right away. To maximize your earnings, you need to target **"High-Frequency"** businesses where customers return often.

---

## 🏆 Top 3 Targets

### 1. Restaurants & Cafes
People eat every day. If a customer loves a meal, the restaurant wants them back tomorrow. Vemtap makes this happen by allowing the owner to send "Special Lunch" alerts.

### 2. Salons & Spas
These are relationship-based businesses. Tracking when a customer is due for their next haircut or treatment is gold. Owners can send "We miss you" discounts.

### 3. Fashion Stores
Great for seasonal promotions. When new stock arrives, the owner can instantly alert all previous customers instead of waiting for them to walk past the shop.

---

## 🔍 What to Look For
When walking down the street, ask yourself these questions:
*   **Does the business have a physical location?**
*   **Do they have repeat customers?**
*   **Does the owner seem interested in growing their sales?**

**Avoid:** Government offices or businesses with one-time customers (like a passport office).
    `,
    summary: [
      'Restaurants & Cafes: High repeat customer potential.',
      'Salons & Spas: Need to manage appointments and loyalty.',
      'Fashion Stores: Great for seasonal promotions.'
    ]
  },
  { 
    id: 3,
    title: 'How to Approach', 
    desc: 'Starting conversations with confidence.',
    videoUrl: 'https://picsum.photos/seed/mod3/800/450',
    pdfUrl: '#',
    articleContent: `
### Mastering the First Impression

In the Nigerian market, **"Respect"** and **"Confidence"** are your two most important tools. You aren't just selling software; you are selling a solution for growth.

---

## 👔 The Approach Strategy

### 1. Appearance Matters
You don't need a suit, but you must look clean and professional. A Vemtap branded shirt or a neat button-down shows you respect the business owner's time.

### 2. The Opening (The Observation)
Never start by selling. Start by observing. 
*   *"I noticed you have a lot of customers today, that's great! How do you keep track of them so they come back?"*

### 3. The Hook
Once they admit they don't have a system, you introduce Vemtap as the solution to their **"leaking bucket"** (lost customers).

---

## 💡 Pro Tips for Success
*   **Smile, but don't rush.** A calm salesperson is a confident salesperson.
*   **Use local context.** Mention other successful businesses in the area.
*   **Always ask for the Decision Maker.** Don't waste your best pitch on someone who can't say "Yes."
    `,
    summary: [
      'Dress clean and professional.',
      'Smile and don\'t rush the conversation.',
      'Start with a question about their customers.'
    ]
  },
  { 
    id: 4,
    title: 'The Perfect Pitch', 
    desc: 'A simple, effective script for closing deals.',
    videoUrl: 'https://picsum.photos/seed/mod4/800/450',
    pdfUrl: '#',
    articleContent: `
### Closing Deals in Under 60 Seconds

Your pitch should be fast, clear, and focused on **Money**. If you can't explain it quickly, you'll lose their attention.

---

## 🎙️ The 3-Step Script

### Step 1: The Problem
*"Most businesses lose 70% of their customers because they have no way to contact them after they leave. You're basically letting money walk out the door."*

### Step 2: The Solution
*"Vemtap lets your customers scan a QR code in 2 seconds. You get their contact details automatically, and they get a reason to come back."*

### Step 3: The Close
*"It takes 2 minutes to set up. Can I show you a quick demo on your phone right now? It's free to see how it works."*

---

## ✅ Why it Works
*   **Low Friction**: No app to download.
*   **Fast**: Just a scan and a result.
*   **Visible Value**: They see the data capture immediately.
    `,
    summary: [
      'Script: "We help you track customers and get their contact using QR code."',
      'Focus on the benefit: Customer Retention.',
      'Offer a 1-minute demo.'
    ]
  },
  { 
    id: 5,
    title: 'Handling Rejection', 
    desc: 'Turning "No" into "Maybe" or "Yes".',
    videoUrl: 'https://picsum.photos/seed/mod5/800/450',
    pdfUrl: '#',
    articleContent: `
### Turning "No" into "Not Yet"

Rejection is just a request for more information. Top closers know that the sale often starts after the first "No."

---

## 🛡️ Common Objections & Responses

### "I'm not interested"
**Response:** *"I understand. Many owners felt the same until they realized they were losing thousands in repeat sales every week. Can I show you how simple it is to stop that?"*

### "I don't have time"
**Response:** *"That's exactly why I'm here. Vemtap automates your customer tracking so you can focus on your business. The setup takes less time than making a cup of coffee."*

### "It sounds expensive"
**Response:** *"Actually, losing a customer is expensive. Vemtap is designed to be affordable for every growing business. It pays for itself with just one or two returning customers."*

---

## 🌟 The Golden Rule
Always leave on a good note. A "No" today might be a "Yes" next month when they see their competitor using it. Give them your card or referral link and move to the next shop!
    `,
    summary: [
      'If they say "Not interested": Ask if they know how many customers they lose daily.',
      'If they say "No time": Explain that setup takes only 2 minutes.',
      'Always remain polite and professional.'
    ]
  },
  { 
    id: 6,
    title: 'Appearance & Confidence', 
    desc: 'The Nigerian context of sales success.',
    videoUrl: 'https://picsum.photos/seed/mod6/800/450',
    pdfUrl: '#',
    articleContent: `
### The "Closer" Mindset

In Nigeria, people buy **YOU** before they buy your product. Your energy determines the outcome of the meeting.

---

## ⚡ Confidence Building

*   **Know your product**: If you know Vemtap inside out, you won't be nervous. Practice the demo 10 times at home.
*   **Body Language**: Stand tall, make eye contact, and use open gestures. Don't cross your arms.
*   **The Voice**: Speak clearly and at a moderate pace. Rushing makes you look desperate or like a "scammer."

---

## 🧠 The "Vemtap Closer" Mindset
You aren't "begging" for a sale. You are offering a solution that will make the business owner more money. You are a **Partner in their Growth**.

> **Remember:** Every "No" brings you closer to a "Yes." Stay positive, stay sharp, and keep closing!
    `,
    summary: [
      'First impressions matter deeply in Nigeria.',
      'Confidence is contagious; if you believe, they will too.',
      'Be respectful but firm in your value proposition.'
    ]
  },
];

const practiceScenarios = [
  {
    id: 1,
    scenario: 'A business owner says: "I\'m not interested"',
    options: [
      { text: 'Okay, no problem. Have a nice day.', correct: false, feedback: 'Too passive! You missed a chance to show value.' },
      { text: 'Can I quickly show you how it helps you get customers?', correct: true, feedback: 'Great response! This pivots to a benefit they care about.' }
    ]
  },
  {
    id: 2,
    scenario: 'The owner says: "I don\'t have time right now"',
    options: [
      { text: 'I understand. That\'s why Vemtap is great—it takes 2 minutes to set up.', correct: true, feedback: 'Perfect! You addressed the time concern immediately.' },
      { text: 'When should I come back?', correct: false, feedback: 'Better to try and grab 2 minutes now if possible, or be more specific.' }
    ]
  },
  {
    id: 3,
    scenario: 'You walk into a busy salon. What\'s your first move?',
    options: [
      { text: 'Wait for a quiet moment and approach the manager with a smile.', correct: true, feedback: 'Correct. Timing and approach are key.' },
      { text: 'Start talking to the customers about the QR code.', correct: false, feedback: 'No! Always talk to the business owner or manager first.' }
    ]
  }
];

const quizQuestions = [
  {
    question: 'What is the core benefit of Vemtap for a business?',
    options: ['Free WiFi', 'Customer Retention', 'Inventory Management', 'Social Media Likes'],
    correct: 1
  },
  {
    question: 'Which of these is a primary target for Vemtap?',
    options: ['Construction Sites', 'Local Salons', 'Government Offices', 'Farms'],
    correct: 1
  },
  {
    question: 'How much commission do you earn on direct referrals?',
    options: ['5%', '10%', '20%', '50%'],
    correct: 2
  },
  {
    question: 'What should you do if an owner says they are too busy?',
    options: ['Leave immediately', 'Explain it takes only 2 minutes', 'Start a long presentation', 'Ask for money'],
    correct: 1
  }
];

// --- Components ---

export default function AcademyPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'learn' | 'practice' | 'test'>('learn');
  const [completedModules, setCompletedModules] = useState<number[]>([]);
  
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
  const [selectedModule, setSelectedModule] = useState<typeof modules[0] | null>(null);
  const [moduleView, setModuleView] = useState<'article' | 'video'>('article');

  // Progress calculation
  const moduleProgress = Math.round((completedModules.length / modules.length) * 100);
  
  const getBadge = () => {
    const totalPractice = practiceStats.correct + practiceStats.failed;
    const practiceDone = totalPractice >= practiceScenarios.length;
    
    if (moduleProgress === 100 && quizScore >= 90 && practiceDone && practiceStats.correct === practiceScenarios.length) return 'Closer';
    if (moduleProgress >= 70 && quizScore >= 70) return 'Sales Ready';
    if (moduleProgress >= 30) return 'Active Learner';
    return 'Beginner';
  };

  const getStatusText = () => {
    if (quizScore >= 71) return 'Ready to Earn';
    if (quizScore >= 41) return 'Getting Better';
    return 'Needs Improvement';
  };

  const handleModuleComplete = (id: number) => {
    if (!completedModules.includes(id)) {
      setCompletedModules([...completedModules, id]);
      showToast(`Module ${id} completed!`, 'success');
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
    const isCorrect = index === quizQuestions[quizStep].correct;
    if (isCorrect) {
      setQuizScore(prev => prev + (100 / quizQuestions.length));
      setQuizStats(prev => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setQuizStats(prev => ({ ...prev, failed: prev.failed + 1 }));
    }
    
    if (quizStep < quizQuestions.length - 1) {
      setQuizStep(quizStep + 1);
    } else {
      setIsQuizFinished(true);
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
                {modules.map((module) => (
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
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Module {module.id}: {module.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2">{module.desc}</p>
                    <div className={cn(
                      "mt-6 flex items-center text-xs font-bold transition-colors",
                      moduleView === 'article' ? "text-emerald-600" : "text-blue-600"
                    )}>
                      {moduleView === 'article' ? 'Read Article' : 'Watch Video'} <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
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
                            <Image 
                              src={selectedModule.videoUrl} 
                              alt={selectedModule.title}
                              fill
                              className="object-cover opacity-60"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-2xl animate-pulse">
                                <Play className="w-8 h-8 fill-current ml-1" />
                              </div>
                            </div>
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
                              <ReactMarkdown>{selectedModule.articleContent}</ReactMarkdown>
                            </div>
                          </div>
                        )}

                        <div className="p-8 sm:p-12 pt-0">
                          <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100">
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                              <Zap className="w-4 h-4 text-blue-600" /> Key Takeaways
                            </h4>
                            <ul className="space-y-4">
                              {selectedModule.summary.map((item, i) => (
                                <li key={i} className="flex items-start gap-4 text-slate-600">
                                  <div className="mt-1.5 w-2 h-2 bg-blue-600 rounded-full shrink-0" />
                                  <span className="text-base font-medium leading-relaxed">{item}</span>
                                </li>
                              ))}
                            </ul>
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
              {!isPracticeFinished ? (
                <div className="bg-white p-8 sm:p-12 rounded-[40px] border border-slate-200 shadow-xl text-center">
                  <div className="w-16 h-16 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-600 mx-auto mb-8">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">Scenario {practiceIndex + 1} of {practiceScenarios.length}</p>
                  <h3 className="text-2xl font-bold text-slate-900 mb-10 leading-tight italic">
                    &quot;{practiceScenarios[practiceIndex].scenario}&quot;
                  </h3>

                  <div className="space-y-4">
                    {practiceScenarios[practiceIndex].options.map((option, i) => (
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
              )}
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
              {!isQuizFinished ? (
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
                    {quizQuestions[quizStep].options.map((option, i) => (
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
              )}
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
