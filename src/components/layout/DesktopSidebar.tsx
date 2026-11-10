import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  CheckSquare,
  Feather,
  Target,
  Sparkles,
  Heart,
  BookOpen,
  DollarSign,
  Home,
  Briefcase,
  BarChart3,
  Settings,
  RefreshCw,
  LogOut,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';

interface DesktopSidebarProps {
  onOpenRestart: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ onOpenRestart }) => {
  const { user, signOut, isDemo } = useAuth();
  const { saveState } = useData();

  const navSections = [
    {
      title: 'Daily Flow',
      items: [
        { to: '/app', label: 'Home Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { to: '/app/plan', label: 'Day & Week Plan', icon: <CalendarDays className="w-4 h-4" /> },
        { to: '/app/calendar', label: 'Calendar', icon: <Calendar className="w-4 h-4" /> },
        { to: '/app/tasks', label: 'Tasks', icon: <CheckSquare className="w-4 h-4" /> },
        { to: '/app/brain-dump', label: 'Brain Dump', icon: <Feather className="w-4 h-4" /> },
        { to: '/app/focus', label: 'Focus Timer', icon: <Target className="w-4 h-4" /> },
      ],
    },
    {
      title: 'Growth & Wellness',
      items: [
        { to: '/app/goals', label: 'Goals & Projects', icon: <Sparkles className="w-4 h-4" /> },
        { to: '/app/wellness', label: 'Wellness & Habits', icon: <Heart className="w-4 h-4" /> },
        { to: '/app/mind', label: 'Mind & Journal', icon: <BookOpen className="w-4 h-4" /> },
      ],
    },
    {
      title: 'Life Operations',
      items: [
        { to: '/app/life-admin', label: 'Life Admin Hub', icon: <Briefcase className="w-4 h-4" /> },
        { to: '/app/money', label: 'Money Hub', icon: <DollarSign className="w-4 h-4" /> },
        { to: '/app/household', label: 'Household', icon: <Home className="w-4 h-4" /> },
        { to: '/app/reviews', label: 'Reviews & Wins', icon: <BarChart3 className="w-4 h-4" /> },
      ],
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-cardwhite dark:bg-espresso-900 border-r border-[#EAE3D8] dark:border-espresso-800 h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-ivory-200 dark:border-espresso-800 flex items-center justify-between">
        <NavLink to="/app" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-base shadow-soft-sm">
            LR
          </div>
          <div>
            <h1 className="font-serif font-bold text-base tracking-tight text-espresso-900 dark:text-ivory-50 leading-tight">
              LIFE RESET
            </h1>
            <p className="text-[10px] text-espresso-400 dark:text-ivory-400 tracking-wide uppercase">
              Organised. Your way.
            </p>
          </div>
        </NavLink>

        {isDemo && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-sage-light text-sage-dark font-medium border border-sage/40">
            Demo
          </span>
        )}
      </div>

      {/* Gentle Restart CTA in sidebar */}
      <div className="px-4 pt-3 pb-1">
        <button
          onClick={onOpenRestart}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-softpeach-light/70 dark:bg-espresso-800 border border-softpeach/50 text-xs font-semibold text-softpeach-dark dark:text-softpeach hover:bg-softpeach-light transition-all group"
        >
          <span className="flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 text-primary group-hover:rotate-180 transition-transform duration-300" />
            Gentle Restart
          </span>
          <span className="text-[10px] opacity-75">Clean slate</span>
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {navSections.map(sec => (
          <div key={sec.title}>
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-espresso-400 dark:text-ivory-400 mb-1">
              {sec.title}
            </p>
            <div className="space-y-0.5">
              {sec.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/app'}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-espresso-800 text-ivory-50 shadow-soft-sm font-semibold'
                        : 'text-espresso-700 dark:text-ivory-200 hover:bg-ivory-200/60 dark:hover:bg-espresso-800/70'
                    }`
                  }
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Profile & Save state */}
      <div className="p-3 border-t border-ivory-200 dark:border-espresso-800 space-y-2">
        {/* Save state badge */}
        <div className="flex items-center justify-between px-2 text-[11px] text-espresso-400 dark:text-ivory-400">
          <span className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                saveState === 'saved'
                  ? 'bg-sage'
                  : saveState === 'saving'
                  ? 'bg-primary animate-pulse'
                  : 'bg-amber-400'
              }`}
            />
            {saveState === 'saved'
              ? 'Synced to cloud'
              : saveState === 'saving'
              ? 'Saving changes...'
              : 'Local safe mode'}
          </span>
          <NavLink to="/app/settings" className="hover:text-primary p-1">
            <Settings className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        {/* User Card */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-ivory-100 dark:bg-espresso-800">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
              {user?.display_name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-espresso-900 dark:text-ivory-100 truncate">
                {user?.display_name || 'My Life Reset'}
              </p>
              <p className="text-[10px] text-espresso-400 dark:text-ivory-400 truncate">
                {user?.email || 'Logged in'}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            title="Log out"
            className="p-1 text-espresso-400 hover:text-espresso-700 dark:hover:text-ivory-200 rounded"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

