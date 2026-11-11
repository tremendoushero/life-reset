import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { AlertTriangle, RefreshCw, LogOut, CheckCircle2, ShieldAlert, Info } from 'lucide-react';
import { syncEngine } from '@/lib/syncEngine';

interface SignOutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSignOut: () => Promise<void> | void;
  pendingCount: number;
  userEmail?: string;
  userId?: string;
}

export const SignOutConfirmModal: React.FC<SignOutConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirmSignOut,
  pendingCount,
  userEmail,
  userId,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);
  const [currentPending, setCurrentPending] = useState(pendingCount);
  const [criticalPending, setCriticalPending] = useState(pendingCount);
  const [optionalPending, setOptionalPending] = useState(0);
  const [optionalTables, setOptionalTables] = useState<string[]>([]);
  const [criticalTables, setCriticalTables] = useState<string[]>([]);

  // Update pending breakdown when opened or pending count changes
  useEffect(() => {
    if (isOpen) {
      syncEngine.getPendingBreakdown().then((b) => {
        setCurrentPending(b.total);
        setCriticalPending(b.critical);
        setOptionalPending(b.optional);
        setCriticalTables(b.criticalTables);
        setOptionalTables(b.optionalTables);
      });
    }
  }, [isOpen, pendingCount]);

  // Sync right inside the warning dialog
  const handleSyncNow = async () => {
    if (!userId) return;
    setIsSyncing(true);
    setSyncStatus(null);

    try {
      const res = await syncEngine.flushAndPull(userId);
      const breakdown = await syncEngine.getPendingBreakdown();
      setCurrentPending(breakdown.total);
      setCriticalPending(breakdown.critical);
      setOptionalPending(breakdown.optional);
      setCriticalTables(breakdown.criticalTables);
      setOptionalTables(breakdown.optionalTables);

      if (res.criticalSuccess) {
        if (breakdown.optional === 0) {
          setSyncStatus({
            type: 'success',
            message: `All changes successfully uploaded! (${res.flushedCount} synced). It is now safe to sign out.`,
          });
        } else {
          setSyncStatus({
            type: 'warning',
            message: `All critical tasks, habits, and goals uploaded (${res.flushedCount} synced). Note: ${breakdown.optional} optional item (${breakdown.optionalTables.join(', ')}) is safely preserved in local storage and will sync when table permissions are updated in Supabase. It is now safe to sign out.`,
          });
        }
      } else {
        const errorDetail = res.criticalError || res.error || 'Network error';
        setSyncStatus({
          type: 'error',
          message: `Could not upload ${breakdown.critical} critical change(s) (${breakdown.criticalTables.join(', ')}). Error: ${errorDetail}. Please keep signed in until connected.`,
        });
      }
    } catch (err: any) {
      setSyncStatus({
        type: 'error',
        message: err?.message || 'Sync attempt failed.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleProceedSignOut = async () => {
    await onConfirmSignOut();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Unsaved Changes Waiting to Sync"
      maxWidth="md"
    >
      <div className="space-y-4 pt-2">
        {/* Warning banner */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-sm text-amber-800 dark:text-amber-300">
                {criticalPending > 0
                  ? `You have ${criticalPending} unsaved critical change${criticalPending === 1 ? '' : 's'}${optionalPending > 0 ? ` and ${optionalPending} optional item${optionalPending === 1 ? '' : 's'}` : ''}`
                  : optionalPending > 0
                  ? `All critical tasks are synced. ${optionalPending} optional item is waiting on database permissions`
                  : 'All changes are synchronized'}
              </p>
              <p className="text-amber-700 dark:text-amber-300/90 leading-relaxed">
                {criticalPending > 0
                  ? `These critical changes (${criticalTables.join(', ') || 'tasks/planner items'}) were made while offline or waiting to sync. They have not yet uploaded to your cloud account${userEmail ? ` (${userEmail})` : ''}.`
                  : optionalPending > 0
                  ? `Your tasks, habits, and goals are synced in the cloud. Only secondary items (${optionalTables.join(', ')}) remain stored safely on this device.`
                  : 'Your cloud account is completely up to date.'}
              </p>
            </div>
          </div>
        </div>

        {/* Account isolation & safety guarantee */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-sage-light/40 dark:bg-espresso-700/60 border border-sage/30 text-xs text-espresso-700 dark:text-ivory-200">
          <ShieldAlert className="w-4 h-4 text-sage-dark dark:text-sage shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Your data will NOT be deleted:</strong> If you sign out now, your unsynced changes will be safely archived on this device for your account only. Another account signing in will not see or upload your data. Your changes will automatically resume syncing when you sign back into this account.
          </p>
        </div>

        {/* Sync feedback */}
        {syncStatus && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              syncStatus.type === 'success'
                ? 'bg-sage-light text-sage-dark border border-sage/40'
                : syncStatus.type === 'warning'
                ? 'bg-amber-500/10 text-amber-800 dark:text-amber-200 border border-amber-500/30'
                : 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/30'
            }`}
          >
            {syncStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-sage-dark" />
            ) : syncStatus.type === 'warning' ? (
              <Info className="w-4 h-4 shrink-0 text-amber-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            )}
            <p className="leading-relaxed">{syncStatus.message}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="pt-2 flex flex-col gap-2">
          {/* If critical tasks are already synced, show a primary Proceed button */}
          {criticalPending === 0 && (
            <Button
              variant="primary"
              onClick={handleProceedSignOut}
              icon={<LogOut className="w-4 h-4" />}
              className="w-full justify-center"
            >
              Proceed to Sign Out (Critical Data Synced)
            </Button>
          )}

          {/* Option 1: Cancel and stay signed in */}
          <Button
            variant={criticalPending > 0 ? 'primary' : 'outline'}
            onClick={onClose}
            className="w-full justify-center"
          >
            {criticalPending > 0 ? 'Cancel & Keep Signed In (Recommended)' : 'Close'}
          </Button>

          {/* Option 2: Attempt sync now if anything is pending */}
          {currentPending > 0 && (
            <Button
              variant="outline"
              onClick={handleSyncNow}
              disabled={isSyncing}
              icon={<RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />}
              className="w-full justify-center"
            >
              {isSyncing ? 'Syncing with Supabase...' : 'Sync Now Before Signing Out'}
            </Button>
          )}

          {/* Option 3: Sign out anyway (safe archive) only if critical items still pending */}
          {criticalPending > 0 && (
            <Button
              variant="danger"
              onClick={handleProceedSignOut}
              icon={<LogOut className="w-4 h-4" />}
              className="w-full justify-center text-xs"
            >
              Sign Out Anyway (Preserve Data on Device)
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

