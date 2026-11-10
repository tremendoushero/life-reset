import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured, storage } from '@/lib/supabase';
import { UserProfile, Entitlement } from '@/types';
import { demoProfile } from '@/lib/demoData';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isDemo: boolean;
  entitlement: Entitlement | null;
  signIn: (email: string, password?: string) => Promise<{ error?: string }>;
  signUp: (email: string, password?: string, displayName?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  enterDemoMode: () => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  deleteAccount: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  grantEntitlement: (planId?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isDemo, setIsDemo] = useState<boolean>(() => storage.get('is_demo_mode', false));
  const [loading, setLoading] = useState(true);
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (isDemo) {
          const cachedProfile = storage.get('demo_profile', demoProfile);
          setUser(cachedProfile);
          setEntitlement({
            id: 'ent_demo',
            user_id: cachedProfile.id,
            plan_id: 'lifetime_19',
            status: 'active',
            provider: 'test',
            granted_at: new Date().toISOString(),
          });
          setLoading(false);
          return;
        }

        if (!isSupabaseConfigured) {
          // If no Supabase env vars, automatically provide demo mode with a warm prompt
          const savedUser = storage.get<UserProfile | null>('active_user', null);
          if (savedUser) {
            setUser(savedUser);
          }
          setLoading(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // fetch profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            setUser(profile);
          } else {
            // create initial profile
            const newProfile: UserProfile = {
              id: session.user.id,
              email: session.user.email || '',
              display_name: session.user.user_metadata?.display_name || 'My Life Reset',
              planning_capacity: 'steady',
              preferred_planning_time: 'morning',
              onboarding_completed: false,
              created_at: new Date().toISOString(),
            };
            await supabase.from('profiles').insert(newProfile);
            setUser(newProfile);
          }

          // fetch entitlement
          const { data: ent } = await supabase
            .from('subscriptions_or_entitlements')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          if (ent) setEntitlement(ent);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (profile) setUser(profile);
        } else if (!isDemo) {
          setUser(null);
          setEntitlement(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [isDemo]);

  const signIn = async (email: string, password?: string) => {
    if (!isSupabaseConfigured) {
      // Local fallback account
      const mockUser: UserProfile = {
        id: `usr_${Date.now()}`,
        email,
        display_name: email.split('@')[0],
        planning_capacity: 'steady',
        preferred_planning_time: 'morning',
        onboarding_completed: true,
        created_at: new Date().toISOString(),
      };
      setUser(mockUser);
      storage.set('active_user', mockUser);
      return {};
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: password || 'default-password',
      });
      if (error) return { error: error.message };
      return {};
    } catch (err: any) {
      return { error: err.message || 'Failed to sign in' };
    }
  };

  const signUp = async (email: string, password?: string, displayName?: string) => {
    if (!isSupabaseConfigured) {
      const mockUser: UserProfile = {
        id: `usr_${Date.now()}`,
        email,
        display_name: displayName || email.split('@')[0],
        planning_capacity: 'steady',
        preferred_planning_time: 'morning',
        onboarding_completed: false,
        created_at: new Date().toISOString(),
      };
      setUser(mockUser);
      storage.set('active_user', mockUser);
      return {};
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: password || 'default-password',
        options: {
          data: { display_name: displayName || email.split('@')[0] },
        },
      });
      if (error) return { error: error.message };
      if (data.user) {
        const newProfile: UserProfile = {
          id: data.user.id,
          email,
          display_name: displayName || email.split('@')[0],
          planning_capacity: 'steady',
          preferred_planning_time: 'morning',
          onboarding_completed: false,
          created_at: new Date().toISOString(),
        };
        await supabase.from('profiles').upsert(newProfile);
        setUser(newProfile);
      }
      return {};
    } catch (err: any) {
      return { error: err.message || 'Failed to sign up' };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setIsDemo(false);
    storage.remove('is_demo_mode');
    storage.remove('active_user');
  };

  const enterDemoMode = () => {
    setIsDemo(true);
    storage.set('is_demo_mode', true);
    storage.set('demo_profile', demoProfile);
    setUser(demoProfile);
    setEntitlement({
      id: 'ent_demo',
      user_id: demoProfile.id,
      plan_id: 'lifetime_19',
      status: 'active',
      provider: 'test',
      granted_at: new Date().toISOString(),
    });
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);

    if (isDemo) {
      storage.set('demo_profile', updated);
      return;
    }

    if (isSupabaseConfigured) {
      await supabase.from('profiles').update(updates).eq('id', user.id);
    } else {
      storage.set('active_user', updated);
    }
  };

  const deleteAccount = async () => {
    if (user && isSupabaseConfigured) {
      await supabase.from('profiles').delete().eq('id', user.id);
      await supabase.auth.signOut();
    }
    await signOut();
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured) {
      return {}; // simulated success
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) return { error: error.message };
      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const grantEntitlement = async (planId = 'lifetime_19') => {
    const newEnt: Entitlement = {
      id: `ent_${Date.now()}`,
      user_id: user?.id || 'anonymous',
      plan_id: planId,
      status: 'active',
      provider: 'test',
      granted_at: new Date().toISOString(),
    };
    setEntitlement(newEnt);
    storage.set('entitlement', newEnt);

    if (isSupabaseConfigured && user) {
      await supabase.from('subscriptions_or_entitlements').upsert({
        user_id: user.id,
        plan_id: planId,
        status: 'active',
        provider: 'test',
        granted_at: new Date().toISOString(),
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isDemo,
        entitlement,
        signIn,
        signUp,
        signOut,
        enterDemoMode,
        updateProfile,
        deleteAccount,
        resetPassword,
        grantEntitlement,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
