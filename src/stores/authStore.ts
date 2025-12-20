import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StravaAthlete } from '../types/strava';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  athlete: StravaAthlete | null;

  setTokens: (accessToken: string, refreshToken: string, expiresAt: number) => void;
  setAthlete: (athlete: StravaAthlete) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isTokenExpired: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      athlete: null,

      setTokens: (accessToken, refreshToken, expiresAt) => {
        set({ accessToken, refreshToken, expiresAt });
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
    }),
    {
      name: 'strava-auth-storage',
    }
  )
);
