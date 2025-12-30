import { describe, it, expect, beforeEach } from 'vitest';
import { ActivityService } from '../activityService';
import type { Activity } from '../../types/activity';
import type { YearInReviewSettings } from '../../stores/settingsStore';

describe('ActivityService', () => {
  let mockActivities: Activity[];
  let mockSettings: YearInReviewSettings;

  beforeEach(() => {
    // Create mock activities for testing
    mockActivities = [
      {
        id: '1',
        name: 'Morning Run',
        type: 'Run',
        date: new Date('2024-03-15T07:00:00Z'),
        distanceKm: 10,
        movingTimeMinutes: 50,
        durationMinutes: 52,
        elevationGainMeters: 100,
        kudosCount: 5,
        workoutType: 0,
      },
      {
        id: '2',
        name: 'Half Marathon Race',
        type: 'Run',
        date: new Date('2024-04-20T09:00:00Z'),
        distanceKm: 21.1,
        movingTimeMinutes: 105,
        durationMinutes: 107,
        elevationGainMeters: 200,
        kudosCount: 25,
        workoutType: 1, // Race
      },
      {
        id: '3',
        name: 'Virtual Ride',
        type: 'VirtualRide',
        date: new Date('2024-05-10T18:00:00Z'),
        distanceKm: 40,
        movingTimeMinutes: 80,
        durationMinutes: 82,
        elevationGainMeters: 300,
        kudosCount: 10,
        workoutType: 0,
      },
      {
        id: '4',
        name: 'Test Activity - Ignore',
        type: 'Run',
        date: new Date('2024-06-01T06:00:00Z'),
        distanceKm: 5,
        movingTimeMinutes: 25,
        durationMinutes: 26,
        elevationGainMeters: 50,
        kudosCount: 2,
        workoutType: 0,
      },
      {
        id: '5',
        name: 'Long Ride',
        type: 'Ride',
        date: new Date('2024-07-15T08:00:00Z'),
        distanceKm: 100,
        movingTimeMinutes: 300,
        durationMinutes: 310,
        elevationGainMeters: 1200,
        kudosCount: 30,
        workoutType: 0,
      },
    ] as Activity[];

    // Create mock settings
    mockSettings = {
      backgroundImageUrl: null,
      backgroundImageCrop: null,
      backgroundImageOpacity: 0.5,
      socialCardCrops: {},
      excludedActivityTypes: [],
      excludeVirtualPerSport: {
        cycling: { highlights: false, stats: false },
        running: { highlights: false, stats: false },
        swimming: { highlights: false, stats: false },
      },
      titleIgnorePatterns: [
        {
          pattern: 'Test Activity',
          excludeFromHighlights: true,
          excludeFromStats: true,
        },
      ],
      highlightStats: ['distance', 'activities', 'hours'],
      activityTypeSettings: {
        order: ['Run', 'Ride', 'VirtualRide'],
        includeInStats: ['Run', 'Ride', 'VirtualRide'],
        includeInHighlights: ['Run', 'Ride'],
      },
      specialOptions: {
        enableTriathlonHighlights: true,
        mergeCycling: false,
      },
      activityFilters: [
        {
          activityType: 'Run',
          distanceFilters: [
            {
              id: '1',
              operator: '±',
              value: 21,
              unit: 'km',
            },
          ],
          titlePatterns: [],
        },
      ],
      sportBreakdown: {
        activities: [],
      },
      exportSettings: {
        enabledSections: [],
        sectionOrder: [],
      },
    } as unknown as YearInReviewSettings;
  });

  describe('getEnrichedActivities', () => {
    it('should return enriched activity data with all components', () => {
      const result = ActivityService.getEnrichedActivities(mockActivities, mockSettings);

      expect(result).toHaveProperty('activitiesForStats');
      expect(result).toHaveProperty('highlights');
      expect(result).toHaveProperty('sportHighlights');
      expect(result).toHaveProperty('excludedActivityIds');
    });

    it('should filter activities for stats based on excludeFromStats patterns', () => {
      const result = ActivityService.getEnrichedActivities(mockActivities, mockSettings);

      // Should exclude activity with "Test Activity" in the name
      const statsActivityIds = result.activitiesForStats.map((a) => a.id);
      expect(statsActivityIds).not.toContain('4'); // Test Activity should be excluded
      expect(statsActivityIds).toContain('1'); // Morning Run should be included
      expect(statsActivityIds).toContain('2'); // Half Marathon should be included
    });

    it('should filter activities based on excludedActivityTypes', () => {
      const settingsWithExclusions: YearInReviewSettings = {
        ...mockSettings,
        excludedActivityTypes: ['VirtualRide'],
      };

      const result = ActivityService.getEnrichedActivities(mockActivities, settingsWithExclusions);

      const statsActivityIds = result.activitiesForStats.map((a) => a.id);
      expect(statsActivityIds).not.toContain('3'); // Virtual Ride should be excluded
      expect(result.activitiesForStats.length).toBe(3); // 5 total - 1 virtual - 1 test = 3
    });

    it('should detect race highlights', () => {
      const result = ActivityService.getEnrichedActivities(mockActivities, mockSettings);

      expect(result.highlights.length).toBeGreaterThan(0);
      // Should detect the half marathon (21.1km run)
      const halfMarathon = result.highlights.find((h) => h.id === '2');
      expect(halfMarathon).toBeDefined();
      expect(halfMarathon?.type).toBe('custom-highlight');
    });

    it('should calculate sport highlights for different sports', () => {
      const result = ActivityService.getEnrichedActivities(mockActivities, mockSettings);

      // Should have running and cycling highlights
      expect(result.sportHighlights.running).toBeDefined();
      expect(result.sportHighlights.cycling).toBeDefined();
    });

    it('should track excluded activity IDs from custom filters', () => {
      const result = ActivityService.getEnrichedActivities(mockActivities, mockSettings);

      // The half marathon matched by custom filter should be in excludedActivityIds
      expect(result.excludedActivityIds.has('2')).toBe(true);
    });

    it('should optionally calculate year statistics', () => {
      const resultWithoutStats = ActivityService.getEnrichedActivities(
        mockActivities,
        mockSettings,
        false
      );
      expect(resultWithoutStats.yearStats).toBeUndefined();

      const resultWithStats = ActivityService.getEnrichedActivities(
        mockActivities,
        mockSettings,
        true,
        2024
      );
      expect(resultWithStats.yearStats).toBeDefined();
      expect(resultWithStats.yearStats?.year).toBe(2024);
    });

    it('should handle empty activities array', () => {
      const result = ActivityService.getEnrichedActivities([], mockSettings);

      expect(result.activitiesForStats).toEqual([]);
      expect(result.highlights).toEqual([]);
      expect(result.sportHighlights).toEqual({});
      expect(result.excludedActivityIds.size).toBe(0);
    });

    it('should correctly filter activities when multiple patterns match', () => {
      const settingsWithMultiplePatterns: YearInReviewSettings = {
        ...mockSettings,
        titleIgnorePatterns: [
          {
            pattern: 'Test',
            excludeFromHighlights: false,
            excludeFromStats: true,
          },
          {
            pattern: 'Morning',
            excludeFromHighlights: false,
            excludeFromStats: true,
          },
        ],
      };

      const result = ActivityService.getEnrichedActivities(
        mockActivities,
        settingsWithMultiplePatterns
      );

      const statsActivityIds = result.activitiesForStats.map((a) => a.id);
      expect(statsActivityIds).not.toContain('1'); // Morning Run excluded
      expect(statsActivityIds).not.toContain('4'); // Test Activity excluded
      expect(statsActivityIds).toContain('2'); // Half Marathon included
    });
  });

  describe('getTriathlons', () => {
    it('should detect triathlons from activities on same day', () => {
      const triathlonActivities: Activity[] = [
        {
          id: 'tri-1',
          name: 'Ironman Swim',
          type: 'Swim',
          date: new Date('2024-08-15T06:00:00Z'),
          distanceKm: 3.8,
          movingTimeMinutes: 80,
          durationMinutes: 82,
          elevationGainMeters: 0,
          kudosCount: 10,
          workoutType: 1,
        },
        {
          id: 'tri-2',
          name: 'Ironman Bike',
          type: 'Ride',
          date: new Date('2024-08-15T08:00:00Z'),
          distanceKm: 180,
          movingTimeMinutes: 420,
          durationMinutes: 430,
          elevationGainMeters: 1500,
          kudosCount: 50,
          workoutType: 1,
        },
        {
          id: 'tri-3',
          name: 'Ironman Run',
          type: 'Run',
          date: new Date('2024-08-15T15:00:00Z'),
          distanceKm: 42.2,
          movingTimeMinutes: 240,
          durationMinutes: 245,
          elevationGainMeters: 300,
          kudosCount: 100,
          workoutType: 1,
        },
      ] as Activity[];

      const triathlons = ActivityService.getTriathlons(triathlonActivities);

      expect(triathlons.length).toBe(1);
      expect(triathlons[0].type).toBe('full');
      expect(triathlons[0].activities.swim).toBeDefined();
      expect(triathlons[0].activities.bike).toBeDefined();
      expect(triathlons[0].activities.run).toBeDefined();
    });

    it('should return empty array when no triathlons found', () => {
      const triathlons = ActivityService.getTriathlons(mockActivities);
      expect(triathlons).toEqual([]);
    });
  });

  describe('getRaceHighlights', () => {
    it('should detect race highlights with provided config', () => {
      const config = {
        titleIgnorePatterns: mockSettings.titleIgnorePatterns,
        activityFilters: mockSettings.activityFilters,
      };

      const highlights = ActivityService.getRaceHighlights(mockActivities, config);

      expect(highlights.length).toBeGreaterThan(0);
      // Should detect the half marathon
      const halfMarathon = highlights.find((h) => h.id === '2');
      expect(halfMarathon).toBeDefined();
    });

    it('should respect title ignore patterns in config', () => {
      const config = {
        titleIgnorePatterns: [
          {
            pattern: 'Half Marathon',
            excludeFromHighlights: true,
            excludeFromStats: false,
          },
        ],
        activityFilters: [],
      };

      const highlights = ActivityService.getRaceHighlights(mockActivities, config);

      // Half Marathon should be excluded from highlights
      const halfMarathon = highlights.find((h) => h.id === '2');
      expect(halfMarathon).toBeUndefined();
    });
  });

  describe('filterActivities', () => {
    it('should filter activities for stats target', () => {
      const filtered = ActivityService.filterActivities(mockActivities, mockSettings, 'stats');

      // Should exclude "Test Activity" which has excludeFromStats=true
      const filteredIds = filtered.map((a) => a.id);
      expect(filteredIds).not.toContain('4');
      expect(filtered.length).toBe(4); // 5 total - 1 test activity = 4
    });

    it('should filter activities for highlights target', () => {
      const settingsWithHighlightPattern: YearInReviewSettings = {
        ...mockSettings,
        titleIgnorePatterns: [
          {
            pattern: 'Morning',
            excludeFromHighlights: true,
            excludeFromStats: false,
          },
        ],
      };

      const filtered = ActivityService.filterActivities(
        mockActivities,
        settingsWithHighlightPattern,
        'highlights'
      );

      // Should exclude "Morning Run" which has excludeFromHighlights=true
      const filteredIds = filtered.map((a) => a.id);
      expect(filteredIds).not.toContain('1');
      expect(filtered.length).toBe(4); // 5 total - 1 morning run = 4
    });

    it('should filter by excluded activity types', () => {
      const settingsWithExclusions: YearInReviewSettings = {
        ...mockSettings,
        excludedActivityTypes: ['VirtualRide', 'Run'],
      };

      const filtered = ActivityService.filterActivities(
        mockActivities,
        settingsWithExclusions,
        'stats'
      );

      const filteredIds = filtered.map((a) => a.id);
      expect(filteredIds).not.toContain('1'); // Run excluded
      expect(filteredIds).not.toContain('2'); // Run excluded
      expect(filteredIds).not.toContain('3'); // VirtualRide excluded
      expect(filteredIds).not.toContain('4'); // Run excluded
      expect(filteredIds).toContain('5'); // Ride included
      expect(filtered.length).toBe(1);
    });
  });

  describe('calculateYearStats', () => {
    it('should calculate year statistics for activities', () => {
      const stats = ActivityService.calculateYearStats(mockActivities, 2024);

      expect(stats.year).toBe(2024);
      expect(stats.activityCount).toBe(5);
      expect(stats.totalDistanceKm).toBeGreaterThan(0);
      expect(stats.totalElevationMeters).toBeGreaterThan(0);
      expect(stats.byMonth).toBeDefined();
      expect(stats.byMonth.length).toBe(12); // All months
    });

    it('should aggregate monthly statistics correctly', () => {
      const stats = ActivityService.calculateYearStats(mockActivities, 2024);

      // March has 1 activity (Morning Run)
      const marchStats = stats.byMonth[2]; // March is index 2
      expect(marchStats.activityCount).toBe(1);
      expect(marchStats.distanceKm).toBe(10);
    });

    it('should handle empty activities array', () => {
      const stats = ActivityService.calculateYearStats([], 2024);

      expect(stats.year).toBe(2024);
      expect(stats.activityCount).toBe(0);
      expect(stats.totalDistanceKm).toBe(0);
    });
  });

  describe('Future Features Placeholders', () => {
    it('should have detectMultiSportEvents method (placeholder)', () => {
      const result = ActivityService.detectMultiSportEvents(mockActivities);
      expect(result).toEqual([]);
    });

    it('should have getPersonalRecords method (placeholder)', () => {
      const result = ActivityService.getPersonalRecords(mockActivities, 'Run');
      expect(result).toEqual([]);
    });

    it('should have calculateTrainingLoad method (placeholder)', () => {
      const result = ActivityService.calculateTrainingLoad(mockActivities);
      expect(result).toEqual({
        weeklyLoad: 0,
        monthlyLoad: 0,
        fitness: 0,
        fatigue: 0,
        form: 0,
      });
    });
  });

  describe('Integration: End-to-End Workflow', () => {
    it('should process activities through complete workflow', () => {
      // Simulate a component using the service
      const enriched = ActivityService.getEnrichedActivities(
        mockActivities,
        mockSettings,
        true,
        2024
      );

      // Verify all data is present
      expect(enriched.activitiesForStats.length).toBeGreaterThan(0);
      expect(enriched.highlights.length).toBeGreaterThan(0);
      expect(Object.keys(enriched.sportHighlights).length).toBeGreaterThan(0);
      expect(enriched.yearStats).toBeDefined();

      // Verify data consistency
      expect(enriched.yearStats?.activityCount).toBe(enriched.activitiesForStats.length);

      // Verify filtering logic
      const hasTestActivity = enriched.activitiesForStats.some(
        (a) => a.name === 'Test Activity - Ignore'
      );
      expect(hasTestActivity).toBe(false); // Should be filtered out
    });

    it('should handle complex filtering scenarios', () => {
      const complexSettings: YearInReviewSettings = {
        ...mockSettings,
        excludedActivityTypes: ['VirtualRide'],
        titleIgnorePatterns: [
          {
            pattern: 'Test',
            excludeFromHighlights: true,
            excludeFromStats: true,
          },
          {
            pattern: 'Morning',
            excludeFromHighlights: true,
            excludeFromStats: false, // Only exclude from highlights, not stats
          },
        ],
      };

      const enriched = ActivityService.getEnrichedActivities(mockActivities, complexSettings);

      // Stats should exclude: VirtualRide, Test Activity
      // Stats should include: Morning Run (only excluded from highlights)
      const statsIds = enriched.activitiesForStats.map((a) => a.id);
      expect(statsIds).toContain('1'); // Morning Run (included in stats)
      expect(statsIds).not.toContain('3'); // VirtualRide (excluded)
      expect(statsIds).not.toContain('4'); // Test Activity (excluded)

      // Verify counts
      expect(enriched.activitiesForStats.length).toBe(3); // Run, Half Marathon, Long Ride
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large datasets efficiently', () => {
      // Create 1000 activities
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `activity-${i}`,
        name: `Activity ${i}`,
        type: i % 2 === 0 ? 'Run' : 'Ride',
        date: new Date(2024, i % 12, (i % 28) + 1),
        distanceKm: Math.random() * 50,
        movingTimeMinutes: Math.random() * 180,
        durationMinutes: Math.random() * 200,
        elevationGainMeters: Math.random() * 500,
        kudosCount: Math.floor(Math.random() * 20),
        workoutType: 0,
      })) as Activity[];

      const startTime = performance.now();
      const result = ActivityService.getEnrichedActivities(largeDataset, mockSettings, true, 2024);
      const endTime = performance.now();

      // Should complete in reasonable time (< 1 second for 1000 activities)
      expect(endTime - startTime).toBeLessThan(1000);
      expect(result.activitiesForStats.length).toBeGreaterThan(0);
      expect(result.yearStats).toBeDefined();
    });

    it('should handle activities with missing or null values', () => {
      const activitiesWithNulls: Activity[] = [
        {
          id: '1',
          name: 'Incomplete Activity',
          type: 'Run',
          date: new Date('2024-01-01'),
          distanceKm: 0,
          movingTimeMinutes: 0,
          durationMinutes: 0,
          elevationGainMeters: 0,
          kudosCount: 0,
          workoutType: 0,
        },
      ] as Activity[];

      const result = ActivityService.getEnrichedActivities(activitiesWithNulls, mockSettings);

      expect(result.activitiesForStats.length).toBe(1);
      expect(result.highlights).toBeDefined();
      expect(result.sportHighlights).toBeDefined();
    });
  });
});
