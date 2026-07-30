'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, HelpCircle, ChevronDown, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { useMarketMappingConfig } from '@/hooks/use-market-mapping-config';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FALLBACK_FAQ: FAQItem[] = [
  { id: '1', question: 'How do I start a new market mapping mission?', answer: 'Go to Market Mapping > Plan Mission. Set your start date, choose Day or Week, enter a location and target number, then save. You can then go to Execute Visits to start adding businesses.', category: 'Market Mapping' },
  { id: '2', question: 'How do I add a business after visiting?', answer: 'In Execute Visits, tap "Add Business" to create a placeholder, then tap the business card to open the capture drawer. Fill in the details across General, Profile, and Sales tabs, then save.', category: 'Market Mapping' },
  { id: '3', question: 'What does "Subscribed" mean?', answer: 'A business is marked as Subscribed (Customer) when they sign up on VemTap through your referral. This counts toward your monthly subscription target.', category: 'General' },
  { id: '4', question: 'How do I track my progress?', answer: 'Your dashboard shows daily and weekly targets with progress bars. The Pipeline page shows all businesses you captured and their current status.', category: 'General' },
  { id: '5', question: 'How are commissions calculated?', answer: 'Commissions are based on the plan type of each subscribed business. Premium and Enterprise plans earn higher commissions. Check your Wallet & Earnings for details.', category: 'Commissions' },
  { id: '6', question: 'How do I contact support?', answer: 'Go to Support page from the dashboard or the Direct Assistance banner. Fill in the subject and message, then submit. Our team will respond to you via the platform.', category: 'General' },
  { id: '7', question: 'Can I edit a business after saving?', answer: 'Yes. Go to Pipeline or Execute Visits, tap on any business card, and update the details. Changes are saved immediately.', category: 'Market Mapping' },
  { id: '8', question: 'What is the difference between Daily and Weekly targets?', answer: 'Daily targets are the number of businesses you aim to visit or capture per day. Weekly targets are the cumulative goal for the week. Both are shown on your dashboard with progress tracking.', category: 'General' },
  { id: '9', question: 'How do I withdraw my earnings?', answer: 'Go to Wallet & Earnings, check your available balance, and tap Withdraw. Enter your bank details and amount. Processing takes 1-3 business days.', category: 'Commissions' },
  { id: '10', question: 'What happens if a business I referred cancels?', answer: 'If a referred business cancels within the first 30 days, the commission may be reversed. After 30 days, commissions are finalized and cannot be reversed.', category: 'Commissions' },
];

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const { data: config } = useMarketMappingConfig();
  const configFaqs = config?.faqs as FAQItem[] | undefined;

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/faqs');
      const data = res as any;
      const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setFaqs(list.length > 0 ? list : (configFaqs ?? FALLBACK_FAQ));
    } catch {
      setFaqs(configFaqs ?? FALLBACK_FAQ);
    } finally {
      setIsLoading(false);
    }
  };

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
