import type { ActivityType } from './strava';

// Domain model - transformed from Strava API responses
export interface Activity {
  id: string;
  name: string;
  type: ActivityType;
  date: Date;
  distanceKm: number;
  durationMinutes: number;
  movingTimeMinutes: number;
  elevationGainMeters: number;
  averageSpeedKmh: number;
  maxSpeedKmh: number;
  averageHeartRate?: number;
  maxHeartRate?: number;
  sufferScore?: number;
  calories?: number;
  kilojoules?: number;
  polyline?: string;
  workoutType?: number; // For runs: 0=default, 1=race, 2=long run, 3=workout
  kudosCount?: number;
}

export interface YearStats {
  year: number;
  totalDistanceKm: number;
  totalElevationMeters: number;
  totalTimeHours: number;
  activityCount: number;
  totalKudos: number;
  byMonth: MonthlyStats[];
  byType: Record<ActivityType, TypeStats>;
  longestActivity?: Activity;
  highestElevation?: Activity;
}

export interface MonthlyStats {
  month: number; // 0-11
  monthName: string;
  distanceKm: number;
  elevationMeters: number;
  timeHours: number;
  activityCount: number;
}

export interface TypeStats {
  count: number;
  distanceKm: number;
  elevationMeters: number;
  timeHours: number;
}
