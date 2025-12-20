import type { Activity } from '../types';

export interface DistanceRecord {
  distance: string;
  activity: Activity;
  pace?: number; // min/km for running, min/100m for swimming
  speed?: number; // km/h for cycling
}

export interface SportHighlights {
  sport: 'running' | 'cycling' | 'swimming';
  totalDistance: number;
  totalTime: number;
  activityCount: number;
  averagePace?: number; // min/km or min/100m
  averageSpeed?: number; // km/h
  distanceRecords: DistanceRecord[];
  longestActivity: Activity;
  totalElevation: number;
}

// Distance ranges for each sport (in km)
const SWIM_DISTANCES = [
  { name: '100m', min: 0.08, max: 0.12 },
  { name: '500m', min: 0.4, max: 0.6 },
  { name: '1000m', min: 0.9, max: 1.1 },
  { name: '2000m', min: 1.8, max: 2.2 },
  { name: '5000m', min: 4.5, max: 5.5 },
];

const RUN_DISTANCES = [
  { name: '5km', min: 4.5, max: 5.5 },
  { name: '10km', min: 9.5, max: 10.5 },
  { name: '15km', min: 14, max: 16 },
  { name: 'Half Marathon', min: 20, max: 22 },
  { name: 'Marathon', min: 40, max: 44 },
];

const CYCLING_DISTANCES = [
  { name: '50km', min: 45, max: 55 },
  { name: '100km', min: 95, max: 105 },
  { name: '150km', min: 145, max: 155 },
  { name: '200km', min: 195, max: 210 },
];

function findBestForDistance(
  activities: Activity[],
  distanceRange: { name: string; min: number; max: number },
  sport: 'running' | 'cycling' | 'swimming'
): DistanceRecord | null {
  const matching = activities.filter(
    (a) => a.distanceKm >= distanceRange.min && a.distanceKm <= distanceRange.max
  );

  if (matching.length === 0) return null;

  // Find fastest (shortest time)
  const best = matching.reduce((fastest, current) =>
    current.movingTimeMinutes < fastest.movingTimeMinutes ? current : fastest
  );

  const record: DistanceRecord = {
    distance: distanceRange.name,
    activity: best,
  };

  // Calculate pace or speed
  if (sport === 'running') {
    // Pace in min/km
    record.pace = best.movingTimeMinutes / best.distanceKm;
  } else if (sport === 'swimming') {
    // Time per 100m in minutes
    record.pace = best.movingTimeMinutes / best.distanceKm / 10;
  } else if (sport === 'cycling') {
    // Speed in km/h
    record.speed = (best.distanceKm / best.movingTimeMinutes) * 60;
  }

  return record;
}

export function calculateSportHighlights(activities: Activity[]): {
  running?: SportHighlights;
  cycling?: SportHighlights;
  swimming?: SportHighlights;
} {
  const running = activities.filter((a) => a.type === 'Run');
  const cycling = activities.filter((a) => ['Ride', 'VirtualRide'].includes(a.type));
  const swimming = activities.filter((a) => a.type === 'Swim');

  const result: {
    running?: SportHighlights;
    cycling?: SportHighlights;
    swimming?: SportHighlights;
  } = {};

  // Running highlights
  if (running.length > 0) {
    const totalDistance = running.reduce((sum, a) => sum + a.distanceKm, 0);
    const totalTime = running.reduce((sum, a) => sum + a.movingTimeMinutes, 0);
    const totalElevation = running.reduce((sum, a) => sum + (a.elevationGainMeters || 0), 0);
    const averagePace = totalTime / totalDistance; // min/km

    const distanceRecords = RUN_DISTANCES.map((d) =>
      findBestForDistance(running, d, 'running')
    ).filter(Boolean) as DistanceRecord[];

    const longestActivity = running.reduce((longest, current) =>
      current.distanceKm > longest.distanceKm ? current : longest
    );

    result.running = {
      sport: 'running',
      totalDistance,
      totalTime,
      activityCount: running.length,
      averagePace,
      distanceRecords,
      longestActivity,
      totalElevation,
    };
  }

  // Cycling highlights
  if (cycling.length > 0) {
    const totalDistance = cycling.reduce((sum, a) => sum + a.distanceKm, 0);
    const totalTime = cycling.reduce((sum, a) => sum + a.movingTimeMinutes, 0);
    const totalElevation = cycling.reduce((sum, a) => sum + (a.elevationGainMeters || 0), 0);
    const averageSpeed = (totalDistance / totalTime) * 60; // km/h

    const distanceRecords = CYCLING_DISTANCES.map((d) =>
      findBestForDistance(cycling, d, 'cycling')
    ).filter(Boolean) as DistanceRecord[];

    const longestActivity = cycling.reduce((longest, current) =>
      current.distanceKm > longest.distanceKm ? current : longest
    );

    result.cycling = {
      sport: 'cycling',
      totalDistance,
      totalTime,
      activityCount: cycling.length,
      averageSpeed,
      distanceRecords,
      longestActivity,
      totalElevation,
    };
  }

  // Swimming highlights
  if (swimming.length > 0) {
    const totalDistance = swimming.reduce((sum, a) => sum + a.distanceKm, 0);
    const totalTime = swimming.reduce((sum, a) => sum + a.movingTimeMinutes, 0);
    const totalElevation = swimming.reduce((sum, a) => sum + (a.elevationGainMeters || 0), 0);
    const averagePace = totalTime / totalDistance / 10; // min/100m

    const distanceRecords = SWIM_DISTANCES.map((d) =>
      findBestForDistance(swimming, d, 'swimming')
    ).filter(Boolean) as DistanceRecord[];

    const longestActivity = swimming.reduce((longest, current) =>
      current.distanceKm > longest.distanceKm ? current : longest
    );

    result.swimming = {
      sport: 'swimming',
      totalDistance,
      totalTime,
      activityCount: swimming.length,
      averagePace,
      distanceRecords,
      longestActivity,
      totalElevation,
    };
  }

  return result;
}
