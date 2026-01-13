// Auth Context for Operation Hired
// Phase 2: Agency-Based Multi-Tenancy

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  AuthState,
  AgencyUser,
  Agency,
  signIn as authSignIn,
  signOut as authSignOut,
  subscribeToAuthState,
  isAdmin,
  isOwner,
  canManageUsers,
  canModifySettings,
  canCreateCandidates,
  canViewCandidates,
} from '../lib/auth';

// ============================================================================
// Context Types
// ============================================================================

interface AuthContextValue extends AuthState {
  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;

  // Permission helpers
  isAdmin: boolean;
  isOwner: boolean;
  canManageUsers: boolean;
  canModifySettings: boolean;
  canCreateCandidates: boolean;
  canViewCandidates: boolean;
}

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    agencyUser: null,
    agency: null,
    loading: true,
    error: null,
  });

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthState((newState) => {
      setState(newState);
    });

    return unsubscribe;
  }, []);

  // Sign in handler
  const handleSignIn = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await authSignIn(email, password);
      // Auth state will be updated by the subscription
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to sign in',
      }));
      throw error;
    }
  }, []);

  // Sign out handler
  const handleSignOut = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await authSignOut();
      // Auth state will be updated by the subscription
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to sign out',
      }));
      throw error;
    }
  }, []);

  // Compute permissions
  const value: AuthContextValue = {
    ...state,
    signIn: handleSignIn,
    signOut: handleSignOut,
    isAdmin: isAdmin(state.agencyUser),
    isOwner: isOwner(state.agencyUser),
    canManageUsers: canManageUsers(state.agencyUser),
    canModifySettings: canModifySettings(state.agencyUser),
    canCreateCandidates: canCreateCandidates(state.agencyUser),
    canViewCandidates: canViewCandidates(state.agencyUser),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Get current user (throws if not authenticated)
 */
export function useRequireAuth(): {
  user: User;
  agencyUser: AgencyUser;
  agency: Agency;
} {
  const { user, agencyUser, agency, loading, error } = useAuth();

  if (loading) {
    throw new Promise(() => {}); // Suspense-compatible loading
  }

  if (error || !user || !agencyUser || !agency) {
    throw new Error(error || 'Not authenticated');
  }

  return { user, agencyUser, agency };
}

/**
 * Get current agency ID (or null)
 */
export function useAgencyId(): string | null {
  const { agencyUser } = useAuth();
  return agencyUser?.agencyId ?? null;
}

/**
 * Check if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { user, loading } = useAuth();
  return !loading && user !== null;
}
