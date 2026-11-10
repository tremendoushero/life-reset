import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { DesktopSidebar } from './DesktopSidebar';
import { TopBar } from './TopBar';
import { MobileBottomNav } from './MobileBottomNav';
import { QuickAddModal } from './QuickAddModal';
import { GentleRestartModal } from '@/components/features/GentleRestartModal';
import { TinyStepRescueModal } from '@/components/features/TinyStepRescueModal';
import {
  X,
  LayoutDashboard,
  CalendarDays,
  Calendar,
  CheckSquare,
  Feather,
  Target,
  Sparkles,
  Heart,
  BookOpen,
  Briefcase,
  DollarSign,
  Home,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const AppShell: React.FC = () => {
  const { signOut, user } = useAuth();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [restartOpen, setRestartOpen] = useState(false);
  const [rescueOpen, setRescueOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mobileNavItems = [
    { to: '/app', label: 'Home Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: '/app/plan', label: 'Day & Week Plan', icon: <CalendarDays className="w-4 h-4" /> },
    { to: '/app/calendar', label: 'Calendar', icon: <Calendar className="w-4 h-4" /> },
    { to: '/app/tasks', label: 'Task Management', icon: <CheckSquare className="w-4 h-4" /> },
    { to: '/app/brain-dump', label: 'Brain Dump', icon: <Feather className="w-4 h-4" /> },
    { to: '/app/focus', label: 'Focus Timer', icon: <Target className="w-4 h-4" /> },
    { to: '/app/goals', label: 'Goals & Projects', icon: <Sparkles className="w-4 h-4" /> },
    { to: '/app/wellness', label: 'Wellness & Habits', icon: <Heart className="w-4 h-4" /> },
    { to: '/app/mind', label: 'Mind & Journal', icon: <BookOpen className="w-4 h-4" /> },
    { to: '/app/life-admin', label: 'Life Admin Hub', icon: <Briefcase className="w-4 h-4" /> },
    { to: '/app/money', label: 'Money Hub', icon: <DollarSign className="w-4 h-4" /> },
    { to: '/app/household', label: 'Household', icon: <Home className="w-4 h-4" /> },
    { to: '/app/reviews', label: 'Reviews & Wins', icon: <BarChart3 className="w-4 h-4" /> },
    { to: '/app/settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-row">
      {/* Desktop Sidebar */}
      <DesktopSidebar onOpenRestart={() => setRestartOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        <TopBar
          onOpenQuickAdd={() => setQuickAddOpen(true)}
          onOpenRestart={() => setRestartOpen(true)}
        />

        <main className="flex-1 px-4 sm:px-6 md:px-8 py-6 max-w-7xl w-full mx-auto animate-fade-in">
          <Outlet context={{ openRescue: () => setRescueOpen(true) }} />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        onOpenQuickAdd={() => setQuickAddOpen(true)}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
      />

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-espresso-900/60 backdrop-blur-sm animate-fade-in">
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-cardwhite dark:bg-espresso-900 p-5 flex flex-col shadow-soft-lg animate-slide-up">
            <div className="flex items-center justify-between pb-4 border-b border-ivory-200 dark:border-espresso-800">
              <span className="font-serif font-bold text-base text-espresso-900 dark:text-ivory-50">
                LIFE RESET
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-espresso-400 hover:text-espresso-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-1">
              {mobileNavItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/app'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-espresso-800 text-ivory-50 font-semibold'
                        : 'text-espresso-700 dark:text-ivory-200 hover:bg-ivory-100'
                    }`
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>

            <div className="pt-3 border-t border-ivory-200 dark:border-espresso-800">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 rounded-xl hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out ({user?.display_name || 'User'})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Modals */}
      <QuickAddModal isOpen={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
      <GentleRestartModal isOpen={restartOpen} onClose={() => setRestartOpen(false)} />
      <TinyStepRescueModal isOpen={rescueOpen} onClose={() => setRescueOpen(false)} />
    </div>
  );
};

