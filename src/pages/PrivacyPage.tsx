import React from 'react';
import { NavLink } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import { ShieldCheck } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-[#EAE3D8] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <NavLink to="/" className="font-serif font-bold text-lg text-espresso-900">
          LIFE RESET
        </NavLink>
        <NavLink to="/login" className="text-xs text-primary font-semibold hover:underline">
          Open App
        </NavLink>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12 space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-espresso-900">Privacy Policy</h1>
          <p className="text-xs text-espresso-400 mt-1">Effective Date: November 2026</p>
        </div>

        <Card className="p-6 space-y-4 text-xs text-espresso-700 leading-relaxed bg-cardwhite">
          <div className="p-3 bg-sage-light/60 rounded-xl text-sage-dark font-medium flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <span>Your personal life management data and journal entries are strictly private. We never sell your data or train external AI models on your private entries.</span>
          </div>

          <h3 className="font-serif text-base font-bold text-espresso-900 pt-2">1. Information We Collect</h3>
          <p>
            When you register, we collect your email address and profile name. When you use Life Reset, your tasks, schedules, journals, and reflections are securely stored in your personal database records protected by Row Level Security (RLS).
          </p>

          <h3 className="font-serif text-base font-bold text-espresso-900 pt-2">2. How Data Is Used</h3>
          <p>
            Your information is used solely to provide and synchronize your personal planner across your devices. We do not inspect, monetize, or share your entries.
          </p>

          <h3 className="font-serif text-base font-bold text-espresso-900 pt-2">3. Medical & Health Disclaimer</h3>
          <p>
            LIFE RESET is an organizational productivity application designed with ADHD-friendly principles. It does not provide medical diagnoses, psychiatric advice, medication recommendations, or mental health treatment. It does not replace professional care.
          </p>

          <h3 className="font-serif text-base font-bold text-espresso-900 pt-2">4. Data Deletion and Export</h3>
          <p>
            You hold 100% ownership over your data. You may export all your records in standard JSON format or request immediate account deletion from your Settings page at any time.
          </p>

          <p className="pt-4 text-espresso-400 text-[11px] italic">
            * Note: This policy serves as a clear operating template and may require formal legal jurisdiction review.
          </p>
        </Card>
      </main>
    </div>
  );
};

