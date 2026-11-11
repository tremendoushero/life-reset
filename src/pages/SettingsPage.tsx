import React, { useState, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { AuthModal } from '@/components/features/AuthModal';
import { SignOutConfirmModal } from '@/components/features/SignOutConfirmModal';
import {
  Settings,
  Palette,
  Eye,
  Download,
  Upload,
  RotateCcw,
  Check,
  ShieldCheck,
  AlertTriangle,
  HardDrive,
  Cloud,
  CloudOff,
  RefreshCw,
  LogOut,
  User,
  ExternalLink,
  X,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme, colorMode, setColorMode, fontSize, setFontSize, reducedMotion, setReducedMotion } = useTheme();
  const { user, updateProfile, isAuthenticated, signOut } = useAuth();
  const { exportBackup, importBackup, clearAllData, syncState, triggerSync, dismissSyncError } = useData();

  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [profileSaved, setProfileSaved] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [isSyncingManual, setIsSyncingManual] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const themeOptions: { id: any; name: string; preview: string }[] = [
    { id: 'warm-ivory', name: 'Warm Ivory (Default)', preview: 'bg-[#F5F0E8] border-[#E8E2D8]' },
    { id: 'sage', name: 'Sage Calm', preview: 'bg-[#F0F4EC] border-[#A4B58A]' },
    { id: 'lavender', name: 'Lavender Peace', preview: 'bg-[#F4F1FA] border-[#B6A4E8]' },
    { id: 'soft-blue', name: 'Soft Blue Clarity', preview: 'bg-[#EFF5F8] border-[#A8CDE0]' },
    { id: 'soft-peach', name: 'Soft Peach Warmth', preview: 'bg-[#F9F3EE] border-[#F4C7A8]' },
    { id: 'dark-espresso', name: 'Dark Espresso', preview: 'bg-[#231B16] border-[#44372F]' },
  ];

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({ display_name: displayName });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handleManualSync = async () => {
    setIsSyncingManual(true);
    setSyncFeedback(null);
    try {
      const res = await triggerSync();
      if (res.success) {
        setSyncFeedback({
          type: 'success',
          message: `Synced with Supabase! Uploaded ${res.flushedCount} pending changes, refreshed ${res.pulledCount} cloud items.`,
        });
        setTimeout(() => setSyncFeedback(null), 5000);
      } else {
        // Keep error visible until dismissed
        setSyncFeedback({
          type: 'error',
          message: res.error || 'Sync failed. Please check connection and database tables.',
        });
      }
    } catch (err: any) {
      setSyncFeedback({
        type: 'error',
        message: err?.message || 'Sync failed.',
      });
    } finally {
      setIsSyncingManual(false);
    }
  };

  const handleExportData = async () => {
    try {
      const jsonString = await exportBackup();
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `life-reset-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const result = await importBackup(content);
        if (result.success) {
          setImportStatus({
            type: 'success',
            message: 'Backup restored successfully! All your planner data has been loaded.',
          });
        } else {
          setImportStatus({
            type: 'error',
            message: result.message || 'Failed to parse backup file.',
          });
        }
      } catch (err: any) {
        setImportStatus({
          type: 'error',
          message: err?.message || 'Error processing backup file.',
        });
      }
      setTimeout(() => setImportStatus(null), 5000);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = async () => {
    await clearAllData();
    setClearConfirmOpen(false);
    setDisplayName('My Life Reset');
    setImportStatus({
      type: 'success',
      message: 'Planner reset to clean defaults. All previous records have been cleared.',
    });
    setTimeout(() => setImportStatus(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-espresso-900 dark:text-ivory-50">
            Personalisation & Settings
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-espresso-500 dark:text-ivory-400 mt-0.5">
          Customise themes, visual comfort, sensory preferences, account sync, and local data backups.
        </p>
      </div>

      {/* CLOUD SYNC & ACCOUNT CARD */}
      <Card className="p-5 space-y-4 border-primary/30 shadow-soft-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-primary" />
            <h3 className="font-serif text-base font-bold text-espresso-900 dark:text-ivory-50">
              Account & Cloud Synchronization
            </h3>
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 ${
              !isAuthenticated
                ? 'bg-ivory-200 text-espresso-700 dark:bg-espresso-800 dark:text-ivory-200'
                : syncState.status === 'offline'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                : 'bg-sage-light text-sage-dark dark:bg-sage-dark/30 dark:text-sage'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                !isAuthenticated
                  ? 'bg-espresso-400'
                  : syncState.status === 'offline'
                  ? 'bg-amber-500'
                  : 'bg-sage'
              }`}
            />
            {!isAuthenticated
              ? 'Local Guest Mode'
              : syncState.status === 'offline'
              ? 'Offline (Queued)'
              : 'Synced'}
          </span>
        </div>

        <p className="text-xs text-espresso-600 dark:text-ivory-300 leading-relaxed">
          {!isAuthenticated
            ? 'Your planner is saving locally in your browser. Create a free account or sign in to sync your tasks, habits, and reflections seamlessly across your laptop, tablet, and phone. Full offline support is included — you can keep planning offline and your changes will sync automatically when you reconnect.'
            : 'Your planner is connected to your cloud account. Any edits you make while offline will automatically queue on this device and sync immediately whenever internet connectivity returns.'}
        </p>

        {/* Sync Info Badges */}
        {isAuthenticated && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-ivory-100 dark:bg-espresso-800 text-xs">
            <div>
              <span className="text-[11px] text-espresso-400 block">Signed In As</span>
              <span className="font-medium text-espresso-900 dark:text-ivory-100 truncate block">
                {user.email || user.display_name}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-espresso-400 block">Offline Queue</span>
              <span className="font-medium text-espresso-900 dark:text-ivory-100">
                {syncState.pendingCount === 0
                  ? 'All changes synced'
                  : `${syncState.pendingCount} changes waiting to sync`}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-espresso-400 block">Last Synced</span>
              <span className="font-medium text-espresso-900 dark:text-ivory-100">
                {syncState.lastSyncedAt
                  ? new Date(syncState.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Just now'}
              </span>
            </div>
          </div>
        )}

        {/* Sync Error / Database Notice Banner */}
        {syncState.errorMessage && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Cloud Database Setup Notice</span>
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
            {syncState.errorMessage.includes('SQL schema migration') && (
              <div className="pt-1 flex flex-wrap items-center gap-2">
                <a
                  href="https://supabase.com/dashboard/project/jlojadolxjymaullfucb/sql/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white font-medium text-[11px] hover:bg-amber-700 transition"
                >
                  Open Supabase SQL Editor
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Sync Manual Feedback Notice */}
        {syncFeedback && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
              syncFeedback.type === 'success'
                ? 'bg-sage-light dark:bg-sage-dark/30 border-sage/40 text-sage-dark dark:text-sage'
                : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
            }`}
          >
            <div className="flex items-center gap-2 flex-1">
              {syncFeedback.type === 'success' ? (
                <Check className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{syncFeedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setSyncFeedback(null)}
              className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition shrink-0"
              title="Dismiss message"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {!isAuthenticated ? (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setAuthMode('signup');
                  setAuthModalOpen(true);
                }}
                icon={<Cloud className="w-4 h-4" />}
              >
                Create Account & Enable Cloud Sync
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAuthMode('signin');
                  setAuthModalOpen(true);
                }}
                icon={<User className="w-4 h-4" />}
              >
                Sign In
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={isSyncingManual}
                onClick={handleManualSync}
                icon={<RefreshCw className={`w-4 h-4 ${isSyncingManual ? 'animate-spin' : ''}`} />}
              >
                {isSyncingManual ? 'Syncing...' : 'Sync Now'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  if (syncState.pendingCount > 0) {
                    setSignOutConfirmOpen(true);
                  } else {
                    await signOut();
                  }
                }}
                icon={<LogOut className="w-4 h-4" />}
              >
                Sign Out on This Device
              </Button>
            </>
          )}
        </div>
      </Card>

      {/* Local Storage Privacy Badge */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-sage-light/60 dark:bg-espresso-800/80 border border-sage/40 text-espresso-800 dark:text-ivory-100">
        <ShieldCheck className="w-5 h-5 text-sage-dark shrink-0" />
        <div className="text-xs">
          <p className="font-semibold text-sage-dark dark:text-sage">
            Device-First IndexedDB Storage
          </p>
          <p className="text-espresso-600 dark:text-ivory-300 mt-0.5">
            Your LIFE RESET planner always operates instantly with zero latency using local IndexedDB in your browser. Whether you are online or completely offline, your planner is fully accessible.
          </p>
        </div>
      </div>

      {/* Status banner */}
      {importStatus && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
            importStatus.type === 'success'
              ? 'bg-sage-light text-sage-dark border border-sage/40'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {importStatus.type === 'success' ? (
            <Check className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{importStatus.message}</span>
        </div>
      )}

      {/* Profile & Name Card */}
      <Card className="p-5">
        <h3 className="font-serif text-base font-bold text-espresso-900 dark:text-ivory-50 mb-3">
          Your Planner Profile
        </h3>
        <form onSubmit={handleUpdateProfile} className="space-y-3 max-w-md">
          <div>
            <label className="block text-xs font-semibold uppercase text-espresso-600 dark:text-ivory-300 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="e.g. My Life Reset"
              className="w-full text-xs p-2.5 rounded-xl border border-ivory-300 dark:border-espresso-700 bg-white dark:bg-espresso-900 text-espresso-900 dark:text-ivory-100"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" variant="primary" size="sm">
              Save Name
            </Button>
            {profileSaved && (
              <span className="text-xs text-sage-dark font-medium flex items-center gap-1">
                <Check className="w-4 h-4" /> Saved!
              </span>
            )}
          </div>
        </form>
      </Card>

      {/* 1. Theme Color Palette */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary" />
          <h3 className="font-serif text-base font-bold text-espresso-900 dark:text-ivory-50">
            Sensory Colour Themes (6 Options)
          </h3>
        </div>
        <p className="text-xs text-espresso-500">
          Soft, grounded tones designed to avoid visual fatigue and overstimulation.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
          {themeOptions.map(t => {
            const isSelected = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/30 shadow-soft-sm'
                    : 'border-ivory-300 dark:border-espresso-700 hover:border-ivory-400'
                }`}
              >
                <div className={`w-6 h-6 rounded-full border shadow-sm ${t.preview}`} />
                <span className="text-xs font-medium text-espresso-800 dark:text-ivory-100">
                  {t.name}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* 2. Visual Mode & Accessibility */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" />
          <h3 className="font-serif text-base font-bold text-espresso-900 dark:text-ivory-50">
            Display Mode & Comfort
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Light / Dark Mode */}
          <div className="p-3.5 rounded-xl border border-ivory-200 dark:border-espresso-700 bg-ivory-100/50 dark:bg-espresso-900">
            <span className="text-xs font-semibold text-espresso-700 dark:text-ivory-200 block mb-2">
              Appearance
            </span>
            <div className="flex rounded-lg border border-ivory-300 bg-cardwhite dark:bg-espresso-800 p-0.5 text-xs">
              {(['light', 'dark', 'system'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setColorMode(mode)}
                  className={`flex-1 py-1 rounded capitalize font-medium ${
                    colorMode === mode
                      ? 'bg-espresso-800 text-ivory-50 shadow-xs'
                      : 'text-espresso-600 dark:text-ivory-300'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className="p-3.5 rounded-xl border border-ivory-200 dark:border-espresso-700 bg-ivory-100/50 dark:bg-espresso-900">
            <span className="text-xs font-semibold text-espresso-700 dark:text-ivory-200 block mb-2">
              Text Sizing
            </span>
            <div className="flex rounded-lg border border-ivory-300 bg-cardwhite dark:bg-espresso-800 p-0.5 text-xs">
              {(['normal', 'large', 'x-large'] as const).map(size => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`flex-1 py-1 rounded capitalize font-medium ${
                    fontSize === size
                      ? 'bg-espresso-800 text-ivory-50 shadow-xs'
                      : 'text-espresso-600 dark:text-ivory-300'
                  }`}
                >
                  {size.replace('x-large', 'XL')}
                </button>
              ))}
            </div>
          </div>

          {/* Reduced Motion */}
          <div className="p-3.5 rounded-xl border border-ivory-200 dark:border-espresso-700 bg-ivory-100/50 dark:bg-espresso-900 flex flex-col justify-between">
            <span className="text-xs font-semibold text-espresso-700 dark:text-ivory-200 block">
              Reduced Motion
            </span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] text-espresso-500">Disable animations</span>
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={e => setReducedMotion(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary/30"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Data Backup, Restore & Clear */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-primary" />
          <h3 className="font-serif text-base font-bold text-espresso-900 dark:text-ivory-50">
            Local Data Backup & Restore
          </h3>
        </div>
        <p className="text-xs text-espresso-500">
          Export your complete planner data into a single portable JSON file anytime. You can restore this file on any browser or device.
        </p>

        {/* Hidden file input for import */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".json,application/json"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
            icon={<Download className="w-4 h-4" />}
          >
            Export Backup (JSON)
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            icon={<Upload className="w-4 h-4" />}
          >
            Import Backup (JSON)
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setClearConfirmOpen(true)}
            icon={<RotateCcw className="w-4 h-4" />}
          >
            Clear All Data
          </Button>
        </div>
      </Card>

      {/* Clear Confirmation Modal */}
      <Modal
        isOpen={clearConfirmOpen}
        onClose={() => setClearConfirmOpen(false)}
        title="Confirm Reset / Clear Data"
        description="This will restore LIFE RESET to a clean fresh slate."
      >
        <p className="text-xs text-espresso-700 dark:text-ivory-200 mb-4 leading-relaxed">
          Are you sure you want to clear your planner? All local tasks, brain dumps, habits, journal entries, and custom records will be removed from your browser. We recommend downloading an Export Backup first.
        </p>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setClearConfirmOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleClearData}
          >
            Reset Everything
          </Button>
        </div>
      </Modal>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authMode}
      />

      {/* Warning modal if signing out with pending unsynced changes */}
      <SignOutConfirmModal
        isOpen={signOutConfirmOpen}
        onClose={() => setSignOutConfirmOpen(false)}
        onConfirmSignOut={async () => {
          await signOut();
          setSignOutConfirmOpen(false);
        }}
        pendingCount={syncState.pendingCount}
        userEmail={user.email}
        userId={user.id}
      />
    </div>
  );
};
