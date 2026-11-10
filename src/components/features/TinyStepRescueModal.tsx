import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Task } from '@/types';
import { useData } from '@/contexts/DataContext';
import { Sparkles, HelpCircle, CheckCircle2, Plus, Trash2, ArrowRight } from 'lucide-react';

interface TinyStepRescueModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
}

export const TinyStepRescueModal: React.FC<TinyStepRescueModalProps> = ({
  isOpen,
  onClose,
  task,
}) => {
  const { breakdownTaskIntoSteps } = useData();
  const [activeTab, setActiveTab] = useState<'breakdown' | 'diagnostic'>('breakdown');
  const [taskTitle, setTaskTitle] = useState(task?.title || '');
  const [steps, setSteps] = useState<{ title: string; estimated_minutes: number }[]>([
    { title: 'Clear just one small surface', estimated_minutes: 2 },
    { title: 'Gather items belonging elsewhere into a box', estimated_minutes: 5 },
    { title: 'Take a 2-minute water pause', estimated_minutes: 2 },
    { title: 'Decide if you want to stop or continue', estimated_minutes: 2 },
  ]);

  // Diagnostic states
  const [stuckReason, setStuckReason] = useState<string | null>(null);

  const handleAddStep = (minutes = 5) => {
    setSteps(prev => [...prev, { title: '', estimated_minutes: minutes }]);
  };

  const handleUpdateStep = (index: number, text: string) => {
    setSteps(prev => prev.map((s, i) => (i === index ? { ...s, title: text } : s)));
  };

  const handleRemoveStep = (index: number) => {
    setSteps(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveToTask = async () => {
    if (!task) {
      onClose();
      return;
    }
    const validSteps = steps.filter(s => s.title.trim().length > 0);
    if (validSteps.length > 0) {
      await breakdownTaskIntoSteps(task.id, validSteps);
    }
    onClose();
  };

  // Rule-based diagnostic suggestions (no external API needed)
  const generateRescueSuggestions = (reason: string) => {
    switch (reason) {
      case 'too_big':
        setSteps([
          { title: 'Do just 2 minutes of the easiest part', estimated_minutes: 2 },
          { title: 'Give yourself full permission to stop right after', estimated_minutes: 1 },
          { title: 'Celebrate that you initiated action', estimated_minutes: 1 },
        ]);
        setActiveTab('breakdown');
        break;
      case 'unclear_start':
        setSteps([
          { title: 'Open the necessary tab, file or physical location', estimated_minutes: 2 },
          { title: 'Write down what the very first click or action is', estimated_minutes: 3 },
          { title: 'Execute that single action only', estimated_minutes: 5 },
        ]);
        setActiveTab('breakdown');
        break;
      case 'missing_info':
        setSteps([
          { title: 'Send one message asking for the missing detail', estimated_minutes: 3 },
          { title: 'Move this task to "Waiting-for" list', estimated_minutes: 1 },
          { title: 'Let go of thinking about it for today', estimated_minutes: 1 },
        ]);
        setActiveTab('breakdown');
        break;
      case 'low_energy':
        setSteps([
          { title: 'Drink a glass of cool water and stretch for 60 seconds', estimated_minutes: 2 },
          { title: 'Postpone the demanding part to tomorrow with zero guilt', estimated_minutes: 1 },
          { title: 'Pick one tiny appetizer from your Dopamine Menu', estimated_minutes: 5 },
        ]);
        setActiveTab('breakdown');
        break;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tiny-Step Rescue"
      description="Break daunting tasks into frictionless 2 to 15-minute micro-steps."
      maxWidth="lg"
    >
      {/* Sub-tabs */}
      <div className="flex border-b border-ivory-200 dark:border-espresso-700 mb-4 pb-2 gap-4">
        <button
          onClick={() => setActiveTab('breakdown')}
          className={`text-sm font-medium pb-1 transition-colors ${
            activeTab === 'breakdown'
              ? 'text-primary border-b-2 border-primary font-semibold'
              : 'text-espresso-500 hover:text-espresso-800 dark:text-ivory-300'
          }`}
        >
          Step Breakdown
        </button>
        <button
          onClick={() => setActiveTab('diagnostic')}
          className={`flex items-center gap-1.5 text-sm font-medium pb-1 transition-colors ${
            activeTab === 'diagnostic'
              ? 'text-primary border-b-2 border-primary font-semibold'
              : 'text-espresso-500 hover:text-espresso-800 dark:text-ivory-300'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-primary" />
          <span>I'm Stuck Diagnostic</span>
        </button>
      </div>

      {activeTab === 'breakdown' ? (
        <div className="space-y-4">
          <div className="p-3 bg-ivory-100 dark:bg-espresso-900/60 rounded-xl border border-ivory-300 dark:border-espresso-700">
            <label className="block text-xs font-semibold uppercase text-espresso-600 dark:text-ivory-300 mb-1">
              Task being rescued
            </label>
            <p className="text-sm font-medium text-espresso-900 dark:text-ivory-100">
              {task?.title || taskTitle || 'Pick up clothes & reset bedroom'}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-espresso-600 dark:text-ivory-300">
              <span>Bite-sized micro-steps:</span>
              <div className="flex items-center gap-1">
                <span>Quick-add:</span>
                {[2, 5, 10, 15].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleAddStep(m)}
                    className="px-2 py-0.5 rounded bg-ivory-200 dark:bg-espresso-700 hover:bg-ivory-300 text-[11px] font-medium"
                  >
                    +{m}m
                  </button>
                ))}
              </div>
            </div>

            {steps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-2.5 bg-cardwhite dark:bg-espresso-900 rounded-xl border border-ivory-300 dark:border-espresso-700 shadow-soft-sm"
              >
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={step.title}
                  onChange={e => handleUpdateStep(idx, e.target.value)}
                  placeholder="What is one tiny action?"
                  className="flex-1 bg-transparent text-sm text-espresso-900 dark:text-ivory-100 focus:outline-none"
                />
                <span className="text-xs px-2 py-0.5 rounded bg-ivory-200 dark:bg-espresso-800 text-espresso-600 dark:text-ivory-300 shrink-0">
                  {step.estimated_minutes} min
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveStep(idx)}
                  className="p-1 text-espresso-400 hover:text-red-500 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-ivory-200 dark:border-espresso-700 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddStep(5)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Step
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveToTask}
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                Save Micro-Steps
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Diagnostic Tab */
        <div className="space-y-4">
          <p className="text-sm text-espresso-700 dark:text-ivory-200">
            Let's gently diagnose what is blocking you right now. No guilt, no self-criticism.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[
              { id: 'too_big', title: 'The task feels too big or vague', subtitle: 'You do not know where it ends' },
              { id: 'unclear_start', title: 'The first action is unclear', subtitle: 'Unsure what exact click/move to make' },
              { id: 'missing_info', title: 'Missing information or reply', subtitle: 'Blocked by someone else or a file' },
              { id: 'low_energy', title: 'Exhausted or executive battery at zero', subtitle: 'Need a rest or a restart' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setStuckReason(item.id);
                  generateRescueSuggestions(item.id);
                }}
                className="text-left p-3 rounded-xl border border-ivory-300 dark:border-espresso-700 bg-cardwhite dark:bg-espresso-900 hover:border-primary transition-all shadow-soft-sm group"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-espresso-900 dark:text-ivory-100 group-hover:text-primary">
                    {item.title}
                  </h4>
                  <ArrowRight className="w-3.5 h-3.5 text-espresso-400 group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="text-[11px] text-espresso-500 dark:text-ivory-400 mt-0.5">{item.subtitle}</p>
              </button>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-sage-light/60 dark:bg-espresso-900/60 border border-sage/40 text-xs text-espresso-700 dark:text-ivory-200 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-sage-dark shrink-0 mt-0.5" />
            <p>
              Remember: Starting for just 120 seconds lowers friction by up to 80%. Even if you stop immediately after 2 minutes, you broke the inertia spell!
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
};

