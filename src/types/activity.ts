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

export interface DayOfWeekStats {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  dayName: string;
  distanceKm: number;
  timeHours: number;
  activityCount: number;
  averageDistance: number;
  averageTime: number;
}

export interface HourDayHeatmapCell {
  day: number; // 0-6 (Sunday-Saturday)
  hour: number; // 0-23
  activityCount: number;
  distanceKm: number;
  timeHours: number;
  activities: Activity[];
}

export interface MostActiveDay {
  dayName: string;
  activityCount: number;
  distanceKm: number;
  timeHours: number;
}

export interface PreferredTrainingTime {
  timeBlock: string;
  startHour: number;
  endHour: number;
  activityCount: number;
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
  byDayOfWeek: DayOfWeekStats[];
  hourDayHeatmap: Map<string, HourDayHeatmapCell>;
  mostActiveDay?: MostActiveDay;
  preferredTrainingTime?: PreferredTrainingTime;
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
