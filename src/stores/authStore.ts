import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StravaAthlete } from '../types/strava';
import { mockStravaAthlete } from '../mocks/stravaActivities';

// Check if we're in mock mode (demo build)
const useMocks = typeof import.meta !== 'undefined' && import.meta.env?.VITE_USE_MOCKS === 'true';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  athlete: StravaAthlete | null;

  setTokens: (
    accessToken: string,
    refreshToken: string,
    expiresAt: number,
    athlete?: StravaAthlete
  ) => void;
  setAthlete: (athlete: StravaAthlete) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isTokenExpired: () => boolean;
}

// Store configuration function
const storeConfig = (set: any, get: any): AuthState => ({
  // In mock mode, initialize with demo data; otherwise start with null
  accessToken: useMocks ? 'mock_access_token' : null,
  refreshToken: useMocks ? 'mock_refresh_token' : null,
  expiresAt: useMocks ? Math.floor(Date.now() / 1000) + 21600 : null, // 6 hours from now
  athlete: useMocks ? mockStravaAthlete : null,

  setTokens: (accessToken, refreshToken, expiresAt, athlete) => {
    set({ accessToken, refreshToken, expiresAt, athlete: athlete || get().athlete });
  },

  setAthlete: (athlete) => {
    set({ athlete });
  },

  logout: () => {
    set({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      athlete: null,
    });
  },

  isAuthenticated: () => {
    const { accessToken } = get();
    return accessToken !== null;
  },

  isTokenExpired: () => {
    const { expiresAt } = get();
    if (!expiresAt) return true;
    return Date.now() / 1000 >= expiresAt;
  },
});

// In mock mode, skip persist middleware to prevent localStorage interference
// In production mode, use persist middleware for session persistence
export const useAuthStore = useMocks
  ? create<AuthState>()(storeConfig)
  : create<AuthState>()(persist(storeConfig, { name: 'strava-auth-storage' }));
