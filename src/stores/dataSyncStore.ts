import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DataSyncState {
  // Track last activity timestamp for each year
  lastActivityTimestamps: Record<number, number>;
  // Track last sync time for each year
  lastSyncTimes: Record<number, number>;

  setLastActivityTimestamp: (year: number, timestamp: number) => void;
  getLastActivityTimestamp: (year: number) => number | undefined;
  setLastSyncTime: (year: number, timestamp: number) => void;
  getLastSyncTime: (year: number) => number | undefined;
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
            [year]: timestamp,
          },
        }));
      },

      getLastActivityTimestamp: (year) => {
        return get().lastActivityTimestamps[year];
      },

      setLastSyncTime: (year, timestamp) => {
        set((state) => ({
          lastSyncTimes: {
            ...state.lastSyncTimes,
            [year]: timestamp,
          },
        }));
      },

      getLastSyncTime: (year) => {
        return get().lastSyncTimes[year];
      },

      clearData: () => {
        set({
          lastActivityTimestamps: {},
          lastSyncTimes: {},
        });
      },
    }),
    {
      name: 'sport-year-data-sync',
    }
  )
);
