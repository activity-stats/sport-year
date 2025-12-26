import type { Activity } from '../types';
import type { ActivityTypeFilter } from '../stores/settingsStore';

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
  biggestClimb: Activity | null;
  totalElevation: number;
}

// Distance ranges for each sport (in km)
const _SWIM_DISTANCES = [
  { name: '100m', min: 0.08, max: 0.12 },
  { name: '500m', min: 0.4, max: 0.6 },
  { name: '1000m', min: 0.9, max: 1.1 },
  { name: '2000m', min: 1.8, max: 2.2 },
  { name: '5000m', min: 4.5, max: 5.5 },
];

const _RUN_DISTANCES = [
  { name: '5km', min: 4.5, max: 5.5 },
  { name: '10km', min: 9.5, max: 10.5 },
  { name: '15km', min: 14, max: 16 },
  { name: 'Half Marathon', min: 20, max: 22 },
  { name: 'Marathon', min: 40, max: 44 },
];

const _CYCLING_DISTANCES = [
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

export function calculateSportHighlights(
  activities: Activity[],
  activityFilters?: ActivityTypeFilter[],
  excludeActivityIds?: Set<string>
): {
  running?: SportHighlights;
  cycling?: SportHighlights;
  swimming?: SportHighlights;
} {
  // Keep all activities for longest and biggest climb calculation
  const allRunning = activities.filter((a) => a.type === 'Run');
  const allCycling = activities.filter((a) => ['Ride', 'VirtualRide'].includes(a.type));
  const allSwimming = activities.filter((a) => a.type === 'Swim');

  // Filter out activities that were matched by custom filters for distance records
  const filteredActivities = excludeActivityIds
    ? activities.filter((a) => !excludeActivityIds.has(a.id))
    : activities;

  // Use provided activities for totals - will include VirtualRides
  // For distance records (highlight cards), use only Ride to respect virtual ride exclusion
  const running = filteredActivities.filter((a) => a.type === 'Run');
  const cyclingForRecords = filteredActivities.filter((a) => a.type === 'Ride');
  const cyclingForTotals = filteredActivities.filter((a) =>
    ['Ride', 'VirtualRide'].includes(a.type)
  );
  const swimming = filteredActivities.filter((a) => a.type === 'Swim');

  const result: {
    running?: SportHighlights;
    cycling?: SportHighlights;
    swimming?: SportHighlights;
  } = {};

  // Build distance ranges for running from activityFilters only
  const runDistances: { name: string; min: number; max: number }[] = [];
  if (activityFilters) {
    const runFilter = activityFilters.find((f) => f.activityType === 'Run');
    if (runFilter && runFilter.distanceFilters.length > 0) {
      // Convert distance filters to ranges
      runFilter.distanceFilters.forEach((df) => {
        if (df.operator === '±' || df.operator === '=' || df.operator === 'eq') {
          let tolerance = 0;
          if (df.operator === 'eq') tolerance = df.value * 0.1;
          else if (df.operator === '±') tolerance = df.value * 0.05;
          else if (df.operator === '=') tolerance = 0.1;

          const min = df.value - tolerance;
          const max = df.value + tolerance;

          // Use a more descriptive name based on the distance
          let name = `${Math.round(df.value)}km`;
          if (df.value === 21) name = 'Half Marathon';
          else if (df.value === 42) name = 'Marathon';

          runDistances.push({ name, min, max });
        }
      });
      // Sort by min distance
      runDistances.sort((a, b) => a.min - b.min);
    }
  }

  // Running highlights
  if (running.length > 0) {
    const totalDistance = running.reduce((sum, a) => sum + a.distanceKm, 0);
    const totalTime = running.reduce((sum, a) => sum + a.movingTimeMinutes, 0);
    const totalElevation = running.reduce((sum, a) => sum + (a.elevationGainMeters || 0), 0);
    const averagePace = totalTime / totalDistance; // min/km

    // Sort runDistances by min distance to ensure proper ordering
    runDistances.sort((a, b) => a.min - b.min);

    const distanceRecords = runDistances
      .map((d) => findBestForDistance(running, d, 'running'))
      .filter(Boolean) as DistanceRecord[];

    const longestActivity = allRunning.reduce((longest, current) =>
      current.distanceKm > longest.distanceKm ? current : longest
    );

    // Find activity with biggest elevation gain
    const biggestClimb =
      allRunning.length > 0
        ? allRunning.reduce((biggest, current) => {
            const currentElevation = current.elevationGainMeters || 0;
            const biggestElevation = biggest.elevationGainMeters || 0;
            return currentElevation > biggestElevation ? current : biggest;
          })
        : null;

    result.running = {
      sport: 'running',
      totalDistance,
      totalTime,
      activityCount: running.length,
      averagePace,
      distanceRecords,
      longestActivity,
      biggestClimb: (biggestClimb?.elevationGainMeters || 0) > 50 ? biggestClimb : null,
      totalElevation,
    };
  }

  // Build distance ranges for cycling from activityFilters only
  const cyclingDistances: { name: string; min: number; max: number }[] = [];
  if (activityFilters) {
    // Only use Ride filter since VirtualRide should be filtered out already
    const rideFilter = activityFilters.find((f) => f.activityType === 'Ride');

    if (rideFilter && rideFilter.distanceFilters.length > 0) {
      // Convert distance filters to ranges
      rideFilter.distanceFilters.forEach((df) => {
        if (df.operator === '±' || df.operator === '=' || df.operator === 'eq') {
          let tolerance = 0;
          if (df.operator === 'eq') tolerance = df.value * 0.1;
          else if (df.operator === '±') tolerance = df.value * 0.05;
          else if (df.operator === '=') tolerance = 0.1;

          const min = df.value - tolerance;
          const max = df.value + tolerance;
          const name = `${Math.round(df.value)}km`;

          cyclingDistances.push({ name, min, max });
        }
      });
      cyclingDistances.sort((a, b) => a.min - b.min);
    }
  }

  // Cycling highlights
  if (cyclingForTotals.length > 0) {
    const totalDistance = cyclingForTotals.reduce((sum, a) => sum + a.distanceKm, 0);
    const totalTime = cyclingForTotals.reduce((sum, a) => sum + a.movingTimeMinutes, 0);
    const totalElevation = cyclingForTotals.reduce(
      (sum, a) => sum + (a.elevationGainMeters || 0),
      0
    );
    const averageSpeed = (totalDistance / totalTime) * 60; // km/h

    // Sort cyclingDistances by min distance to ensure proper ordering
    cyclingDistances.sort((a, b) => a.min - b.min);

    // Use cyclingForRecords (Ride only) for distance records to respect virtual ride exclusion
    const distanceRecords = cyclingDistances
      .map((d) => findBestForDistance(cyclingForRecords, d, 'cycling'))
      .filter(Boolean) as DistanceRecord[];

    const longestActivity = allCycling.reduce((longest, current) =>
      current.distanceKm > longest.distanceKm ? current : longest
    );

    // Find activity with biggest elevation gain
    const biggestClimb =
      allCycling.length > 0
        ? allCycling.reduce((biggest, current) => {
            const currentElevation = current.elevationGainMeters || 0;
            const biggestElevation = biggest.elevationGainMeters || 0;
            return currentElevation > biggestElevation ? current : biggest;
          })
        : null;

    result.cycling = {
      sport: 'cycling',
      totalDistance,
      totalTime,
      activityCount: cyclingForTotals.length,
      averageSpeed,
      distanceRecords,
      longestActivity,
      biggestClimb: (biggestClimb?.elevationGainMeters || 0) > 50 ? biggestClimb : null,
      totalElevation,
    };
  }

  // Build distance ranges for swimming from activityFilters only
  const swimDistances: { name: string; min: number; max: number }[] = [];
  if (activityFilters) {
    const swimFilter = activityFilters.find((f) => f.activityType === 'Swim');
    if (swimFilter && swimFilter.distanceFilters.length > 0) {
      // Convert distance filters to ranges
      swimFilter.distanceFilters.forEach((df) => {
        if (df.operator === '±' || df.operator === '=' || df.operator === 'eq') {
          let tolerance = 0;
          if (df.operator === 'eq') tolerance = df.value * 0.1;
          else if (df.operator === '±') tolerance = df.value * 0.05;
          else if (df.operator === '=') tolerance = 0.1;

          const min = df.value - tolerance;
          const max = df.value + tolerance;

          // Format swim distances nicely
          let name = '';
          if (df.value < 1) {
            name = `${Math.round(df.value * 1000)}m`;
          } else {
            name = `${df.value}km`;
          }

          swimDistances.push({ name, min, max });
        }
      });
      // Sort by min distance
      swimDistances.sort((a, b) => a.min - b.min);
    }
  }

  // Swimming highlights
  if (swimming.length > 0) {
    const totalDistance = swimming.reduce((sum, a) => sum + a.distanceKm, 0);
    const totalTime = swimming.reduce((sum, a) => sum + a.movingTimeMinutes, 0);
    const totalElevation = swimming.reduce((sum, a) => sum + (a.elevationGainMeters || 0), 0);
    const averagePace = totalTime / totalDistance / 10; // min/100m

    // Sort swimDistances by min distance to ensure proper ordering
    swimDistances.sort((a, b) => a.min - b.min);

    const distanceRecords = swimDistances
      .map((d) => findBestForDistance(swimming, d, 'swimming'))
      .filter(Boolean) as DistanceRecord[];

    const longestActivity = allSwimming.reduce((longest, current) =>
      current.distanceKm > longest.distanceKm ? current : longest
    );

    // Swimming rarely has elevation, but include for completeness
    const biggestClimb =
      allSwimming.length > 0
        ? allSwimming.reduce((biggest, current) => {
            const currentElevation = current.elevationGainMeters || 0;
            const biggestElevation = biggest.elevationGainMeters || 0;
            return currentElevation > biggestElevation ? current : biggest;
          })
        : null;

    result.swimming = {
      sport: 'swimming',
      totalDistance,
      totalTime,
      activityCount: swimming.length,
      averagePace,
      distanceRecords,
      longestActivity,
      biggestClimb: (biggestClimb?.elevationGainMeters || 0) > 50 ? biggestClimb : null,
      totalElevation,
    };
  }

  return result;
}
