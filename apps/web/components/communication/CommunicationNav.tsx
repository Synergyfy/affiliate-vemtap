'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import ModalShell from '@/components/ui/ModalShell';
import {
  LayoutDashboard,
  MessageCircle,
  MessageSquare,
  FileText,
  Megaphone,
  Workflow,
  Settings,
} from 'lucide-react';

const tabs = [
  { id: 'overview', label: 'Overview', href: '/admin/communication', icon: LayoutDashboard },
  { id: 'whatsapp', label: 'WhatsApp', href: '/admin/communication/whatsapp', icon: MessageCircle },
  { id: 'sms', label: 'SMS', href: '/admin/communication/sms', icon: MessageSquare },
  { id: 'templates', label: 'Templates', href: '/admin/communication/templates', icon: FileText },
  { id: 'campaigns', label: 'Campaigns', href: '/admin/communication/campaigns', icon: Megaphone },
  { id: 'sequences', label: 'Sequences', href: '/admin/communication/sequences', icon: Workflow },
  { id: 'reports', label: 'Reports', href: '/admin/communication/reports', icon: FileText },
  { id: 'settings', label: 'Settings', href: '/admin/communication/settings', icon: Settings },
];

export default function CommunicationNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (tab: (typeof tabs)[number]) =>
    tab.id === 'overview' ? pathname === tab.href : pathname.startsWith(tab.href);
  const activeTab = tabs.find(isActive) || tabs[0];

  return (
    <>
      {/* Mobile hamburger bar */}
      <div className="sm:hidden border-b border-slate-100 bg-white rounded-t-2xl sm:rounded-t-3xl -mt-px">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
              <activeTab.icon className="w-4 h-4" />
            </div>
            <span className="text-sm font-black text-slate-900 truncate">
              Communication · {activeTab.label}
            </span>
          </div>
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open communication menu"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition-all shrink-0"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Desktop tab bar */}
      <div className="hidden sm:block relative border-b border-slate-100 bg-white rounded-t-2xl sm:rounded-t-3xl -mt-px">
        <div className="flex overflow-x-auto scrollbar-hide snap-x -mb-px">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                'relative flex items-center gap-2 px-5 py-4 text-sm font-bold transition-all whitespace-nowrap snap-start shrink-0',
                isActive(tab) ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700',
              )}
            >
              <tab.icon className={cn('w-4 h-4', isActive(tab) ? 'text-blue-600' : 'text-slate-400')} />
              {tab.label}
              {isActive(tab) && (
                <motion.div
                  layoutId="communicationTab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"
                />
              )}
            </Link>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white to-transparent z-10" />
      </div>

      {/* Mobile menu sheet */}
      <ModalShell
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        size="sm"
        maxHeightClass="max-h-[70dvh] sm:max-h-[70vh]"
        header={
          <div className="p-5 pr-14">
            <h2 className="text-lg font-black text-slate-900">Communication</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Jump to a section</p>
          </div>
        }
      >
        <nav className="p-2 space-y-1">
          {tabs.map((tab) => {
            const active = isActive(tab);
            return (
              <Link
                key={tab.id}
                href={tab.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all',
                  active ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50',
                )}
              >
                <tab.icon className={cn('w-5 h-5 shrink-0', active ? 'text-blue-600' : 'text-slate-400')} />
                <span className={cn('text-sm', active ? 'font-black' : 'font-bold')}>{tab.label}</span>
                {active && <span className="ml-auto w-2 h-2 rounded-full bg-blue-600" />}
              </Link>
            );
          })}
        </nav>
      </ModalShell>
    </>
  );
}