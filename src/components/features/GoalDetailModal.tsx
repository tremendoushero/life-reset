import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { useData } from '@/contexts/DataContext';
import { Goal, GoalMilestone } from '@/types';
import {
  Check,
  CheckCircle2,
  Trash2,
  Edit2,
  Plus,
  Calendar,
  Sparkles,
  ArrowRight,
  Target,
  AlertCircle,
  X,
  Smile,
} from 'lucide-react';

interface GoalDetailModalProps {
  goal: Goal | null;
  isOpen: boolean;
  onClose: () => void;
}

export const GoalDetailModal: React.FC<GoalDetailModalProps> = ({
  goal,
  isOpen,
  onClose,
}) => {
  const {
    updateGoal,
    deleteGoal,
    addGoalMilestone,
    toggleGoalMilestone,
    updateGoalMilestone,
    deleteGoalMilestone,
  } = useData();

  // Full goal edit mode state
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('personal');
  const [targetDate, setTargetDate] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [status, setStatus] = useState<Goal['status']>('in_progress');

  // Add new milestone state - kept completely stable while typing
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [isSavingMilestone, setIsSavingMilestone] = useState(false);
  const [milestoneError, setMilestoneError] = useState<string | null>(null);

  // Edit milestone state
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [editMilestoneTitle, setEditMilestoneTitle] = useState('');
  const [editMilestoneDate, setEditMilestoneDate] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Quick edit next step inline
  const [isEditingNextAction, setIsEditingNextAction] = useState(false);
  const [quickNextAction, setQuickNextAction] = useState('');

  // Delete goal confirmation
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Track session and goal ID to prevent background poll re-renders from wiping user drafts
  const prevGoalIdRef = useRef<string | null>(null);
  const prevIsOpenRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isOpen || !goal) {
      if (prevIsOpenRef.current && !isOpen) {
        // Modal just closed: clean up transient draft state
        setNewMilestoneTitle('');
        setNewMilestoneDate('');
        setIsAddingMilestone(false);
        setEditingMilestoneId(null);
        setIsEditingGoal(false);
        setIsEditingNextAction(false);
        setMilestoneError(null);
        setEditError(null);
      }
      prevIsOpenRef.current = isOpen;
      return;
    }

    const isNewModalSession = !prevIsOpenRef.current && isOpen;
    const isDifferentGoal = prevGoalIdRef.current !== goal.id;

    if (isNewModalSession || isDifferentGoal) {
      // Switched to a new goal or freshly opened modal
      prevGoalIdRef.current = goal.id;
      setTitle(goal.title || '');
      setDescription(goal.description || '');
      setCategory(goal.category || 'personal');
      setTargetDate(goal.target_date || '');
      setNextAction(goal.next_action || '');
      setQuickNextAction(goal.next_action || '');
      setStatus(goal.status || 'in_progress');
      setIsEditingGoal(false);
      setIsEditingNextAction(false);
      setEditingMilestoneId(null);
      setConfirmDelete(false);
      setNewMilestoneTitle('');
      setNewMilestoneDate('');
      setIsAddingMilestone(false);
      setMilestoneError(null);
      setEditError(null);
    } else {
      // Same goal while modal stays open:
      // Only sync background updates if user is not actively editing that specific section
      if (!isEditingGoal) {
        setTitle(goal.title || '');
        setDescription(goal.description || '');
        setCategory(goal.category || 'personal');
        setTargetDate(goal.target_date || '');
        setStatus(goal.status || 'in_progress');
        setNextAction(goal.next_action || '');
      }
      if (!isEditingNextAction) {
        setQuickNextAction(goal.next_action || '');
      }
      // CRITICAL FIX: Never wipe newMilestoneTitle, newMilestoneDate, or editingMilestoneId
      // while the user is actively composing or editing in the open modal!
    }

    prevIsOpenRef.current = isOpen;
  }, [isOpen, goal?.id, goal]);

  if (!goal) return null;

  const milestones: GoalMilestone[] = goal.milestones || [];
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter(m => m.is_completed).length;
  const progress = goal.progress ?? 0;

  // Handle saving full goal edits
  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await updateGoal(goal.id, {
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      target_date: targetDate || undefined,
      next_action: nextAction.trim() || undefined,
      status,
    });
    setIsEditingGoal(false);
  };

  // Handle saving quick next action edit
  const handleSaveQuickNextAction = async () => {
    await updateGoal(goal.id, {
      next_action: quickNextAction.trim() || undefined,
    });
    setIsEditingNextAction(false);
  };

  // Handle adding a milestone safely: only clear input after successful save; keep text on error
  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = newMilestoneTitle.trim();
    if (!trimmedTitle) return;

    setIsSavingMilestone(true);
    setMilestoneError(null);
    try {
      await addGoalMilestone(goal.id, trimmedTitle, newMilestoneDate || undefined);
      // Only clear input and hide form once successfully saved
      setNewMilestoneTitle('');
      setNewMilestoneDate('');
      setIsAddingMilestone(false);
    } catch (err: any) {
      console.error('[GoalDetailModal] Failed to add milestone:', err);
      setMilestoneError(err?.message || 'Failed to save milestone. Your text has been preserved so you can retry.');
    } finally {
      setIsSavingMilestone(false);
    }
  };

  // Handle editing milestone safely
  const handleStartEditMilestone = (m: GoalMilestone) => {
    setEditingMilestoneId(m.id);
    setEditMilestoneTitle(m.title);
    setEditMilestoneDate(m.target_date || '');
    setEditError(null);
  };

  const handleSaveMilestoneEdit = async (mId: string) => {
    const trimmed = editMilestoneTitle.trim();
    if (!trimmed) return;

    setIsSavingEdit(true);
    setEditError(null);
    try {
      await updateGoalMilestone(goal.id, mId, {
        title: trimmed,
        target_date: editMilestoneDate || undefined,
      });
      setEditingMilestoneId(null);
    } catch (err: any) {
      console.error('[GoalDetailModal] Failed to update milestone:', err);
      setEditError(err?.message || 'Failed to update milestone. Your changes have been preserved so you can retry.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle setting a milestone as the immediate next action
  const handleSetMilestoneAsNextStep = async (mTitle: string) => {
    await updateGoal(goal.id, {
      next_action: mTitle,
    });
    setQuickNextAction(mTitle);
  };

  // Handle deleting goal
  const handleDeleteGoal = async () => {
    await deleteGoal(goal.id);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditingGoal ? 'Edit Goal Details' : goal.title}
      description={isEditingGoal ? 'Refine your ambition and target dates.' : goal.description || 'Interactive milestone progress & next actions'}
      maxWidth="lg"
      closeAriaLabel="Close goal details"
    >
      <div className="space-y-5 pt-1">
        {/* Full Goal Edit Mode */}
        {isEditingGoal ? (
          <form onSubmit={handleSaveGoal} className="space-y-4">
            <Input
              label="Goal Title *"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Publish my digital product"
              required
              autoFocus
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-espresso-600 dark:text-ivory-300 mb-1.5">
                Why this matters (Description)
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-ivory-300 dark:border-espresso-700 bg-white dark:bg-espresso-900 p-2.5 text-xs text-espresso-900 dark:text-ivory-100"
                placeholder="What will this bring to your life?"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-espresso-600 dark:text-ivory-300 mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-ivory-300 dark:border-espresso-700 bg-white dark:bg-espresso-900 p-2.5 text-xs text-espresso-900 dark:text-ivory-100"
                >
                  <option value="personal">Personal</option>
                  <option value="career">Career / Work</option>
                  <option value="health">Health & Wellness</option>
                  <option value="finance">Finance / Money</option>
                  <option value="creative">Creative & Projects</option>
                  <option value="learning">Learning & Skills</option>
                  <option value="lifestyle">Lifestyle & Home</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-espresso-600 dark:text-ivory-300 mb-1.5">
                  Status
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as Goal['status'])}
                  className="w-full rounded-xl border border-ivory-300 dark:border-espresso-700 bg-white dark:bg-espresso-900 p-2.5 text-xs text-espresso-900 dark:text-ivory-100"
                >
                  <option value="in_progress">In Progress</option>
                  <option value="not_started">Not Started</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                type="date"
                label="Target Date (Optional)"
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
              />

              <Input
                label="Immediate Next Action"
                value={nextAction}
                onChange={e => setNextAction(e.target.value)}
                placeholder="e.g. Schedule brainstorm session"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-ivory-200 dark:border-espresso-700">
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => setConfirmDelete(true)}
              >
                Delete Goal
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingGoal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Save Changes
                </Button>
              </div>
            </div>

            {/* Confirm Delete Sub-prompt */}
            {confirmDelete && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-center justify-between gap-3 text-xs text-red-800 dark:text-red-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Are you sure you want to delete this goal and its milestones?</span>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDelete(false)}
                  >
                    Keep Goal
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={handleDeleteGoal}
                  >
                    Confirm Delete
                  </Button>
                </div>
              </div>
            )}
          </form>
        ) : (
          <>
            {/* Header Meta & Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-softpeach-light text-softpeach-dark border border-softpeach/40">
                  {goal.category}
                </span>
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                    goal.status === 'completed'
                      ? 'bg-sage-light text-sage-dark'
                      : goal.status === 'paused'
                      ? 'bg-ivory-200 text-espresso-600'
                      : 'bg-primary/10 text-primary'
                  }`}
                >
                  {goal.status === 'completed'
                    ? 'Completed'
                    : goal.status === 'paused'
                    ? 'Paused'
                    : goal.status === 'not_started'
                    ? 'Not Started'
                    : 'In Progress'}
                </span>
                {goal.target_date && (
                  <span className="text-xs text-espresso-500 dark:text-ivory-300 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Target: {goal.target_date}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingGoal(true)}
                  icon={<Edit2 className="w-3.5 h-3.5" />}
                >
                  Edit Goal
                </Button>
              </div>
            </div>

            {/* Progress Card Section */}
            <div className="p-4 sm:p-5 rounded-2xl bg-cardwhite dark:bg-espresso-800 border border-ivory-300 dark:border-espresso-700 shadow-soft-sm space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary shrink-0" />
                  <span className="font-serif font-bold text-base text-espresso-900 dark:text-ivory-50">
                    Goal Progress
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-serif text-xl sm:text-2xl font-bold text-primary">
                    {progress}%
                  </span>
                  <span className="text-xs text-espresso-500 dark:text-ivory-400 block -mt-0.5">
                    {totalMilestones === 0
                      ? '0 milestones'
                      : `${completedMilestones} of ${totalMilestones} completed`}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div
                className="w-full h-3 bg-ivory-200 dark:bg-espresso-700 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Goal milestone completion percentage"
              >
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Status Message or Celebration */}
              {totalMilestones === 0 ? (
                <div className="flex items-center gap-2 text-xs text-espresso-600 dark:text-ivory-300 pt-1">
                  <AlertCircle className="w-4 h-4 text-primary shrink-0" />
                  <span>
                    No milestones added yet. Break this goal into smaller milestones below to track your progress.
                  </span>
                </div>
              ) : progress === 100 ? (
                <div className="p-2.5 rounded-xl bg-sage-light/60 dark:bg-sage-dark/30 border border-sage/40 text-xs text-sage-dark dark:text-sage flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 text-sage-dark dark:text-sage" />
                  <span className="font-semibold">
                    All milestones completed! Phenomenal accomplishment!
                  </span>
                </div>
              ) : (
                <p className="text-[11px] text-espresso-500 dark:text-ivory-400">
                  Check off milestones as you achieve them to immediately advance your progress bar.
                </p>
              )}
            </div>

            {/* Immediate Next Step Box */}
            <div className="p-4 rounded-2xl bg-ivory-100 dark:bg-espresso-900/60 border border-ivory-300 dark:border-espresso-700 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5" />
                  Immediate Next Step
                </span>
                {!isEditingNextAction ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQuickNextAction(goal.next_action || '');
                      setIsEditingNextAction(true);
                    }}
                    className="text-[11px] font-medium text-espresso-500 hover:text-primary dark:text-ivory-300 transition-colors cursor-pointer"
                  >
                    {goal.next_action ? 'Change' : '+ Set Next Step'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingNextAction(false)}
                    className="text-[11px] text-espresso-400 hover:text-espresso-700 dark:hover:text-ivory-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {isEditingNextAction ? (
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={quickNextAction}
                    onChange={e => setQuickNextAction(e.target.value)}
                    placeholder="What small action can you take next?"
                    className="flex-1 text-xs p-2 rounded-xl border border-ivory-300 dark:border-espresso-700 bg-white dark:bg-espresso-800 text-espresso-900 dark:text-ivory-100"
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveQuickNextAction();
                      }
                    }}
                  />
                  <Button size="sm" variant="primary" onClick={handleSaveQuickNextAction}>
                    Save
                  </Button>
                </div>
              ) : (
                <p className="text-xs sm:text-sm font-medium text-espresso-800 dark:text-ivory-100 leading-snug">
                  {goal.next_action || (
                    <span className="text-espresso-400 dark:text-ivory-400 italic">
                      None set yet. Pick an easy next action to maintain momentum.
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Milestones Management Section */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-serif font-bold text-base text-espresso-900 dark:text-ivory-50">
                    Milestones ({milestones.length})
                  </h4>
                </div>

                {!isAddingMilestone && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAddingMilestone(true)}
                    icon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Add Milestone
                  </Button>
                )}
              </div>

              {/* Add Milestone Inline Form */}
              {isAddingMilestone && (
                <form
                  onSubmit={handleAddMilestone}
                  className="p-3.5 rounded-2xl bg-ivory-100/80 dark:bg-espresso-800 border border-primary/30 space-y-3 animate-fade-in"
                >
                  <span className="text-xs font-semibold text-espresso-800 dark:text-ivory-100 block">
                    New Milestone
                  </span>

                  {milestoneError && (
                    <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                      <span>{milestoneError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Complete module 1 or draft initial outline"
                      value={newMilestoneTitle}
                      onChange={e => {
                        setNewMilestoneTitle(e.target.value);
                        if (milestoneError) setMilestoneError(null);
                      }}
                      disabled={isSavingMilestone}
                      className="sm:col-span-2 text-xs p-2.5 rounded-xl border border-ivory-300 dark:border-espresso-700 bg-white dark:bg-espresso-900 text-espresso-900 dark:text-ivory-100 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
                      autoFocus
                    />
                    <input
                      type="date"
                      value={newMilestoneDate}
                      onChange={e => setNewMilestoneDate(e.target.value)}
                      disabled={isSavingMilestone}
                      className="text-xs p-2.5 rounded-xl border border-ivory-300 dark:border-espresso-700 bg-white dark:bg-espresso-900 text-espresso-900 dark:text-ivory-100 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
                      title="Optional target date"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isSavingMilestone}
                      onClick={() => {
                        setIsAddingMilestone(false);
                        setMilestoneError(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={isSavingMilestone || !newMilestoneTitle.trim()}
                    >
                      {isSavingMilestone ? 'Adding...' : 'Add Milestone'}
                    </Button>
                  </div>
                </form>
              )}

              {/* Milestones List */}
              {milestones.length === 0 ? (
                <div className="p-6 text-center rounded-2xl border border-dashed border-ivory-300 dark:border-espresso-700 bg-ivory-50/50 dark:bg-espresso-800/40 space-y-2">
                  <p className="text-xs text-espresso-600 dark:text-ivory-300">
                    No milestones yet. Break big ambitions into small, doable stepping stones.
                  </p>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      setIsAddingMilestone(true);
                      setMilestoneError(null);
                    }}
                    icon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Add Your First Milestone
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {milestones.map((m) => (
                    <div
                      key={m.id}
                      className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                        m.is_completed
                          ? 'bg-ivory-100/50 dark:bg-espresso-900/30 border-ivory-200 dark:border-espresso-800/80 opacity-80'
                          : 'bg-cardwhite dark:bg-espresso-800 border-ivory-300 dark:border-espresso-700 shadow-2xs'
                      }`}
                    >
                      {editingMilestoneId === m.id ? (
                        <div className="flex-1 flex flex-col gap-2">
                          {editError && (
                            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-[11px] text-red-700 dark:text-red-300 flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                              <span>{editError}</span>
                            </div>
                          )}
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <input
                              type="text"
                              value={editMilestoneTitle}
                              onChange={e => {
                                setEditMilestoneTitle(e.target.value);
                                if (editError) setEditError(null);
                              }}
                              disabled={isSavingEdit}
                              className="flex-1 text-xs p-2 rounded-lg border border-primary bg-white dark:bg-espresso-900 text-espresso-900 dark:text-ivory-100 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
                              autoFocus
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveMilestoneEdit(m.id);
                                }
                              }}
                            />
                            <input
                              type="date"
                              value={editMilestoneDate}
                              onChange={e => setEditMilestoneDate(e.target.value)}
                              disabled={isSavingEdit}
                              className="text-xs p-2 rounded-lg border border-ivory-300 dark:border-espresso-700 bg-white dark:bg-espresso-900 text-espresso-900 dark:text-ivory-100 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
                            />
                            <div className="flex items-center gap-1 justify-end">
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={isSavingEdit}
                                onClick={() => {
                                  setEditingMilestoneId(null);
                                  setEditError(null);
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                variant="primary"
                                disabled={isSavingEdit || !editMilestoneTitle.trim()}
                                onClick={() => handleSaveMilestoneEdit(m.id)}
                              >
                                {isSavingEdit ? 'Saving...' : 'Save'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {/* Checkbox: min 44x44px touch target */}
                            <button
                              type="button"
                              onClick={() => toggleGoalMilestone(goal.id, m.id)}
                              className={`shrink-0 min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-xl cursor-pointer transition-all touch-manipulation active:scale-95 ${
                                m.is_completed
                                  ? 'bg-sage text-white shadow-2xs hover:bg-sage-dark'
                                  : 'bg-ivory-100 dark:bg-espresso-700/60 border border-ivory-300 dark:border-espresso-600 text-transparent hover:border-primary/60 hover:text-espresso-400'
                              }`}
                              aria-label={
                                m.is_completed
                                  ? `Mark milestone "${m.title}" incomplete`
                                  : `Mark milestone "${m.title}" complete`
                              }
                            >
                              <Check
                                className={`w-5 h-5 stroke-[2.5] transition-opacity ${
                                  m.is_completed ? 'opacity-100' : 'opacity-0'
                                }`}
                              />
                            </button>

                            <div className="flex-1 min-w-0 pt-2.5">
                              <p
                                className={`text-xs sm:text-sm font-medium leading-snug break-words ${
                                  m.is_completed
                                    ? 'line-through text-espresso-400 dark:text-ivory-400'
                                    : 'text-espresso-900 dark:text-ivory-100'
                                }`}
                              >
                                {m.title}
                              </p>
                              {m.target_date && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-espresso-500 dark:text-ivory-400 mt-1">
                                  <Calendar className="w-3 h-3" />
                                  Target: {m.target_date}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Milestone Actions */}
                          <div className="flex items-center gap-1 justify-end shrink-0 pl-11 sm:pl-0 pt-1 sm:pt-0">
                            {!m.is_completed && goal.next_action !== m.title && (
                              <button
                                type="button"
                                onClick={() => handleSetMilestoneAsNextStep(m.title)}
                                className="text-[11px] font-medium text-espresso-500 hover:text-primary dark:text-ivory-300 px-2 py-1 rounded-md hover:bg-ivory-200 dark:hover:bg-espresso-700 transition cursor-pointer"
                                title="Set this milestone as immediate next action"
                              >
                                Set as Next Step
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleStartEditMilestone(m)}
                              className="min-w-[36px] min-h-[36px] p-2 rounded-lg text-espresso-400 hover:text-espresso-700 dark:hover:text-ivory-200 hover:bg-ivory-200/80 dark:hover:bg-espresso-700 transition cursor-pointer flex items-center justify-center"
                              title="Edit milestone"
                              aria-label={`Edit milestone "${m.title}"`}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => deleteGoalMilestone(goal.id, m.id)}
                              className="min-w-[36px] min-h-[36px] p-2 rounded-lg text-espresso-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer flex items-center justify-center"
                              title="Delete milestone"
                              aria-label={`Delete milestone "${m.title}"`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-ivory-200 dark:border-espresso-700">
              <Button variant="primary" size="sm" onClick={onClose}>
                Done
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
