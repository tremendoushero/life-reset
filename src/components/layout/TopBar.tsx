import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCapacity } from '@/contexts/CapacityContext';
import { Search, Plus, Sparkles, RefreshCw, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';

interface TopBarProps {
  onOpenQuickAdd: () => void;
  onOpenRestart: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenQuickAdd, onOpenRestart }) => {
  const { user } = useAuth();
  const { mode } = useCapacity();
  const { tasks, brainDumps, lifeAdmin } = useData();
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Search results
  const filteredTasks = searchQuery.trim()
    ? tasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 3)
    : [];

  const filteredDumps = searchQuery.trim()
    ? brainDumps.filter(b => b.content.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 3)
    : [];

  const filteredAdmin = searchQuery.trim()
    ? lifeAdmin.filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 3)
    : [];

  return (
    <header className="sticky top-0 z-20 bg-background/85 backdrop-blur-md border-b border-[#EAE3D8] dark:border-espresso-800 px-4 md:px-8 py-3 flex items-center justify-between gap-4 transition-all">
      {/* Left side: Greeting */}
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-espresso-900 dark:text-ivory-100 truncate">
          Hello, {user?.display_name?.split(' ')[0] || 'Friend'}
        </h2>
        <div className="flex items-center gap-2 text-xs text-espresso-500 dark:text-ivory-400">
          <span className="capitalize">{mode.replace('-', ' ')} Mode active</span>
          <span>•</span>
          <span className="hidden sm:inline">Take things one breath at a time</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Search trigger */}
        <div className="relative">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-ivory-300 dark:border-espresso-700 bg-cardwhite dark:bg-espresso-800 text-xs text-espresso-400 dark:text-ivory-400 hover:border-ivory-400 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Search anything...</span>
          </button>

          {/* Quick Search Dropdown Modal */}
          {searchOpen && (
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-espresso-900/40 backdrop-blur-sm animate-fade-in">
              <div className="w-full max-w-lg bg-cardwhite dark:bg-espresso-800 rounded-2xl border border-ivory-300 dark:border-espresso-700 shadow-soft-lg p-4 animate-slide-up">
                <div className="flex items-center gap-2 border-b border-ivory-200 dark:border-espresso-700 pb-3">
                  <Search className="w-4 h-4 text-primary shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search tasks, brain dumps, admin..."
                    className="flex-1 bg-transparent text-sm text-espresso-900 dark:text-ivory-100 focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="p-1 text-espresso-400 hover:text-espresso-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Results list */}
                <div className="max-h-72 overflow-y-auto pt-3 space-y-2 text-xs">
                  {searchQuery.trim() === '' ? (
                    <p className="text-center py-6 text-espresso-400">
                      Type keywords to find tasks, thoughts, or reminders...
                    </p>
                  ) : filteredTasks.length === 0 && filteredDumps.length === 0 && filteredAdmin.length === 0 ? (
                    <p className="text-center py-6 text-espresso-400">
                      No matching records found.
                    </p>
                  ) : (
                    <>
                      {filteredTasks.map(t => (
                        <div
                          key={t.id}
                          onClick={() => {
                            setSearchOpen(false);
                            navigate('/app/tasks');
                          }}
                          className="p-2 rounded-xl hover:bg-ivory-100 dark:hover:bg-espresso-700 cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <span className="font-semibold text-primary">Task:</span> {t.title}
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-espresso-400" />
                        </div>
                      ))}

                      {filteredDumps.map(d => (
                        <div
                          key={d.id}
                          onClick={() => {
                            setSearchOpen(false);
                            navigate('/app/brain-dump');
                          }}
                          className="p-2 rounded-xl hover:bg-ivory-100 dark:hover:bg-espresso-700 cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <span className="font-semibold text-lavender-dark">Brain Dump:</span> {d.content}
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-espresso-400" />
                        </div>
                      ))}

                      {filteredAdmin.map(a => (
                        <div
                          key={a.id}
                          onClick={() => {
                            setSearchOpen(false);
                            navigate('/app/life-admin');
                          }}
                          className="p-2 rounded-xl hover:bg-ivory-100 dark:hover:bg-espresso-700 cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <span className="font-semibold text-sage-dark">Life Admin:</span> {a.title}
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-espresso-400" />
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Gentle Restart Header Button */}
        <button
          onClick={onOpenRestart}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-softpeach/60 bg-softpeach-light/50 dark:bg-espresso-800 text-xs font-medium text-softpeach-dark dark:text-softpeach hover:bg-softpeach-light transition-colors"
          title="Reset my day without guilt"
        >
          <RefreshCw className="w-3.5 h-3.5 text-primary" />
          <span>Reset Day</span>
        </button>

        {/* Quick Add Button */}
        <button
          onClick={onOpenQuickAdd}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold shadow-soft-sm hover:opacity-95 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden sm:inline">Add</span>
        </button>
      </div>
    </header>
  );
};
