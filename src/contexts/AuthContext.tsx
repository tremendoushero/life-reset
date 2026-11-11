import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, Entitlement } from '@/types';
import { db } from '@/lib/indexedDB';
import {
  defaultProfile,
  defaultPreferences,
  defaultHabits,
  defaultDopamineMenu,
  defaultHouseholdTasks,
  defaultTasks,
  defaultBrainDumps,
  defaultGoals,
  defaultProjects,
  defaultHabitLogs,
  defaultMoods,
  defaultEnergies,
  defaultJournals,
  defaultGratitudes,
  defaultFocusSessions,
  defaultCalendarEvents,
  defaultBills,
  defaultTransactions,
  defaultSavings,
  defaultDebts,
  defaultLifeAdmin,
  defaultFollowUps,
  defaultHouseholdInventory,
  defaultWeeklyReviews,
  defaultMonthlyReviews,
} from '@/lib/starterData';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { syncEngine } from '@/lib/syncEngine';

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
        if (isSupabaseConfigured) {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.warn('Supabase getSession error:', error.message);
          }

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
              email: session.user.email || '',
              display_name:
                remoteProfile?.display_name ||
                session.user.user_metadata?.display_name ||
                session.user.email?.split('@')[0] ||
                'My Life Reset',
              planning_capacity: remoteProfile?.planning_capacity || 'steady',
              preferred_planning_time: remoteProfile?.preferred_planning_time || 'morning',
              onboarding_completed: true,
              created_at: remoteProfile?.created_at || new Date().toISOString(),
            };

            setUser(profileToSet);
            await db.set('profile', profileToSet);

            // Restore any stashed pending mutations from prior sign-out
            await db.restoreUserStash(session.user.id);
            await syncEngine.flushQueue(session.user.id);

            // Pull cloud data into local storage
            await syncEngine.pullRemoteData(session.user.id);
            return;
          }
        }

        // If no active session or not logged in, check stored profile
        const stored = await db.get<UserProfile>('profile', defaultProfile);
        if (isMounted) {
          if (stored && stored.id && stored.id !== 'local_user') {
            // User was previously authenticated on this device; preserve their identity offline
            console.log('[AuthContext 📱] Preserving authenticated user session offline:', stored.id);
            setUser(stored);
            setIsAuthenticated(true);
            await db.restoreUserStash(stored.id);
            syncEngine.setUserId(stored.id);
          } else {
            setUser(stored || defaultProfile);
            setIsAuthenticated(false);
            syncEngine.setUserId(null);
          }
        }
      } catch (err) {
        console.warn('Auth initialization exception:', err);
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
          await syncEngine.migrateGuestData(session.user.id);
          await syncEngine.pullRemoteData(session.user.id);
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
    setUser((prev) => {
      const updated: UserProfile = { ...prev, ...updates };
      db.set('profile', updated).catch((err) => console.error('Failed to save profile:', err));
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
    await signOut();
  };

  const signUp = async (
    email: string,
    password?: string,
    displayName?: string
  ): Promise<{ error?: string }> => {
    if (!isSupabaseConfigured) {
      return {
        error: 'Supabase credentials are not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.',
      };
    }

    if (!email || !email.includes('@')) {
      return { error: 'Please enter a valid email address.' };
    }

    if (!password || password.length < 6) {
      return { error: 'Password must be at least 6 characters long.' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: displayName?.trim() || email.split('@')[0],
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        // Check if user already exists (Supabase returns empty identities array when user already exists)
        if (data.user.identities && data.user.identities.length === 0) {
          return { error: 'An account with this email already exists. Please sign in instead.' };
        }

        const newUserId = data.user.id;
        const newProfile: UserProfile = {
          id: newUserId,
          email: data.user.email || email,
          display_name: displayName?.trim() || email.split('@')[0] || 'My Life Reset',
          planning_capacity: user.planning_capacity || 'steady',
          preferred_planning_time: user.preferred_planning_time || 'morning',
          onboarding_completed: true,
          created_at: new Date().toISOString(),
        };

        setUser(newProfile);
        setIsAuthenticated(true);
        await db.set('profile', newProfile);

        syncEngine.setUserId(newUserId);
        await syncEngine.migrateGuestData(newUserId);
        await syncEngine.pullRemoteData(newUserId);
      }

      return {};
    } catch (err: any) {
      return { error: err?.message || 'Failed to sign up.' };
    }
  };

  const signIn = async (email: string, password?: string): Promise<{ error?: string }> => {
    if (!isSupabaseConfigured) {
      return {
        error: 'Supabase credentials are not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.',
      };
    }

    if (!email || !email.includes('@')) {
      return { error: 'Please enter a valid email address.' };
    }

    if (!password) {
      return { error: 'Please enter your password.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        const userId = data.user.id;
        syncEngine.setUserId(userId);

        // Fetch remote profile or construct from metadata
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
        setIsAuthenticated(true);
        await db.set('profile', updatedProfile);

        // Restore any stashed pending mutations from prior sign-out
        await db.restoreUserStash(userId);

        // Flush any restored mutations
        await syncEngine.flushQueue(userId);

        // Pull remote data into IndexedDB and notify DataContext
        await syncEngine.pullRemoteData(userId);
      }

      return {};
    } catch (err: any) {
      return { error: err?.message || 'Failed to sign in.' };
    }
  };

  /**
   * Safely signs out of Supabase.
   * If there are pending mutations or local data, safely archives/stashes them
   * under an account-isolated stash slot (`user_stash_${currentId}`) so they
   * are never deleted, lost, or exposed to other accounts.
   */
  const signOut = async () => {
    const currentId = user.id;

    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('SignOut error:', err);
    }

    // Safely stash offline data & pending mutations so they are never lost
    if (currentId && currentId !== 'local_user') {
      console.log(`[AuthContext 🔒] Stashing offline data and pending mutations for user ${currentId}...`);
      await db.stashUserData(currentId);
    }

    setIsAuthenticated(false);
    syncEngine.setUserId(null);

    // Clean active user's data from IndexedDB while PRESERVING user stashes
    await db.clearActiveSession();
    await db.clearQueue();

    // Re-seed starter defaults for guest mode
    await Promise.all([
      db.set('profile', defaultProfile),
      db.set('user_preferences', defaultPreferences),
      db.set('habits', defaultHabits),
      db.set('dopamine', defaultDopamineMenu),
      db.set('household_tasks', defaultHouseholdTasks),
      db.set('tasks', defaultTasks),
      db.set('brain_dumps', defaultBrainDumps),
      db.set('goals', defaultGoals),
      db.set('projects', defaultProjects),
      db.set('habit_logs', defaultHabitLogs),
      db.set('moods', defaultMoods),
      db.set('energies', defaultEnergies),
      db.set('journals', defaultJournals),
      db.set('gratitudes', defaultGratitudes),
      db.set('focus_sessions', defaultFocusSessions),
      db.set('calendar_events', defaultCalendarEvents),
      db.set('bills', defaultBills),
      db.set('transactions', defaultTransactions),
      db.set('savings', defaultSavings),
      db.set('debts', defaultDebts),
      db.set('life_admin', defaultLifeAdmin),
      db.set('follow_ups', defaultFollowUps),
      db.set('household_inv', defaultHouseholdInventory),
      db.set('weekly_reviews', defaultWeeklyReviews),
      db.set('monthly_reviews', defaultMonthlyReviews),
    ]);

    setUser(defaultProfile);

    // Notify DataContext to wipe in-memory collections immediately
    syncEngine.notifyReset();
  };

  const resetPassword = async (email: string): Promise<{ error?: string }> => {
    if (!isSupabaseConfigured) {
      return {
        error: 'Supabase credentials are not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.',
      };
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
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
