import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, Entitlement } from '@/types';
import { db } from '@/lib/indexedDB';
import { defaultProfile } from '@/lib/starterData';

interface AuthContextType {
  user: UserProfile;
  loading: boolean;
  isDemo: boolean;
  entitlement: Entitlement;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  resetProfile: () => Promise<void>;
  // Compatible no-op stubs for any residual callers
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
  provider: 'gumroad',
  granted_at: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(defaultProfile);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      try {
        const stored = await db.get<UserProfile>('profile', defaultProfile);
        if (isMounted) {
          setUser(stored || defaultProfile);
        }
      } catch (err) {
        console.warn('Could not load profile from local db, using default:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    setUser(prev => {
      const updated: UserProfile = { ...prev, ...updates };
      db.set('profile', updated).catch(err => console.error('Failed to save profile:', err));
      return updated;
    });
  };

  const resetProfile = async () => {
    setUser(defaultProfile);
    await db.set('profile', defaultProfile);
  };

  const deleteAccount = async () => {
    // In standalone local planner, deleting account wipes local storage back to defaults
    await db.clear();
    setUser(defaultProfile);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isDemo: false,
        entitlement: defaultEntitlement,
        updateProfile,
        resetProfile,
        signIn: async () => ({}),
        signUp: async () => ({}),
        signOut: async () => {},
        enterDemoMode: () => {},
        deleteAccount,
        resetPassword: async () => ({}),
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
