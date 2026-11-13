import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import { calculateGoalProgress, Goal, GoalMilestone } from '@/types';
import { DataProvider, useData } from '@/contexts/DataContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { GoalsPage } from '@/pages/GoalsPage';
import { GoalDetailModal } from '@/components/features/GoalDetailModal';
import { syncEngine } from '@/lib/syncEngine';
import { db } from '@/lib/indexedDB';

describe('Goal Milestones & Interactive Progress Tracking', () => {
  describe('Progress Calculation Logic (calculateGoalProgress)', () => {
    it('handles undefined or empty milestones gracefully without dividing by zero', () => {
      expect(calculateGoalProgress(undefined)).toBe(0);
      expect(calculateGoalProgress([])).toBe(0);
    });

    it('calculates 0% when no milestones are completed', () => {
      const milestones: GoalMilestone[] = [
        { id: 'm1', goal_id: 'g1', user_id: 'u1', title: 'Step 1', is_completed: false, sort_order: 0 },
        { id: 'm2', goal_id: 'g1', user_id: 'u1', title: 'Step 2', is_completed: false, sort_order: 1 },
      ];
      expect(calculateGoalProgress(milestones)).toBe(0);
    });

    it('calculates exact percentage based on completed divided by total milestones', () => {
      const milestones: GoalMilestone[] = [
        { id: 'm1', goal_id: 'g1', user_id: 'u1', title: 'Step 1', is_completed: true, sort_order: 0 },
        { id: 'm2', goal_id: 'g1', user_id: 'u1', title: 'Step 2', is_completed: false, sort_order: 1 },
      ];
      expect(calculateGoalProgress(milestones)).toBe(50);

      // 1 of 3 -> 33%
      milestones.push({ id: 'm3', goal_id: 'g1', user_id: 'u1', title: 'Step 3', is_completed: false, sort_order: 2 });
      expect(calculateGoalProgress(milestones)).toBe(33);

      // 2 of 3 -> 67%
      milestones[1].is_completed = true;
      expect(calculateGoalProgress(milestones)).toBe(67);

      // 3 of 3 -> 100%
      milestones[2].is_completed = true;
      expect(calculateGoalProgress(milestones)).toBe(100);
    });

    it('recalculates progress immediately when a milestone is removed', () => {
      const milestones: GoalMilestone[] = [
        { id: 'm1', goal_id: 'g1', user_id: 'u1', title: 'Step 1', is_completed: true, sort_order: 0 },
        { id: 'm2', goal_id: 'g1', user_id: 'u1', title: 'Step 2', is_completed: false, sort_order: 1 },
      ];
      expect(calculateGoalProgress(milestones)).toBe(50);

      // Remove uncompleted milestone -> 1 of 1 is now 100%
      const remaining = milestones.filter(m => m.id !== 'm2');
      expect(calculateGoalProgress(remaining)).toBe(100);
    });
  });

  describe('DataContext Goal Milestone Operations & Supabase Sync', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('dispatches mutations to goals and goal_milestones when adding, toggling, and deleting milestones', async () => {
      const dispatchSpy = vi.spyOn(syncEngine, 'dispatchMutation').mockResolvedValue(undefined as any);

      let currentData: any;
      const TestConsumer = () => {
        currentData = useData();
        return <div data-testid="goals-count">{currentData.goals.length}</div>;
      };

      render(
        <AuthProvider>
          <DataProvider>
            <TestConsumer />
          </DataProvider>
        </AuthProvider>
      );

      await screen.findByTestId('goals-count');

      // 1. Add a Goal
      await act(async () => {
        await currentData.addGoal({
          title: 'Launch Life Reset',
          description: 'Complete all launch requirements',
          category: 'career',
          next_action: 'Outline steps',
          status: 'in_progress',
        });
      });

      await waitFor(() => {
        const g = currentData.goals.find((item: Goal) => item.title === 'Launch Life Reset');
        expect(g).toBeDefined();
        expect(g.progress).toBe(0);
        expect(g.milestones).toEqual([]);
      });

      const initialGoal = currentData.goals.find((g: Goal) => g.title === 'Launch Life Reset');

      // Verify goals UPSERT was dispatched
      expect(dispatchSpy).toHaveBeenCalledWith('goals', 'UPSERT', expect.objectContaining({
        title: 'Launch Life Reset',
        progress: 0,
      }), expect.anything());

      dispatchSpy.mockClear();

      // 2. Add Milestones
      await act(async () => {
        await currentData.addGoalMilestone(initialGoal.id, 'Prepare Landing Page');
        await currentData.addGoalMilestone(initialGoal.id, 'Configure Gumroad Integration');
      });

      await waitFor(() => {
        const g = currentData.goals.find((item: Goal) => item.id === initialGoal.id);
        expect(g.milestones).toHaveLength(2);
      });

      const goalWithMilestones = currentData.goals.find((g: Goal) => g.id === initialGoal.id);
      expect(goalWithMilestones.progress).toBe(0);

      // Verify goal_milestones UPSERT was dispatched
      expect(dispatchSpy).toHaveBeenCalledWith('goal_milestones', 'UPSERT', expect.objectContaining({
        title: 'Configure Gumroad Integration',
        is_completed: false,
      }), expect.anything());

      // 3. Toggle First Milestone
      const m1 = goalWithMilestones.milestones[0];
      await act(async () => {
        await currentData.toggleGoalMilestone(initialGoal.id, m1.id);
      });

      await waitFor(() => {
        const g = currentData.goals.find((item: Goal) => item.id === initialGoal.id);
        expect(g.milestones[0].is_completed).toBe(true);
        expect(g.progress).toBe(50); // 1 of 2 = 50%
      });

      // Verify goals was updated with 50% and goal_milestones with is_completed: true
      expect(dispatchSpy).toHaveBeenCalledWith('goals', 'UPSERT', expect.objectContaining({
        id: initialGoal.id,
        progress: 50,
      }), expect.anything());

      expect(dispatchSpy).toHaveBeenCalledWith('goal_milestones', 'UPSERT', expect.objectContaining({
        id: m1.id,
        is_completed: true,
      }), expect.anything());

      // 4. Update Next Action
      await act(async () => {
        await currentData.updateGoal(initialGoal.id, {
          next_action: 'Review Gumroad webhook endpoint',
        });
      });

      await waitFor(() => {
        const g = currentData.goals.find((item: Goal) => item.id === initialGoal.id);
        expect(g.next_action).toBe('Review Gumroad webhook endpoint');
      });

      // 5. Delete Milestone
      const m2 = goalWithMilestones.milestones[1];
      await act(async () => {
        await currentData.deleteGoalMilestone(initialGoal.id, m2.id);
      });

      await waitFor(() => {
        const g = currentData.goals.find((item: Goal) => item.id === initialGoal.id);
        expect(g.milestones).toHaveLength(1);
        expect(g.progress).toBe(100); // 1 of 1 remaining = 100%
      });

      expect(dispatchSpy).toHaveBeenCalledWith('goal_milestones', 'DELETE', { id: m2.id }, expect.anything());
    });
  });

  describe('UI Interaction: GoalsPage and GoalDetailModal', () => {
    it('allows opening goal details modal on card click and interacts with milestones', async () => {
      // Seed a goal in mock database
      const testGoal: Goal = {
        id: 'goal-123',
        user_id: 'local_user',
        title: 'Master Digital Planning',
        description: 'Establish consistent routines',
        category: 'personal',
        next_action: 'Review morning habit loop',
        status: 'in_progress',
        progress: 0,
        created_at: new Date().toISOString(),
        milestones: [
          { id: 'm-1', goal_id: 'goal-123', user_id: 'local_user', title: 'Complete first daily review', is_completed: false, sort_order: 0 },
        ],
      };
      await db.set('goals', [testGoal]);

      render(
        <AuthProvider>
          <DataProvider>
            <GoalsPage />
          </DataProvider>
        </AuthProvider>
      );

      // Verify goal card renders
      const goalHeading = await screen.findByText('Master Digital Planning');
      expect(goalHeading).toBeInTheDocument();

      // Click the goal card to open Goal Details Modal
      const card = goalHeading.closest('[role="button"]') || goalHeading.parentElement!;
      fireEvent.click(card);

      // Modal dialog should now be open
      const dialog = await screen.findByRole('dialog');
      expect(dialog).toBeInTheDocument();

      const dialogScope = within(dialog);
      expect(dialogScope.getByText('Complete first daily review')).toBeInTheDocument();
      expect(dialogScope.getByText('0%')).toBeInTheDocument();

      // Check the milestone inside the modal
      const checkbox = dialogScope.getByRole('button', { name: /Mark milestone "Complete first daily review" complete/i });
      fireEvent.click(checkbox);

      // Progress immediately advances to 100% inside modal
      await waitFor(() => {
        expect(dialogScope.getByText('100%')).toBeInTheDocument();
      });

      // Verify immediate next step box is visible and editable
      expect(dialogScope.getByText('Review morning habit loop')).toBeInTheDocument();
      const changeNextStepBtn = dialogScope.getByText('Change');
      fireEvent.click(changeNextStepBtn);

      const nextStepInput = dialogScope.getByPlaceholderText('What small action can you take next?');
      fireEvent.change(nextStepInput, { target: { value: 'Write evening reflection' } });
      const saveNextStepBtn = dialogScope.getByRole('button', { name: 'Save' });
      fireEvent.click(saveNextStepBtn);

      await waitFor(() => {
        expect(dialogScope.getByText('Write evening reflection')).toBeInTheDocument();
      });

      // Close modal
      const closeBtn = dialogScope.getByRole('button', { name: 'Close goal details' });
      fireEvent.click(closeBtn);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('preserves typed milestone draft text when goal updates or re-renders in the background (no disappearing text)', async () => {
      const initialGoal: Goal = {
        id: 'goal-stability-test',
        user_id: 'local_user',
        title: 'Draft Stability Goal',
        description: 'Test text retention during re-renders',
        category: 'creative',
        status: 'in_progress',
        progress: 0,
        created_at: new Date().toISOString(),
        milestones: [],
      };

      const { rerender } = render(
        <AuthProvider>
          <DataProvider>
            <GoalDetailModal
              goal={initialGoal}
              isOpen={true}
              onClose={() => {}}
            />
          </DataProvider>
        </AuthProvider>
      );

      const dialog = screen.getByRole('dialog');
      const dialogScope = within(dialog);

      // Click Add Milestone
      const addMilestoneBtn = dialogScope.getByRole('button', { name: 'Add Milestone' });
      fireEvent.click(addMilestoneBtn);

      // Type draft milestone text
      const input = dialogScope.getByPlaceholderText('e.g. Complete module 1 or draft initial outline');
      fireEvent.change(input, { target: { value: 'Write 500 words for introduction chapter' } });
      expect((input as HTMLInputElement).value).toBe('Write 500 words for introduction chapter');

      // Simulate a background sync / periodic poll update that provides a new goal object reference!
      const updatedGoalReference: Goal = {
        ...initialGoal,
        updated_at: new Date().toISOString(),
      };

      act(() => {
        rerender(
          <AuthProvider>
            <DataProvider>
              <GoalDetailModal
                goal={updatedGoalReference}
                isOpen={true}
                onClose={() => {}}
              />
            </DataProvider>
          </AuthProvider>
        );
      });

      // CRITICAL ASSERTION: The typed text MUST NOT disappear when the goal reference updates!
      const inputAfterPoll = dialogScope.getByPlaceholderText('e.g. Complete module 1 or draft initial outline');
      expect((inputAfterPoll as HTMLInputElement).value).toBe('Write 500 words for introduction chapter');
    });

    it('preserves typed milestone text when saving fails and allows retrying', async () => {
      const testGoal: Goal = {
        id: 'goal-failed-save-test',
        user_id: 'local_user',
        title: 'Error Handling Goal',
        category: 'learning',
        status: 'in_progress',
        progress: 0,
        created_at: new Date().toISOString(),
        milestones: [],
      };

      // Mock dispatchMutation to simulate a failure
      vi.spyOn(syncEngine, 'dispatchMutation').mockRejectedValueOnce(new Error('Simulated network timeout'));

      render(
        <AuthProvider>
          <DataProvider>
            <GoalDetailModal
              goal={testGoal}
              isOpen={true}
              onClose={() => {}}
            />
          </DataProvider>
        </AuthProvider>
      );

      const dialog = screen.getByRole('dialog');
      const dialogScope = within(dialog);

      // Open add form
      const addBtn = dialogScope.getByRole('button', { name: 'Add Milestone' });
      fireEvent.click(addBtn);

      const input = dialogScope.getByPlaceholderText('e.g. Complete module 1 or draft initial outline');
      fireEvent.change(input, { target: { value: 'Important milestone to retry' } });

      // Click submit
      const submitBtn = dialogScope.getByRole('button', { name: 'Add Milestone' });
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      // The text must remain in the input even after save fails
      expect((input as HTMLInputElement).value).toBe('Important milestone to retry');
    });

    it('persists milestones and calculated progress across page refresh via IndexedDB', async () => {
      const goalWithSavedMilestones: Goal = {
        id: 'goal-persist-refresh',
        user_id: 'local_user',
        title: 'Goal Preserved On Refresh',
        category: 'finance',
        status: 'in_progress',
        progress: 100,
        created_at: new Date().toISOString(),
        milestones: [
          { id: 'm-p1', goal_id: 'goal-persist-refresh', user_id: 'local_user', title: 'Open High-Yield Savings Account', is_completed: true, sort_order: 0 },
        ],
      };

      // Save directly to IndexedDB
      await db.set('goals', [goalWithSavedMilestones]);

      // Render fresh component simulating a new page load
      render(
        <AuthProvider>
          <DataProvider>
            <GoalsPage />
          </DataProvider>
        </AuthProvider>
      );

      // Verify goal title and 100% progress are restored from storage
      expect(await screen.findByText('Goal Preserved On Refresh')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('Open High-Yield Savings Account')).toBeInTheDocument();
    });

    it('safely queues milestone mutations for offline usage', async () => {
      const offlineUserId = '44444444-4444-4444-8444-444444444444';
      syncEngine.setUserId(offlineUserId);
      syncEngine.handleNetworkChange(false);

      await syncEngine.dispatchMutation(
        'goal_milestones',
        'UPSERT',
        {
          id: 'm-offline-1',
          goal_id: 'goal-offline-test',
          title: 'Walk 20 minutes daily',
          is_completed: false,
          sort_order: 0,
        },
        offlineUserId
      );

      // Verify the queue in IndexedDB has the queued mutation
      const queue = await db.getQueue();
      const milestoneMutation = queue.find(
        q => q.table === 'goal_milestones' && q.payload.title === 'Walk 20 minutes daily'
      );

      expect(milestoneMutation).toBeDefined();
      expect(milestoneMutation?.operation).toBe('UPSERT');

      // Restore online status & clean up
      syncEngine.handleNetworkChange(true);
      syncEngine.setUserId(null);
    });
  });
});
