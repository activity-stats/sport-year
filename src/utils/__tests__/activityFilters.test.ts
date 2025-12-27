import { describe, it, expect } from 'vitest';
import { filterActivities, matchesCustomFilters } from '../activityFilters';
import type { Activity } from '../../types';
import type { YearInReviewSettings } from '../../stores/settingsStore';

// Helper to create mock activity
const createActivity = (overrides: Partial<Activity> = {}): Activity => ({
  id: '123',
  name: 'Test Activity',
  type: 'Run',
  date: new Date('2024-01-01T10:00:00Z'),
  distanceKm: 10,
  durationMinutes: 60,
  movingTimeMinutes: 58,
  elevationGainMeters: 100,
  averageSpeedKmh: 10,
  maxSpeedKmh: 12.5,
  polyline: '',
  ...overrides,
});

// Helper to create mock settings
const createSettings = (overrides = {}): YearInReviewSettings => ({
  excludedActivityTypes: [],
  excludeVirtualPerSport: {
    cycling: { highlights: false, stats: false },
    running: { highlights: false, stats: false },
    swimming: { highlights: false, stats: false },
  },
  titleIgnorePatterns: [],
  activityFilters: [],
  backgroundImageUrl: null,
  backgroundImagePosition: { x: 50, y: 50, scale: 1 },
  highlightStats: [],
  activityTypeSettings: {
    order: [],
    includeInStats: [],
    includeInHighlights: [],
  },
  specialOptions: {
    enableTriathlonHighlights: true,
    mergeCycling: false,
  },
  ...overrides,
});

describe('activityFilters', () => {
  describe('filterActivities', () => {
    it('should return all activities when no filters applied', () => {
      const activities = [createActivity(), createActivity({ id: '456', type: 'Ride' })];
      const settings = createSettings();

      const result = filterActivities(activities, settings);

      expect(result).toHaveLength(2);
      expect(result).toEqual(activities);
    });

    it('should filter out excluded activity types', () => {
      const activities = [
        createActivity({ id: '1', type: 'Run' }),
        createActivity({ id: '2', type: 'Ride' }),
        createActivity({ id: '3', type: 'Swim' }),
      ];
      const settings = createSettings({ excludedActivityTypes: ['Ride', 'Swim'] });

      const result = filterActivities(activities, settings);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('Run');
    });

    it('should filter virtual rides when excluded for highlights', () => {
      const activities = [
        createActivity({ id: '1', type: 'VirtualRide' }),
        createActivity({ id: '2', type: 'Ride' }),
      ];
      const settings = createSettings({
        excludeVirtualPerSport: {
          cycling: { highlights: true, stats: false },
          running: { highlights: false, stats: false },
          swimming: { highlights: false, stats: false },
        },
      });

      const result = filterActivities(activities, settings, 'highlights');

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('Ride');
    });

    it('should filter virtual rides when excluded for stats', () => {
      const activities = [
        createActivity({ id: '1', type: 'VirtualRide' }),
        createActivity({ id: '2', type: 'Ride' }),
      ];
      const settings = createSettings({
        excludeVirtualPerSport: {
          cycling: { highlights: false, stats: true },
          running: { highlights: false, stats: false },
          swimming: { highlights: false, stats: false },
        },
      });

      const result = filterActivities(activities, settings, 'stats');

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('Ride');
    });

    it('should not filter virtual rides when included for target', () => {
      const activities = [
        createActivity({ id: '1', type: 'VirtualRide' }),
        createActivity({ id: '2', type: 'Ride' }),
      ];
      const settings = createSettings({
        excludeVirtualPerSport: {
          cycling: { highlights: true, stats: false },
          running: { highlights: false, stats: false },
          swimming: { highlights: false, stats: false },
        },
      });

      const result = filterActivities(activities, settings, 'stats');

      expect(result).toHaveLength(2);
    });

    it('should filter activities by title pattern for highlights', () => {
      const activities = [
        createActivity({ id: '1', name: 'Morning Run' }),
        createActivity({ id: '2', name: 'Test Activity' }),
        createActivity({ id: '3', name: 'Evening Run' }),
      ];
      const settings = createSettings({
        titleIgnorePatterns: [
          { pattern: 'test', excludeFromHighlights: true, excludeFromStats: false },
        ],
      });

      const result = filterActivities(activities, settings, 'highlights');

      expect(result).toHaveLength(2);
      expect(result.find((a) => a.name === 'Test Activity')).toBeUndefined();
    });

    it('should filter activities by title pattern for stats', () => {
      const activities = [
        createActivity({ id: '1', name: 'Morning Run' }),
        createActivity({ id: '2', name: 'Test Activity' }),
      ];
      const settings = createSettings({
        titleIgnorePatterns: [
          { pattern: 'test', excludeFromHighlights: false, excludeFromStats: true },
        ],
      });

      const result = filterActivities(activities, settings, 'stats');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Morning Run');
    });

    it('should not filter by title pattern when target does not match', () => {
      const activities = [createActivity({ name: 'Test Activity' })];
      const settings = createSettings({
        titleIgnorePatterns: [
          { pattern: 'test', excludeFromHighlights: true, excludeFromStats: false },
        ],
      });

      const result = filterActivities(activities, settings, 'stats');

      expect(result).toHaveLength(1);
    });

    it('should be case-insensitive for title patterns', () => {
      const activities = [
        createActivity({ id: '1', name: 'TEST Activity' }),
        createActivity({ id: '2', name: 'test activity' }),
        createActivity({ id: '3', name: 'TeSt AcTiViTy' }),
      ];
      const settings = createSettings({
        titleIgnorePatterns: [
          { pattern: 'test', excludeFromHighlights: true, excludeFromStats: false },
        ],
      });

      const result = filterActivities(activities, settings, 'highlights');

      expect(result).toHaveLength(0);
    });

    it('should apply multiple filters together', () => {
      const activities = [
        createActivity({ id: '1', type: 'Run', name: 'Morning Run' }),
        createActivity({ id: '2', type: 'Ride', name: 'Test Ride' }),
        createActivity({ id: '3', type: 'VirtualRide', name: 'Zwift Ride' }),
        createActivity({ id: '4', type: 'Swim', name: 'Pool Swim' }),
      ];
      const settings = createSettings({
        excludedActivityTypes: ['Swim'],
        excludeVirtualPerSport: {
          cycling: { highlights: true, stats: false },
          running: { highlights: false, stats: false },
          swimming: { highlights: false, stats: false },
        },
        titleIgnorePatterns: [
          { pattern: 'test', excludeFromHighlights: true, excludeFromStats: false },
        ],
      });

      const result = filterActivities(activities, settings, 'highlights');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Morning Run');
    });
  });

  describe('matchesCustomFilters', () => {
    it('should return false when no activity filter exists for type', () => {
      const activity = createActivity({ type: 'Run' });
      const settings = createSettings({
        activityFilters: [
          {
            activityType: 'Ride',
            distanceFilters: [],
            titlePatterns: [],
          },
        ],
      });

      expect(matchesCustomFilters(activity, settings)).toBe(false);
    });

    it('should return true when activity filter exists but no constraints', () => {
      const activity = createActivity({ type: 'Run' });
      const settings = createSettings({
        activityFilters: [
          {
            activityType: 'Run',
            distanceFilters: [],
            titlePatterns: [],
          },
        ],
      });

      expect(matchesCustomFilters(activity, settings)).toBe(true);
    });

    describe('distance filters', () => {
      it('should match gt (greater than) operator', () => {
        const activity = createActivity({ distanceKm: 10 });
        const settings = createSettings({
          activityFilters: [
            {
              activityType: 'Run',
              distanceFilters: [{ operator: 'gt', value: 5, unit: 'km' }],
              titlePatterns: [],
            },
          ],
        });

        expect(matchesCustomFilters(activity, settings)).toBe(true);
      });

      it('should not match gt operator when equal', () => {
        const activity = createActivity({ distanceKm: 10 });
        const settings = createSettings({
          activityFilters: [
            {
              activityType: 'Run',
              distanceFilters: [{ operator: 'gt', value: 10, unit: 'km' }],
              titlePatterns: [],
            },
          ],
        });

        expect(matchesCustomFilters(activity, settings)).toBe(false);
      });

      it('should match gte (greater than or equal) operator', () => {
        const activity = createActivity({ distanceKm: 10 });
        const settings = createSettings({
          activityFilters: [
            {
              activityType: 'Run',
              distanceFilters: [{ operator: 'gte', value: 10, unit: 'km' }],
              titlePatterns: [],
            },
          ],
        });

        expect(matchesCustomFilters(activity, settings)).toBe(true);
      });

      it('should match lt (less than) operator', () => {
        const activity = createActivity({ distanceKm: 5 });
        const settings = createSettings({
          activityFilters: [
            {
              activityType: 'Run',
              distanceFilters: [{ operator: 'lt', value: 10, unit: 'km' }],
              titlePatterns: [],
            },
          ],
        });

        expect(matchesCustomFilters(activity, settings)).toBe(true);
      });

      it('should match lte (less than or equal) operator', () => {
        const activity = createActivity({ distanceKm: 10 });
        const settings = createSettings({
          activityFilters: [
            {
              activityType: 'Run',
              distanceFilters: [{ operator: 'lte', value: 10, unit: 'km' }],
              titlePatterns: [],
            },
          ],
        });

        expect(matchesCustomFilters(activity, settings)).toBe(true);
      });

      it('should match eq operator with 10% tolerance', () => {
        const activity = createActivity({ distanceKm: 10 });
        const settings = createSettings({
          activityFilters: [
            {
              activityType: 'Run',
              distanceFilters: [{ operator: 'eq', value: 10.5, unit: 'km' }],
              titlePatterns: [],
            },
          ],
        });

        expect(matchesCustomFilters(activity, settings)).toBe(true);
      });

      it('should not match eq operator outside 10% tolerance', () => {
        const activity = createActivity({ distanceKm: 10 });
        const settings = createSettings({
          activityFilters: [
            {
              activityType: 'Run',
              distanceFilters: [{ operator: 'eq', value: 12, unit: 'km' }],
              titlePatterns: [],
            },
          ],
        });

        expect(matchesCustomFilters(activity, settings)).toBe(false);
      });

      it('should match ± operator with 5% tolerance', () => {
        const activity = createActivity({ distanceKm: 10 });
        const settings = createSettings({
          activityFilters: [
            {
              activityType: 'Run',
              distanceFilters: [{ operator: '±', value: 10.3, unit: 'km' }],
              titlePatterns: [],
            },
          ],
        });

        expect(matchesCustomFilters(activity, settings)).toBe(true);
      });

      it('should not match ± operator outside 5% tolerance', () => {
        const activity = createActivity({ distanceKm: 10 });
        const settings = createSettings({
          activityFilters: [
            {
              activityType: 'Run',
              distanceFilters: [{ operator: '±', value: 11, unit: 'km' }],
              titlePatterns: [],
            },
          ],
        });

        expect(matchesCustomFilters(activity, settings)).toBe(false);
      });

      it('should match = operator with 0.1 km tolerance', () => {
        const activity = createActivity({ distanceKm: 10 });
        const settings = createSettings({
          activityFilters: [
            {
              activityType: 'Run',
              distanceFilters: [{ operator: '=', value: 10.05, unit: 'km' }],
              titlePatterns: [],
            },
          ],
        });

        expect(matchesCustomFilters(activity, settings)).toBe(true);
      });

      it('should not match = operator outside 0.1 km tolerance', () => {
        const activity = createActivity({ distanceKm: 10 });
        const settings = createSettings({
          activityFilters: [
            {
              activityType: 'Run',
              distanceFilters: [{ operator: '=', value: 10.2, unit: 'km' }],
              titlePatterns: [],
            },
          ],
        });

        expect(matchesCustomFilters(activity, settings)).toBe(false);
      });

      it('should convert miles to km for distance comparison', () => {
        const activity = createActivity({ distanceKm: 10 }); // ~6.21 miles
        const settings = createSettings({
          activityFilters: [
            {
              activityType: 'Run',
              distanceFilters: [{ operator: 'gte', value: 6, unit: 'mi' }],
              titlePatterns: [],
            },
          ],
        });

        expect(matchesCustomFilters(activity, settings)).toBe(true);
      });

      it('should match when at least one distance filter matches', () => {
        const activity = createActivity({ distanceKm: 10 });
        const settings = createSettings({
          activityFilters: [
            {
              activityType: 'Run',
              distanceFilters: [
                { operator: 'lt', value: 5, unit: 'km' }, // doesn't match
                { operator: 'gte', value: 10, unit: 'km' }, // matches
              ],
              titlePatterns: [],
            },
          ],
        });

        expect(matchesCustomFilters(activity, settings)).toBe(true);
      });

      it('should not match when no distance filters match', () => {
        const activity = createActivity({ distanceKm: 10 });
        const settings = createSettings({
          activityFilters: [
            {
              activityType: 'Run',
              distanceFilters: [
                { operator: 'lt', value: 5, unit: 'km' },
                { operator: 'gt', value: 20, unit: 'km' },
              ],
              titlePatterns: [],
            },
          ],
        });

        expect(matchesCustomFilters(activity, settings)).toBe(false);
      });
    });

    describe('title filters', () => {
      it('should match when title contains pattern', () => {
        const activity = createActivity({ name: 'Morning Run' });
        const settings = createSettings({
          activityFilters: [
            {
              activityType: 'Run',
              distanceFilters: [],
              titlePatterns: ['morning'],
            },
          ],
        });

        expect(matchesCustomFilters(activity, settings)).toBe(true);
      });

      it('should be case-insensitive for title matching', () => {
        const activity = createActivity({ name: 'MORNING RUN' });
        const settings = createSettings({
          activityFilters: [
            {
              activityType: 'Run',
              distanceFilters: [],
              titlePatterns: ['morning'],
            },
          ],
        });

        expect(matchesCustomFilters(activity, settings)).toBe(true);
      });

      it('should match when at least one title pattern matches', () => {
        const activity = createActivity({ name: 'Morning Run' });
        const settings = createSettings({
          activityFilters: [
            {
              activityType: 'Run',
              distanceFilters: [],
              titlePatterns: ['evening', 'morning'],
            },
          ],
        });

        expect(matchesCustomFilters(activity, settings)).toBe(true);
      });

      it('should not match when no title patterns match', () => {
        const activity = createActivity({ name: 'Morning Run' });
        const settings = createSettings({
          activityFilters: [
            {
              activityType: 'Run',
              distanceFilters: [],
              titlePatterns: ['evening', 'night'],
            },
          ],
        });

        expect(matchesCustomFilters(activity, settings)).toBe(false);
      });
    });

    describe('combined filters', () => {
      it('should match when both distance and title filters match', () => {
        const activity = createActivity({ name: 'Marathon Run', distanceKm: 42 });
        const settings = createSettings({
          activityFilters: [
            {
              activityType: 'Run',
              distanceFilters: [{ operator: 'gte', value: 40, unit: 'km' }],
              titlePatterns: ['marathon'],
            },
          ],
        });

        expect(matchesCustomFilters(activity, settings)).toBe(true);
      });

      it('should not match when distance matches but title does not', () => {
        const activity = createActivity({ name: 'Long Run', distanceKm: 42 });
        const settings = createSettings({
          activityFilters: [
            {
              activityType: 'Run',
              distanceFilters: [{ operator: 'gte', value: 40, unit: 'km' }],
              titlePatterns: ['marathon'],
            },
          ],
        });

        expect(matchesCustomFilters(activity, settings)).toBe(false);
      });

      it('should not match when title matches but distance does not', () => {
        const activity = createActivity({ name: 'Marathon Run', distanceKm: 10 });
        const settings = createSettings({
          activityFilters: [
            {
              activityType: 'Run',
              distanceFilters: [{ operator: 'gte', value: 40, unit: 'km' }],
              titlePatterns: ['marathon'],
            },
          ],
        });

        expect(matchesCustomFilters(activity, settings)).toBe(false);
      });
    });
  });
});
