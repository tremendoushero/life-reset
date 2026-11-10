import React from 'react';
import { NavLink } from 'react-router-dom';
import { Card } from '@/components/common/Card';

export const TermsPage: React.FC = () => {
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
          <h1 className="font-serif text-3xl font-bold text-espresso-900">Terms of Service</h1>
          <p className="text-xs text-espresso-400 mt-1">Effective Date: November 2026</p>
        </div>

        <Card className="p-6 space-y-4 text-xs text-espresso-700 leading-relaxed bg-cardwhite">
          <h3 className="font-serif text-base font-bold text-espresso-900">1. Acceptance of Terms</h3>
          <p>
            By using LIFE RESET, you agree to these Terms of Service. If you disagree with any part of these terms, please do not use the application.
          </p>

          <h3 className="font-serif text-base font-bold text-espresso-900 pt-2">2. Single Purchase & Account Access</h3>
          <p>
            LIFE RESET is made available for a one-time purchase of $19 (subject to applicable taxes). This purchase grants a personal, non-transferable licence to access the web application. Access is provided for your individual personal use.
          </p>

          <h3 className="font-serif text-base font-bold text-espresso-900 pt-2">3. Refund Policy</h3>
          <p>
            We provide a 14-day refund policy. If Life Reset does not fit your executive functioning style or requirements, contact support within 14 days of purchase for a prompt refund.
          </p>

          <h3 className="font-serif text-base font-bold text-espresso-900 pt-2">4. Disclaimers</h3>
          <p>
            The service is provided "as is" without warranty of any kind. LIFE RESET is an executive life management tool, not medical or mental health software.
          </p>
        </Card>
      </main>
    </div>
  );
};
