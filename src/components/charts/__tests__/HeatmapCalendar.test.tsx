import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { HeatmapCalendar } from '../HeatmapCalendar';
import type { Activity } from '../../../types';

describe('HeatmapCalendar', () => {
  describe('End of year date handling', () => {
    it('should render Dec 31 activities correctly without timezone issues', () => {
      // This test verifies the fix for the Dec 31 rendering bug
      // Bug: isInPeriod check used midnight dates, causing Dec 31 noon dates to fail comparison

      const dec31Activities: Activity[] = [
        {
          id: '10360',
          name: 'Home Triathlon - Swim',
          type: 'Swim',
          date: new Date('2024-12-31T10:00:00'),
          distanceKm: 1.5,
          durationMinutes: 33.75,
          movingTimeMinutes: 33.75,
          elevationGainMeters: 0,
          averageSpeedKmh: 2.67,
          maxSpeedKmh: 2.88,
        },
        {
          id: '10361',
          name: 'Home Triathlon - Bike',
          type: 'Ride',
          date: new Date('2024-12-31T11:15:00'),
          distanceKm: 40,
          durationMinutes: 75,
          movingTimeMinutes: 75,
          elevationGainMeters: 100,
          averageSpeedKmh: 32,
          maxSpeedKmh: 43.2,
        },
        {
          id: '10362',
          name: 'Home Triathlon - Run',
          type: 'Run',
          date: new Date('2024-12-31T12:40:00'),
          distanceKm: 10.5,
          durationMinutes: 47.25,
          movingTimeMinutes: 47.25,
          elevationGainMeters: 50,
          averageSpeedKmh: 13.33,
          maxSpeedKmh: 15.12,
        },
      ];

      const { container } = render(<HeatmapCalendar activities={dec31Activities} year={2024} />);

      // Find all elements with titles containing "Dec 31"
      const dec31Elements = Array.from(container.querySelectorAll('[title*="Dec 31"]'));

      // Should find exactly one Dec 31 cell
      expect(dec31Elements.length).toBeGreaterThan(0);

      // Verify Dec 31 cell is not transparent (has activities)
      const dec31Cell = dec31Elements[0];
      expect(dec31Cell.className).not.toContain('bg-transparent');

      // Verify the title contains the expected data
      const title = dec31Cell.getAttribute('title');
      expect(title).toContain('Dec 31');
      expect(title).toContain('3 activities'); // 3 activities from triathlon
      expect(title).toContain('52.0 km'); // Total distance
    });

    it('should handle activities on Jan 1 correctly', () => {
      const jan1Activities: Activity[] = [
        {
          id: '10001',
          name: 'New Year Run',
          type: 'Run',
          date: new Date('2024-01-01T09:00:00'),
          distanceKm: 5,
          durationMinutes: 20,
          movingTimeMinutes: 20,
          elevationGainMeters: 0,
          averageSpeedKmh: 15,
          maxSpeedKmh: 18,
        },
      ];

      const { container } = render(<HeatmapCalendar activities={jan1Activities} year={2024} />);

      const jan1Elements = Array.from(container.querySelectorAll('[title*="Jan 1"]'));
      expect(jan1Elements.length).toBeGreaterThan(0);

      const jan1Cell = jan1Elements[0];
      expect(jan1Cell.className).not.toContain('bg-transparent');

      const title = jan1Cell.getAttribute('title');
      expect(title).toContain('Jan 1');
      expect(title).toContain('1 activity');
    });

    it('should mark days without activities as rest days', () => {
      // Activities that skip Dec 30, so it should be a rest day
      const activities: Activity[] = [
        {
          id: '10001',
          name: 'Run Dec 29',
          type: 'Run',
          date: new Date('2024-12-29T10:00:00'),
          distanceKm: 5,
          durationMinutes: 20,
          movingTimeMinutes: 20,
          elevationGainMeters: 0,
          averageSpeedKmh: 15,
          maxSpeedKmh: 18,
        },
        {
          id: '10002',
          name: 'Run Dec 31',
          type: 'Run',
          date: new Date('2024-12-31T10:00:00'),
          distanceKm: 5,
          durationMinutes: 20,
          movingTimeMinutes: 20,
          elevationGainMeters: 0,
          averageSpeedKmh: 15,
          maxSpeedKmh: 18,
        },
      ];

      const { container } = render(<HeatmapCalendar activities={activities} year={2024} />);

      // Find Dec 30 (should be rest day)
      const dec30Elements = Array.from(container.querySelectorAll('[title*="Dec 30"]'));
      expect(dec30Elements.length).toBeGreaterThan(0);

      const dec30Cell = dec30Elements[0];
      const title = dec30Cell.getAttribute('title');
      expect(title).toContain('Rest day');
      expect(dec30Cell.className).toContain('bg-gray');
    });
  });

  describe('Activity aggregation', () => {
    it('should aggregate multiple activities on the same day', () => {
      const sameDayActivities: Activity[] = [
        {
          id: '1',
          name: 'Morning Run',
          type: 'Run',
          date: new Date('2024-06-15T08:00:00'),
          distanceKm: 5,
          durationMinutes: 20,
          movingTimeMinutes: 20,
          elevationGainMeters: 50,
          averageSpeedKmh: 15,
          maxSpeedKmh: 18,
        },
        {
          id: '2',
          name: 'Evening Ride',
          type: 'Ride',
          date: new Date('2024-06-15T18:00:00'),
          distanceKm: 30,
          durationMinutes: 60,
          movingTimeMinutes: 60,
          elevationGainMeters: 200,
          averageSpeedKmh: 30,
          maxSpeedKmh: 43.2,
        },
      ];

      const { container } = render(<HeatmapCalendar activities={sameDayActivities} year={2024} />);

      const jun15Elements = Array.from(container.querySelectorAll('[title*="Jun 15"]'));
      expect(jun15Elements.length).toBeGreaterThan(0);

      const jun15Cell = jun15Elements[0];
      const title = jun15Cell.getAttribute('title');

      // Should show combined stats
      expect(title).toContain('Jun 15');
      expect(title).toContain('2 activities');
      expect(title).toContain('1h 20min'); // 20 + 60 minutes
      expect(title).toContain('35.0 km'); // 5 + 30 km
    });
  });

  describe('Year boundary handling', () => {
    it('should handle last365 mode correctly', () => {
      const activities: Activity[] = [
        {
          id: '1',
          name: 'Recent Run',
          type: 'Run',
          date: new Date('2024-12-29T10:00:00'),
          distanceKm: 5,
          durationMinutes: 20,
          movingTimeMinutes: 20,
          elevationGainMeters: 0,
          averageSpeedKmh: 15,
          maxSpeedKmh: 18,
        },
      ];

      const { container } = render(<HeatmapCalendar activities={activities} year="last365" />);

      // Should render without errors
      const calendarCells = container.querySelectorAll('[title]');
      expect(calendarCells.length).toBeGreaterThan(0);
    });
  });

  describe('Visual indicators', () => {
    it('should apply different colors based on activity intensity', () => {
      const activities: Activity[] = [
        {
          id: '1',
          name: 'Light activity',
          type: 'Run',
          date: new Date('2024-06-01T10:00:00'),
          distanceKm: 2,
          durationMinutes: 10,
          movingTimeMinutes: 10,
          elevationGainMeters: 0,
          averageSpeedKmh: 12,
          maxSpeedKmh: 14.4,
        },
        {
          id: '2',
          name: 'Heavy activity',
          type: 'Ride',
          date: new Date('2024-06-15T10:00:00'),
          distanceKm: 100,
          durationMinutes: 240,
          movingTimeMinutes: 240,
          elevationGainMeters: 1000,
          averageSpeedKmh: 25,
          maxSpeedKmh: 36,
        },
      ];

      const { container } = render(<HeatmapCalendar activities={activities} year={2024} />);

      // Light activity should have lighter color
      const jun1Elements = Array.from(container.querySelectorAll('[title*="Jun 1"]'));
      const jun1Cell = jun1Elements[0];
      expect(jun1Cell.className).toMatch(/bg-emerald-(200|400)/);

      // Heavy activity should have darker color
      const jun15Elements = Array.from(container.querySelectorAll('[title*="Jun 15"]'));
      const jun15Cell = jun15Elements[0];
      expect(jun15Cell.className).toMatch(/bg-emerald-(600|800)/);
    });
  });

  describe('Regression: Dec 31 timezone bug', () => {
    it('should not mark Dec 31 as out of period when using noon dates', () => {
      // This is the specific regression test for the bug we fixed
      // The bug was: isInPeriod used `new Date(year, 11, 31)` (midnight)
      // But day.date was at noon, so noon > midnight made isInPeriod false

      const activities: Activity[] = [
        {
          id: '999',
          name: 'Dec 31 Activity',
          type: 'Run',
          date: new Date('2024-12-31T12:00:00'), // Noon local time
          distanceKm: 10,
          durationMinutes: 50,
          movingTimeMinutes: 50,
          elevationGainMeters: 0,
          averageSpeedKmh: 12,
          maxSpeedKmh: 14.4,
        },
      ];

      const { container } = render(<HeatmapCalendar activities={activities} year={2024} />);

      const dec31Elements = Array.from(container.querySelectorAll('[title*="Dec 31"]'));

      // CRITICAL: Should find Dec 31, not be transparent
      expect(dec31Elements.length).toBeGreaterThan(0);

      const dec31Cell = dec31Elements[0];

      // Should NOT be transparent (bug symptom)
      expect(dec31Cell.className).not.toContain('bg-transparent');

      // Should have emerald color (has activity)
      expect(dec31Cell.className).toContain('bg-emerald');

      // Should have proper title
      const title = dec31Cell.getAttribute('title');
      expect(title).toBeTruthy();
      expect(title).toContain('Dec 31');
      expect(title).not.toBe(''); // Bug caused empty title
    });
  });
});
