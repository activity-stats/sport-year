import type { Activity } from '../types';
import type { ActivityTypeFilter, TitlePattern } from '../stores/settingsStore';

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

// Distance ranges for each sport (in km) - kept for potential future use
// const _SWIM_DISTANCES = [
//   { name: '100m', min: 0.08, max: 0.12 },
//   { name: '500m', min: 0.4, max: 0.6 },
//   { name: '1000m', min: 0.9, max: 1.1 },
//   { name: '2000m', min: 1.8, max: 2.2 },
//   { name: '5000m', min: 4.5, max: 5.5 },
// ];

// const _RUN_DISTANCES = [
//   { name: '5km', min: 4.5, max: 5.5 },
//   { name: '10km', min: 9.5, max: 10.5 },
//   { name: '15km', min: 14, max: 16 },
//   { name: 'Half Marathon', min: 20, max: 22 },
//   { name: 'Marathon', min: 40, max: 44 },
// ];

// const _CYCLING_DISTANCES = [
//   { name: '50km', min: 45, max: 55 },
//   { name: '100km', min: 95, max: 105 },
//   { name: '150km', min: 145, max: 155 },
//   { name: '200km', min: 195, max: 210 },
// ];

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
  excludeActivityIds?: Set<string>,
  titleIgnorePatterns?: TitlePattern[],
  includeInHighlights?: string[]
): {
  running?: SportHighlights;
  cycling?: SportHighlights;
  swimming?: SportHighlights;
} {
  // Helper to check if activity should be excluded from highlights based on title patterns
  const shouldExcludeFromHighlights = (activity: Activity): boolean => {
    if (!titleIgnorePatterns || titleIgnorePatterns.length === 0) return false;

    return titleIgnorePatterns.some(
      (pattern) =>
        pattern.excludeFromHighlights &&
        activity.name.toLowerCase().includes(pattern.pattern.toLowerCase())
    );
  };

  // Helper to check if activity type is included in highlights
  const isIncludedInHighlights = (activityType: string): boolean => {
    if (!includeInHighlights) return true; // If not provided, include all
    return includeInHighlights.includes(activityType);
  };

  // STEP 1: Filter out activities that were matched by custom filters (for display only)
  const filteredActivities = excludeActivityIds
    ? activities.filter((a) => !excludeActivityIds.has(a.id))
    : activities;

  // STEP 2: For EACH sport, filter by type FIRST
  // - allSport: ALL activities for totals (no filtering)
  // - sportForLongest: For longest/biggest climb calculations (only filter by title patterns, NOT by excludeActivityIds)
  // - sportForHighlights: For distance records display (filtered by excludeActivityIds AND title patterns)

  // Running: ALL runs for totals calculation (not filtered)
  const allRunning = activities.filter((a) => a.type === 'Run');
  // Runs for longest/biggest climb (filter by title patterns only, NOT by excludeActivityIds)
  const runningForLongest = activities
    .filter((a) => a.type === 'Run')
    .filter((a) => !shouldExcludeFromHighlights(a));
  // Runs for highlights display (filtered by excludeActivityIds AND title patterns)
  const runningForHighlights = filteredActivities
    .filter((a) => a.type === 'Run')
    .filter((a) => !shouldExcludeFromHighlights(a))
    .filter((a) => isIncludedInHighlights(a.type));

  // Cycling: ALL cycling for totals calculation (not filtered)
  const allCycling = activities.filter((a) => ['Ride', 'VirtualRide'].includes(a.type));
  // Cycling for longest/biggest climb (filter by title patterns only, NOT by excludeActivityIds)
  const cyclingForLongest = activities
    .filter((a) => ['Ride', 'VirtualRide'].includes(a.type))
    .filter((a) => !shouldExcludeFromHighlights(a));
  // Cycling for highlights display (filtered by excludeActivityIds AND title patterns)
  const cyclingForHighlights = filteredActivities
    .filter((a) => ['Ride', 'VirtualRide'].includes(a.type))
    .filter((a) => !shouldExcludeFromHighlights(a))
    .filter((a) => isIncludedInHighlights(a.type));

  // Swimming: ALL swimming for totals calculation (not filtered)
  const allSwimming = activities.filter((a) => a.type === 'Swim');
  // Swimming for longest (filter by title patterns only, NOT by excludeActivityIds)
  const swimmingForLongest = activities
    .filter((a) => a.type === 'Swim')
    .filter((a) => !shouldExcludeFromHighlights(a));
  // Swimming for highlights display (filtered by excludeActivityIds AND title patterns)
  const swimmingForHighlights = filteredActivities
    .filter((a) => a.type === 'Swim')
    .filter((a) => !shouldExcludeFromHighlights(a))
    .filter((a) => isIncludedInHighlights(a.type));

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

  // Running highlights - only if we have filtered activities
  if (runningForHighlights.length > 0) {
    // Use ALL running for totals (not filtered)
    const totalDistance = allRunning.reduce((sum, a) => sum + a.distanceKm, 0);
    const totalTime = allRunning.reduce((sum, a) => sum + a.movingTimeMinutes, 0);
    const totalElevation = allRunning.reduce((sum, a) => sum + (a.elevationGainMeters || 0), 0);
    const averagePace = totalTime / totalDistance; // min/km

    // Sort runDistances by min distance to ensure proper ordering
    runDistances.sort((a, b) => a.min - b.min);

    // Use FILTERED activities for distance records
    const distanceRecords = runDistances
      .map((d) => findBestForDistance(runningForHighlights, d, 'running'))
      .filter(Boolean) as DistanceRecord[];

    // Calculate longest and biggest climb from FILTERED running activities
    // This respects title patterns with excludeFromHighlights flag
    const longestActivity = runningForLongest.reduce((longest, current) =>
      current.distanceKm > longest.distanceKm ? current : longest
    );

    // Find activity with biggest elevation gain from filtered running
    const biggestClimb = runningForLongest.reduce((biggest, current) => {
      const currentElevation = current.elevationGainMeters || 0;
      const biggestElevation = biggest.elevationGainMeters || 0;
      return currentElevation > biggestElevation ? current : biggest;
    });

    result.running = {
      sport: 'running',
      totalDistance,
      totalTime,
      activityCount: allRunning.length,
      averagePace,
      distanceRecords,
      longestActivity,
      biggestClimb: (biggestClimb?.elevationGainMeters || 0) > 50 ? biggestClimb : null,
      totalElevation,
    };
  }

  // Build distance ranges for cycling from activityFilters only
  // ONLY include filters from activity types that are in includeInHighlights
  const cycleDistances: { name: string; min: number; max: number }[] = [];
  if (activityFilters) {
    // Collect distance filters only from activity types that are included in highlights
    const distanceMap = new Map<number, { name: string; min: number; max: number }>();

    activityFilters.forEach((filter) => {
      // Only process cycling-related filters that are in includeInHighlights
      if (
        ['Ride', 'VirtualRide'].includes(filter.activityType) &&
        isIncludedInHighlights(filter.activityType) &&
        filter.distanceFilters.length > 0
      ) {
        filter.distanceFilters.forEach((df) => {
          if (df.operator === '±' || df.operator === '=' || df.operator === 'eq') {
            let tolerance = 0;
            if (df.operator === 'eq') tolerance = df.value * 0.1;
            else if (df.operator === '±') tolerance = df.value * 0.05;
            else if (df.operator === '=') tolerance = 0.1;

            const min = df.value - tolerance;
            const max = df.value + tolerance;
            const name = `${Math.round(df.value)}km`;

            // Use Map to deduplicate (e.g., both Ride and VirtualRide might have same distance)
            if (!distanceMap.has(df.value)) {
              distanceMap.set(df.value, { name, min, max });
            }
          }
        });
      }
    });

    cycleDistances.push(...distanceMap.values());
    cycleDistances.sort((a, b) => a.min - b.min);
  }

  // Cycling highlights - only if we have filtered activities
  if (cyclingForHighlights.length > 0) {
    // Use ALL cycling (Ride + VirtualRide) for totals
    const totalDistance = allCycling.reduce((sum, a) => sum + a.distanceKm, 0);
    const totalTime = allCycling.reduce((sum, a) => sum + a.movingTimeMinutes, 0);
    const totalElevation = allCycling.reduce((sum, a) => sum + (a.elevationGainMeters || 0), 0);
    const averageSpeed = totalDistance / (totalTime / 60); // km/h

    // Sort cycleDistances by min distance to ensure proper ordering
    cycleDistances.sort((a, b) => a.min - b.min);

    // Use FILTERED activities for distance records
    const distanceRecords = cycleDistances
      .map((d) => findBestForDistance(cyclingForHighlights, d, 'cycling'))
      .filter(Boolean) as DistanceRecord[];

    // Calculate longest and biggest climb from FILTERED cycling activities
    // This respects title patterns with excludeFromHighlights flag
    const longestActivity = cyclingForLongest.reduce((longest, current) =>
      current.distanceKm > longest.distanceKm ? current : longest
    );

    // Find activity with biggest elevation gain from filtered cycling
    const biggestClimb = cyclingForLongest.reduce((biggest, current) => {
      const currentElevation = current.elevationGainMeters || 0;
      const biggestElevation = biggest.elevationGainMeters || 0;
      return currentElevation > biggestElevation ? current : biggest;
    });

    result.cycling = {
      sport: 'cycling',
      totalDistance,
      totalTime,
      activityCount: allCycling.length,
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

  // Swimming highlights - only if we have filtered activities
  if (swimmingForHighlights.length > 0) {
    // Use ALL swimming for totals
    const totalDistance = allSwimming.reduce((sum, a) => sum + a.distanceKm, 0);
    const totalTime = allSwimming.reduce((sum, a) => sum + a.movingTimeMinutes, 0);
    const totalElevation = allSwimming.reduce((sum, a) => sum + (a.elevationGainMeters || 0), 0);
    const averagePace = totalTime / totalDistance / 10; // min/100m

    // Sort swimDistances by min distance to ensure proper ordering
    swimDistances.sort((a, b) => a.min - b.min);

    // Use FILTERED activities for distance records
    const distanceRecords = swimDistances
      .map((d) => findBestForDistance(swimmingForHighlights, d, 'swimming'))
      .filter(Boolean) as DistanceRecord[];

    // Calculate longest from FILTERED swimming activities
    // This respects title patterns with excludeFromHighlights flag
    const longestActivity = swimmingForLongest.reduce((longest, current) =>
      current.distanceKm > longest.distanceKm ? current : longest
    );

    // Swimming rarely has elevation, but include for completeness
    const biggestClimb = swimmingForLongest.reduce((biggest, current) => {
      const currentElevation = current.elevationGainMeters || 0;
      const biggestElevation = biggest.elevationGainMeters || 0;
      return currentElevation > biggestElevation ? current : biggest;
    });

    result.swimming = {
      sport: 'swimming',
      totalDistance,
      totalTime,
      activityCount: allSwimming.length,
      averagePace,
      distanceRecords,
      longestActivity,
      biggestClimb: (biggestClimb?.elevationGainMeters || 0) > 50 ? biggestClimb : null,
      totalElevation,
    };
  }

  return result;
}
