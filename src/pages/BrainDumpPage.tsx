import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { BrainDumpEntry } from '@/types';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Feather, ArrowRight, CheckCircle2, Archive, Trash2, Search, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

export const BrainDumpPage: React.FC = () => {
  const { brainDumps, addBrainDump, convertBrainDumpToTask, archiveBrainDump, deleteBrainDump } = useData();

  const [inputContent, setInputContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [organizeMode, setOrganizeMode] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [targetDate, setTargetDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim()) return;
    await addBrainDump(inputContent.trim());
    setInputContent('');
  };

  const handleConvert = async (entry: BrainDumpEntry) => {
    await convertBrainDumpToTask(entry.id, targetDate);
    setConvertingId(null);
  };

  const filteredEntries = brainDumps
    .filter(b => !b.is_archived)
    .filter(b => (searchQuery ? b.content.toLowerCase().includes(searchQuery.toLowerCase()) : true));

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Feather className="w-5 h-5 text-primary" />
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-espresso-900 dark:text-ivory-50">
              Brain Dump
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-espresso-500 dark:text-ivory-400 mt-0.5">
            Get tangled thoughts out of your head immediately. Zero pressure to categorize right now.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setOrganizeMode(!organizeMode)}
          icon={<Sparkles className="w-3.5 h-3.5" />}
        >
          {organizeMode ? 'Exit Organise Mode' : 'Organise Later Mode'}
        </Button>
      </div>

      {/* Large distraction-free input area */}
      <Card className="p-4 border-2 border-primary/20 shadow-soft-md">
        <form onSubmit={handleCapture}>
          <label className="block text-xs font-semibold uppercase tracking-wider text-espresso-600 dark:text-ivory-300 mb-2">
            Quick Capture (Press Enter or click Capture)
          </label>
          <textarea
            value={inputContent}
            onChange={e => setInputContent(e.target.value)}
            placeholder="Type anything on your mind: a random reminder, gift idea, worrying thought, chore..."
            rows={3}
            autoFocus
            className="w-full p-3 rounded-xl border border-ivory-300 dark:border-espresso-700 bg-white dark:bg-espresso-900 text-sm text-espresso-900 dark:text-ivory-100 placeholder-espresso-300 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-ivory-200 dark:border-espresso-800">
            <span className="text-[11px] text-espresso-400">
              Just write. You can convert thoughts into tasks later.
            </span>
            <Button type="submit" variant="primary" size="sm" disabled={!inputContent.trim()}>
              Capture Thought
            </Button>
          </div>
        </form>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-espresso-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search captured thoughts..."
          className="w-full pl-9 pr-3 py-2 rounded-xl border border-ivory-300 dark:border-espresso-700 bg-white dark:bg-espresso-900 text-xs text-espresso-900 dark:text-ivory-100 placeholder-espresso-300 focus:outline-none focus:border-primary"
        />
      </div>

      {/* Entries List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-espresso-600 dark:text-ivory-300">
            Captured Thoughts ({filteredEntries.length})
          </span>
          {organizeMode && (
            <span className="text-xs text-primary font-medium">
              Reviewing each item: Turn into a task, keep, or dismiss.
            </span>
          )}
        </div>

        {filteredEntries.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-ivory-300 dark:border-espresso-700 rounded-2xl">
            <Feather className="w-8 h-8 text-espresso-300 mx-auto mb-2 opacity-60" />
            <p className="text-sm font-medium text-espresso-800 dark:text-ivory-100">
              Your mental slate is quiet.
            </p>
            <p className="text-xs text-espresso-400 mt-0.5">
              Whenever something pops into your head, type it above to unload the thought.
            </p>
          </div>
        ) : (
          filteredEntries.map(entry => {
            const isConverting = convertingId === entry.id;

            return (
              <Card
                key={entry.id}
                className={`p-4 transition-all ${
                  entry.is_processed
                    ? 'bg-ivory-100/60 dark:bg-espresso-900/40 opacity-75'
                    : 'bg-cardwhite dark:bg-espresso-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-espresso-900 dark:text-ivory-100 leading-relaxed break-words">
                      {entry.content}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-espresso-400">
                      <span>{format(new Date(entry.created_at), 'MMM d, h:mm a')}</span>
                      {entry.category !== 'uncategorized' && (
                        <span className="capitalize px-1.5 py-0.5 rounded bg-ivory-200 dark:bg-espresso-700">
                          {entry.category}
                        </span>
                      )}
                      {entry.is_processed && (
                        <span className="text-sage-dark font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Converted to task
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!entry.is_processed && (
                      <Button
                        variant="gentle"
                        size="sm"
                        onClick={() => setConvertingId(isConverting ? null : entry.id)}
                        icon={<ArrowRight className="w-3.5 h-3.5" />}
                      >
                        To Task
                      </Button>
                    )}
                    <button
                      onClick={() => archiveBrainDump(entry.id)}
                      title="Archive thought"
                      className="p-1.5 text-espresso-400 hover:text-espresso-700 rounded-lg hover:bg-ivory-200"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteBrainDump(entry.id)}
                      title="Delete thought"
                      className="p-1.5 text-espresso-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Inline Convert Workflow */}
                {isConverting && (
                  <div className="mt-3 pt-3 border-t border-ivory-200 dark:border-espresso-700 flex flex-wrap items-center gap-3 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-espresso-600 dark:text-ivory-300">
                        Schedule for:
                      </label>
                      <input
                        type="date"
                        value={targetDate}
                        onChange={e => setTargetDate(e.target.value)}
                        className="text-xs p-1.5 rounded-lg border border-ivory-300 dark:border-espresso-700 bg-white dark:bg-espresso-900"
                      />
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleConvert(entry)}
                    >
                      Confirm Convert
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConvertingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

