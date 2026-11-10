import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';

// Digital Planner Pages
import { DashboardPage } from '@/pages/DashboardPage';
import { PlanPage } from '@/pages/PlanPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { TasksPage } from '@/pages/TasksPage';
import { BrainDumpPage } from '@/pages/BrainDumpPage';
import { FocusPage } from '@/pages/FocusPage';
import { GoalsPage } from '@/pages/GoalsPage';
import { WellnessPage } from '@/pages/WellnessPage';
import { MindPage } from '@/pages/MindPage';
import { MoneyPage } from '@/pages/MoneyPage';
import { HouseholdPage } from '@/pages/HouseholdPage';
import { LifeAdminPage } from '@/pages/LifeAdminPage';
import { ReviewsPage } from '@/pages/ReviewsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { OnboardingPage } from '@/pages/OnboardingPage';

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Root Standalone Planner AppShell */}
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/plan" element={<PlanPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/brain-dump" element={<BrainDumpPage />} />
        <Route path="/focus" element={<FocusPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/wellness" element={<WellnessPage />} />
        <Route path="/mind" element={<MindPage />} />
        <Route path="/money" element={<MoneyPage />} />
        <Route path="/household" element={<HouseholdPage />} />
        <Route path="/life-admin" element={<LifeAdminPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
      </Route>

      {/* Legacy /app/* redirects to direct routes */}
      <Route path="/app" element={<Navigate to="/" replace />} />
      <Route path="/app/plan" element={<Navigate to="/plan" replace />} />
      <Route path="/app/calendar" element={<Navigate to="/calendar" replace />} />
      <Route path="/app/tasks" element={<Navigate to="/tasks" replace />} />
      <Route path="/app/brain-dump" element={<Navigate to="/brain-dump" replace />} />
      <Route path="/app/focus" element={<Navigate to="/focus" replace />} />
      <Route path="/app/goals" element={<Navigate to="/goals" replace />} />
      <Route path="/app/wellness" element={<Navigate to="/wellness" replace />} />
      <Route path="/app/mind" element={<Navigate to="/mind" replace />} />
      <Route path="/app/money" element={<Navigate to="/money" replace />} />
      <Route path="/app/household" element={<Navigate to="/household" replace />} />
      <Route path="/app/life-admin" element={<Navigate to="/life-admin" replace />} />
      <Route path="/app/reviews" element={<Navigate to="/reviews" replace />} />
      <Route path="/app/settings" element={<Navigate to="/settings" replace />} />
      <Route path="/app/onboarding" element={<Navigate to="/onboarding" replace />} />

      {/* Fallback Catch-All */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
