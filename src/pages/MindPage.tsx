import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { BookOpen, Sparkles, Search, Plus, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export const MindPage: React.FC = () => {
  const { journals, addJournal } = useData();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isWriting, setIsWriting] = useState(false);

  const prompts = [
    'What can I be gentle with myself about today?',
    'What thought has been taking up unnecessary mental RAM?',
    'If I could only accomplish one tiny thing today and call it a win, what is it?',
    'What helped me feel grounded recently?',
    'What permission do I need to give myself right now?',
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    await addJournal(content.trim(), title.trim() || undefined, selectedPrompt || undefined);
    setTitle('');
    setContent('');
    setSelectedPrompt('');
    setIsWriting(false);
  };

  const filteredJournals = journals.filter(j =>
    searchQuery
      ? j.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (j.title && j.title.toLowerCase().includes(searchQuery.toLowerCase()))
      : true
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-espresso-900 dark:text-ivory-50">
              Mind & Journal
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-espresso-500 dark:text-ivory-400 mt-0.5">
            A quiet sanctuary for free reflection and releasing mental clutter.
          </p>
        </div>

        {!isWriting && (
          <Button
            variant="primary"
            onClick={() => setIsWriting(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            New Journal Entry
          </Button>
        )}
      </div>

      {/* Writing Box */}
      {isWriting && (
        <Card className="p-5 border-2 border-primary/30 shadow-soft-md animate-slide-up">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-espresso-600 dark:text-ivory-300">
                Writing Entry • {format(new Date(), 'MMMM d, yyyy')}
              </span>
              <button
                type="button"
                onClick={() => setIsWriting(false)}
                className="text-xs text-espresso-400 hover:text-espresso-700"
              >
                Close
              </button>
            </div>

            {/* Prompt pills */}
            <div className="space-y-1">
              <span className="text-[11px] text-espresso-400 block font-medium">
                Optional writing prompt:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {prompts.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setSelectedPrompt(p)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                      selectedPrompt === p
                        ? 'bg-primary text-white border-primary font-medium'
                        : 'bg-ivory-100 text-espresso-700 border-ivory-300 hover:bg-ivory-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Entry Title (Optional)"
              className="w-full text-base font-serif font-semibold border-b border-ivory-300 dark:border-espresso-700 bg-transparent py-1 text-espresso-900 dark:text-ivory-50 placeholder-espresso-300 focus:outline-none focus:border-primary"
            />

            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Write freely. No grammar police, no formatting pressure..."
              rows={6}
              autoFocus
              className="w-full p-3 rounded-xl border border-ivory-300 dark:border-espresso-700 bg-white dark:bg-espresso-900 text-sm text-espresso-900 dark:text-ivory-100 placeholder-espresso-300 focus:outline-none focus:border-primary resize-none leading-relaxed"
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-ivory-200">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsWriting(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={!content.trim()}>
                Save Entry
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Search Entries */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-espresso-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search journal entries..."
          className="w-full pl-9 pr-3 py-2 rounded-xl border border-ivory-300 dark:border-espresso-700 bg-white dark:bg-espresso-900 text-xs text-espresso-900 dark:text-ivory-100 placeholder-espresso-300 focus:outline-none focus:border-primary"
        />
      </div>

      {/* Entries List */}
      <div className="space-y-4">
        {filteredJournals.length === 0 ? (
          <Card className="text-center py-10 border-dashed">
            <BookOpen className="w-8 h-8 text-espresso-300 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium text-espresso-800 dark:text-ivory-100">
              No journal entries yet.
            </p>
            <p className="text-xs text-espresso-400 mt-0.5">
              Click 'New Journal Entry' whenever you want to unpack your thoughts.
            </p>
          </Card>
        ) : (
          filteredJournals.map(entry => (
            <Card key={entry.id} className="p-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-espresso-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {entry.date}
                </span>
                {entry.prompt && (
                  <span className="italic text-primary max-w-sm truncate">
                    Prompt: "{entry.prompt}"
                  </span>
                )}
              </div>

              {entry.title && (
                <h3 className="font-serif text-lg font-bold text-espresso-900 dark:text-ivory-50">
                  {entry.title}
                </h3>
              )}

              <p className="text-sm text-espresso-800 dark:text-ivory-100 whitespace-pre-line leading-relaxed">
                {entry.content}
              </p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

