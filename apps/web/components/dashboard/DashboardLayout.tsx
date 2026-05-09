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
  Star,
  LineChart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createContext, useContext } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import OnboardingModal from './OnboardingModal';
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
  { name: 'Leads', icon: Target, href: '/dashboard/leads' },
  { name: 'Referral Tools', icon: LinkIcon, href: '/dashboard/tools' },
  { name: 'Businesses', icon: Briefcase, href: '/dashboard/businesses' },
  { name: 'Manager Network', icon: Users, href: '/dashboard/network' },
  { name: 'Leaderboard', icon: Trophy, href: '/dashboard/leaderboard' },
  { name: 'Wallet', icon: Wallet, href: '/dashboard/wallet' },
  { name: 'Sales Academy', icon: BookOpen, href: '/dashboard/training' },
  { name: 'Profile', icon: User, href: '/dashboard/profile' },
];

const mobileNavItems = [
  { name: 'Home', icon: Home, href: '/dashboard' },
  { name: 'Leads', icon: Target, href: '/dashboard/leads' },
  { name: 'VIP', icon: Star, href: '/dashboard/network' },
  { name: 'Profit', icon: LineChart, href: '/dashboard/wallet' },
  { name: 'My', icon: User, href: '/dashboard/profile' },
];

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
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

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'info');
    router.push('/login');
  };

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
            {sidebarItems.map((item) => (
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
            <button className="relative p-2 text-slate-600"><Bell className="w-6 h-6" /><span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" /></button>
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><User className="w-5 h-5" /></div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-grow flex flex-col min-w-0 pb-24 lg:pb-0 pt-16 lg:pt-0">
          <div className="p-4 md:p-8 lg:p-12 max-w-7xl mx-auto w-full">
            <OnboardingModal />
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 h-20 flex items-center justify-between z-50 pb-safe">
          {mobileNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href} 
                className="flex flex-col items-center justify-center gap-1 min-w-[64px] transition-all"
              >
                <div className={cn(
                  "p-2 rounded-2xl transition-all",
                  isActive ? "bg-emerald-100 text-emerald-600" : "text-slate-400"
                )}>
                  <item.icon className="w-6 h-6" />
                </div>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest",
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
