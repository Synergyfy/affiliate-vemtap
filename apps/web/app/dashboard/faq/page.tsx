'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, HelpCircle, ChevronDown, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { cn } from '@/lib/utils';
import { useFaqs } from '@/services/useSupportHooks';

export default function FAQPage() {
  const { data: faqs = [], isLoading, isError } = useFaqs();
  const [openId, setOpenId] = useState<string | null>(null);

  // Group by category
  const categories = [...new Set(faqs.map(f => f.category))];

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-0">

        {/* Header */}
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </a>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-teal-600" />
              Frequently Asked Questions
            </h1>
            <p className="text-xs text-slate-500 font-medium">Find answers to common questions</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-pulse text-slate-300" />
          </div>
        ) : isError ? (
          <p className="text-sm text-red-600">Unable to load FAQs.</p>
        ) : (
          <div className="space-y-6">
            {categories.map(category => (
              <div key={category} className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{category}</h3>
                <div className="space-y-2">
                  {faqs.filter(f => f.category === category).map(faq => (
                    <div key={faq.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                      <button
                        onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                      >
                        <span className="text-sm font-bold text-slate-700 pr-3">{faq.question}</span>
                        <ChevronDown className={cn("w-4 h-4 text-slate-400 shrink-0 transition-transform", openId === faq.id && "rotate-180")} />
                      </button>
                      <AnimatePresence>
                        {openId === faq.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 text-sm text-slate-500 font-medium leading-relaxed border-t border-slate-50 pt-3">
                              {faq.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
