import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError(null);
    const res = await resetPassword(email.trim());
    if (res.error) {
      setError(res.error);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <NavLink to="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-base">
              LR
            </div>
            <span className="font-serif font-bold text-xl text-espresso-900">
              LIFE RESET
            </span>
          </NavLink>
          <h2 className="font-serif text-2xl font-bold text-espresso-900 mt-2">
            Reset Password
          </h2>
          <p className="text-xs text-espresso-500">
            We will email you a secure link to reset your password.
          </p>
        </div>

        <Card className="p-6 sm:p-8 space-y-4 bg-cardwhite shadow-soft-md">
          {sent ? (
            <div className="text-center py-4 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-sage mx-auto" />
              <p className="text-sm font-semibold text-espresso-900">Check your inbox</p>
              <p className="text-xs text-espresso-500">
                If an account exists for {email}, a recovery link has been sent.
              </p>
              <NavLink to="/login" className="block pt-2">
                <Button variant="outline" size="sm" className="w-full">
                  Return to Sign In
                </Button>
              </NavLink>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
                  {error}
                </div>
              )}
              <Input
                type="email"
                label="Email Address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
              />

              <Button type="submit" variant="primary" size="lg" className="w-full font-semibold">
                Send Reset Link
              </Button>

              <div className="text-center pt-2">
                <NavLink to="/login" className="text-xs text-primary hover:underline">
                  Back to Sign In
                </NavLink>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

