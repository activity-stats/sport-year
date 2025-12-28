import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useMocks = typeof import.meta !== 'undefined' && import.meta.env?.VITE_USE_MOCKS === 'true';

type YearKey = number | 'last365';

interface DataSyncState {
  // Track last activity timestamp for each year or 'last365'
  lastActivityTimestamps: Record<string, number>;
  // Track last sync time for each year or 'last365'
  lastSyncTimes: Record<string, number>;

  setLastActivityTimestamp: (year: YearKey, timestamp: number) => void;
  getLastActivityTimestamp: (year: YearKey) => number | undefined;
  setLastSyncTime: (year: YearKey, timestamp: number) => void;
  getLastSyncTime: (year: YearKey) => number | undefined;
  clearData: () => void;
}

export const useDataSyncStore = create<DataSyncState>()(
  persist(
    (set, get) => ({
      lastActivityTimestamps: {},
      lastSyncTimes: {},

      setLastActivityTimestamp: (year, timestamp) => {
        set((state) => ({
          lastActivityTimestamps: {
            ...state.lastActivityTimestamps,
            [year.toString()]: timestamp,
          },
        }));
      },

      getLastActivityTimestamp: (year) => {
        return get().lastActivityTimestamps[year.toString()];
      },

      setLastSyncTime: (year, timestamp) => {
        set((state) => ({
          lastSyncTimes: {
            ...state.lastSyncTimes,
            [year.toString()]: timestamp,
          },
        }));
      },

      getLastSyncTime: (year) => {
        return get().lastSyncTimes[year.toString()];
      },

      clearData: () => {
        set({
          lastActivityTimestamps: {},
          lastSyncTimes: {},
        });
      },
    }),
    {
      name: useMocks ? 'sport-year-data-sync-demo' : 'sport-year-data-sync',
    }
  )
);
