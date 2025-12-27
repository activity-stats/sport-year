import { describe, it, expect } from 'vitest';
import { transformActivity, transformActivities } from '../transformers';
import type { StravaActivity } from '../../types/strava';

describe('transformers', () => {
  describe('transformActivity', () => {
    it('should transform basic Strava activity to domain model', () => {
      const stravaActivity: StravaActivity = {
        id: 12345,
        name: 'Morning Run',
        type: 'Run',
        sport_type: 'Run',
        distance: 5000,
        moving_time: 1800,
        elapsed_time: 1900,
        total_elevation_gain: 100,
        start_date: '2024-01-15T08:00:00Z',
        start_date_local: '2024-01-15T09:00:00',
        timezone: '(GMT+01:00) Europe/Amsterdam',
        average_speed: 2.78,
        max_speed: 3.5,
        kudos_count: 5,
        map: {
          id: 'map123',
          summary_polyline: 'encoded_polyline',
          resource_state: 2,
        },
      };

      const result = transformActivity(stravaActivity);

      expect(result).toEqual({
        id: '12345',
        name: 'Morning Run',
        type: 'Run',
        date: new Date('2024-01-15T08:00:00Z'),
        distanceKm: 5,
        durationMinutes: 31.666666666666668,
        movingTimeMinutes: 30,
        elevationGainMeters: 100,
        averageSpeedKmh: 10.008,
        maxSpeedKmh: 12.6,
        averageHeartRate: undefined,
        maxHeartRate: undefined,
        sufferScore: undefined,
        calories: undefined,
        kilojoules: undefined,
        polyline: 'encoded_polyline',
        workoutType: undefined,
        kudosCount: 5,
      });
    });

    it('should transform activity with optional fields', () => {
      const stravaActivity: StravaActivity = {
        id: 67890,
        name: 'Evening Ride',
        type: 'Ride',
        sport_type: 'Ride',
        distance: 25000,
        moving_time: 3600,
        elapsed_time: 3800,
        total_elevation_gain: 500,
        start_date: '2024-06-20T18:00:00Z',
        start_date_local: '2024-06-20T20:00:00',
        timezone: '(GMT+02:00) Europe/Paris',
        average_speed: 6.94,
        max_speed: 12.5,
        average_heartrate: 145,
        max_heartrate: 178,
        suffer_score: 85,
        calories: 850,
        kilojoules: 3556,
        workout_type: 1,
        kudos_count: 12,

        map: {
          id: 'map456',
          summary_polyline: 'another_polyline',
          resource_state: 2,
        },
      };

      const result = transformActivity(stravaActivity);

      expect(result).toEqual({
        id: '67890',
        name: 'Evening Ride',
        type: 'Ride',
        date: new Date('2024-06-20T18:00:00Z'),
        distanceKm: 25,
        durationMinutes: 63.333333333333336,
        movingTimeMinutes: 60,
        elevationGainMeters: 500,
        averageSpeedKmh: 24.984,
        maxSpeedKmh: 45,
        averageHeartRate: 145,
        maxHeartRate: 178,
        sufferScore: 85,
        calories: 850,
        kilojoules: 3556,
        polyline: 'another_polyline',
        workoutType: 1,
        kudosCount: 12,
      });
    });

    it('should handle activity without map', () => {
      const stravaActivity: StravaActivity = {
        id: 99999,
        name: 'Indoor Run',
        type: 'Run',
        sport_type: 'Run',
        distance: 3000,
        moving_time: 900,
        elapsed_time: 900,
        total_elevation_gain: 0,
        start_date: '2024-03-10T07:00:00Z',
        start_date_local: '2024-03-10T08:00:00',
        timezone: '(GMT+01:00) Europe/Amsterdam',
        average_speed: 3.33,
        max_speed: 4.0,
        kudos_count: 2,
      };

      const result = transformActivity(stravaActivity);

      expect(result.polyline).toBeUndefined();
      expect(result.id).toBe('99999');
      expect(result.name).toBe('Indoor Run');
    });

    it('should convert ID to string', () => {
      const stravaActivity: StravaActivity = {
        id: 123,
        name: 'Test',
        type: 'Run',
        sport_type: 'Run',
        distance: 1000,
        moving_time: 300,
        elapsed_time: 300,
        total_elevation_gain: 0,
        start_date: '2024-01-01T00:00:00Z',
        start_date_local: '2024-01-01T00:00:00',
        timezone: '(GMT+00:00) UTC',
        average_speed: 3.33,
        max_speed: 4.0,
        kudos_count: 0,
      };

      const result = transformActivity(stravaActivity);

      expect(result.id).toBe('123');
      expect(typeof result.id).toBe('string');
    });

    it('should correctly convert units', () => {
      const stravaActivity: StravaActivity = {
        id: 111,
        name: 'Unit Test',
        type: 'Run',
        sport_type: 'Run',
        distance: 10000, // 10 km
        moving_time: 3600, // 60 minutes
        elapsed_time: 3600,
        total_elevation_gain: 250,
        start_date: '2024-01-01T00:00:00Z',
        start_date_local: '2024-01-01T00:00:00',
        timezone: '(GMT+00:00) UTC',
        average_speed: 2.78, // 10 km/h
        max_speed: 5.56, // 20 km/h
        kudos_count: 0,
      };

      const result = transformActivity(stravaActivity);

      expect(result.distanceKm).toBe(10);
      expect(result.movingTimeMinutes).toBe(60);
      expect(result.averageSpeedKmh).toBeCloseTo(10.008, 2);
      expect(result.maxSpeedKmh).toBeCloseTo(20.016, 2);
    });
  });

  describe('transformActivities', () => {
    it('should transform array of Strava activities', () => {
      const stravaActivities: StravaActivity[] = [
        {
          id: 1,
          name: 'Activity 1',
          type: 'Run',
          sport_type: 'Run',
          distance: 5000,
          moving_time: 1800,
          elapsed_time: 1900,
          total_elevation_gain: 50,
          start_date: '2024-01-01T08:00:00Z',
          start_date_local: '2024-01-01T09:00:00',
          timezone: '(GMT+01:00) Europe/Amsterdam',
          average_speed: 2.78,
          max_speed: 3.5,
          kudos_count: 3,
        },
        {
          id: 2,
          name: 'Activity 2',
          type: 'Ride',
          sport_type: 'Ride',
          distance: 20000,
          moving_time: 3000,
          elapsed_time: 3100,
          total_elevation_gain: 300,
          start_date: '2024-01-02T10:00:00Z',
          start_date_local: '2024-01-02T11:00:00',
          timezone: '(GMT+01:00) Europe/Amsterdam',
          average_speed: 6.67,
          max_speed: 10.0,
          kudos_count: 7,
        },
      ];

      const result = transformActivities(stravaActivities);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[0].name).toBe('Activity 1');
      expect(result[0].type).toBe('Run');
      expect(result[1].id).toBe('2');
      expect(result[1].name).toBe('Activity 2');
      expect(result[1].type).toBe('Ride');
    });

    it('should handle empty array', () => {
      const result = transformActivities([]);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should transform single activity array', () => {
      const stravaActivities: StravaActivity[] = [
        {
          id: 42,
          name: 'Solo Activity',
          type: 'Run',
          sport_type: 'Run',
          distance: 1000,
          moving_time: 300,
          elapsed_time: 300,
          total_elevation_gain: 10,
          start_date: '2024-01-15T08:00:00Z',
          start_date_local: '2024-01-15T09:00:00',
          timezone: '(GMT+01:00) Europe/Amsterdam',
          average_speed: 3.33,
          max_speed: 4.0,
          kudos_count: 1,
        },
      ];

      const result = transformActivities(stravaActivities);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('42');
      expect(result[0].name).toBe('Solo Activity');
    });
  });
});
