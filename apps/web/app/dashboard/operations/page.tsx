'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import KPIStrip from '@/components/dashboard/operations/KPIStrip';
import TabNavigation from '@/components/dashboard/operations/TabNavigation';
import OverviewTab from '@/components/dashboard/operations/OverviewTab';
import LeadsTab from '@/components/dashboard/operations/LeadsTab';
import FollowUpsTab from '@/components/dashboard/operations/FollowUpsTab';
import DemosTab from '@/components/dashboard/operations/DemosTab';
import BusinessesTab from '@/components/dashboard/operations/BusinessesTab';
import OnboardingTab from '@/components/dashboard/operations/OnboardingTab';
import TasksTab from '@/components/dashboard/operations/TasksTab';
import ActivitiesTab from '@/components/dashboard/operations/ActivitiesTab';
import { motion, AnimatePresence } from 'framer-motion';

export default function OperationsPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'leads':
        return <LeadsTab />;
      case 'follow-ups':
        return <FollowUpsTab />;
      case 'demos':
        return <DemosTab />;
      case 'businesses':
        return <BusinessesTab />;
      case 'onboarding':
        return <OnboardingTab />;
      case 'tasks':
        return <TasksTab />;
      case 'activities':
        return <ActivitiesTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Operations Command Center</h2>
          <p className="text-slate-500">Manage your business acquisition lifecycle and operational workflow.</p>
        </div>

        <KPIStrip />

        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
          
          <div className="p-6 sm:p-8 min-h-[600px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
