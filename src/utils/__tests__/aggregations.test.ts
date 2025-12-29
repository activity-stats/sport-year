import { describe, it, expect } from 'vitest';
import { aggregateYearStats } from '../aggregations';
import type { Activity } from '../../types/activity';

describe('aggregateYearStats', () => {
  const createActivity = (overrides: Partial<Activity> = {}): Activity => ({
    id: '1',
    name: 'Test Activity',
    type: 'Run',
    distanceKm: 10,
    durationMinutes: 60,
    movingTimeMinutes: 58,
    elevationGainMeters: 100,
    date: new Date('2024-06-15T10:00:00Z'),
    kudosCount: 5,
    polyline: '',
    averageSpeedKmh: 10,
    maxSpeedKmh: 15,
    ...overrides,
  });

  describe('Total Statistics', () => {
    it('should calculate total distance correctly', () => {
      const activities = [
        createActivity({ distanceKm: 5 }),
        createActivity({ distanceKm: 10 }),
        createActivity({ distanceKm: 15 }),
      ];

      const stats = aggregateYearStats(activities, 2024);

      expect(stats.totalDistanceKm).toBe(30);
    });

    it('should calculate total elevation correctly', () => {
      const activities = [
        createActivity({ elevationGainMeters: 100 }),
        createActivity({ elevationGainMeters: 250 }),
        createActivity({ elevationGainMeters: 150 }),
      ];

      const stats = aggregateYearStats(activities, 2024);

      expect(stats.totalElevationMeters).toBe(500);
    });

    it('should calculate total time in hours correctly', () => {
      const activities = [
        createActivity({ durationMinutes: 60 }), // 1 hour
        createActivity({ durationMinutes: 90 }), // 1.5 hours
        createActivity({ durationMinutes: 30 }), // 0.5 hours
      ];

      const stats = aggregateYearStats(activities, 2024);

      expect(stats.totalTimeHours).toBe(3);
    });

    it('should count activities correctly', () => {
      const activities = [
        createActivity({ id: '1' }),
        createActivity({ id: '2' }),
        createActivity({ id: '3' }),
      ];

      const stats = aggregateYearStats(activities, 2024);

      expect(stats.activityCount).toBe(3);
    });

    it('should calculate total kudos correctly', () => {
      const activities = [
        createActivity({ kudosCount: 5 }),
        createActivity({ kudosCount: 10 }),
        createActivity({ kudosCount: 3 }),
      ];

      const stats = aggregateYearStats(activities, 2024);

      expect(stats.totalKudos).toBe(18);
    });

    it('should handle zero kudos gracefully', () => {
      const activities = [
        createActivity({ kudosCount: 0 }),
        createActivity({ kudosCount: undefined }),
      ];

      const stats = aggregateYearStats(activities, 2024);

      expect(stats.totalKudos).toBe(0);
    });
  });

  describe('Year Filtering', () => {
    it('should only include activities from specified year', () => {
      const activities = [
        createActivity({ date: new Date('2024-01-01T10:00:00Z'), distanceKm: 10 }),
        createActivity({ date: new Date('2023-12-31T10:00:00Z'), distanceKm: 5 }),
        createActivity({ date: new Date('2024-12-31T10:00:00Z'), distanceKm: 15 }),
        createActivity({ date: new Date('2025-01-01T10:00:00Z'), distanceKm: 20 }),
      ];

      const stats = aggregateYearStats(activities, 2024);

      expect(stats.activityCount).toBe(2);
      expect(stats.totalDistanceKm).toBe(25); // Only 2024 activities
    });

    it('should return empty stats for year with no activities', () => {
      const activities = [createActivity({ date: new Date('2023-06-15T10:00:00Z') })];

      const stats = aggregateYearStats(activities, 2024);

      expect(stats.activityCount).toBe(0);
      expect(stats.totalDistanceKm).toBe(0);
      expect(stats.totalElevationMeters).toBe(0);
      expect(stats.totalTimeHours).toBe(0);
    });
  });

  describe('Monthly Aggregation', () => {
    it('should aggregate activities by month', () => {
      const activities = [
        createActivity({ date: new Date('2024-01-15'), distanceKm: 10 }),
        createActivity({ date: new Date('2024-01-20'), distanceKm: 5 }),
        createActivity({ date: new Date('2024-02-10'), distanceKm: 15 }),
      ];

      const stats = aggregateYearStats(activities, 2024);

      expect(stats.byMonth[0].monthName).toBe('January');
      expect(stats.byMonth[0].distanceKm).toBe(15);
      expect(stats.byMonth[0].activityCount).toBe(2);

      expect(stats.byMonth[1].monthName).toBe('February');
      expect(stats.byMonth[1].distanceKm).toBe(15);
      expect(stats.byMonth[1].activityCount).toBe(1);
    });

    it('should return all 12 months even if some have no activities', () => {
      const activities = [createActivity({ date: new Date('2024-01-15') })];

      const stats = aggregateYearStats(activities, 2024);

      expect(stats.byMonth).toHaveLength(12);

      // Check empty month
      expect(stats.byMonth[2].monthName).toBe('March');
      expect(stats.byMonth[2].distanceKm).toBe(0);
      expect(stats.byMonth[2].activityCount).toBe(0);
    });

    it('should calculate monthly elevation correctly', () => {
      const activities = [
        createActivity({ date: new Date('2024-03-10'), elevationGainMeters: 200 }),
        createActivity({ date: new Date('2024-03-20'), elevationGainMeters: 300 }),
      ];

      const stats = aggregateYearStats(activities, 2024);

      expect(stats.byMonth[2].elevationMeters).toBe(500);
    });

    it('should calculate monthly time in hours correctly', () => {
      const activities = [
        createActivity({ date: new Date('2024-04-10'), durationMinutes: 120 }),
        createActivity({ date: new Date('2024-04-20'), durationMinutes: 60 }),
      ];

      const stats = aggregateYearStats(activities, 2024);

      expect(stats.byMonth[3].timeHours).toBe(3);
    });
  });

  describe('Type Aggregation', () => {
    it('should aggregate activities by type', () => {
      const activities = [
        createActivity({ type: 'Run', distanceKm: 10 }),
        createActivity({ type: 'Run', distanceKm: 5 }),
        createActivity({ type: 'Ride', distanceKm: 50 }),
      ];

      const stats = aggregateYearStats(activities, 2024);

      expect(stats.byType.Run.count).toBe(2);
      expect(stats.byType.Run.distanceKm).toBe(15);
      expect(stats.byType.Ride.count).toBe(1);
      expect(stats.byType.Ride.distanceKm).toBe(50);
    });

    it('should aggregate type elevation correctly', () => {
      const activities = [
        createActivity({ type: 'Hike', elevationGainMeters: 500 }),
        createActivity({ type: 'Hike', elevationGainMeters: 700 }),
      ];

      const stats = aggregateYearStats(activities, 2024);

      expect(stats.byType.Hike.elevationMeters).toBe(1200);
    });

    it('should aggregate type time correctly', () => {
      const activities = [
        createActivity({ type: 'Swim', durationMinutes: 45 }),
        createActivity({ type: 'Swim', durationMinutes: 30 }),
      ];

      const stats = aggregateYearStats(activities, 2024);

      expect(stats.byType.Swim.timeHours).toBe(1.25);
    });

    it('should handle multiple activity types', () => {
      const activities = [
        createActivity({ type: 'Run' }),
        createActivity({ type: 'Ride' }),
        createActivity({ type: 'Swim' }),
        createActivity({ type: 'Hike' }),
      ];

      const stats = aggregateYearStats(activities, 2024);

      expect(stats.byType.Run).toBeDefined();
      expect(stats.byType.Ride).toBeDefined();
      expect(stats.byType.Swim).toBeDefined();
      expect(stats.byType.Hike).toBeDefined();
    });
  });

  describe('Highlight Activities', () => {
    it('should find longest activity by distance', () => {
      const activities = [
        createActivity({ id: '1', distanceKm: 10 }),
        createActivity({ id: '2', distanceKm: 25 }),
        createActivity({ id: '3', distanceKm: 15 }),
      ];

      const stats = aggregateYearStats(activities, 2024);

      expect(stats.longestActivity?.id).toBe('2');
      expect(stats.longestActivity?.distanceKm).toBe(25);
    });

    it('should find activity with highest elevation gain', () => {
      const activities = [
        createActivity({ id: '1', elevationGainMeters: 100 }),
        createActivity({ id: '2', elevationGainMeters: 500 }),
        createActivity({ id: '3', elevationGainMeters: 250 }),
      ];

      const stats = aggregateYearStats(activities, 2024);

      expect(stats.highestElevation?.id).toBe('2');
      expect(stats.highestElevation?.elevationGainMeters).toBe(500);
    });

    it('should return undefined for highlight activities when no activities exist', () => {
      const stats = aggregateYearStats([], 2024);

      expect(stats.longestActivity).toBeUndefined();
      expect(stats.highestElevation).toBeUndefined();
    });

    it('should handle single activity as both highlights', () => {
      const activity = createActivity({ id: '1', distanceKm: 20, elevationGainMeters: 300 });

      const stats = aggregateYearStats([activity], 2024);

      expect(stats.longestActivity?.id).toBe('1');
      expect(stats.highestElevation?.id).toBe('1');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty activity list', () => {
      const stats = aggregateYearStats([], 2024);

      expect(stats.activityCount).toBe(0);
      expect(stats.totalDistanceKm).toBe(0);
      expect(stats.totalElevationMeters).toBe(0);
      expect(stats.totalTimeHours).toBe(0);
      expect(stats.byMonth).toHaveLength(12);
    });

    it('should handle activities with zero values', () => {
      const activities = [
        createActivity({
          distanceKm: 0,
          elevationGainMeters: 0,
          durationMinutes: 0,
          kudosCount: 0,
        }),
      ];

      const stats = aggregateYearStats(activities, 2024);

      expect(stats.activityCount).toBe(1);
      expect(stats.totalDistanceKm).toBe(0);
      expect(stats.totalElevationMeters).toBe(0);
      expect(stats.totalTimeHours).toBe(0);
    });

    it('should maintain correct year in stats', () => {
      const activities = [createActivity()];

      const stats = aggregateYearStats(activities, 2024);

      expect(stats.year).toBe(2024);
    });

    it('should handle activities at year boundaries', () => {
      const activities = [
        createActivity({ id: '1', date: new Date(2024, 0, 1, 0, 0, 0), distanceKm: 10 }),
        createActivity({ id: '2', date: new Date(2024, 11, 31, 23, 59, 59), distanceKm: 20 }),
      ];

      const stats = aggregateYearStats(activities, 2024);

      expect(stats.activityCount).toBe(2);
      expect(stats.totalDistanceKm).toBe(30);
    });

    it('should handle large numbers correctly', () => {
      const activities = [
        createActivity({
          distanceKm: 999999,
          elevationGainMeters: 999999,
          durationMinutes: 999999,
        }),
      ];

      const stats = aggregateYearStats(activities, 2024);

      expect(stats.totalDistanceKm).toBe(999999);
      expect(stats.totalElevationMeters).toBe(999999);
      expect(stats.totalTimeHours).toBe(999999 / 60);
    });
  });

  describe('Decimal Precision', () => {
    it('should handle decimal distances correctly', () => {
      const activities = [
        createActivity({ distanceKm: 5.5 }),
        createActivity({ distanceKm: 10.3 }),
      ];

      const stats = aggregateYearStats(activities, 2024);

      expect(stats.totalDistanceKm).toBeCloseTo(15.8, 2);
    });

    it('should handle decimal time conversion correctly', () => {
      const activities = [
        createActivity({ durationMinutes: 45 }), // 0.75 hours
        createActivity({ durationMinutes: 90 }), // 1.5 hours
      ];

      const stats = aggregateYearStats(activities, 2024);

      expect(stats.totalTimeHours).toBeCloseTo(2.25, 2);
    });
  });

  describe('Day of Week Statistics', () => {
    it('should aggregate activities by day of week (Monday-first)', () => {
      const activities = [
        createActivity({ date: new Date('2024-01-08T10:00:00Z'), distanceKm: 10 }), // Monday
        createActivity({ date: new Date('2024-01-09T10:00:00Z'), distanceKm: 15 }), // Tuesday
        createActivity({ date: new Date('2024-01-08T14:00:00Z'), distanceKm: 5 }), // Monday
      ];

      const stats = aggregateYearStats(activities, 2024);

      expect(stats.byDayOfWeek).toHaveLength(7);
      expect(stats.byDayOfWeek[0].dayName).toBe('monday'); // Monday is index 0
      expect(stats.byDayOfWeek[0].activityCount).toBe(2);
      expect(stats.byDayOfWeek[0].distanceKm).toBe(15);
      expect(stats.byDayOfWeek[1].dayName).toBe('tuesday');
      expect(stats.byDayOfWeek[1].activityCount).toBe(1);
    });

    it('should include all 7 days even with no activities', () => {
      const activities = [
        createActivity({ date: new Date('2024-01-08T10:00:00Z') }), // Monday only
      ];

      const stats = aggregateYearStats(activities, 2024);

      expect(stats.byDayOfWeek).toHaveLength(7);
      stats.byDayOfWeek.forEach((day) => {
        expect(day.dayName).toBeDefined();
        expect(day.activityCount).toBeGreaterThanOrEqual(0);
      });
    });

    it('should calculate averages correctly for days with activities', () => {
      const activities = [
        createActivity({
          date: new Date('2024-01-08T10:00:00Z'),
          distanceKm: 10,
          durationMinutes: 60,
        }), // Monday
        createActivity({
          date: new Date('2024-01-08T14:00:00Z'),
          distanceKm: 20,
          durationMinutes: 120,
        }), // Monday
      ];

      const stats = aggregateYearStats(activities, 2024);
      const monday = stats.byDayOfWeek[0];

      expect(monday.averageDistance).toBe(15); // (10+20)/2
      expect(monday.averageTime).toBe(1.5); // (60+120)/60/2
    });
  });

  describe('Hour-Day Heatmap', () => {
    it('should create heatmap data for activities', () => {
      // Use activities with explicit dates
      const activities = [
        createActivity({ date: new Date('2024-01-08T10:00:00'), distanceKm: 10 }), // Monday 10am local
        createActivity({ date: new Date('2024-01-08T10:00:00'), distanceKm: 5 }), // Monday 10am local
        createActivity({ date: new Date('2024-01-09T14:00:00'), distanceKm: 15 }), // Tuesday 2pm local
      ];

      const stats = aggregateYearStats(activities, 2024);

      expect(stats.hourDayHeatmap).toBeInstanceOf(Map);
      expect(stats.hourDayHeatmap.size).toBeGreaterThan(0);

      // Should have entries for the activities
      const hasEntries = stats.hourDayHeatmap.size > 0;
      expect(hasEntries).toBe(true);
    });

    it('should handle empty heatmap', () => {
      const stats = aggregateYearStats([], 2024);

      expect(stats.hourDayHeatmap).toBeInstanceOf(Map);
      expect(stats.hourDayHeatmap.size).toBe(0);
    });
  });

  describe('Most Active Day', () => {
    it('should find the most active day by time', () => {
      const activities = [
        createActivity({
          date: new Date('2024-01-08T10:00:00Z'),
          durationMinutes: 120,
        }), // Monday
        createActivity({
          date: new Date('2024-01-09T10:00:00Z'),
          durationMinutes: 60,
        }), // Tuesday
        createActivity({
          date: new Date('2024-01-08T14:00:00Z'),
          durationMinutes: 90,
        }), // Monday
      ];

      const stats = aggregateYearStats(activities, 2024);

      expect(stats.mostActiveDay).toBeDefined();
      expect(stats.mostActiveDay?.dayName).toBe('monday');
      expect(stats.mostActiveDay?.activityCount).toBe(2);
      expect(stats.mostActiveDay?.timeHours).toBe(3.5); // 210 minutes / 60
    });

    it('should return undefined when no activities', () => {
      const stats = aggregateYearStats([], 2024);

      expect(stats.mostActiveDay).toBeUndefined();
    });
  });

  describe('Preferred Training Time', () => {
    it('should identify preferred training time block', () => {
      const activities = [
        createActivity({ date: new Date('2024-01-08T06:00:00Z') }), // Early morning
        createActivity({ date: new Date('2024-01-09T07:00:00Z') }), // Early morning
        createActivity({ date: new Date('2024-01-10T10:00:00Z') }), // Morning
        createActivity({ date: new Date('2024-01-11T06:30:00Z') }), // Early morning
      ];

      const stats = aggregateYearStats(activities, 2024);

      expect(stats.preferredTrainingTime).toBeDefined();
      expect(stats.preferredTrainingTime?.timeBlock).toBe('earlyMorning');
      expect(stats.preferredTrainingTime?.activityCount).toBe(3);
    });

    it('should handle night time block correctly (wraps around midnight)', () => {
      const activities = [
        createActivity({ date: new Date('2024-01-08T22:00:00Z') }), // Night
        createActivity({ date: new Date('2024-01-09T23:00:00Z') }), // Night
        createActivity({ date: new Date('2024-01-10T02:00:00Z') }), // Night (early AM)
      ];

      const stats = aggregateYearStats(activities, 2024);

      expect(stats.preferredTrainingTime).toBeDefined();
      expect(stats.preferredTrainingTime?.timeBlock).toBe('night');
      expect(stats.preferredTrainingTime?.activityCount).toBe(3);
    });

    it('should return undefined when no activities', () => {
      const stats = aggregateYearStats([], 2024);

      expect(stats.preferredTrainingTime).toBeUndefined();
    });
  });
});
