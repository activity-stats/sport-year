import { describe, it, expect } from 'vitest';
import {
  formatDistance,
  formatDistanceWithUnit,
  formatDistanceForClosing,
  formatDuration,
  formatPace,
  formatElevation,
  formatHeartRate,
  formatDate,
  formatTime,
  formatAthleteSlug,
} from '../formatters';

describe('formatters', () => {
  describe('formatDistance', () => {
    it('should format distance < 10km with 2 decimals', () => {
      expect(formatDistance(5000)).toBe('5,00');
      expect(formatDistance(1234)).toBe('1,23');
      expect(formatDistance(9999)).toBe('10,00');
    });

    it('should format distance >= 10km with 1 decimal', () => {
      expect(formatDistance(10000)).toBe('10,0');
      expect(formatDistance(42195)).toBe('42,2');
      expect(formatDistance(100000)).toBe('100,0');
    });

    it('should handle zero distance', () => {
      expect(formatDistance(0)).toBe('0,00');
    });
  });

  describe('formatDistanceWithUnit', () => {
    it('should format distance with km unit', () => {
      expect(formatDistanceWithUnit(5000)).toBe('5,00 km');
      expect(formatDistanceWithUnit(10000)).toBe('10,0 km');
      expect(formatDistanceWithUnit(42195)).toBe('42,2 km');
    });
  });

  describe('formatDistanceForClosing', () => {
    it('should format distance with thousands separator and one decimal', () => {
      expect(formatDistanceForClosing(13926900)).toBe('13.926,9 km');
      expect(formatDistanceForClosing(1234500)).toBe('1.234,5 km');
      expect(formatDistanceForClosing(5000)).toBe('5,0 km');
      expect(formatDistanceForClosing(999999)).toBe('1.000,0 km');
    });
  });

  describe('formatDuration', () => {
    it('should format hours and minutes', () => {
      expect(formatDuration(3661)).toBe('1h 1m');
      expect(formatDuration(7200)).toBe('2h 0m');
      expect(formatDuration(3723)).toBe('1h 2m');
    });

    it('should format minutes and seconds when no hours', () => {
      expect(formatDuration(61)).toBe('1m 1s');
      expect(formatDuration(120)).toBe('2m 0s');
      expect(formatDuration(3599)).toBe('59m 59s');
    });

    it('should format only seconds when less than a minute', () => {
      expect(formatDuration(0)).toBe('0s');
      expect(formatDuration(30)).toBe('30s');
      expect(formatDuration(59)).toBe('59s');
    });
  });

  describe('formatPace', () => {
    it('should format pace as min/km for Run', () => {
      // 3.33 m/s = 5:00 min/km
      expect(formatPace(3.33, 'Run')).toBe('5:00 /km');

      // 2.77 m/s ≈ 6:00 min/km
      expect(formatPace(2.77, 'Run')).toBe('6:01 /km');
    });

    it('should format pace as min/km for Swim', () => {
      // 1.0 m/s = 16:40 min/km
      expect(formatPace(1.0, 'Swim')).toBe('16:40 /km');
    });

    it('should format pace as km/h for Ride', () => {
      // 8.33 m/s = 30.0 km/h
      expect(formatPace(8.33, 'Ride')).toBe('30,0 km/h');

      // 5.55 m/s ≈ 20.0 km/h
      expect(formatPace(5.55, 'Ride')).toBe('20,0 km/h');
    });

    it('should format pace as km/h for other activity types', () => {
      expect(formatPace(5.0, 'Walk')).toBe('18,0 km/h');
      expect(formatPace(10.0, 'Hike')).toBe('36,0 km/h');
    });
  });

  describe('formatElevation', () => {
    it('should format elevation as rounded meters', () => {
      expect(formatElevation(100)).toBe('100 m');
      expect(formatElevation(123.4)).toBe('123 m');
      expect(formatElevation(567.8)).toBe('568 m');
    });

    it('should handle zero elevation', () => {
      expect(formatElevation(0)).toBe('0 m');
    });
  });

  describe('formatHeartRate', () => {
    it('should format heart rate as rounded bpm', () => {
      expect(formatHeartRate(150)).toBe('150 bpm');
      expect(formatHeartRate(123.4)).toBe('123 bpm');
      expect(formatHeartRate(178.9)).toBe('179 bpm');
    });

    it('should return N/A when heart rate is undefined', () => {
      expect(formatHeartRate(undefined)).toBe('N/A');
    });

    it('should return N/A when heart rate is 0', () => {
      expect(formatHeartRate(0)).toBe('N/A');
    });
  });

  describe('formatDate', () => {
    it('should format date in en-US format', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = formatDate(date);

      // Format will be "Jan 15, 2024" in en-US locale
      expect(formatted).toMatch(/Jan 1[45], 2024/); // Allow for timezone differences
    });

    it('should format different dates correctly', () => {
      const date = new Date('2024-12-25T00:00:00Z');
      const formatted = formatDate(date);

      expect(formatted).toMatch(/Dec 2[45], 2024/); // Allow for timezone differences
    });
  });

  describe('formatTime', () => {
    it('should format time in 12-hour format with AM/PM', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = formatTime(date);

      // Should include time with AM/PM
      expect(formatted).toMatch(/\d{1,2}:\d{2} (AM|PM)/);
    });

    it('should format different times correctly', () => {
      const date = new Date('2024-01-15T15:45:00Z');
      const formatted = formatTime(date);

      // Should include time with AM/PM
      expect(formatted).toMatch(/\d{1,2}:\d{2} (AM|PM)/);
    });
  });

  describe('formatAthleteSlug', () => {
    it('should format athlete name as slug', () => {
      const athlete = { firstname: 'John', lastname: 'Doe' };
      expect(formatAthleteSlug(athlete)).toBe('john-doe');
    });

    it('should handle names with spaces', () => {
      const athlete = { firstname: 'John Paul', lastname: 'Doe Smith' };
      expect(formatAthleteSlug(athlete)).toBe('john-paul-doe-smith');
    });

    it('should handle names with uppercase', () => {
      const athlete = { firstname: 'JOHN', lastname: 'DOE' };
      expect(formatAthleteSlug(athlete)).toBe('john-doe');
    });

    it('should handle spaces in names', () => {
      const athlete = { firstname: 'John Paul', lastname: 'Doe Smith' };
      expect(formatAthleteSlug(athlete)).toBe('john-paul-doe-smith');
    });

    it('should return "athlete" when both names are empty', () => {
      const athlete = { firstname: '', lastname: '' };
      expect(formatAthleteSlug(athlete)).toBe('athlete');
    });

    it('should return "athlete" when athlete is null', () => {
      expect(formatAthleteSlug(null)).toBe('athlete');
    });

    it('should return "athlete" when athlete is undefined', () => {
      expect(formatAthleteSlug(undefined)).toBe('athlete');
    });

    it('should handle single name when lastname is empty', () => {
      const athlete = { firstname: 'John', lastname: '' };
      expect(formatAthleteSlug(athlete)).toBe('john-');
    });

    it('should handle single name when firstname is empty', () => {
      const athlete = { firstname: '', lastname: 'Doe' };
      expect(formatAthleteSlug(athlete)).toBe('-doe');
    });

    it('should handle multiple spaces by collapsing to single hyphen', () => {
      const athlete = { firstname: 'John   Paul', lastname: 'Doe   Smith' };
      expect(formatAthleteSlug(athlete)).toBe('john-paul-doe-smith');
    });
  });
});
