'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  PhoneCall,
  PlayCircle,
  Briefcase,
  BarChart3,
  Menu,
  X,
} from 'lucide-react';

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'follow-ups', label: 'Follow-ups', icon: PhoneCall },
  { id: 'demos', label: 'Demos', icon: PlayCircle },
  { id: 'businesses', label: 'Businesses', icon: Briefcase },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
];

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (id: string) => void;
}

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const activeTabData = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  const handleSelect = (id: string) => {
    onTabChange(id);
    setSheetOpen(false);
  };

  return (
    <>
      {/* Mobile: hamburger button */}
      <div className="sm:hidden border-b border-slate-100 bg-slate-50/50 px-4">
        <button
          onClick={() => setSheetOpen(true)}
          className="flex items-center gap-3 w-full py-4 text-left"
        >
          <div className="p-2 rounded-xl bg-blue-50">
            <activeTabData.icon className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Section</p>
            <p className="text-sm font-bold text-slate-900">{activeTabData.label}</p>
          </div>
          <Menu className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Desktop: horizontal tabs */}
      <div className="hidden sm:block border-b border-slate-100 bg-slate-50/50 px-4 sm:px-8">
        <div className="flex overflow-x-auto scrollbar-hide -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative flex items-center gap-2 px-6 py-5 text-sm font-bold transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "text-blue-600"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-blue-600" : "text-slate-400")} />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile: bottom sheet tab picker */}
      <AnimatePresence>
        {sheetOpen && (
          <div className="fixed inset-0 z-[200] sm:hidden flex items-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSheetOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative w-full bg-white shadow-2xl rounded-t-[28px] max-h-[70dvh] overflow-hidden pb-[env(safe-area-inset-bottom)]"
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1.5 bg-slate-200 rounded-full" />
              </div>

              <div className="flex items-center justify-between px-5 pb-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Switch Section</h3>
                <button
                  onClick={() => setSheetOpen(false)}
                  className="p-2 -mr-1 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto max-h-[60dvh] overscroll-contain">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleSelect(tab.id)}
                    className={cn(
                      "flex items-center gap-3 w-full px-5 py-4 text-left border-b border-slate-50 transition-colors",
                      activeTab === tab.id
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-700 active:bg-slate-50"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-xl",
                      activeTab === tab.id ? "bg-blue-100" : "bg-slate-100"
                    )}>
                      <tab.icon className={cn("w-5 h-5", activeTab === tab.id ? "text-blue-600" : "text-slate-500")} />
                    </div>
                    <span className="text-sm font-bold">{tab.label}</span>
                    {activeTab === tab.id && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
