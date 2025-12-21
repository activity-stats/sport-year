import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ActivityType } from '../types';

export interface TitlePattern {
  pattern: string;
  excludeFromHighlights: boolean;
  excludeFromStats: boolean;
}

export type StatType =
  | 'daysActive'
  | 'hours'
  | 'distance'
  | 'elevation'
  | 'activities'
  | 'avgSpeed'
  | 'longestActivity'
  | 'biggestClimb'
  | 'avgHeartRate'
  | 'maxSpeed';

export interface StatOption {
  id: StatType;
  label: string;
  description: string;
  enabled: boolean;
}

interface YearInReviewSettings {
  backgroundImageUrl: string | null;
  excludedActivityTypes: ActivityType[];
  excludeVirtualPerSport: {
    cycling: { highlights: boolean; stats: boolean };
    running: { highlights: boolean; stats: boolean };
    swimming: { highlights: boolean; stats: boolean };
  };
  titleIgnorePatterns: TitlePattern[];
  highlightStats: StatType[];
}

interface SettingsState {
  yearInReview: YearInReviewSettings;
  setBackgroundImage: (url: string | null) => void;
  toggleActivityType: (type: ActivityType) => void;
  selectAllActivityTypes: () => void;
  deselectAllActivityTypes: (types: ActivityType[]) => void;
  toggleExcludeVirtual: (
    sport: 'cycling' | 'running' | 'swimming',
    target: 'highlights' | 'stats'
  ) => void;
  addIgnorePattern: (pattern: string) => void;
  updateIgnorePattern: (oldPattern: string, updates: Partial<TitlePattern>) => void;
  removeIgnorePattern: (pattern: string) => void;
  toggleHighlightStat: (stat: StatType) => void;
  setHighlightStats: (stats: StatType[]) => void;
  resetYearInReview: () => void;
}

const defaultSettings: YearInReviewSettings = {
  backgroundImageUrl: null,
  excludedActivityTypes: [],
  excludeVirtualPerSport: {
    cycling: { highlights: false, stats: false },
    running: { highlights: false, stats: false },
    swimming: { highlights: false, stats: false },
  },
  titleIgnorePatterns: [],
  highlightStats: ['hours', 'daysActive', 'distance', 'elevation'],
};

export const AVAILABLE_STATS: Record<StatType, Omit<StatOption, 'enabled'>> = {
  daysActive: {
    id: 'daysActive',
    label: 'Days Active',
    description: 'Total number of days you had at least one activity',
  },
  hours: {
    id: 'hours',
    label: 'Active Hours',
    description: 'Total time spent on activities',
  },
  distance: {
    id: 'distance',
    label: 'Distance',
    description: 'Total distance covered in kilometers',
  },
  elevation: {
    id: 'elevation',
    label: 'Climbing',
    description: 'Total elevation gain in meters',
  },
  activities: {
    id: 'activities',
    label: 'Activities',
    description: 'Total number of activities completed',
  },
  avgSpeed: {
    id: 'avgSpeed',
    label: 'Avg Speed',
    description: 'Average speed across all activities',
  },
  longestActivity: {
    id: 'longestActivity',
    label: 'Longest Activity',
    description: 'Distance of your longest single activity',
  },
  biggestClimb: {
    id: 'biggestClimb',
    label: 'Biggest Climb',
    description: 'Elevation gain of your toughest climb',
  },
  avgHeartRate: {
    id: 'avgHeartRate',
    label: 'Avg Heart Rate',
    description: 'Average heart rate across activities (if available)',
  },
  maxSpeed: {
    id: 'maxSpeed',
    label: 'Max Speed',
    description: 'Maximum speed achieved',
  },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      yearInReview: defaultSettings,

      setBackgroundImage: (url) =>
        set((state) => ({
          yearInReview: { ...state.yearInReview, backgroundImageUrl: url },
        })),

      toggleActivityType: (type) =>
        set((state) => {
          const current = state.yearInReview.excludedActivityTypes;
          const updated = current.includes(type)
            ? current.filter((t) => t !== type)
            : [...current, type];
          return {
            yearInReview: { ...state.yearInReview, excludedActivityTypes: updated },
          };
        }),

      selectAllActivityTypes: () =>
        set((state) => ({
          yearInReview: { ...state.yearInReview, excludedActivityTypes: [] },
        })),

      deselectAllActivityTypes: (types) =>
        set((state) => ({
          yearInReview: { ...state.yearInReview, excludedActivityTypes: types },
        })),

      toggleExcludeVirtual: (sport, target) =>
        set((state) => ({
          yearInReview: {
            ...state.yearInReview,
            excludeVirtualPerSport: {
              ...state.yearInReview.excludeVirtualPerSport,
              [sport]: {
                ...state.yearInReview.excludeVirtualPerSport[sport],
                [target]: !state.yearInReview.excludeVirtualPerSport[sport][target],
              },
            },
          },
        })),

      addIgnorePattern: (pattern) =>
        set((state) => {
          if (
            !pattern.trim() ||
            state.yearInReview.titleIgnorePatterns.some((p) => p.pattern === pattern.trim())
          ) {
            return state;
          }
          return {
            yearInReview: {
              ...state.yearInReview,
              titleIgnorePatterns: [
                ...state.yearInReview.titleIgnorePatterns,
                { pattern: pattern.trim(), excludeFromHighlights: true, excludeFromStats: false },
              ],
            },
          };
        }),

      updateIgnorePattern: (oldPattern, updates) =>
        set((state) => ({
          yearInReview: {
            ...state.yearInReview,
            titleIgnorePatterns: state.yearInReview.titleIgnorePatterns.map((p) =>
              p.pattern === oldPattern ? { ...p, ...updates } : p
            ),
          },
        })),

      removeIgnorePattern: (pattern) =>
        set((state) => ({
          yearInReview: {
            ...state.yearInReview,
            titleIgnorePatterns: state.yearInReview.titleIgnorePatterns.filter(
              (p) => p.pattern !== pattern
            ),
          },
        })),

      toggleHighlightStat: (stat) =>
        set((state) => {
          const current = state.yearInReview.highlightStats || ['hours', 'daysActive', 'distance', 'elevation'];
          const updated = current.includes(stat)
            ? current.filter((s) => s !== stat)
            : [...current, stat];
          return {
            yearInReview: { ...state.yearInReview, highlightStats: updated },
          };
        }),

      setHighlightStats: (stats) =>
        set((state) => ({
          yearInReview: { ...state.yearInReview, highlightStats: stats },
        })),

      resetYearInReview: () =>
        set(() => ({
          yearInReview: defaultSettings,
        })),
    }),
    {
      name: 'sport-year-settings',
    }
  )
);
