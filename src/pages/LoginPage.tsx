import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Sparkles, ArrowRight, Shield } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { signIn, enterDemoMode } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError(null);
    setLoading(true);

    const res = await signIn(email.trim(), password);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      navigate('/app');
    }
  };

  const handleDemo = () => {
    enterDemoMode();
    navigate('/app');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <NavLink to="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-base shadow-soft-sm">
              LR
            </div>
            <span className="font-serif font-bold text-xl text-espresso-900">
              LIFE RESET
            </span>
          </NavLink>
          <h2 className="font-serif text-2xl font-bold text-espresso-900 mt-2">
            Welcome Back
          </h2>
          <p className="text-xs text-espresso-500">
            Sign in to access your calm personal workspace.
          </p>
        </div>

        <Card className="p-6 sm:p-8 space-y-5 bg-cardwhite shadow-soft-md">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              label="Email Address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase text-espresso-600">
                  Password
                </label>
                <NavLink
                  to="/forgot-password"
                  className="text-[11px] text-primary hover:underline"
                >
                  Forgot password?
                </NavLink>
              </div>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-semibold"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In to Life Reset'}
            </Button>
          </form>

          <div className="pt-2 text-center border-t border-ivory-200 space-y-3">
            <button
              type="button"
              onClick={handleDemo}
              className="w-full py-2 px-3 rounded-xl border border-ivory-300 hover:bg-ivory-100 text-xs font-semibold text-espresso-700 flex items-center justify-center gap-2 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Or Explore in Instant Demo Mode</span>
            </button>

            <p className="text-xs text-espresso-500">
              Don't have an account yet?{' '}
              <NavLink to="/signup" className="text-primary font-semibold hover:underline">
                Create one
              </NavLink>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

