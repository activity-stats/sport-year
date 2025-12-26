import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ActivityType } from '../types';

export interface TitlePattern {
  pattern: string;
  excludeFromHighlights: boolean;
  excludeFromStats: boolean;
}

export interface DistanceFilter {
  id: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | '±' | '=';
  value: number;
  unit: 'km' | 'mi';
}

export interface ActivityTypeFilter {
  activityType: ActivityType;
  distanceFilters: DistanceFilter[];
  titlePatterns: string[];
}

export type SportBreakdownActivityId =
  | 'cycling-all'
  | 'cycling-outdoor'
  | 'cycling-virtual'
  | 'running'
  | 'swimming'
  | 'walking'
  | 'hiking'
  | 'triathlon';

export interface SportBreakdownActivity {
  id: SportBreakdownActivityId;
  label: string;
  icon: string;
  gradient: string;
  stravaTypes: ActivityType[];
  enabled: boolean;
  order: number;
  includeInStats: boolean;
  includeInHighlights: boolean;
  // Special handling
  specialType?: 'triathlon' | 'bike-category';
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
  | 'maxSpeed'
  | 'calories';

export interface StatOption {
  id: StatType;
  label: string;
  description: string;
  enabled: boolean;
}

interface SportBreakdownSettings {
  activities: SportBreakdownActivity[];
}

interface YearInReviewSettings {
  backgroundImageUrl: string | null;
  backgroundImagePosition: { x: number; y: number; scale: number };
  excludedActivityTypes: ActivityType[];
  excludeVirtualPerSport: {
    cycling: { highlights: boolean; stats: boolean };
    running: { highlights: boolean; stats: boolean };
    swimming: { highlights: boolean; stats: boolean };
  };
  titleIgnorePatterns: TitlePattern[];
  highlightStats: StatType[];
  activityTypeSettings: {
    order: ActivityType[];
    includeInStats: ActivityType[];
    includeInHighlights: ActivityType[];
  };
  specialOptions: {
    enableTriathlonHighlights: boolean;
    mergeCycling: boolean;
  };
  activityFilters: ActivityTypeFilter[];
}

interface SettingsState {
  yearInReview: YearInReviewSettings;
  sportBreakdown: SportBreakdownSettings;
  setBackgroundImage: (url: string | null) => void;
  setBackgroundImagePosition: (position: { x: number; y: number; scale: number }) => void;
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
  // Activity Type Management
  reorderActivityTypes: (types: ActivityType[]) => void;
  toggleActivityInStats: (type: ActivityType) => void;
  toggleActivityInHighlights: (type: ActivityType) => void;
  toggleTriathlonHighlights: () => void;
  toggleMergeCycling: () => void;
  // Activity Filters
  addActivityFilter: (activityType: ActivityType) => void;
  removeActivityFilter: (activityType: ActivityType) => void;
  addDistanceFilter: (activityType: ActivityType, filter: DistanceFilter) => void;
  removeDistanceFilter: (activityType: ActivityType, filterId: string) => void;
  addTitleFilter: (activityType: ActivityType, pattern: string) => void;
  removeTitleFilter: (activityType: ActivityType, pattern: string) => void;
  initializeDefaultFilters: () => void;
  // Sport Breakdown methods
  toggleSportActivity: (id: SportBreakdownActivityId) => void;
  reorderSportActivities: (activities: SportBreakdownActivity[]) => void;
  toggleSportActivityInStats: (id: SportBreakdownActivityId) => void;
  toggleSportActivityInHighlights: (id: SportBreakdownActivityId) => void;
  resetSportBreakdown: () => void;
}

const defaultSportBreakdown: SportBreakdownSettings = {
  activities: [
    {
      id: 'cycling-all',
      label: 'Cycling (All)',
      icon: '🚴',
      gradient: 'from-blue-500 to-cyan-500',
      stravaTypes: ['Ride', 'VirtualRide'],
      enabled: true,
      order: 0,
      includeInStats: true,
      includeInHighlights: true,
      specialType: 'bike-category',
    },
    {
      id: 'running',
      label: 'Running',
      icon: '🏃',
      gradient: 'from-orange-500 to-red-500',
      stravaTypes: ['Run'],
      enabled: true,
      order: 1,
      includeInStats: true,
      includeInHighlights: true,
    },
    {
      id: 'swimming',
      label: 'Swimming',
      icon: '🏊',
      gradient: 'from-teal-500 to-blue-500',
      stravaTypes: ['Swim'],
      enabled: true,
      order: 2,
      includeInStats: true,
      includeInHighlights: true,
    },
    {
      id: 'cycling-outdoor',
      label: 'Cycling (Outdoor)',
      icon: '🚴',
      gradient: 'from-blue-600 to-blue-800',
      stravaTypes: ['Ride'],
      enabled: false,
      order: 3,
      includeInStats: true,
      includeInHighlights: true,
      specialType: 'bike-category',
    },
    {
      id: 'cycling-virtual',
      label: 'Cycling (Virtual)',
      icon: '🚴‍♂️',
      gradient: 'from-purple-500 to-indigo-600',
      stravaTypes: ['VirtualRide'],
      enabled: false,
      order: 4,
      includeInStats: true,
      includeInHighlights: true,
      specialType: 'bike-category',
    },
    {
      id: 'walking',
      label: 'Walking',
      icon: '🚶',
      gradient: 'from-green-500 to-emerald-600',
      stravaTypes: ['Walk'],
      enabled: false,
      order: 5,
      includeInStats: true,
      includeInHighlights: true,
    },
    {
      id: 'hiking',
      label: 'Hiking',
      icon: '🥾',
      gradient: 'from-amber-600 to-orange-700',
      stravaTypes: ['Hike'],
      enabled: false,
      order: 6,
      includeInStats: true,
      includeInHighlights: true,
    },
    {
      id: 'triathlon',
      label: 'Triathlon',
      icon: '🏊🚴🏃',
      gradient: 'from-pink-500 via-purple-500 to-indigo-600',
      stravaTypes: ['Run', 'Ride', 'Swim'],
      enabled: false,
      order: 7,
      includeInStats: true,
      includeInHighlights: true,
      specialType: 'triathlon',
    },
  ],
};

const defaultSettings: YearInReviewSettings = {
  backgroundImageUrl: null,
  backgroundImagePosition: { x: 50, y: 50, scale: 1 },
  excludedActivityTypes: [],
  excludeVirtualPerSport: {
    cycling: { highlights: false, stats: false },
    running: { highlights: false, stats: false },
    swimming: { highlights: false, stats: false },
  },
  titleIgnorePatterns: [],
  highlightStats: ['hours', 'daysActive', 'distance', 'elevation'],
  activityTypeSettings: {
    order: ['Run', 'Ride', 'VirtualRide', 'Swim', 'Walk', 'Hike'],
    includeInStats: ['Run', 'Ride', 'VirtualRide', 'Swim', 'Walk', 'Hike'],
    includeInHighlights: ['Run', 'Ride', 'VirtualRide', 'Swim', 'Walk', 'Hike'],
  },
  specialOptions: {
    enableTriathlonHighlights: true,
    mergeCycling: false,
  },
  activityFilters: [],
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
  calories: {
    id: 'calories',
    label: 'Calories Burned',
    description: 'Total calories burned across all activities',
  },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      yearInReview: defaultSettings,
      sportBreakdown: defaultSportBreakdown,

      setBackgroundImage: (url) =>
        set((state) => ({
          yearInReview: { ...state.yearInReview, backgroundImageUrl: url },
        })),

      setBackgroundImagePosition: (position) =>
        set((state) => ({
          yearInReview: { ...state.yearInReview, backgroundImagePosition: position },
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
          const current = state.yearInReview.highlightStats || [
            'hours',
            'daysActive',
            'distance',
            'elevation',
          ];
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

      // Activity Type Management
      reorderActivityTypes: (types) =>
        set((state) => ({
          yearInReview: {
            ...state.yearInReview,
            activityTypeSettings: {
              ...state.yearInReview.activityTypeSettings,
              order: types,
            },
          },
        })),

      toggleActivityInStats: (type) =>
        set((state) => {
          const current = state.yearInReview.activityTypeSettings.includeInStats;
          const updated = current.includes(type)
            ? current.filter((t) => t !== type)
            : [...current, type];
          return {
            yearInReview: {
              ...state.yearInReview,
              activityTypeSettings: {
                ...state.yearInReview.activityTypeSettings,
                includeInStats: updated,
              },
            },
          };
        }),

      toggleActivityInHighlights: (type) =>
        set((state) => {
          const current = state.yearInReview.activityTypeSettings.includeInHighlights;
          const updated = current.includes(type)
            ? current.filter((t) => t !== type)
            : [...current, type];
          return {
            yearInReview: {
              ...state.yearInReview,
              activityTypeSettings: {
                ...state.yearInReview.activityTypeSettings,
                includeInHighlights: updated,
              },
            },
          };
        }),

      toggleTriathlonHighlights: () =>
        set((state) => ({
          yearInReview: {
            ...state.yearInReview,
            specialOptions: {
              ...state.yearInReview.specialOptions,
              enableTriathlonHighlights:
                !state.yearInReview.specialOptions.enableTriathlonHighlights,
            },
          },
        })),

      toggleMergeCycling: () =>
        set((state) => ({
          yearInReview: {
            ...state.yearInReview,
            specialOptions: {
              ...state.yearInReview.specialOptions,
              mergeCycling: !state.yearInReview.specialOptions.mergeCycling,
            },
          },
        })),

      // Activity Filters
      addActivityFilter: (activityType) =>
        set((state) => {
          if (state.yearInReview.activityFilters.some((f) => f.activityType === activityType)) {
            return state;
          }
          return {
            yearInReview: {
              ...state.yearInReview,
              activityFilters: [
                ...state.yearInReview.activityFilters,
                { activityType, distanceFilters: [], titlePatterns: [] },
              ],
            },
          };
        }),

      removeActivityFilter: (activityType) =>
        set((state) => ({
          yearInReview: {
            ...state.yearInReview,
            activityFilters: state.yearInReview.activityFilters.filter(
              (f) => f.activityType !== activityType
            ),
          },
        })),

      addDistanceFilter: (activityType, filter) =>
        set((state) => ({
          yearInReview: {
            ...state.yearInReview,
            activityFilters: state.yearInReview.activityFilters.map((f) =>
              f.activityType === activityType
                ? { ...f, distanceFilters: [...f.distanceFilters, filter] }
                : f
            ),
          },
        })),

      removeDistanceFilter: (activityType, filterId) =>
        set((state) => ({
          yearInReview: {
            ...state.yearInReview,
            activityFilters: state.yearInReview.activityFilters.map((f) =>
              f.activityType === activityType
                ? {
                    ...f,
                    distanceFilters: f.distanceFilters.filter((df) => df.id !== filterId),
                  }
                : f
            ),
          },
        })),

      addTitleFilter: (activityType, pattern) =>
        set((state) => ({
          yearInReview: {
            ...state.yearInReview,
            activityFilters: state.yearInReview.activityFilters.map((f) =>
              f.activityType === activityType
                ? { ...f, titlePatterns: [...f.titlePatterns, pattern] }
                : f
            ),
          },
        })),

      removeTitleFilter: (activityType, pattern) =>
        set((state) => ({
          yearInReview: {
            ...state.yearInReview,
            activityFilters: state.yearInReview.activityFilters.map((f) =>
              f.activityType === activityType
                ? { ...f, titlePatterns: f.titlePatterns.filter((p) => p !== pattern) }
                : f
            ),
          },
        })),

      initializeDefaultFilters: () =>
        set((state) => {
          // Only initialize if no filters exist yet
          if (state.yearInReview.activityFilters.length > 0) {
            return state;
          }

          // Default distance filters
          const defaultFilters: ActivityTypeFilter[] = [
            {
              activityType: 'Run',
              distanceFilters: [
                { id: 'default-run-5', operator: '±', value: 5, unit: 'km' },
                { id: 'default-run-10', operator: '±', value: 10, unit: 'km' },
                { id: 'default-run-15', operator: '±', value: 15, unit: 'km' },
                { id: 'default-run-21', operator: '±', value: 21, unit: 'km' },
                { id: 'default-run-42', operator: '±', value: 42, unit: 'km' },
              ],
              titlePatterns: [],
            },
            {
              activityType: 'Ride',
              distanceFilters: [
                { id: 'default-ride-40', operator: '±', value: 40, unit: 'km' },
                { id: 'default-ride-50', operator: '±', value: 50, unit: 'km' },
                { id: 'default-ride-90', operator: '±', value: 90, unit: 'km' },
                { id: 'default-ride-100', operator: '±', value: 100, unit: 'km' },
                { id: 'default-ride-150', operator: '±', value: 150, unit: 'km' },
                { id: 'default-ride-200', operator: '±', value: 200, unit: 'km' },
              ],
              titlePatterns: [],
            },
            {
              activityType: 'VirtualRide',
              distanceFilters: [
                { id: 'default-vride-40', operator: '±', value: 40, unit: 'km' },
                { id: 'default-vride-50', operator: '±', value: 50, unit: 'km' },
                { id: 'default-vride-90', operator: '±', value: 90, unit: 'km' },
                { id: 'default-vride-100', operator: '±', value: 100, unit: 'km' },
                { id: 'default-vride-150', operator: '±', value: 150, unit: 'km' },
                { id: 'default-vride-200', operator: '±', value: 200, unit: 'km' },
              ],
              titlePatterns: [],
            },
            {
              activityType: 'Swim',
              distanceFilters: [
                { id: 'default-swim-0.5', operator: '±', value: 0.5, unit: 'km' },
                { id: 'default-swim-1', operator: '±', value: 1, unit: 'km' },
                { id: 'default-swim-1.5', operator: '±', value: 1.5, unit: 'km' },
                { id: 'default-swim-2', operator: '±', value: 2, unit: 'km' },
              ],
              titlePatterns: [],
            },
          ];

          return {
            yearInReview: {
              ...state.yearInReview,
              activityFilters: defaultFilters,
            },
          };
        }),

      // Sport Breakdown methods
      toggleSportActivity: (id) =>
        set((state) => ({
          sportBreakdown: {
            ...state.sportBreakdown,
            activities: state.sportBreakdown.activities.map((a) =>
              a.id === id ? { ...a, enabled: !a.enabled } : a
            ),
          },
        })),

      reorderSportActivities: (activities) =>
        set((state) => ({
          sportBreakdown: {
            ...state.sportBreakdown,
            activities: activities.map((a, index) => ({ ...a, order: index })),
          },
        })),

      toggleSportActivityInStats: (id) =>
        set((state) => ({
          sportBreakdown: {
            ...state.sportBreakdown,
            activities: state.sportBreakdown.activities.map((a) =>
              a.id === id ? { ...a, includeInStats: !a.includeInStats } : a
            ),
          },
        })),

      toggleSportActivityInHighlights: (id) =>
        set((state) => ({
          sportBreakdown: {
            ...state.sportBreakdown,
            activities: state.sportBreakdown.activities.map((a) =>
              a.id === id ? { ...a, includeInHighlights: !a.includeInHighlights } : a
            ),
          },
        })),

      resetSportBreakdown: () =>
        set(() => ({
          sportBreakdown: defaultSportBreakdown,
        })),
    }),
    {
      name: 'sport-year-settings',
      version: 5,
      migrate: (persistedState: any, version: number) => {
        let state = persistedState;
        if (version < 2) {
          state = {
            ...state,
            sportBreakdown: defaultSportBreakdown,
          };
        }
        if (version < 3) {
          state = {
            ...state,
            yearInReview: {
              ...state.yearInReview,
              backgroundImagePosition: { x: 50, y: 50, scale: 1 },
            },
          };
        }
        if (version < 4) {
          // Add new activity management and filtering features with default filters
          const defaultFilters = [
            {
              activityType: 'Run',
              distanceFilters: [
                { id: 'default-run-5', operator: '±', value: 5, unit: 'km' },
                { id: 'default-run-10', operator: '±', value: 10, unit: 'km' },
                { id: 'default-run-15', operator: '±', value: 15, unit: 'km' },
                { id: 'default-run-21', operator: '±', value: 21, unit: 'km' },
                { id: 'default-run-42', operator: '±', value: 42, unit: 'km' },
              ],
              titlePatterns: [],
            },
            {
              activityType: 'Ride',
              distanceFilters: [
                { id: 'default-ride-40', operator: '±', value: 40, unit: 'km' },
                { id: 'default-ride-50', operator: '±', value: 50, unit: 'km' },
                { id: 'default-ride-90', operator: '±', value: 90, unit: 'km' },
                { id: 'default-ride-100', operator: '±', value: 100, unit: 'km' },
                { id: 'default-ride-150', operator: '±', value: 150, unit: 'km' },
                { id: 'default-ride-200', operator: '±', value: 200, unit: 'km' },
              ],
              titlePatterns: [],
            },
            {
              activityType: 'VirtualRide',
              distanceFilters: [
                { id: 'default-vride-40', operator: '±', value: 40, unit: 'km' },
                { id: 'default-vride-50', operator: '±', value: 50, unit: 'km' },
                { id: 'default-vride-90', operator: '±', value: 90, unit: 'km' },
                { id: 'default-vride-100', operator: '±', value: 100, unit: 'km' },
                { id: 'default-vride-150', operator: '±', value: 150, unit: 'km' },
                { id: 'default-vride-200', operator: '±', value: 200, unit: 'km' },
              ],
              titlePatterns: [],
            },
            {
              activityType: 'Swim',
              distanceFilters: [
                { id: 'default-swim-0.5', operator: '±', value: 0.5, unit: 'km' },
                { id: 'default-swim-1', operator: '±', value: 1, unit: 'km' },
                { id: 'default-swim-1.5', operator: '±', value: 1.5, unit: 'km' },
                { id: 'default-swim-2', operator: '±', value: 2, unit: 'km' },
              ],
              titlePatterns: [],
            },
          ];

          state = {
            ...state,
            yearInReview: {
              ...state.yearInReview,
              activityTypeSettings: {
                order: ['Run', 'Ride', 'VirtualRide', 'Swim', 'Walk', 'Hike'],
                includeInStats: ['Run', 'Ride', 'VirtualRide', 'Swim', 'Walk', 'Hike'],
                includeInHighlights: ['Run', 'Ride', 'VirtualRide', 'Swim', 'Walk', 'Hike'],
              },
              specialOptions: {
                enableTriathlonHighlights: true,
                mergeCycling: false,
              },
              activityFilters: defaultFilters,
            },
            sportBreakdown: {
              ...state.sportBreakdown,
              activities: state.sportBreakdown.activities.map((a: any) => ({
                ...a,
                includeInStats: a.includeInStats ?? true,
                includeInHighlights: a.includeInHighlights ?? true,
              })),
            },
          };
        }
        if (version < 5) {
          // Update default filters to new distances
          const defaultFilters = [
            {
              activityType: 'Run',
              distanceFilters: [
                { id: 'default-run-5', operator: '±', value: 5, unit: 'km' },
                { id: 'default-run-10', operator: '±', value: 10, unit: 'km' },
                { id: 'default-run-15', operator: '±', value: 15, unit: 'km' },
                { id: 'default-run-21', operator: '±', value: 21, unit: 'km' },
                { id: 'default-run-42', operator: '±', value: 42, unit: 'km' },
              ],
              titlePatterns: [],
            },
            {
              activityType: 'Ride',
              distanceFilters: [
                { id: 'default-ride-40', operator: '±', value: 40, unit: 'km' },
                { id: 'default-ride-50', operator: '±', value: 50, unit: 'km' },
                { id: 'default-ride-90', operator: '±', value: 90, unit: 'km' },
                { id: 'default-ride-100', operator: '±', value: 100, unit: 'km' },
                { id: 'default-ride-150', operator: '±', value: 150, unit: 'km' },
                { id: 'default-ride-200', operator: '±', value: 200, unit: 'km' },
              ],
              titlePatterns: [],
            },
            {
              activityType: 'VirtualRide',
              distanceFilters: [
                { id: 'default-vride-40', operator: '±', value: 40, unit: 'km' },
                { id: 'default-vride-50', operator: '±', value: 50, unit: 'km' },
                { id: 'default-vride-90', operator: '±', value: 90, unit: 'km' },
                { id: 'default-vride-100', operator: '±', value: 100, unit: 'km' },
                { id: 'default-vride-150', operator: '±', value: 150, unit: 'km' },
                { id: 'default-vride-200', operator: '±', value: 200, unit: 'km' },
              ],
              titlePatterns: [],
            },
            {
              activityType: 'Swim',
              distanceFilters: [
                { id: 'default-swim-0.5', operator: '±', value: 0.5, unit: 'km' },
                { id: 'default-swim-1', operator: '±', value: 1, unit: 'km' },
                { id: 'default-swim-1.5', operator: '±', value: 1.5, unit: 'km' },
                { id: 'default-swim-2', operator: '±', value: 2, unit: 'km' },
              ],
              titlePatterns: [],
            },
          ];

          state = {
            ...state,
            yearInReview: {
              ...state.yearInReview,
              activityFilters: defaultFilters,
            },
          };
        }
        return state;
      },
    }
  )
);
