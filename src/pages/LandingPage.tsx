import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  HeartHandshake,
  Zap,
  BatteryLow,
  Clock,
  Feather,
  Briefcase,
  HelpCircle,
  Eye,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { enterDemoMode } = useAuth();
  const navigate = useNavigate();

  const handleInstantDemo = () => {
    enterDemoMode();
    navigate('/app');
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* Public Navigation */}
      <nav className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-[#EAE3D8] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-sm shadow-soft-sm">
            LR
          </div>
          <span className="font-serif font-bold text-lg tracking-tight text-espresso-900">
            LIFE RESET
          </span>
        </NavLink>

        <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-espresso-700">
          <NavLink to="/features" className="hover:text-primary transition-colors">
            Features
          </NavLink>
          <NavLink to="/pricing" className="hover:text-primary transition-colors">
            Pricing ($19)
          </NavLink>
          <NavLink to="/privacy" className="hover:text-primary transition-colors">
            Privacy
          </NavLink>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleInstantDemo}
            className="text-xs"
          >
            Explore Demo
          </Button>
          <NavLink to="/login">
            <Button variant="primary" size="sm" className="text-xs">
              Sign In
            </Button>
          </NavLink>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-5xl mx-auto px-4 sm:px-8 pt-16 sm:pt-24 pb-16 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-softpeach-light/80 border border-softpeach/60 text-xs font-semibold text-softpeach-dark animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Designed with ADHD-Friendly Principles</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-espresso-900 leading-[1.15]">
          Your life, organised. <br className="hidden sm:inline" />
          <span className="text-primary italic">Your way.</span>
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-espresso-600 leading-relaxed font-normal">
          One calm place for your plans, tasks, goals and everyday responsibilities — designed to work with your capacity, not against it.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            size="lg"
            onClick={handleInstantDemo}
            icon={<ArrowRight className="w-4 h-4" />}
            className="w-full sm:w-auto text-sm px-6 py-3 font-semibold"
          >
            Open Interactive App Now
          </Button>

          <NavLink to="/signup" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full text-sm px-6 py-3">
              Create Your Free Account
            </Button>
          </NavLink>
        </div>

        <p className="text-xs text-espresso-400">
          No credit card required to explore • One-time purchase for lifetime account
        </p>
      </header>

      {/* Philosophy Pillars */}
      <section className="max-w-5xl mx-auto px-4 sm:px-8 py-12 border-y border-[#EAE3D8]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-3">
            <h3 className="font-serif text-base font-bold text-espresso-900">Zero Guilt</h3>
            <p className="text-xs text-espresso-500 mt-1">Never punished for missing days</p>
          </div>
          <div className="p-3">
            <h3 className="font-serif text-base font-bold text-espresso-900">Capacity-Adaptive</h3>
            <p className="text-xs text-espresso-500 mt-1">Simplifies when you're overwhelmed</p>
          </div>
          <div className="p-3">
            <h3 className="font-serif text-base font-bold text-espresso-900">Tiny-Step Rescue</h3>
            <p className="text-xs text-espresso-500 mt-1">2-minute starts break inertia</p>
          </div>
          <div className="p-3">
            <h3 className="font-serif text-base font-bold text-espresso-900">No Broken Streaks</h3>
            <p className="text-xs text-espresso-500 mt-1">Gentle restarts anytime</p>
          </div>
        </div>
      </section>

      {/* Signature Differentiators Showcase */}
      <section className="max-w-5xl mx-auto px-4 sm:px-8 py-16 space-y-16">
        {/* Feature 1: Adaptive Capacity Engine */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Signature Innovation
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-espresso-900">
              The Adaptive Capacity Engine
            </h2>
            <p className="text-sm text-espresso-600 leading-relaxed">
              Traditional planners assume you have 100% executive bandwidth every single day.
              Life Reset dynamically shifts into <strong>Low-Energy</strong>, <strong>Overwhelmed</strong>, or <strong>Focus</strong> mode with one tap.
            </p>
            <ul className="text-xs space-y-2 text-espresso-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sage" /> In Overwhelmed Mode, only 1 single next step is shown.
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sage" /> Non-essential tasks are paused with zero shame.
              </li>
            </ul>
          </div>

          <Card className="p-5 border-2 border-primary/20 shadow-soft-md">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-3">
              ⚡ Overwhelmed Mode Active
            </div>
            <p className="font-serif text-lg font-bold text-espresso-900">
              Pick up laundry basket (2-minute start)
            </p>
            <p className="text-xs text-espresso-500 mt-1">
              Give yourself full permission to stop right after.
            </p>
            <div className="mt-4 flex gap-2">
              <Button variant="primary" size="sm">
                Mark 2m Done
              </Button>
              <Button variant="outline" size="sm">
                Postpone
              </Button>
            </div>
          </Card>
        </div>

        {/* Feature 2: Gentle Restart System */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <Card className="p-5 border-2 border-sage/30 order-2 md:order-1 bg-sage-light/30">
            <div className="flex items-center gap-2 text-sage-dark font-semibold text-xs mb-2">
              <HeartHandshake className="w-4 h-4" /> Welcome back. You are right on time.
            </div>
            <p className="text-xs text-espresso-700 leading-relaxed">
              No red notifications. No broken streaks. Select 1 or 2 tasks that still matter today,
              and quietly park the rest in your inbox.
            </p>
            <div className="mt-4 pt-3 border-t border-sage/20 flex justify-between items-center text-xs">
              <span className="font-medium text-espresso-600">One-click Reset My Day</span>
              <span className="px-2 py-0.5 rounded bg-sage text-white text-[11px] font-bold">
                Fresh Clean Slate
              </span>
            </div>
          </Card>

          <div className="space-y-4 order-1 md:order-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sage-dark">
              Guilt-Free Return
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-espresso-900">
              The Gentle Restart System
            </h2>
            <p className="text-sm text-espresso-600 leading-relaxed">
              Most productivity apps punish you when life gets overwhelming.
              With Life Reset, you never face a wall of overdue red dates. A single button resets your day with compassion and zero data loss.
            </p>
          </div>
        </div>

        {/* Feature 3: Life Admin Hub */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-softblue-dark">
              No More Dropped Balls
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-espresso-900">
              Life Admin & Waiting-For Tracker
            </h2>
            <p className="text-sm text-espresso-600 leading-relaxed">
              Keep renewals, returns, doctor appointments, and things you are waiting for other people to do in one reliable place. Offload them from working memory.
            </p>
          </div>

          <Card className="p-5 border-2 border-softblue/30 space-y-2.5">
            <div className="p-2.5 rounded-xl bg-softblue-light/50 text-xs flex items-center justify-between">
              <div>
                <span className="font-semibold text-softblue-dark block">Waiting for Landlord:</span>
                <span className="text-espresso-800">Bathroom tap repair email</span>
              </div>
              <span className="text-[10px] text-espresso-400">Follow-up: Today</span>
            </div>
            <div className="p-2.5 rounded-xl bg-ivory-100 text-xs flex items-center justify-between">
              <div>
                <span className="font-semibold text-espresso-700 block">Car insurance quote:</span>
                <span className="text-espresso-800">Check price comparison</span>
              </div>
              <span className="text-[10px] text-espresso-400">Due: Friday</span>
            </div>
          </Card>
        </div>
      </section>

      {/* Transparent Pricing Section */}
      <section className="bg-ivory-100 py-16 px-4 sm:px-8 border-t border-[#EAE3D8]">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Clear, Honest Pricing
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-espresso-900">
            $19 One-Time Payment. No Subscriptions.
          </h2>
          <p className="text-sm text-espresso-600">
            We reject predatory monthly subscriptions that charge you while you forget to use them.
          </p>
        </div>

        <Card className="max-w-md mx-auto p-6 sm:p-8 border-2 border-primary shadow-soft-lg text-center space-y-5 bg-cardwhite">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-espresso-500">
              Lifetime Personal Access
            </span>
            <div className="font-serif text-5xl font-bold text-espresso-900">$19</div>
            <span className="text-xs text-espresso-400">One-time payment • No monthly recurring fees</span>
          </div>

          <ul className="text-xs text-left space-y-2.5 py-4 border-y border-ivory-200 text-espresso-700">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sage shrink-0" /> Full access to all 12 modules & future updates
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sage shrink-0" /> Adaptive Capacity Engine & Overwhelmed Mode
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sage shrink-0" /> Tiny-Step Rescue & Gentle Restart System
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sage shrink-0" /> Complete data export & privacy protection
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sage shrink-0" /> Works on phones, tablets, and desktop
            </li>
          </ul>

          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={handleInstantDemo}
              className="w-full font-semibold"
            >
              Get Started with Life Reset
            </Button>
            <p className="text-[11px] text-espresso-400 mt-2">
              14-day compassionate refund guarantee if it doesn't fit your brain.
            </p>
          </div>
        </Card>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-8 py-16 space-y-6">
        <h2 className="font-serif text-2xl font-bold text-espresso-900 text-center mb-8">
          Frequently Asked Questions
        </h2>

        <div className="space-y-3 text-xs">
          <Card className="p-4 space-y-1">
            <h4 className="font-bold text-sm text-espresso-900">Does Life Reset treat or diagnose ADHD?</h4>
            <p className="text-espresso-600 leading-relaxed">
              No. Life Reset is an executive functioning and life management software application designed using ADHD-friendly principles. It does not provide medical diagnoses or replace mental health care.
            </p>
          </Card>

          <Card className="p-4 space-y-1">
            <h4 className="font-bold text-sm text-espresso-900">What happens if I abandon the app for 3 weeks?</h4>
            <p className="text-espresso-600 leading-relaxed">
              Nothing is broken! You will see zero warning badges or failed streak notifications. Click the Gentle Restart button to select what matters today and pick right back up.
            </p>
          </Card>

          <Card className="p-4 space-y-1">
            <h4 className="font-bold text-sm text-espresso-900">Can I access my data offline?</h4>
            <p className="text-espresso-600 leading-relaxed">
              Yes, Life Reset is an installable PWA that safely saves your tasks and thoughts locally and reconciles changes when your network returns.
            </p>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#EAE3D8] py-8 px-4 text-center text-xs text-espresso-500 space-y-2">
        <div className="flex justify-center gap-6 font-medium">
          <NavLink to="/privacy" className="hover:underline">Privacy Policy</NavLink>
          <NavLink to="/terms" className="hover:underline">Terms of Service</NavLink>
          <NavLink to="/pricing" className="hover:underline">Pricing</NavLink>
          <NavLink to="/features" className="hover:underline">Features</NavLink>
        </div>
        <p>© 2026 LIFE RESET. All rights reserved. Your life, organised. Your way.</p>
      </footer>
    </div>
  );
};

