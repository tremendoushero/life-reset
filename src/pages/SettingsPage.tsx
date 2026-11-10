import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Settings, Palette, Eye, Moon, BellOff, Download, Trash2, Check, Shield } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme, colorMode, setColorMode, fontSize, setFontSize, reducedMotion, setReducedMotion } = useTheme();
  const { user, deleteAccount, updateProfile } = useAuth();
  const { tasks, brainDumps, habits, bills } = useData();

  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [profileSaved, setProfileSaved] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

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

  const handleExportData = () => {
    const exportBundle = {
      profile: user,
      tasks,
      brainDumps,
      habits,
      bills,
      exportedAt: new Date().toISOString(),
      app: 'LIFE RESET',
    };
    const blob = new Blob([JSON.stringify(exportBundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `life-reset-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-espresso-900 dark:text-ivory-50">
            Personalisation & Settings
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-espresso-500 dark:text-ivory-400 mt-0.5">
          Customise themes, visual comfort, and quiet hours to fit your sensory preferences.
        </p>
      </div>

      {/* Profile & Name Card */}
      <Card className="p-5">
        <h3 className="font-serif text-base font-bold text-espresso-900 dark:text-ivory-50 mb-3">
          Your Profile
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
              <span className="text-[11px] text-espresso-500">Disable UI animations</span>
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

      {/* 3. Data Export & Account Safety */}
      <Card className="p-5 space-y-4">
        <h3 className="font-serif text-base font-bold text-espresso-900 dark:text-ivory-50">
          Data Ownership & Privacy
        </h3>
        <p className="text-xs text-espresso-500">
          Your life management data is strictly yours. You can export complete records in JSON format anytime or safely delete your account.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
            icon={<Download className="w-4 h-4" />}
          >
            Export All Data (JSON)
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteConfirmOpen(true)}
            icon={<Trash2 className="w-4 h-4" />}
          >
            Delete Account & Records
          </Button>
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Confirm Account Deletion"
        description="This will permanently remove your profile, tasks, and reflections."
      >
        <p className="text-xs text-espresso-700 dark:text-ivory-200 mb-4 leading-relaxed">
          Are you completely sure? This action cannot be undone. All your locally cached and server data will be wiped.
        </p>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={async () => {
              await deleteAccount();
              setDeleteConfirmOpen(false);
            }}
          >
            Permanently Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};
