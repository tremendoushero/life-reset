import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Plus, Feather, Menu } from 'lucide-react';

interface MobileBottomNavProps {
  onOpenQuickAdd: () => void;
  onOpenMobileMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onOpenQuickAdd,
  onOpenMobileMenu,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-cardwhite dark:bg-espresso-900 border-t border-[#EAE3D8] dark:border-espresso-800 px-3 py-1.5 flex items-center justify-around shadow-soft-lg">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-[10px] font-medium transition-colors ${
            isActive ? 'text-primary font-bold' : 'text-espresso-500 dark:text-ivory-400'
          }`
        }
      >
        <LayoutDashboard className="w-5 h-5" />
        <span>Today</span>
      </NavLink>

      <NavLink
        to="/tasks"
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-[10px] font-medium transition-colors ${
            isActive ? 'text-primary font-bold' : 'text-espresso-500 dark:text-ivory-400'
          }`
        }
      >
        <CheckSquare className="w-5 h-5" />
        <span>Tasks</span>
      </NavLink>

      {/* Floating Center Quick Add */}
      <button
        onClick={onOpenQuickAdd}
        className="w-11 h-11 -mt-4 rounded-full bg-primary text-white flex items-center justify-center shadow-soft-md hover:scale-105 active:scale-95 transition-transform"
        aria-label="Quick Add"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      <NavLink
        to="/brain-dump"
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-[10px] font-medium transition-colors ${
            isActive ? 'text-primary font-bold' : 'text-espresso-500 dark:text-ivory-400'
          }`
        }
      >
        <Feather className="w-5 h-5" />
        <span>Dump</span>
      </NavLink>

      <button
        onClick={onOpenMobileMenu}
        className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-[10px] font-medium text-espresso-500 dark:text-ivory-400 hover:text-espresso-900"
      >
        <Menu className="w-5 h-5" />
        <span>Menu</span>
      </button>
    </nav>
  );
};
