'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Link as LinkIcon, 
  Briefcase, 
  Users, 
  Wallet, 
  BookOpen, 
  LogOut, 
  Menu, 
  X,
  Bell,
  User,
  Trophy
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import OnboardingModal from './OnboardingModal';

const sidebarItems = [
  { name: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Referral Tools', icon: LinkIcon, href: '/dashboard/tools' },
  { name: 'Businesses', icon: Briefcase, href: '/dashboard/businesses' },
  { name: 'Affiliate Network', icon: Users, href: '/dashboard/network' },
  { name: 'Leaderboard', icon: Trophy, href: '/dashboard/leaderboard' },
  { name: 'Wallet', icon: Wallet, href: '/dashboard/wallet' },
  { name: 'Sales Academy', icon: BookOpen, href: '/dashboard/training' },
  { name: 'Profile', icon: User, href: '/dashboard/profile' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  // Close mobile menu on route change
  useEffect(() => {
    const timer = setTimeout(() => setIsMobileMenuOpen(false), 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'info');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ... (sidebar code) */}
      <aside 
        className={cn(
          "hidden lg:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 sticky top-0 h-screen",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <Link href="/" className="flex items-center text-xl font-bold text-blue-600">
              Vemtap <span className="font-light ml-1 text-slate-400">Affiliates</span>
            </Link>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <nav className="flex-grow px-4 space-y-2 mt-4">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-all group",
                  isActive 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-100" 
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400 group-hover:text-blue-600")} />
                {isSidebarOpen && <span className="font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl w-full text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all group",
              !isSidebarOpen && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-600" />
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-600"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Link href="/" className="flex items-center text-lg font-bold text-blue-600">
            Vemtap
          </Link>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-slate-100 relative text-slate-600">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[85%] max-w-xs bg-white z-[70] lg:hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">V</div>
                  <span className="text-xl font-bold text-slate-900">Vemtap</span>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-xl hover:bg-slate-200 text-slate-400 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 bg-blue-600 text-white mx-4 mt-6 rounded-2xl shadow-lg shadow-blue-200">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold leading-tight">{user?.fullName || 'John Doe'}</p>
                    <p className="text-[10px] text-blue-100 uppercase tracking-widest font-bold">Affiliate Partner</p>
                  </div>
                </div>
              </div>

              <nav className="flex-grow p-4 space-y-1 mt-4">
                {sidebarItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-xl transition-all font-bold text-sm",
                        isActive 
                          ? "bg-blue-50 text-blue-600" 
                          : "text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      <item.icon className={cn("w-5 h-5", isActive ? "text-blue-600" : "text-slate-400")} />
                      <span>{item.name}</span>
                      {isActive && <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
                    </Link>
                  );
                })}
              </nav>
              
              <div className="p-4 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 p-4 rounded-xl w-full text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all font-bold text-sm"
                >
                  <LogOut className="w-5 h-5 text-slate-400" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-grow flex flex-col min-w-0">
        {/* Top Header */}
        <header className="hidden lg:flex h-20 bg-white border-b border-slate-200 items-center justify-between px-8 sticky top-0 z-30">
          <h1 className="text-xl font-bold text-slate-900">
            {sidebarItems.find(item => item.href === pathname)?.name || 'Dashboard'}
          </h1>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-slate-100 relative text-slate-600">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="h-8 w-px bg-slate-200 mx-2" />
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">{user?.fullName || 'John Doe'}</p>
                <p className="text-xs text-slate-500">Affiliate</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <User className="w-6 h-6" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-8 pt-20 lg:pt-8">
          <OnboardingModal />
          {children}
        </div>
      </main>
    </div>
  );
}
