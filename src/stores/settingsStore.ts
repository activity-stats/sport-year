import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ActivityType } from '../types';

export interface TitlePattern {
  pattern: string;
  excludeFromHighlights: boolean;
  excludeFromStats: boolean;
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
