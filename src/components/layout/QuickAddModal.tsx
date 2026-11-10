import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { useData } from '@/contexts/DataContext';
import { CheckSquare, Feather, DollarSign, Briefcase, Heart, Smile } from 'lucide-react';
import { format } from 'date-fns';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ isOpen, onClose }) => {
  const { addTask, addBrainDump, addBill, addLifeAdmin, addGratitude } = useData();

  const [activeType, setActiveType] = useState<'task' | 'braindump' | 'bill' | 'admin' | 'gratitude'>('task');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [amount, setAmount] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    if (activeType === 'task') {
      await addTask({
        title: content.trim(),
        category,
        priority: 'important',
        due_date: format(new Date(), 'yyyy-MM-dd'),
        estimated_duration: 15,
        status: 'not_started',
        energy_requirement: 'medium',
        recurrence: 'none',
        is_top_three: false,
      });
    } else if (activeType === 'braindump') {
      await addBrainDump(content.trim(), category);
    } else if (activeType === 'bill') {
      await addBill({
        name: content.trim(),
        amount: parseFloat(amount) || 0,
        due_date: format(new Date(), 'yyyy-MM-dd'),
        recurrence: 'monthly',
        payment_status: 'pending',
        category: 'utilities',
      });
    } else if (activeType === 'admin') {
      await addLifeAdmin({
        title: content.trim(),
        category: 'general',
        status: 'pending',
      });
    } else if (activeType === 'gratitude') {
      await addGratitude(content.trim());
    }

    setContent('');
    setAmount('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Capture"
      description="Capture thoughts, obligations, or small wins before they slip away."
      maxWidth="md"
    >
      {/* Category selector */}
      <div className="grid grid-cols-5 gap-1 mb-4 p-1 rounded-xl bg-ivory-100 dark:bg-espresso-900 border border-ivory-200 dark:border-espresso-700">
        {[
          { id: 'task', label: 'Task', icon: <CheckSquare className="w-3.5 h-3.5" /> },
          { id: 'braindump', label: 'Dump', icon: <Feather className="w-3.5 h-3.5" /> },
          { id: 'bill', label: 'Bill', icon: <DollarSign className="w-3.5 h-3.5" /> },
          { id: 'admin', label: 'Admin', icon: <Briefcase className="w-3.5 h-3.5" /> },
          { id: 'gratitude', label: 'Gratitude', icon: <Smile className="w-3.5 h-3.5" /> },
        ].map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveType(item.id as any)}
            className={`py-1.5 px-2 rounded-lg text-xs font-medium flex flex-col items-center gap-1 transition-all ${
              activeType === item.id
                ? 'bg-cardwhite dark:bg-espresso-800 text-primary shadow-soft-sm font-semibold'
                : 'text-espresso-600 dark:text-ivory-300 hover:text-espresso-900'
            }`}
          >
            {item.icon}
            <span className="text-[11px]">{item.label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {activeType === 'gratitude' ? (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-espresso-600 dark:text-ivory-300 mb-1">
              One gentle positive moment today:
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="e.g. Delicious hot coffee, sunshine on my face, friend's text..."
              rows={3}
              autoFocus
              className="w-full rounded-xl border border-ivory-300 dark:border-espresso-700 p-3 text-sm bg-white dark:bg-espresso-900 text-espresso-900 dark:text-ivory-100 focus:outline-none focus:border-primary"
            />
          </div>
        ) : (
          <div>
            <Input
              label={
                activeType === 'task'
                  ? 'Task Title'
                  : activeType === 'braindump'
                  ? 'Whatever is in your head'
                  : activeType === 'bill'
                  ? 'Bill / Subscription Name'
                  : 'Life Admin Item'
              }
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={
                activeType === 'task'
                  ? 'e.g. Empty dishwasher'
                  : activeType === 'braindump'
                  ? 'Just type, categorize later...'
                  : activeType === 'bill'
                  ? 'e.g. Electric bill'
                  : 'e.g. Return package to postal locker'
              }
              autoFocus
              required
            />
          </div>
        )}

        {activeType === 'bill' && (
          <Input
            type="number"
            step="0.01"
            label="Amount ($)"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-ivory-200 dark:border-espresso-700">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm">
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
};
