'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Trophy,
  Clock,
  Target,
  Home,
  CheckSquare,
  FileText,
  Map
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createContext, useContext } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import OnboardingModal from './OnboardingModal';
import AgreementSignModal from './AgreementSignModal';
import DashboardTour from './DashboardTour';
import Image from 'next/image';

interface DashboardContextType {
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
  isProfileOpen: boolean;
  setIsProfileOpen: (open: boolean) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) throw new Error('useDashboard must be used within DashboardLayout');
  return context;
};

const sidebarItems = [
  { name: 'Home', icon: Home, href: '/dashboard' },
  { name: 'Market Mapping', icon: Map, href: '/dashboard/market-mapping' },
  { name: 'Referral Tools', icon: LinkIcon, href: '/dashboard/tools' },
  { name: 'Businesses', icon: Briefcase, href: '/dashboard/businesses' },
  { name: 'Line Manager', icon: Users, href: '/dashboard/network' },
  { name: 'Leaderboard', icon: Trophy, href: '/dashboard/leaderboard' },
  { name: 'Wallet', icon: Wallet, href: '/dashboard/wallet' },
  { name: 'Sales Academy', icon: BookOpen, href: '/dashboard/training' },
  { name: 'Profile', icon: User, href: '/dashboard/profile' },
];

const mobileNavItems = [
  { name: 'Home', icon: Home, href: '/dashboard' },
  { name: 'Map', icon: Map, href: '/dashboard/market-mapping' },
  { name: 'Report', icon: FileText, href: '/dashboard/market-mapping/insights/reports' },
  { name: 'Manager', icon: Users, href: '/dashboard/network' },
  { name: 'My', icon: User, href: '/dashboard/profile' },
];

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout, isLoading } = useAuth();
  const { showToast } = useToast();
  const pathname = usePathname();
  const router = useRouter();

  const [isTourOpen, setIsTourOpen] = useState(false);
  const [hasCompletedTour, setHasCompletedTour] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    if (!user?.createdAt) return;
    const targetDate = new Date(new Date(user.createdAt).getTime() + NINETY_DAYS_MS);
    const timer = setInterval(() => {
      const diff = targetDate.getTime() - new Date().getTime();
      if (diff <= 0) clearInterval(timer);
      else setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60)
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [user?.createdAt]);

  useEffect(() => {
    setHasCompletedTour(localStorage.getItem('hasCompletedTour') === 'true');
  }, []);

  // Handle click outside for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.profile-dropdown-container')) {
        setIsProfileOpen(false);
      }
      if (!target.closest('.notifications-dropdown-container')) {
        setIsNotificationsOpen(false);
      }
    };

    if (isProfileOpen || isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen, isNotificationsOpen]);

  // Redirect to login if hydration completes and no user is authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  // Middleware handles server-side redirection, but we keep the loading state
  // and user check for UI consistency while client-side state is hydrating.

  const handleLogout = async () => {
    await logout();
    showToast('Logged out successfully', 'info');
    router.push('/login');
  };

  // Show loading state or nothing while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-pulse" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Verifying Session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }


  return (
    <DashboardContext.Provider value={{ isNotificationsOpen, setIsNotificationsOpen, isProfileOpen, setIsProfileOpen }}>
      <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
        
        {/* Desktop Sidebar */}
        <aside className={cn(
          "hidden lg:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 sticky top-0 h-screen",
          isSidebarOpen ? "w-64" : "w-20"
        )}>
          <div className="p-6 flex items-center justify-between">
            {isSidebarOpen && (
              <Link href="/dashboard" className="flex items-center">
                <Image src="/assets/logo-full.png" alt="Vemtap" width={120} height={40} className="h-8 w-auto object-contain" priority />
              </Link>
            )}
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg hover:bg-slate-100"><Menu className="w-5 h-5" /></button>
          </div>

          <nav className="flex-grow px-4 space-y-2 mt-4">
            {sidebarItems
              .filter((item) => {
                if (item.name === 'Line Manager') {
                  return user?.role === 'SUPERVISOR' || user?.role === 'MANAGER' || user?.isManagerMode;
                }
                if (item.name === 'Referral Tools') {
                  return user?.role !== 'AGENT';
                }
                return true;
              })
              .map((item) => (
                <Link key={item.name} href={item.href} className={cn("flex items-center gap-3 p-3 rounded-xl transition-all group", pathname === item.href ? "bg-blue-600 text-white shadow-lg" : "text-slate-600 hover:bg-slate-100")}>
                  <item.icon className="w-5 h-5" />
                  {isSidebarOpen && <span className="font-bold text-sm">{item.name}</span>}
                </Link>
              ))}
          </nav>
          <div className="p-4 border-t border-slate-100">
            <button onClick={handleLogout} className="flex items-center gap-3 p-3 rounded-xl w-full text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all">
              <LogOut className="w-5 h-5" />
              {isSidebarOpen && <span className="font-bold text-sm">Logout</span>}
            </button>
          </div>
        </aside>

        {/* Mobile Header */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 h-16 flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image src="/assets/logo-icon.png" alt="V" width={32} height={32} className="w-8 h-8 object-contain" />
              <span className="font-black text-slate-900">Vemtap</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative notifications-dropdown-container">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 text-slate-600"
              >
                <Bell className="w-6 h-6" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              </button>
            </div>
            
            <div className="relative profile-dropdown-container">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 active:scale-90 transition-transform"
              >
                <User className="w-5 h-5" />
              </button>
              
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-64 bg-white/90 backdrop-blur-xl border border-slate-200/50 rounded-3xl shadow-2xl p-2 z-50 origin-top-right overflow-hidden"
                  >
                    <div className="p-4 border-b border-slate-100 mb-2 bg-slate-50/50">
                       <p className="text-sm font-black text-slate-900">{user?.fullName}</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{user?.email}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <Link 
                        href="/dashboard/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 p-3 rounded-2xl text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all group"
                      >
                        <div className="p-2 rounded-xl bg-slate-50 group-hover:bg-blue-100 transition-colors">
                          <User className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-sm">My Profile</span>
                      </Link>
                      
                      <button 
                        onClick={handleLogout}
                        className="flex items-center gap-3 p-3 rounded-2xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all group w-full text-left"
                      >
                        <div className="p-2 rounded-xl bg-slate-50 group-hover:bg-red-100 transition-colors">
                          <LogOut className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-sm">Logout</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-grow flex flex-col min-w-0 pb-28 lg:pb-0 pt-16 lg:pt-0">
          {/* Desktop Header */}
          <header className="hidden lg:flex h-20 bg-white border-b border-slate-200 px-12 items-center justify-between sticky top-0 z-30">
            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                {sidebarItems.find(item => item.href === pathname)?.name || 'Dashboard'}
              </h1>
            </div>
            <div className="flex items-center gap-6">
              <div className="relative notifications-dropdown-container">
                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="relative p-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                </button>
              </div>
              
              <div className="h-8 w-px bg-slate-200" />

              <div className="relative profile-dropdown-container">
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-3 group px-2 py-1.5 rounded-2xl hover:bg-slate-50 transition-all"
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-black text-slate-900 group-hover:text-blue-600 transition-colors">{user?.fullName || 'User Profile'}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.isManagerMode ? 'Line Manager' : user?.role || 'Affiliate'}</p>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                    <User className="w-5 h-5" />
                  </div>
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute right-0 mt-3 w-72 bg-white/90 backdrop-blur-xl border border-slate-200/50 rounded-3xl shadow-2xl p-2 z-50 origin-top-right overflow-hidden"
                    >
                      <div className="p-4 border-b border-slate-100 mb-2 bg-slate-50/50 rounded-t-2xl">
                         <div className="flex items-center gap-3 mb-1">
                           <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xs">
                             {user?.fullName?.charAt(0) || 'U'}
                           </div>
                           <div>
                              <p className="text-sm font-black text-slate-900">{user?.fullName}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.isManagerMode ? 'Line Manager' : user?.role || 'Affiliate'}</p>
                             </div>
                         </div>
                         <p className="text-[10px] font-medium text-slate-400 truncate mt-2">{user?.email}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <Link 
                          href="/dashboard/profile"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 p-3 rounded-2xl text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all group"
                        >
                          <div className="p-2 rounded-xl bg-slate-50 group-hover:bg-blue-100 transition-colors">
                            <User className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-sm">My Profile</span>
                        </Link>
                        
                        <div className="h-px bg-slate-100 mx-2 my-1" />

                        <button 
                          onClick={handleLogout}
                          className="flex items-center gap-3 p-3 rounded-2xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all group w-full text-left"
                        >
                          <div className="p-2 rounded-xl bg-slate-50 group-hover:bg-red-100 transition-colors">
                            <LogOut className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-sm">Logout</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          <div className="p-4 md:p-8 lg:p-12 max-w-7xl mx-auto w-full">
            <OnboardingModal />
            <AgreementSignModal />
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-3 sm:px-6 h-20 flex items-center justify-between gap-1 z-50 pb-safe">
          {mobileNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href} 
                className="flex flex-col items-center justify-center gap-1 min-w-0 flex-1 px-1 transition-all"
              >
                <div className={cn(
                  "p-2 rounded-2xl transition-all",
                  isActive ? "bg-emerald-100 text-emerald-600" : "text-slate-400"
                )}>
                  <item.icon className="w-6 h-6" />
                </div>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest whitespace-nowrap",
                  isActive ? "text-emerald-600" : "text-slate-400"
                )}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        <DashboardTour isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />
      </div>
    </DashboardContext.Provider>
  );
}
