import React from 'react';
import { NavLink } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

export const PricingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-[#EAE3D8] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <NavLink to="/" className="font-serif font-bold text-lg text-espresso-900">
          LIFE RESET
        </NavLink>
        <NavLink to="/login">
          <Button variant="primary" size="sm">Sign In</Button>
        </NavLink>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-16 text-center space-y-8">
        <div className="space-y-3">
          <span className="text-xs font-semibold uppercase text-primary tracking-wider">
            Simple & Transparent
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-espresso-900">
            $19 One-Time Payment
          </h1>
          <p className="text-sm text-espresso-600 max-w-md mx-auto">
            Pay once. Keep your calm personal life management hub for life.
          </p>
        </div>

        <Card className="max-w-md mx-auto p-6 sm:p-8 border-2 border-primary text-center space-y-6 bg-cardwhite">
          <div>
            <span className="font-serif text-4xl font-bold text-espresso-900">$19</span>
            <span className="text-xs text-espresso-500 block mt-1">One-time purchase • Zero recurring billing</span>
          </div>

          <ul className="text-xs text-left space-y-2.5 py-4 border-y border-ivory-200 text-espresso-700">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sage" /> Unlimited task management & subtask breakdown
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sage" /> Adaptive Capacity Engine & Overwhelmed Mode
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sage" /> Gentle Restart system with zero broken streaks
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sage" /> Life Admin & Waiting-for follow-up tracker
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sage" /> Money Hub, Dopamine Menu & Routine builder
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sage" /> Installable PWA with offline safe-caching
            </li>
          </ul>

          <NavLink to="/signup" className="block">
            <Button variant="primary" size="lg" className="w-full">
              Get Started with Life Reset
            </Button>
          </NavLink>

          <p className="text-[11px] text-espresso-400">
            14-day refund guarantee if it doesn't align with your workflow.
          </p>
        </Card>
      </main>
    </div>
  );
};
