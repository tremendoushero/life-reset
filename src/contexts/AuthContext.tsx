import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, Entitlement } from '@/types';
import { db } from '@/lib/indexedDB';
import { defaultProfile } from '@/lib/starterData';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { syncEngine, ensureUUID } from '@/lib/syncEngine';

interface AuthContextType {
  user: UserProfile;
  loading: boolean;
  isDemo: boolean;
  isAuthenticated: boolean;
  entitlement: Entitlement;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  resetProfile: () => Promise<void>;
  signIn: (email: string, password?: string) => Promise<{ error?: string }>;
  signUp: (email: string, password?: string, displayName?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  enterDemoMode: () => void;
  deleteAccount: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
}

const defaultEntitlement: Entitlement = {
  id: 'ent_standalone_unlimited',
  user_id: 'local_user',
  plan_id: 'lifetime_license',
  status: 'active',
  provider: 'standalone',
  granted_at: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // 1. First load local stored profile (instant offline-first)
        const stored = await db.get<UserProfile>('profile', defaultProfile);
        if (isMounted && stored) {
          setUser(stored);
          if (stored.id && stored.id !== 'local_user') {
            setIsAuthenticated(true);
            syncEngine.setUserId(stored.id);
          }
        }

        // 2. If Supabase configured, check active session
        if (isSupabaseConfigured) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && isMounted) {
            setIsAuthenticated(true);
            syncEngine.setUserId(session.user.id);

            // Fetch remote profile if available
            const { data: remoteProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            const profileToSet: UserProfile = {
              id: session.user.id,
              email: session.user.email || stored.email || '',
              display_name:
                remoteProfile?.display_name ||
                session.user.user_metadata?.display_name ||
                stored.display_name ||
                'My Life Reset',
              planning_capacity: remoteProfile?.planning_capacity || stored.planning_capacity || 'steady',
              preferred_planning_time:
                remoteProfile?.preferred_planning_time || stored.preferred_planning_time || 'morning',
              onboarding_completed: true,
              created_at: remoteProfile?.created_at || stored.created_at || new Date().toISOString(),
            };

            setUser(profileToSet);
            await db.set('profile', profileToSet);
          }
        }
      } catch (err) {
        console.warn('Auth initialization:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen to Supabase auth state changes
    if (isSupabaseConfigured) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          setIsAuthenticated(true);
          syncEngine.setUserId(session.user.id);
          // Auto-migrate any local guest data and flush queue
          await syncEngine.migrateGuestData(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          syncEngine.setUserId(null);
        }
      });

      return () => {
        isMounted = false;
        authListener?.subscription.unsubscribe();
      };
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    setUser(prev => {
      const updated: UserProfile = { ...prev, ...updates };
      db.set('profile', updated).catch(err => console.error('Failed to save profile:', err));
      if (isAuthenticated && updated.id !== 'local_user') {
        syncEngine.dispatchMutation('profiles', 'UPSERT', updated, updated.id);
      }
      return updated;
    });
  };

  const resetProfile = async () => {
    setUser(defaultProfile);
    await db.set('profile', defaultProfile);
  };

  const deleteAccount = async () => {
    if (isSupabaseConfigured && isAuthenticated && user.id !== 'local_user') {
      try {
        await supabase.from('profiles').delete().eq('id', user.id);
        await supabase.auth.signOut();
      } catch {}
    }
    await db.clear();
    setIsAuthenticated(false);
    syncEngine.setUserId(null);
    setUser(defaultProfile);
  };

  const signUp = async (
    email: string,
    password?: string,
    displayName?: string
  ): Promise<{ error?: string }> => {
    try {
      if (!isSupabaseConfigured) {
        // Local account simulation when Supabase credentials are not yet set
        const newId = ensureUUID();
        const newProfile: UserProfile = {
          id: newId,
          email,
          display_name: displayName || email.split('@')[0] || 'My Life Reset',
          planning_capacity: user.planning_capacity || 'steady',
          preferred_planning_time: user.preferred_planning_time || 'morning',
          onboarding_completed: true,
          created_at: new Date().toISOString(),
        };

        setUser(newProfile);
        setIsAuthenticated(true);
        await db.set('profile', newProfile);
        await syncEngine.migrateGuestData(newId);
        syncEngine.setUserId(newId);
        return {};
      }

      if (!password) {
        return { error: 'Password is required to create an account.' };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || email.split('@')[0],
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        const newUserId = data.user.id;
        const newProfile: UserProfile = {
          id: newUserId,
          email: data.user.email || email,
          display_name: displayName || email.split('@')[0] || 'My Life Reset',
          planning_capacity: user.planning_capacity || 'steady',
          preferred_planning_time: user.preferred_planning_time || 'morning',
          onboarding_completed: true,
          created_at: new Date().toISOString(),
        };

        setUser(newProfile);
        setIsAuthenticated(true);
        await db.set('profile', newProfile);

        // Crucial: Migrate all guest records to the new user ID
        await syncEngine.migrateGuestData(newUserId);
        syncEngine.setUserId(newUserId);
      }

      return {};
    } catch (err: any) {
      return { error: err?.message || 'Failed to sign up.' };
    }
  };

  const signIn = async (email: string, password?: string): Promise<{ error?: string }> => {
    try {
      if (!isSupabaseConfigured) {
        const existingStored = await db.get<UserProfile>('profile', defaultProfile);
        const resolvedId = existingStored.id && existingStored.id !== 'local_user' ? existingStored.id : ensureUUID();
        const updatedProfile: UserProfile = {
          ...existingStored,
          id: resolvedId,
          email,
          display_name: existingStored.display_name || email.split('@')[0],
        };
        setUser(updatedProfile);
        setIsAuthenticated(true);
        await db.set('profile', updatedProfile);
        await syncEngine.migrateGuestData(resolvedId);
        syncEngine.setUserId(resolvedId);
        return {};
      }

      if (!password) {
        return { error: 'Password is required to sign in.' };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        const userId = data.user.id;
        setIsAuthenticated(true);
        syncEngine.setUserId(userId);

        // Migrate local guest entries if any existed prior to login
        await syncEngine.migrateGuestData(userId);

        // Pull any remote data existing on the account
        await syncEngine.pullRemoteData(userId);

        // Refresh profile
        const { data: remoteProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        const updatedProfile: UserProfile = {
          id: userId,
          email: data.user.email || email,
          display_name:
            remoteProfile?.display_name ||
            data.user.user_metadata?.display_name ||
            email.split('@')[0],
          planning_capacity: remoteProfile?.planning_capacity || 'steady',
          preferred_planning_time: remoteProfile?.preferred_planning_time || 'morning',
          onboarding_completed: true,
          created_at: remoteProfile?.created_at || new Date().toISOString(),
        };

        setUser(updatedProfile);
        await db.set('profile', updatedProfile);
      }

      return {};
    } catch (err: any) {
      return { error: err?.message || 'Failed to sign in.' };
    }
  };

  const signOut = async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch {}

    // Return to local guest state without wiping the customer's planner data!
    setIsAuthenticated(false);
    syncEngine.setUserId(null);
  };

  const resetPassword = async (email: string): Promise<{ error?: string }> => {
    if (!isSupabaseConfigured) {
      return {};
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) return { error: error.message };
      return {};
    } catch (err: any) {
      return { error: err?.message || 'Failed to send password reset.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isDemo: false,
        isAuthenticated,
        entitlement: defaultEntitlement,
        updateProfile,
        resetProfile,
        signIn,
        signUp,
        signOut,
        enterDemoMode: () => {},
        deleteAccount,
        resetPassword,
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
