'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  Settings,
  BookOpen,
  FileText,
  Target,
  Activity,
  Globe2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const adminSidebarItems = [
  { name: 'Admin Overview', icon: Shield, href: '/admin' },
  { name: 'Operations Command', icon: Target, href: '/admin/operations' },
  { name: 'Market Mapping', icon: Globe2, href: '/admin/market-mapping' },
  { name: 'Affiliates', icon: Users, href: '/admin/affiliates' },
  { name: 'Businesses & Referrals', icon: Briefcase, href: '/admin/referrals' },
  { name: 'Commissions', icon: Percent, href: '/admin/commissions' },
  { name: 'Withdrawals', icon: Wallet, href: '/admin/withdrawals' },
  { name: 'Fraud Monitor', icon: AlertTriangle, href: '/admin/fraud' },
  { name: 'System Observability', icon: Activity, href: '/admin/observability' },
  { name: 'Affiliate Agreement', icon: FileText, href: '/admin/settings/agreement' },
  { name: 'Training Academy', icon: BookOpen, href: '/admin/training' },
  { name: 'Notifications', icon: Bell, href: '/admin/notifications' },
  { name: 'Settings', icon: Settings, href: '/admin/settings' },
];

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  // Redirect to login if hydration completes and no user is authenticated
  // or redirect to dashboard if user is not an admin/super_admin
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        router.push('/dashboard');
      }
    }
  }, [isLoading, user, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Verifying Admin Session...</p>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transition-all duration-300 flex flex-col",
          "lg:relative lg:flex", // Always flex on desktop
          !isSidebarOpen ? "-translate-x-full lg:translate-x-0 lg:w-20" : "translate-x-0 w-64"
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
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors hidden lg:block"
          >
            <Menu className="w-5 h-5 text-slate-500" />
          </button>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors lg:hidden"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <nav className="flex-grow px-4 space-y-2 mt-4 overflow-y-auto">
          {adminSidebarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-all group",
                  isActive 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-white" : "text-slate-400 group-hover:text-blue-600")} />
                {isSidebarOpen && <span className="font-medium whitespace-nowrap">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl w-full text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all group",
              !isSidebarOpen && "lg:justify-center"
            )}
          >
            <LogOut className="w-5 h-5 shrink-0 text-slate-400 group-hover:text-red-600" />
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow flex flex-col min-w-0 h-screen overflow-y-auto">
        <header className="h-16 lg:h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors lg:hidden"
            >
              <Menu className="w-5 h-5 text-slate-500" />
            </button>
            <h1 className="text-lg lg:text-xl font-bold text-slate-900 truncate max-w-[200px] sm:max-w-none">
              {adminSidebarItems.find(item => item.href === pathname)?.name || 'Admin Panel'}
            </h1>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold border border-red-100">
              Admin Mode
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
