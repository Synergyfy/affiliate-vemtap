'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Shield, 
  Users, 
  Briefcase, 
  Wallet, 
  AlertTriangle,
  LogOut,
  Menu,
  X,
  Percent,
  Bell,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

const adminSidebarItems = [
  { name: 'Admin Overview', icon: Shield, href: '/admin' },
  { name: 'Affiliates', icon: Users, href: '/admin/affiliates' },
  { name: 'Businesses & Referrals', icon: Briefcase, href: '/admin/referrals' },
  { name: 'Commissions', icon: Percent, href: '/admin/commissions' },
  { name: 'Withdrawals', icon: Wallet, href: '/admin/withdrawals' },
  { name: 'Fraud Monitor', icon: AlertTriangle, href: '/admin/fraud' },
  { name: 'Notifications', icon: Bell, href: '/admin/notifications' },
  { name: 'Settings', icon: Settings, href: '/admin/settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Admin Sidebar */}
      <aside 
        className={cn(
          "hidden lg:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 sticky top-0 h-screen",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <Link href="/" className="flex items-center text-xl font-bold text-slate-900">
              Vemtap <span className="font-light ml-1 text-blue-600">Admin</span>
            </Link>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <nav className="flex-grow px-4 space-y-2 mt-4">
          {adminSidebarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-all group",
                  isActive 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400 group-hover:text-blue-600")} />
                {isSidebarOpen && <span className="font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl w-full text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all group",
              !isSidebarOpen && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5 text-slate-400 group-hover:text-slate-900" />
            {isSidebarOpen && <span className="font-medium">Exit Admin</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-30">
          <h1 className="text-xl font-bold text-slate-900">
            {adminSidebarItems.find(item => item.href === pathname)?.name || 'Admin Panel'}
          </h1>
          <div className="flex items-center gap-4">
            <div className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold border border-red-100">
              Admin Mode
            </div>
          </div>
        </header>

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
