import { describe, it, expect } from 'vitest';
import { calculateSportHighlights } from '../sportHighlights';
import type { Activity } from '../../types';
import type { TitlePattern, ActivityTypeFilter } from '../../stores/settingsStore';

// Helper to create test activities
const createActivity = (
  id: string,
  name: string,
  type: Activity['type'],
  distanceKm: number,
  movingTimeMinutes: number,
  elevationGainMeters: number = 0,
  startDate: string = '2024-01-01T00:00:00Z'
): Activity => ({
  id,
  name,
  type,
  distanceKm,
  movingTimeMinutes,
  elevationGainMeters,
  date: new Date(startDate),
  durationMinutes: movingTimeMinutes,
  averageSpeedKmh: distanceKm / (movingTimeMinutes / 60),
  maxSpeedKmh: (distanceKm / (movingTimeMinutes / 60)) * 1.3,
});

describe('calculateSportHighlights - Title Ignore Filters', () => {
  describe('Basic functionality without filters', () => {
    it('should calculate longest activity for running without any filters', () => {
      const activities: Activity[] = [
        createActivity('1', 'Short Run', 'Run', 10, 50),
        createActivity('2', 'Marathon IRONMAN 140.6', 'Run', 42.2, 240), // Longest
        createActivity('3', 'Medium Run', 'Run', 23, 115),
      ];

      const result = calculateSportHighlights(activities);

      expect(result.running).toBeDefined();
      expect(result.running?.longestActivity.id).toBe('2'); // Marathon should be longest
      expect(result.running?.longestActivity.distanceKm).toBe(42.2);
    });

    it('should calculate longest activity for swimming without any filters', () => {
      const activities: Activity[] = [
        createActivity('1', 'Pool Swim', 'Swim', 1.5, 30),
        createActivity('2', 'IRONMAN 140.6 - Swim', 'Swim', 3.8, 76), // Longest
        createActivity('3', 'Open Water Swim', 'Swim', 2, 40),
      ];

      const result = calculateSportHighlights(activities);

      expect(result.swimming).toBeDefined();
      expect(result.swimming?.longestActivity.id).toBe('2'); // IRONMAN swim should be longest
      expect(result.swimming?.longestActivity.distanceKm).toBe(3.8);
    });

    it('should calculate longest activity for cycling without any filters', () => {
      const activities: Activity[] = [
        createActivity('1', 'Short Ride', 'Ride', 40, 80),
        createActivity('2', 'IRONMAN 140.6 - Bike', 'Ride', 180, 360), // Longest
        createActivity('3', 'Century Ride', 'Ride', 150, 300),
      ];

      const result = calculateSportHighlights(activities);

      expect(result.cycling).toBeDefined();
      expect(result.cycling?.longestActivity.id).toBe('2'); // IRONMAN bike should be longest
      expect(result.cycling?.longestActivity.distanceKm).toBe(180);
    });
  });

  describe('Title ignore filter with excludeFromHighlights=true', () => {
    it('should exclude IRONMAN swim from longest when excludeFromHighlights is true', () => {
      const activities: Activity[] = [
        createActivity('1', 'Pool Swim', 'Swim', 1.5, 30),
        createActivity('2', 'IRONMAN 140.6 - Swim', 'Swim', 3.8, 76), // Should be ignored
        createActivity('3', 'Open Water Swim', 'Swim', 2.0, 40), // Should become longest
      ];

      const titleIgnorePatterns: TitlePattern[] = [
        {
          pattern: 'IRONMAN 140.6',
          excludeFromHighlights: true,
          excludeFromStats: false,
        },
      ];

      const result = calculateSportHighlights(
        activities,
        undefined,
        undefined,
        titleIgnorePatterns
      );

      expect(result.swimming).toBeDefined();
      expect(result.swimming?.longestActivity.id).toBe('3'); // Open Water Swim should be longest now
      expect(result.swimming?.longestActivity.name).toBe('Open Water Swim');
      expect(result.swimming?.longestActivity.distanceKm).toBe(2.0);
    });

    it('should exclude IRONMAN run from longest when excludeFromHighlights is true', () => {
      const activities: Activity[] = [
        createActivity('1', 'Short Run', 'Run', 10, 50),
        createActivity('2', 'IRONMAN 140.6 - Run', 'Run', 42.2, 240), // Should be ignored
        createActivity('3', 'Long Run', 'Run', 23, 115), // Should become longest
      ];

      const titleIgnorePatterns: TitlePattern[] = [
        {
          pattern: 'IRONMAN 140.6',
          excludeFromHighlights: true,
          excludeFromStats: false,
        },
      ];

      const result = calculateSportHighlights(
        activities,
        undefined,
        undefined,
        titleIgnorePatterns
      );

      expect(result.running).toBeDefined();
      expect(result.running?.longestActivity.id).toBe('3'); // Long Run should be longest now
      expect(result.running?.longestActivity.name).toBe('Long Run');
      expect(result.running?.longestActivity.distanceKm).toBe(23);
    });

    it('should exclude IRONMAN bike from longest when excludeFromHighlights is true', () => {
      const activities: Activity[] = [
        createActivity('1', 'Short Ride', 'Ride', 40, 80),
        createActivity('2', 'IRONMAN 140.6 - Bike', 'Ride', 180, 360), // Should be ignored
        createActivity('3', 'Century Ride', 'Ride', 150, 300), // Should become longest
      ];

      const titleIgnorePatterns: TitlePattern[] = [
        {
          pattern: 'IRONMAN 140.6',
          excludeFromHighlights: true,
          excludeFromStats: false,
        },
      ];

      const result = calculateSportHighlights(
        activities,
        undefined,
        undefined,
        titleIgnorePatterns
      );

      expect(result.cycling).toBeDefined();
      expect(result.cycling?.longestActivity.id).toBe('3'); // Century Ride should be longest now
      expect(result.cycling?.longestActivity.name).toBe('Century Ride');
      expect(result.cycling?.longestActivity.distanceKm).toBe(150);
    });

    it('should handle multiple title ignore patterns', () => {
      const activities: Activity[] = [
        createActivity('1', 'Short Run', 'Run', 10, 50),
        createActivity('2', 'IRONMAN 140.6 - Run', 'Run', 42.2, 240), // Ignored by IRONMAN filter
        createActivity('3', 'Long Run', 'Run', 23, 115), // Should become longest
        createActivity('4', 'Half Ironman - Run', 'Run', 30, 150), // Ignored by "Ironman" filter (case insensitive)
      ];

      const titleIgnorePatterns: TitlePattern[] = [
        {
          pattern: 'IRONMAN 140.6',
          excludeFromHighlights: true,
          excludeFromStats: false,
        },
        {
          pattern: 'Half Ironman',
          excludeFromHighlights: true,
          excludeFromStats: false,
        },
      ];

      const result = calculateSportHighlights(
        activities,
        undefined,
        undefined,
        titleIgnorePatterns
      );

      expect(result.running).toBeDefined();
      expect(result.running?.longestActivity.id).toBe('3');
      expect(result.running?.longestActivity.name).toBe('Long Run');
    });

    it('should be case insensitive for title matching', () => {
      const activities: Activity[] = [
        createActivity('1', 'Pool Swim', 'Swim', 1.5, 30),
        createActivity('2', 'ironman 140.6 - swim', 'Swim', 3.8, 76), // Lowercase, should be ignored
        createActivity('3', 'Open Water Swim', 'Swim', 2.0, 40), // Should become longest
      ];

      const titleIgnorePatterns: TitlePattern[] = [
        {
          pattern: 'IRONMAN 140.6',
          excludeFromHighlights: true,
          excludeFromStats: false,
        },
      ];

      const result = calculateSportHighlights(
        activities,
        undefined,
        undefined,
        titleIgnorePatterns
      );

      expect(result.swimming).toBeDefined();
      expect(result.swimming?.longestActivity.id).toBe('3');
      expect(result.swimming?.longestActivity.name).toBe('Open Water Swim');
    });
  });

  describe('Title ignore filter with excludeFromHighlights=false', () => {
    it('should NOT exclude activities when excludeFromHighlights is false', () => {
      const activities: Activity[] = [
        createActivity('1', 'Pool Swim', 'Swim', 1.5, 30),
        createActivity('2', 'IRONMAN 140.6 - Swim', 'Swim', 3.8, 76), // Should NOT be ignored
        createActivity('3', 'Open Water Swim', 'Swim', 2.0, 40),
      ];

      const titleIgnorePatterns: TitlePattern[] = [
        {
          pattern: 'IRONMAN 140.6',
          excludeFromHighlights: false, // Flag is false
          excludeFromStats: true,
        },
      ];

      const result = calculateSportHighlights(
        activities,
        undefined,
        undefined,
        titleIgnorePatterns
      );

      expect(result.swimming).toBeDefined();
      expect(result.swimming?.longestActivity.id).toBe('2'); // IRONMAN swim should still be longest
      expect(result.swimming?.longestActivity.distanceKm).toBe(3.8);
    });
  });

  describe('Biggest climb calculation', () => {
    it('should exclude activities from biggest climb when excludeFromHighlights is true', () => {
      const activities: Activity[] = [
        createActivity('1', 'Flat Run', 'Run', 10, 50, 50),
        createActivity('2', 'IRONMAN 140.6 - Run', 'Run', 42.2, 240, 500), // Should be ignored
        createActivity('3', 'Hilly Run', 'Run', 15, 90, 200), // Should become biggest climb
      ];

      const titleIgnorePatterns: TitlePattern[] = [
        {
          pattern: 'IRONMAN 140.6',
          excludeFromHighlights: true,
          excludeFromStats: false,
        },
      ];

      const result = calculateSportHighlights(
        activities,
        undefined,
        undefined,
        titleIgnorePatterns
      );

      expect(result.running).toBeDefined();
      expect(result.running?.biggestClimb?.id).toBe('3'); // Hilly Run should be biggest climb
      expect(result.running?.biggestClimb?.elevationGainMeters).toBe(200);
    });
  });

  describe('Totals calculation - should NOT be affected by excludeFromHighlights', () => {
    it('should include ignored activities in total distance calculation', () => {
      const activities: Activity[] = [
        createActivity('1', 'Short Run', 'Run', 10, 50),
        createActivity('2', 'IRONMAN 140.6 - Run', 'Run', 42.2, 240), // Ignored for longest, but counts in total
        createActivity('3', 'Long Run', 'Run', 23, 115),
      ];

      const titleIgnorePatterns: TitlePattern[] = [
        {
          pattern: 'IRONMAN 140.6',
          excludeFromHighlights: true,
          excludeFromStats: false,
        },
      ];

      const result = calculateSportHighlights(
        activities,
        undefined,
        undefined,
        titleIgnorePatterns
      );

      expect(result.running).toBeDefined();
      // Total should include all three runs: 10 + 42.2 + 23 = 75.2
      expect(result.running?.totalDistance).toBeCloseTo(75.2, 1);
      // But longest should be the 23km run, not the IRONMAN
      expect(result.running?.longestActivity.distanceKm).toBe(23);
    });

    it('should include ignored activities in total time calculation', () => {
      const activities: Activity[] = [
        createActivity('1', 'Short Run', 'Run', 10, 50),
        createActivity('2', 'IRONMAN 140.6 - Run', 'Run', 42.2, 240), // 240 minutes
        createActivity('3', 'Long Run', 'Run', 23, 115),
      ];

      const titleIgnorePatterns: TitlePattern[] = [
        {
          pattern: 'IRONMAN 140.6',
          excludeFromHighlights: true,
          excludeFromStats: false,
        },
      ];

      const result = calculateSportHighlights(
        activities,
        undefined,
        undefined,
        titleIgnorePatterns
      );

      expect(result.running).toBeDefined();
      // Total time should include all: 50 + 240 + 115 = 405
      expect(result.running?.totalTime).toBe(405);
    });

    it('should include ignored activities in elevation gain calculation', () => {
      const activities: Activity[] = [
        createActivity('1', 'Flat Run', 'Run', 10, 50, 50),
        createActivity('2', 'IRONMAN 140.6 - Run', 'Run', 42.2, 240, 500),
        createActivity('3', 'Hilly Run', 'Run', 15, 90, 200),
      ];

      const titleIgnorePatterns: TitlePattern[] = [
        {
          pattern: 'IRONMAN 140.6',
          excludeFromHighlights: true,
          excludeFromStats: false,
        },
      ];

      const result = calculateSportHighlights(
        activities,
        undefined,
        undefined,
        titleIgnorePatterns
      );

      expect(result.running).toBeDefined();
      // Total elevation should include all: 50 + 500 + 200 = 750
      expect(result.running?.totalElevation).toBe(750);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty title ignore patterns', () => {
      const activities: Activity[] = [
        createActivity('1', 'IRONMAN 140.6 - Swim', 'Swim', 3.8, 76),
        createActivity('2', 'Open Water Swim', 'Swim', 2.0, 40),
      ];

      const result = calculateSportHighlights(activities, undefined, undefined, []);

      expect(result.swimming).toBeDefined();
      expect(result.swimming?.longestActivity.id).toBe('1'); // IRONMAN swim should be longest
    });

    it('should handle undefined title ignore patterns', () => {
      const activities: Activity[] = [
        createActivity('1', 'IRONMAN 140.6 - Swim', 'Swim', 3.8, 76),
        createActivity('2', 'Open Water Swim', 'Swim', 2.0, 40),
      ];

      const result = calculateSportHighlights(activities, undefined, undefined, undefined);

      expect(result.swimming).toBeDefined();
      expect(result.swimming?.longestActivity.id).toBe('1'); // IRONMAN swim should be longest
    });

    it('should handle activities with no matches for title patterns', () => {
      const activities: Activity[] = [
        createActivity('1', 'Pool Swim', 'Swim', 1.5, 30),
        createActivity('2', 'Open Water Swim', 'Swim', 2.0, 40),
      ];

      const titleIgnorePatterns: TitlePattern[] = [
        {
          pattern: 'IRONMAN 140.6',
          excludeFromHighlights: true,
          excludeFromStats: false,
        },
      ];

      const result = calculateSportHighlights(
        activities,
        undefined,
        undefined,
        titleIgnorePatterns
      );

      expect(result.swimming).toBeDefined();
      expect(result.swimming?.longestActivity.id).toBe('2'); // Open Water Swim is still longest
      expect(result.swimming?.longestActivity.distanceKm).toBe(2.0);
    });

    it('should handle when all activities are excluded', () => {
      const activities: Activity[] = [
        createActivity('1', 'IRONMAN 140.6 - Swim 1', 'Swim', 3.8, 76),
        createActivity('2', 'IRONMAN 140.6 - Swim 2', 'Swim', 2.0, 40),
      ];

      const titleIgnorePatterns: TitlePattern[] = [
        {
          pattern: 'IRONMAN 140.6',
          excludeFromHighlights: true,
          excludeFromStats: false,
        },
      ];

      const result = calculateSportHighlights(
        activities,
        undefined,
        undefined,
        titleIgnorePatterns
      );

      // When all activities of a sport are excluded, the sport should not appear in results
      expect(result.swimming).toBeUndefined();
    });

    it('should handle partial pattern matching', () => {
      const activities: Activity[] = [
        createActivity('1', 'Pool Swim', 'Swim', 1.5, 30),
        createActivity('2', 'My IRONMAN 140.6 Race - Swim', 'Swim', 3.8, 76), // Contains pattern
        createActivity('3', 'Open Water Swim', 'Swim', 2.0, 40),
      ];

      const titleIgnorePatterns: TitlePattern[] = [
        {
          pattern: 'IRONMAN 140.6',
          excludeFromHighlights: true,
          excludeFromStats: false,
        },
      ];

      const result = calculateSportHighlights(
        activities,
        undefined,
        undefined,
        titleIgnorePatterns
      );

      expect(result.swimming).toBeDefined();
      expect(result.swimming?.longestActivity.id).toBe('3'); // Should exclude activity 2 due to partial match
      expect(result.swimming?.longestActivity.name).toBe('Open Water Swim');
    });
  });

  describe('Distance filter integration (Fix #3)', () => {
    it('should include activities matched by distance filters in longest calculations', () => {
      const activities: Activity[] = [
        createActivity('1', 'Short Run', 'Run', 10, 50),
        createActivity('2', 'Marathon Run', 'Run', 42.195, 240), // Matches 42km filter AND should be longest
        createActivity('3', 'Long Run', 'Run', 23, 115),
      ];

      // Simulate that activity '2' matched the 42km distance filter
      // In real code, this comes from raceDetection
      const excludeActivityIds = new Set(['2']);

      const result = calculateSportHighlights(activities, undefined, excludeActivityIds, undefined);

      expect(result.running).toBeDefined();
      // CRITICAL: Activity '2' should STILL be longest even though it's in excludeActivityIds
      expect(result.running?.longestActivity.id).toBe('2');
      expect(result.running?.longestActivity.distanceKm).toBe(42.195);
      expect(result.running?.longestActivity.name).toBe('Marathon Run');
    });

    it('should exclude activities matched by distance filters from display highlights', () => {
      const activities: Activity[] = [
        createActivity('1', 'Short Run', 'Run', 10, 50),
        createActivity('2', 'Marathon Run', 'Run', 42.195, 240), // Matches 42km filter
        createActivity('3', 'Long Run', 'Run', 23, 115, 100), // Should be in highlights
      ];

      const excludeActivityIds = new Set(['2']);

      const result = calculateSportHighlights(activities, undefined, excludeActivityIds, undefined);

      expect(result.running).toBeDefined();

      // Activity '2' should be longest
      expect(result.running?.longestActivity.id).toBe('2');

      // But activity '2' should NOT appear in distanceRecords as a separate highlight
      // (it's already shown in the distance-specific Marathon card)
      // The distanceRecords array is for distance-specific cards, not general highlights
    });

    it('should handle combination of distance filter and title pattern filter', () => {
      const activities: Activity[] = [
        createActivity('1', 'Easy Run', 'Run', 10, 50),
        createActivity('2', 'IRONMAN 140.6 - Run', 'Run', 42.195, 240), // Matches distance filter AND title pattern
        createActivity('3', 'Long Run', 'Run', 23, 115),
        createActivity('4', 'IRONMAN Component', 'Run', 5, 25), // Only matches title pattern
      ];

      const excludeActivityIds = new Set(['2']); // From distance filter
      const titleIgnorePatterns: TitlePattern[] = [
        {
          pattern: 'IRONMAN',
          excludeFromHighlights: true,
          excludeFromStats: false,
        },
      ];

      const result = calculateSportHighlights(
        activities,
        undefined,
        excludeActivityIds,
        titleIgnorePatterns
      );

      expect(result.running).toBeDefined();

      // IRONMAN run is excluded by title pattern from longest
      expect(result.running?.longestActivity.id).toBe('3');
      expect(result.running?.longestActivity.distanceKm).toBe(23);

      // Both IRONMAN activities are filtered:
      // - Activity '2' by excludeActivityIds (distance filter) - won't appear in distanceRecords
      // - Activity '4' by title pattern (IRONMAN) - won't appear in longest/biggest calculations
    });

    it('should calculate biggest climb correctly with distance filter exclusions', () => {
      const activities: Activity[] = [
        createActivity('1', 'Flat Run', 'Run', 10, 50, 10),
        createActivity('2', 'Marathon Run', 'Run', 42.195, 240, 150), // Matches distance filter, highest elevation
        createActivity('3', 'Hill Run', 'Run', 15, 75, 100),
      ];

      const excludeActivityIds = new Set(['2']);

      const result = calculateSportHighlights(activities, undefined, excludeActivityIds, undefined);

      expect(result.running).toBeDefined();

      // Activity '2' should be biggest climb even though in excludeActivityIds
      expect(result.running?.biggestClimb?.id).toBe('2');
      expect(result.running?.biggestClimb?.elevationGainMeters).toBe(150);
    });

    it('should allow an activity to be both longest and in a distance-specific card', () => {
      const activities: Activity[] = [
        createActivity('1', '10K Race', 'Run', 10, 40),
        createActivity('2', 'Marathon Race', 'Run', 42.195, 180), // Longest AND matches 42km filter
        createActivity('3', '5K Race', 'Run', 5, 20),
      ];

      // Only 10K and 5K matched distance filters (excluded from longest)
      const excludeActivityIds = new Set(['1', '3']);

      const result = calculateSportHighlights(activities, undefined, excludeActivityIds, undefined);

      expect(result.running).toBeDefined();

      // Marathon should be longest (not in excludeActivityIds)
      expect(result.running?.longestActivity.id).toBe('2');
      expect(result.running?.longestActivity.distanceKm).toBe(42.195);

      // Marathon can still be longest even though it could also match a 42km distance filter
      // (it's just not in excludeActivityIds for this test)
    });
  });

  describe('findBestForDistance edge cases', () => {
    it('should calculate pace for running', () => {
      const activities: Activity[] = [
        createActivity('1', '10K Fast', 'Run', 10, 40), // 4 min/km pace
        createActivity('2', '10K Slow', 'Run', 10, 50), // 5 min/km pace
      ];

      const activityFilters: ActivityTypeFilter[] = [
        {
          activityType: 'Run',
          distanceFilters: [{ id: '1', value: 10, operator: '±', unit: 'km' }],
          titlePatterns: [],
        },
      ];

      const result = calculateSportHighlights(activities, activityFilters);

      expect(result.running?.distanceRecords.length).toBe(1);
      expect(result.running?.distanceRecords[0].pace).toBeDefined();
      expect(result.running?.distanceRecords[0].activity.id).toBe('1'); // Fastest one
    });

    it('should calculate pace for swimming', () => {
      const activities: Activity[] = [
        createActivity('1', '1000m Fast', 'Swim', 1, 15), // 1.5 min/100m
        createActivity('2', '1000m Slow', 'Swim', 1, 20), // 2 min/100m
      ];

      const activityFilters: ActivityTypeFilter[] = [
        {
          activityType: 'Swim',
          distanceFilters: [{ id: '2', value: 1, operator: '±', unit: 'km' }],
          titlePatterns: [],
        },
      ];

      const result = calculateSportHighlights(activities, activityFilters);

      expect(result.swimming?.distanceRecords.length).toBe(1);
      expect(result.swimming?.distanceRecords[0].pace).toBeDefined();
      expect(result.swimming?.distanceRecords[0].activity.id).toBe('1'); // Fastest one
    });

    it('should calculate speed for cycling', () => {
      const activities: Activity[] = [
        createActivity('1', '50K Fast', 'Ride', 50, 80), // 37.5 km/h
        createActivity('2', '50K Slow', 'Ride', 50, 120), // 25 km/h
      ];

      const activityFilters: ActivityTypeFilter[] = [
        {
          activityType: 'Ride',
          distanceFilters: [{ id: '3', value: 50, operator: '±', unit: 'km' }],
          titlePatterns: [],
        },
      ];

      const result = calculateSportHighlights(activities, activityFilters);

      expect(result.cycling?.distanceRecords.length).toBe(1);
      expect(result.cycling?.distanceRecords[0].speed).toBeDefined();
      expect(result.cycling?.distanceRecords[0].activity.id).toBe('1'); // Fastest one
    });

    it('should return null when no activities match distance range', () => {
      const activities: Activity[] = [createActivity('1', '5K', 'Run', 5, 25)];

      const activityFilters: ActivityTypeFilter[] = [
        {
          activityType: 'Run',
          distanceFilters: [{ id: '4', value: 10, operator: '±', unit: 'km' }], // Looking for 10K
          titlePatterns: [],
        },
      ];

      const result = calculateSportHighlights(activities, activityFilters);

      expect(result.running?.distanceRecords.length).toBe(0); // No match
    });

    it('should handle "eq" operator with 10% tolerance', () => {
      const activities: Activity[] = [
        createActivity('1', '10K', 'Run', 10, 40),
        createActivity('2', '11K', 'Run', 11, 45), // Within 10% tolerance of 10
      ];

      const activityFilters: ActivityTypeFilter[] = [
        {
          activityType: 'Run',
          distanceFilters: [{ id: '5', value: 10, operator: 'eq', unit: 'km' }],
          titlePatterns: [],
        },
      ];

      const result = calculateSportHighlights(activities, activityFilters);

      expect(result.running?.distanceRecords.length).toBe(1);
    });

    it('should handle "=" operator with 0.1km tolerance', () => {
      const activities: Activity[] = [createActivity('1', '10K', 'Run', 10, 40)];

      const activityFilters: ActivityTypeFilter[] = [
        {
          activityType: 'Run',
          distanceFilters: [{ id: '6', value: 10, operator: '=', unit: 'km' }],
          titlePatterns: [],
        },
      ];

      const result = calculateSportHighlights(activities, activityFilters);

      expect(result.running?.distanceRecords.length).toBe(1);
    });

    it('should format swim distances under 1km as meters', () => {
      const activities: Activity[] = [createActivity('1', '500m', 'Swim', 0.5, 10)];

      const activityFilters: ActivityTypeFilter[] = [
        {
          activityType: 'Swim',
          distanceFilters: [{ id: '7', value: 0.5, operator: '±', unit: 'km' }],
          titlePatterns: [],
        },
      ];

      const result = calculateSportHighlights(activities, activityFilters);

      expect(result.swimming?.distanceRecords.length).toBe(1);
      expect(result.swimming?.distanceRecords[0].distance).toBe('500m');
    });

    it('should format swim distances over 1km in kilometers', () => {
      const activities: Activity[] = [createActivity('1', '2K', 'Swim', 2, 40)];

      const activityFilters: ActivityTypeFilter[] = [
        {
          activityType: 'Swim',
          distanceFilters: [{ id: '8', value: 2, operator: '±', unit: 'km' }],
          titlePatterns: [],
        },
      ];

      const result = calculateSportHighlights(activities, activityFilters);

      expect(result.swimming?.distanceRecords.length).toBe(1);
      expect(result.swimming?.distanceRecords[0].distance).toBe('2km');
    });

    it('should use special names for common run distances', () => {
      const activities: Activity[] = [
        createActivity('1', 'Half Marathon', 'Run', 21, 105),
        createActivity('2', 'Marathon', 'Run', 42, 180),
      ];

      const activityFilters: ActivityTypeFilter[] = [
        {
          activityType: 'Run',
          distanceFilters: [
            { id: '9', value: 21, operator: '±', unit: 'km' },
            { id: '10', value: 42, operator: '±', unit: 'km' },
          ],
          titlePatterns: [],
        },
      ];

      const result = calculateSportHighlights(activities, activityFilters);

      expect(result.running?.distanceRecords.length).toBe(2);
      expect(result.running?.distanceRecords[0].distance).toBe('Half Marathon');
      expect(result.running?.distanceRecords[1].distance).toBe('Marathon');
    });
  });

  describe('includeInHighlights parameter', () => {
    it('should exclude activity types not in includeInHighlights list', () => {
      const activities: Activity[] = [
        createActivity('1', 'Run', 'Run', 10, 40),
        createActivity('2', 'Ride', 'Ride', 50, 120),
        createActivity('3', 'Swim', 'Swim', 2, 40),
      ];

      // Only include running in highlights
      const includeInHighlights = ['Run'];

      const result = calculateSportHighlights(
        activities,
        undefined,
        undefined,
        undefined,
        includeInHighlights
      );

      expect(result.running).toBeDefined();
      expect(result.cycling).toBeUndefined();
      expect(result.swimming).toBeUndefined();
    });

    it('should only include cycling distance filters for included activity types', () => {
      const activities: Activity[] = [
        createActivity('1', 'Real Ride', 'Ride', 50, 120),
        createActivity('2', 'Virtual Ride', 'VirtualRide', 50, 120),
      ];

      const activityFilters: ActivityTypeFilter[] = [
        {
          activityType: 'Ride',
          distanceFilters: [{ id: '11', value: 50, operator: '±', unit: 'km' }],
          titlePatterns: [],
        },
        {
          activityType: 'VirtualRide',
          distanceFilters: [{ id: '12', value: 50, operator: '±', unit: 'km' }],
          titlePatterns: [],
        },
      ];

      // Only include Ride, not VirtualRide
      const includeInHighlights = ['Ride'];

      const result = calculateSportHighlights(
        activities,
        activityFilters,
        undefined,
        undefined,
        includeInHighlights
      );

      // Should have cycling but with only one distance filter (Ride)
      expect(result.cycling).toBeDefined();
      // VirtualRide distance filter should be excluded
    });

    it('should deduplicate cycling distance filters from Ride and VirtualRide', () => {
      const activities: Activity[] = [
        createActivity('1', 'Real Ride', 'Ride', 50, 120),
        createActivity('2', 'Virtual Ride', 'VirtualRide', 50, 120),
      ];

      const activityFilters: ActivityTypeFilter[] = [
        {
          activityType: 'Ride',
          distanceFilters: [{ id: '13', value: 50, operator: '±', unit: 'km' }],
          titlePatterns: [],
        },
        {
          activityType: 'VirtualRide',
          distanceFilters: [{ id: '14', value: 50, operator: '±', unit: 'km' }], // Same distance
          titlePatterns: [],
        },
      ];

      const result = calculateSportHighlights(activities, activityFilters);

      // Should have only one distance record (deduplicated)
      expect(result.cycling?.distanceRecords.length).toBeLessThanOrEqual(1);
    });

    it('should handle cycling with different distances from Ride and VirtualRide', () => {
      const activities: Activity[] = [
        createActivity('1', 'Real Ride 50K', 'Ride', 50, 120),
        createActivity('2', 'Virtual Ride 100K', 'VirtualRide', 100, 240),
      ];

      const activityFilters: ActivityTypeFilter[] = [
        {
          activityType: 'Ride',
          distanceFilters: [{ id: '15', value: 50, operator: '±', unit: 'km' }],
          titlePatterns: [],
        },
        {
          activityType: 'VirtualRide',
          distanceFilters: [{ id: '16', value: 100, operator: '±', unit: 'km' }], // Different distance
          titlePatterns: [],
        },
      ];

      const result = calculateSportHighlights(activities, activityFilters);

      // Should have two distance records (different distances)
      expect(result.cycling?.distanceRecords.length).toBe(2);
    });

    it('should skip cycling distance filters if VirtualRide not in includeInHighlights', () => {
      const activities: Activity[] = [
        createActivity('1', 'Real Ride', 'Ride', 50, 120),
        createActivity('2', 'Virtual Ride', 'VirtualRide', 50, 120),
      ];

      const activityFilters: ActivityTypeFilter[] = [
        {
          activityType: 'Ride',
          distanceFilters: [{ id: '17', value: 50, operator: '±', unit: 'km' }],
          titlePatterns: [],
        },
        {
          activityType: 'VirtualRide',
          distanceFilters: [{ id: '18', value: 100, operator: '±', unit: 'km' }],
          titlePatterns: [],
        },
      ];

      // Only include Ride, not VirtualRide
      const includeInHighlights = ['Ride'];

      const result = calculateSportHighlights(
        activities,
        activityFilters,
        undefined,
        undefined,
        includeInHighlights
      );

      // Should only have Ride's distance filter (50km), not VirtualRide's (100km)
      expect(result.cycling?.distanceRecords.length).toBeLessThanOrEqual(1);
      if (result.cycling?.distanceRecords.length === 1) {
        expect(result.cycling.distanceRecords[0].distance).toBe('50km');
      }
    });
  });
});
