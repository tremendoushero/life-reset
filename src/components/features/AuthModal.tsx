import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Cloud, Check, AlertCircle, ShieldCheck, Wifi, Sparkles, X } from 'lucide-react';
import { SignOutConfirmModal } from './SignOutConfirmModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'signup',
}) => {
  const { signIn, signUp, resetPassword, isAuthenticated, user, signOut } = useAuth();
  const { triggerSync, syncState, dismissSyncError } = useData();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [manualSyncMessage, setManualSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!email.trim() || !password) {
          setErrorMessage('Please enter both email and password.');
          setLoading(false);
          return;
        }

        const res = await signUp(email.trim(), password, displayName.trim() || undefined);
        if (res.error) {
          setErrorMessage(res.error);
        } else {
          setSuccessMessage('Account created and planner synced! Your local items are preserved.');
          const syncRes = await triggerSync();
          if (!syncRes.success && syncRes.error) {
            setErrorMessage(syncRes.error);
          } else {
            setTimeout(() => {
              onClose();
              setSuccessMessage(null);
            }, 1500);
          }
        }
      } else if (mode === 'signin') {
        if (!email.trim() || !password) {
          setErrorMessage('Please enter both email and password.');
          setLoading(false);
          return;
        }

        const res = await signIn(email.trim(), password);
        if (res.error) {
          setErrorMessage(res.error);
        } else {
          setSuccessMessage('Signed in successfully! Your planner is now synced.');
          const syncRes = await triggerSync();
          if (!syncRes.success && syncRes.error) {
            setErrorMessage(syncRes.error);
          } else {
            setTimeout(() => {
              onClose();
              setSuccessMessage(null);
            }, 1500);
          }
        }
      } else if (mode === 'forgot') {
        if (!email.trim()) {
          setErrorMessage('Please enter your email address.');
          setLoading(false);
          return;
        }

        const res = await resetPassword(email.trim());
        if (res.error) {
          setErrorMessage(res.error);
        } else {
          setSuccessMessage('Password reset instructions sent to your email.');
          setTimeout(() => setMode('signin'), 2500);
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated && user.id !== 'local_user') {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Your Cloud Account"
        description="Your planner is connected and syncing."
        closeAriaLabel="Close sign in window"
      >
        <div className="space-y-4 pt-1">
          <div className="p-4 rounded-2xl bg-sage-light/70 dark:bg-espresso-800 border border-sage/40 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-sage-dark shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-espresso-900 dark:text-ivory-100">
                Connected as {user.display_name}
              </p>
              <p className="text-espresso-600 dark:text-ivory-300">
                {user.email || 'Cloud Account Active'}
              </p>
              <p className="text-[11px] text-sage-dark dark:text-sage font-medium pt-1">
                ✓ Offline ready — changes you make while offline sync automatically when reconnected.
              </p>
            </div>
          </div>

          {syncState.errorMessage && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1.5 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Cloud Database Notice</span>
                </div>
                <button
                  type="button"
                  onClick={dismissSyncError}
                  className="p-1 rounded-md text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100 hover:bg-amber-200/50 dark:hover:bg-amber-900/50 transition"
                  title="Dismiss notice"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] leading-relaxed pr-6">{syncState.errorMessage}</p>
            </div>
          )}

          {manualSyncMessage && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                manualSyncMessage.type === 'success'
                  ? 'bg-sage-light dark:bg-sage-dark/30 border-sage/40 text-sage-dark dark:text-sage'
                  : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
              }`}
            >
              <div className="flex items-center gap-2 flex-1">
                {manualSyncMessage.type === 'success' ? (
                  <Check className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{manualSyncMessage.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setManualSyncMessage(null)}
                className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition shrink-0"
                title="Dismiss message"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                setManualSyncMessage(null);
                const syncRes = await triggerSync();
                if (syncRes.success) {
                  setManualSyncMessage({
                    type: 'success',
                    text: `Synced! Uploaded ${syncRes.flushedCount} changes, refreshed ${syncRes.pulledCount} cloud items.`,
                  });
                  setTimeout(() => setManualSyncMessage(null), 5000);
                } else {
                  // Errors persist until dismissed by user
                  setManualSyncMessage({
                    type: 'error',
                    text: syncRes.error || 'Failed to sync with Supabase.',
                  });
                }
              }}
            >
              Sync Now
            </Button>

            <Button
              variant="danger"
              size="sm"
              onClick={async () => {
                if (syncState.pendingCount > 0) {
                  setIsSignOutConfirmOpen(true);
                } else {
                  await signOut();
                  onClose();
                }
              }}
            >
              Sign Out on This Device
            </Button>
          </div>
        </div>

        {/* Warning modal if signing out with pending unsynced changes */}
        <SignOutConfirmModal
          isOpen={isSignOutConfirmOpen}
          onClose={() => setIsSignOutConfirmOpen(false)}
          onConfirmSignOut={async () => {
            await signOut();
            setIsSignOutConfirmOpen(false);
            onClose();
          }}
          pendingCount={syncState.pendingCount}
          userEmail={user.email}
          userId={user.id}
        />
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeAriaLabel="Close sign in window"
      title={
        mode === 'signup'
          ? 'Create Account & Enable Cloud Sync'
          : mode === 'signin'
          ? 'Sign In to Your Account'
          : 'Reset Your Password'
      }
      description={
        mode === 'signup'
          ? 'Keep your planner backed up and accessible across all your devices.'
          : mode === 'signin'
          ? 'Access your synced planner data on this device.'
          : 'Enter your email to receive recovery instructions.'
      }
    >
      <div className="space-y-4 pt-1">
        {/* Offline & Migration Value Props */}
        <div className="p-3.5 rounded-xl bg-ivory-100 dark:bg-espresso-800/80 border border-ivory-300 dark:border-espresso-700 text-[11px] space-y-1.5 text-espresso-700 dark:text-ivory-200">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>Full Offline & Multi-Device Freedom</span>
          </div>
          <p className="text-espresso-600 dark:text-ivory-300 leading-relaxed">
            • <strong>Works completely offline:</strong> Plan, check off habits, and write notes anywhere. Your changes queue automatically and sync when you return online.
          </p>
          <p className="text-espresso-600 dark:text-ivory-300 leading-relaxed">
            • <strong>Zero data loss:</strong> All items you have already entered locally on this device will be automatically linked to your new account.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex rounded-xl bg-ivory-200/80 dark:bg-espresso-800 p-1 text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
              mode === 'signup'
                ? 'bg-cardwhite dark:bg-espresso-700 text-espresso-900 dark:text-ivory-50 shadow-xs'
                : 'text-espresso-600 dark:text-ivory-300'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
              mode === 'signin'
                ? 'bg-cardwhite dark:bg-espresso-700 text-espresso-900 dark:text-ivory-50 shadow-xs'
                : 'text-espresso-600 dark:text-ivory-300'
            }`}
          >
            Sign In
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-sage-light dark:bg-sage-dark/30 border border-sage/40 text-xs text-sage-dark dark:text-sage flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-espresso-700 dark:text-ivory-200 mb-1">
                Your Name / Nickname
              </label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="e.g. Alex"
                className="w-full text-xs p-2.5 rounded-xl border border-ivory-300 dark:border-espresso-700 bg-white dark:bg-espresso-900 text-espresso-900 dark:text-ivory-100"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-espresso-700 dark:text-ivory-200 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full text-xs p-2.5 rounded-xl border border-ivory-300 dark:border-espresso-700 bg-white dark:bg-espresso-900 text-espresso-900 dark:text-ivory-100"
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-espresso-700 dark:text-ivory-200">
                  Password
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full text-xs p-2.5 rounded-xl border border-ivory-300 dark:border-espresso-700 bg-white dark:bg-espresso-900 text-espresso-900 dark:text-ivory-100"
              />
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={loading}>
              {loading ? (
                'Connecting...'
              ) : mode === 'signup' ? (
                'Create Account & Sync'
              ) : mode === 'signin' ? (
                'Sign In & Sync'
              ) : (
                'Send Reset Instructions'
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

