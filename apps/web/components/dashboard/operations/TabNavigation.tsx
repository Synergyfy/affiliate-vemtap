'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  PhoneCall, 
  PlayCircle, 
  Briefcase, 
  Rocket, 
  CheckSquare, 
  History 
} from 'lucide-react';

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'follow-ups', label: 'Follow-ups', icon: PhoneCall },
  { id: 'demos', label: 'Demos', icon: PlayCircle },
  { id: 'businesses', label: 'Businesses', icon: Briefcase },
  { id: 'onboarding', label: 'Onboarding', icon: Rocket },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'activities', label: 'Activities', icon: History },
];

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (id: string) => void;
}

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="border-b border-slate-100 bg-slate-50/50 px-4 sm:px-8">
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
  );
}
