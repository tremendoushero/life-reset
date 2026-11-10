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
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';

interface DesktopSidebarProps {
  onOpenRestart: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ onOpenRestart }) => {
  const { user } = useAuth();
  const { saveState } = useData();

  const navSections = [
    {
      title: 'Daily Flow',
      items: [
        { to: '/', label: 'Home Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { to: '/plan', label: 'Day & Week Plan', icon: <CalendarDays className="w-4 h-4" /> },
        { to: '/calendar', label: 'Calendar', icon: <Calendar className="w-4 h-4" /> },
        { to: '/tasks', label: 'Tasks', icon: <CheckSquare className="w-4 h-4" /> },
        { to: '/brain-dump', label: 'Brain Dump', icon: <Feather className="w-4 h-4" /> },
        { to: '/focus', label: 'Focus Timer', icon: <Target className="w-4 h-4" /> },
      ],
    },
    {
      title: 'Growth & Wellness',
      items: [
        { to: '/goals', label: 'Goals & Projects', icon: <Sparkles className="w-4 h-4" /> },
        { to: '/wellness', label: 'Wellness & Habits', icon: <Heart className="w-4 h-4" /> },
        { to: '/mind', label: 'Mind & Journal', icon: <BookOpen className="w-4 h-4" /> },
      ],
    },
    {
      title: 'Life Operations',
      items: [
        { to: '/life-admin', label: 'Life Admin Hub', icon: <Briefcase className="w-4 h-4" /> },
        { to: '/money', label: 'Money Hub', icon: <DollarSign className="w-4 h-4" /> },
        { to: '/household', label: 'Household', icon: <Home className="w-4 h-4" /> },
        { to: '/reviews', label: 'Reviews & Wins', icon: <BarChart3 className="w-4 h-4" /> },
      ],
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-cardwhite dark:bg-espresso-900 border-r border-[#EAE3D8] dark:border-espresso-800 h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-ivory-200 dark:border-espresso-800 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-base shadow-soft-sm">
            LR
          </div>
          <div>
            <h1 className="font-serif font-bold text-base tracking-tight text-espresso-900 dark:text-ivory-50 leading-tight">
              LIFE RESET
            </h1>
            <p className="text-[10px] text-espresso-400 dark:text-ivory-400 tracking-wide uppercase">
              Personal Digital Planner
            </p>
          </div>
        </NavLink>
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
                  end={item.to === '/'}
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
          <span className="flex items-center gap-1.5" title="All planner data is saved in your browser IndexedDB">
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
              ? 'Saved on device'
              : saveState === 'saving'
              ? 'Saving changes...'
              : 'Local safe mode'}
          </span>
          <NavLink to="/settings" className="hover:text-primary p-1" title="Settings & Backup">
            <Settings className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        {/* User Card */}
        <NavLink
          to="/settings"
          className="flex items-center justify-between p-2 rounded-xl bg-ivory-100 dark:bg-espresso-800 hover:bg-ivory-200/70 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
              {user?.display_name?.charAt(0) || 'P'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-espresso-900 dark:text-ivory-100 truncate">
                {user?.display_name || 'My Life Reset'}
              </p>
              <p className="text-[10px] text-espresso-400 dark:text-ivory-400 truncate flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-sage-dark inline" /> Private Planner
              </p>
            </div>
          </div>
        </NavLink>
      </div>
    </aside>
  );
};
