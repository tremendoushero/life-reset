import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const ProtectedRoute: React.FC = () => {
  const { user, loading, isDemo } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold animate-pulse">
            LR
          </div>
          <p className="text-xs text-espresso-400 font-medium">Entering your space...</p>
        </div>
      </div>
    );
  }

  // Allow if real user exists or user is exploring in demo mode
  if (!user && !isDemo) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

