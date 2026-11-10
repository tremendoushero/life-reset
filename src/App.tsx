import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';

// Public pages
import { LandingPage } from '@/pages/LandingPage';
import { FeaturesPage } from '@/pages/FeaturesPage';
import { PricingPage } from '@/pages/PricingPage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { PrivacyPage } from '@/pages/PrivacyPage';
import { TermsPage } from '@/pages/TermsPage';

// Authenticated pages
import { OnboardingPage } from '@/pages/OnboardingPage';
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

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />

      {/* Authenticated Routes with Shell */}
      <Route element={<ProtectedRoute />}>
        <Route path="/app/onboarding" element={<OnboardingPage />} />

        <Route element={<AppShell />}>
          <Route path="/app" element={<DashboardPage />} />
          <Route path="/app/plan" element={<PlanPage />} />
          <Route path="/app/calendar" element={<CalendarPage />} />
          <Route path="/app/tasks" element={<TasksPage />} />
          <Route path="/app/brain-dump" element={<BrainDumpPage />} />
          <Route path="/app/focus" element={<FocusPage />} />
          <Route path="/app/goals" element={<GoalsPage />} />
          <Route path="/app/wellness" element={<WellnessPage />} />
          <Route path="/app/mind" element={<MindPage />} />
          <Route path="/app/money" element={<MoneyPage />} />
          <Route path="/app/household" element={<HouseholdPage />} />
          <Route path="/app/life-admin" element={<LifeAdminPage />} />
          <Route path="/app/reviews" element={<ReviewsPage />} />
          <Route path="/app/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* 404 Catch-All Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

