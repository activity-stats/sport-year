import type { Activity } from '../types';

export interface TriathlonRace {
  date: Date;
  activities: {
    swim?: Activity;
    bike?: Activity;
    run?: Activity;
  };
  totalDistance: number;
  totalTime: number;
  type: 'full' | 'half' | 'olympic' | 'sprint' | 'other';
}

export interface RaceHighlight {
  id: string;
  name: string;
  date: Date;
  type: 'triathlon' | 'half-marathon' | '15k-run' | 'long-run' | 'long-ride';
  distance: number;
  duration: number;
  activities?: Activity[];
  badge: string;
}

// Group activities by day
function groupActivitiesByDay(activities: Activity[]): Map<string, Activity[]> {
  const grouped = new Map<string, Activity[]>();

  activities.forEach((activity) => {
    const dateKey = activity.date.toISOString().split('T')[0];
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(activity);
  });

  return grouped;
}

// Detect triathlons (swim + bike + run on same day)
export function detectTriathlons(activities: Activity[]): TriathlonRace[] {
  const byDay = groupActivitiesByDay(activities);
  const triathlons: TriathlonRace[] = [];

  byDay.forEach((dayActivities, dateKey) => {
    const swim = dayActivities.find((a) => a.type === 'Swim');
    const bike = dayActivities.find((a) => ['Ride', 'VirtualRide'].includes(a.type));
    const run = dayActivities.find((a) => a.type === 'Run');

    // Must have all three disciplines
    if (swim && bike && run) {
      const swimKm = swim.distanceKm || 0;
      const bikeKm = bike.distanceKm || 0;
      const runKm = run.distanceKm || 0;

      // Check if any activity has "triathlon", "ironman", "70.3", "t100", etc. in the name
      const triathlonKeywords =
        /triathlon|ironman|70\.3|half.?iron|full.?iron|olympic|sprint.?tri|t100|challenge/i;
      const hasTriathlonName = dayActivities.some((a) => triathlonKeywords.test(a.name));

      // If it has triathlon in the name, be more lenient with distances
      const minSwim = hasTriathlonName ? 0.3 : 0.4;
      const minBike = hasTriathlonName ? 8 : 10;
      const minRun = hasTriathlonName ? 2 : 2.5;

      // Check minimum distances
      if (swimKm < minSwim || bikeKm < minBike || runKm < minRun) {
        return; // Too short to be a triathlon
      }

      // If it doesn't have triathlon in name, apply stricter validation
      if (!hasTriathlonName) {
        // Sort activities by time to check order
        const sortedActivities = [swim, bike, run].sort(
          (a, b) => a.date.getTime() - b.date.getTime()
        );

        // Check if activities are in proper triathlon order (swim, bike, run)
        const swimIndex = sortedActivities.indexOf(swim);
        const bikeIndex = sortedActivities.indexOf(bike);
        const runIndex = sortedActivities.indexOf(run);

        // Swim should come first, then bike, then run (for non-named triathlons)
        if (swimIndex !== 0 || bikeIndex !== 1 || runIndex !== 2) {
          return; // Not in proper order, skip
        }

        // Check for reasonable transition times (between 30 seconds and 2 hours)
        const swimToBikeGap = (bike.date.getTime() - swim.date.getTime()) / 1000 / 60; // minutes
        const bikeToRunGap = (run.date.getTime() - bike.date.getTime()) / 1000 / 60; // minutes

        // Transitions should be reasonable
        if (
          swimToBikeGap < 0.5 ||
          swimToBikeGap > 120 ||
          bikeToRunGap < 0.5 ||
          bikeToRunGap > 120
        ) {
          return; // Transitions don't make sense, skip
        }

        // Total event should complete within 12 hours
        const totalEventTime = (run.date.getTime() - swim.date.getTime()) / 1000 / 60 / 60; // hours
        if (totalEventTime > 12) {
          return; // Too long, likely not a triathlon
        }
      }

      const totalDistance = swimKm + bikeKm + runKm;

      // Calculate total time including transitions
      // Transition time = time from start of first activity to end of last activity
      const sortedActivities = [swim, bike, run].sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      );
      const firstActivity = sortedActivities[0];
      const lastActivity = sortedActivities[2];

      // Total elapsed time in minutes (including transitions)
      const totalElapsedMinutes =
        (lastActivity.date.getTime() - firstActivity.date.getTime()) / 1000 / 60 +
        (lastActivity.movingTimeMinutes || 0);

      const totalTime = totalElapsedMinutes;

      // Determine triathlon type based on distances
      let type: TriathlonRace['type'] = 'other';

      // Full distance (Ironman): ~3.8km swim, ~180km bike, ~42km run
      if (swimKm >= 3.0 && bikeKm >= 160 && runKm >= 35) {
        type = 'full';
      }
      // Half distance (70.3): ~1.9km swim, ~90km bike, ~21km run
      else if (swimKm >= 1.5 && bikeKm >= 80 && runKm >= 18) {
        type = 'half';
      }
      // Olympic: ~1.5km swim, ~40km bike, ~10km run
      else if (swimKm >= 1.0 && bikeKm >= 35 && runKm >= 8) {
        type = 'olympic';
      }
      // Sprint: ~0.75km swim, ~20km bike, ~5km run
      else if (swimKm >= 0.5 && bikeKm >= 15 && runKm >= 4) {
        type = 'sprint';
      }

      triathlons.push({
        date: new Date(dateKey),
        activities: { swim, bike, run },
        totalDistance,
        totalTime,
        type,
      });
    }
  });

  return triathlons.sort((a, b) => b.date.getTime() - a.date.getTime());
}

// Detect race highlights
export function detectRaceHighlights(activities: Activity[]): RaceHighlight[] {
  const highlights: RaceHighlight[] = [];

  // Detect triathlons
  const triathlons = detectTriathlons(activities);
  triathlons.forEach((tri) => {
    const activities = [tri.activities.swim, tri.activities.bike, tri.activities.run].filter(
      Boolean
    ) as Activity[];

    // Find the best name from all activities
    // Prefer names that contain triathlon keywords
    let bestName = '';
    const triathlonKeywords = /triathlon|ironman|70\.3|t100|challenge/i;

    for (const activity of activities) {
      if (triathlonKeywords.test(activity.name)) {
        bestName = activity.name;
        break;
      }
    }

    // If no triathlon keyword found, use first non-generic name
    if (!bestName) {
      const genericSportNames =
        /^(swim|bike|run|ride|morning|afternoon|evening|lunch)\s*(swim|bike|run|ride)?$/i;
      bestName =
        activities.find((a) => !genericSportNames.test(a.name.trim()))?.name ||
        activities[0]?.name ||
        'Triathlon';
    }

    // Clean up the name - remove standalone sport words at the start or end
    bestName = bestName
      .replace(/^(swim|bike|run|ride|cycling|running|swimming)\s+/i, '')
      .replace(/\s+(swim|bike|run|ride|cycling|running|swimming)$/i, '')
      .replace(/\s*[-:]+\s*$/, '') // Remove trailing dashes and colons
      .trim();

    if (!bestName) bestName = 'Triathlon';

    let badge = '🏊‍♂️🚴‍♂️🏃‍♂️';
    let typeName = '';

    if (tri.type === 'full') {
      badge = '🏆 Full Distance Triathlon';
      typeName = 'Full Distance Triathlon';
    } else if (tri.type === 'half') {
      badge = '🥈 Half Distance Triathlon';
      typeName = 'Half Distance Triathlon';
    } else if (tri.type === 'olympic') {
      badge = '🥉 Olympic Triathlon';
      typeName = 'Olympic Triathlon';
    } else if (tri.type === 'sprint') {
      badge = '⚡ Sprint Triathlon';
      typeName = 'Sprint Triathlon';
    } else {
      typeName = 'Triathlon';
    }

    // Determine final display name
    // If name already contains triathlon/type keywords, use as-is
    // Otherwise use just the type name
    const hasTypeKeyword = /triathlon|ironman|70\.3|t100|challenge|sprint|olympic|full|half/i.test(
      bestName
    );
    const finalName = hasTypeKeyword ? bestName : typeName;

    highlights.push({
      id: `tri-${tri.date.toISOString()}`,
      name: finalName,
      date: tri.date,
      type: 'triathlon',
      distance: tri.totalDistance,
      duration: tri.totalTime,
      activities,
      badge,
    });
  });

  // Detect half marathons (runs ~21km)
  activities.forEach((activity) => {
    if (activity.type === 'Run' && activity.distanceKm >= 20 && activity.distanceKm <= 22) {
      // Prefer activities marked as races by Strava (workout_type === 1)
      const isMarkedAsRace = activity.workoutType === 1;

      highlights.push({
        id: activity.id,
        name: activity.name,
        date: activity.date,
        type: 'half-marathon',
        distance: activity.distanceKm,
        duration: activity.movingTimeMinutes,
        badge: isMarkedAsRace ? '🏆 Half Marathon (Race)' : '🏃 Half Marathon',
      });
    }
  });

  // Detect 15km runs (14-16km range)
  activities.forEach((activity) => {
    if (activity.type === 'Run' && activity.distanceKm >= 14 && activity.distanceKm < 20) {
      highlights.push({
        id: activity.id,
        name: activity.name,
        date: activity.date,
        type: '15k-run',
        distance: activity.distanceKm,
        duration: activity.movingTimeMinutes,
        badge: '🏃 15K Run',
      });
    }
  });

  // Detect other notable achievements
  // Long runs (25km+)
  activities.forEach((activity) => {
    if (activity.type === 'Run' && activity.distanceKm >= 25) {
      // Skip if already counted as half marathon
      if (!highlights.find((h) => h.id === activity.id)) {
        highlights.push({
          id: activity.id,
          name: activity.name,
          date: activity.date,
          type: 'long-run',
          distance: activity.distanceKm,
          duration: activity.movingTimeMinutes,
          badge: '🏃 Long Run',
        });
      }
    }
  });

  // Long rides (100km+)
  activities.forEach((activity) => {
    if (['Ride', 'VirtualRide'].includes(activity.type) && activity.distanceKm >= 100) {
      // Skip if part of triathlon
      if (!highlights.find((h) => h.activities?.some((a) => a.id === activity.id))) {
        highlights.push({
          id: activity.id,
          name: activity.name,
          date: activity.date,
          type: 'long-ride',
          distance: activity.distanceKm,
          duration: activity.movingTimeMinutes,
          badge: '🚴 Century Ride',
        });
      }
    }
  });

  // Sort by date descending
  return highlights.sort((a, b) => b.date.getTime() - a.date.getTime());
}
