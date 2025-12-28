import type { Activity } from '../types';
import type { TitlePattern, ActivityTypeFilter } from '../stores/settingsStore';

interface RaceDetectionSettings {
  titleIgnorePatterns?: TitlePattern[];
  activityFilters?: ActivityTypeFilter[];
}

// Helper function to check if activity should be excluded from highlights based on title patterns
function shouldExcludeFromHighlights(
  activity: Activity,
  titleIgnorePatterns?: TitlePattern[]
): boolean {
  if (!titleIgnorePatterns) return false;

  for (const patternObj of titleIgnorePatterns) {
    if (
      patternObj.excludeFromHighlights &&
      activity.name.toLowerCase().includes(patternObj.pattern.toLowerCase())
    ) {
      return true;
    }
  }
  return false;
}

export interface TriathlonRace {
  date: Date;
  activities: {
    swim?: Activity;
    bike?: Activity;
    run?: Activity;
  };
  totalDistance: number;
  totalTime: number;
  totalElevation: number;
  type: 'full' | 'half' | 'olympic' | 'sprint' | 'quarter' | 't100' | 'mountain' | 'other';
}

export interface RaceHighlight {
  id: string;
  name: string;
  date: Date;
  type:
    | 'triathlon'
    | 'half-marathon'
    | '15k-run'
    | '10k-run'
    | '5k-run'
    | 'long-run'
    | 'long-ride'
    | 'custom-highlight';
  distance: number;
  duration: number;
  elevation?: number;
  activities?: Activity[];
  badge: string;
  activityType?: string; // Added to track which sport this highlight belongs to
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

// Generate display name and badge for a triathlon
export function getTriathlonDisplayInfo(tri: TriathlonRace, activities: Activity[]) {
  // Find the best activity name that contains triathlon-related keywords
  const triathlonKeywords = /triathlon|ironman|70\.3|t100|challenge/i;
  const activityWithTriName = activities.find((a) => triathlonKeywords.test(a.name));
  let bestName = activityWithTriName?.name || activities[0]?.name || 'Triathlon';

  // Clean up the name - remove sport prefixes/suffixes
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
  } else if (tri.type === 'quarter') {
    badge = '🔸 Quarter Distance';
    typeName = 'Quarter Distance';
  } else if (tri.type === 't100') {
    badge = '💯 T100';
    typeName = 'T100';
  } else if (tri.type === 'mountain') {
    badge = '⛰️ Mountain Triathlon';
    typeName = 'Mountain Triathlon';
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

  return { name: finalName, badge };
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
      // T100: 0.9-2.1km swim (above 0.9, under 2.1), 87-93km bike, 8-12km run
      else if (
        swimKm > 0.9 &&
        swimKm < 2.1 &&
        bikeKm >= 87 &&
        bikeKm <= 93 &&
        runKm >= 8 &&
        runKm < 12
      ) {
        type = 't100';
      }
      // Olympic: ~1.5km swim, ~40km bike, ~10km run
      else if (swimKm >= 1.0 && bikeKm >= 35 && runKm >= 8) {
        type = 'olympic';
      }
      // Quarter Distance: 0.9-1.1km swim, 35-45km bike, 8-12km run (under 12)
      else if (
        swimKm >= 0.9 &&
        swimKm <= 1.1 &&
        bikeKm >= 35 &&
        bikeKm <= 45 &&
        runKm >= 8 &&
        runKm < 12
      ) {
        type = 'quarter';
      }
      // Sprint: ~0.75km swim, ~20km bike, ~5km run
      else if (swimKm >= 0.5 && bikeKm >= 15 && runKm >= 4) {
        type = 'sprint';
      }

      // Calculate total elevation
      const totalElevation =
        (swim.elevationGainMeters || 0) +
        (bike.elevationGainMeters || 0) +
        (run.elevationGainMeters || 0);

      // Check for Mountain category: elevation gain > 1000m (only if not already full)
      if (type !== 'full' && totalElevation > 1000) {
        type = 'mountain';
      }

      triathlons.push({
        date: new Date(dateKey),
        activities: { swim, bike, run },
        totalDistance,
        totalTime,
        totalElevation,
        type,
      });
    }
  });

  return triathlons.sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function detectRaceHighlights(
  activities: Activity[],
  settings?: RaceDetectionSettings
): RaceHighlight[] {
  const highlights: RaceHighlight[] = [];

  // Track activities matched by custom filters to prevent double-categorization
  const customFilteredActivityIds = new Set<string>();

  // Process custom filters FIRST (before standard detection) so they take precedence
  if (settings?.activityFilters && settings.activityFilters.length > 0) {
    // Process each activity type filter separately
    settings.activityFilters.forEach((activityFilter) => {
      // Get activities of this type
      const typeActivities = activities.filter((a) => a.type === activityFilter.activityType);

      // FIRST: Remove activities that match ignore patterns
      const filteredTypeActivities = typeActivities.filter(
        (a) => !shouldExcludeFromHighlights(a, settings?.titleIgnorePatterns)
      );

      // Process distance filters with best-match selection PER FILTER
      const filterMatches = new Map<
        string,
        { distFilter: (typeof activityFilter.distanceFilters)[0]; activity: Activity; diff: number }
      >();

      // For each distance filter, find ALL candidates and select the SINGLE BEST match
      activityFilter.distanceFilters.forEach((distFilter) => {
        const filterKey = `${distFilter.operator}${distFilter.value}${distFilter.unit}`;
        const candidates: { activity: Activity; diff: number }[] = [];

        filteredTypeActivities.forEach((activity) => {
          // Skip if already matched by another filter
          if (customFilteredActivityIds.has(activity.id)) return;

          const distance =
            distFilter.unit === 'km' ? activity.distanceKm : activity.distanceKm * 0.621371;
          const diff = Math.abs(distance - distFilter.value);

          // Handle different operators
          if (distFilter.operator === 'gte') {
            // For gte, if distance >= value, it's a candidate
            if (distance >= distFilter.value) {
              candidates.push({ activity, diff: distance - distFilter.value });
            }
          } else if (distFilter.operator === 'lte') {
            // For lte, if distance <= value, it's a candidate
            if (distance <= distFilter.value) {
              candidates.push({ activity, diff: distFilter.value - distance });
            }
          } else {
            // For eq, ±, and = operators, check if within tolerance
            let minDist = 0;
            let maxDist = 0;

            if (distFilter.operator === 'eq') {
              // For legacy 'eq', use ±10% tolerance (widest match)
              const tolerance = distFilter.value * 0.1;
              minDist = distFilter.value - tolerance;
              maxDist = distFilter.value + tolerance;
            } else if (distFilter.operator === '±') {
              // For ±, use ±5% tolerance (best match)
              const tolerance = distFilter.value * 0.05;
              minDist = distFilter.value - tolerance;
              maxDist = distFilter.value + tolerance;
            } else if (distFilter.operator === '=') {
              // For =, use ±0.1km tolerance (exact match)
              minDist = distFilter.value - 0.1;
              maxDist = distFilter.value + 0.1;
            }

            // Check if distance is within range
            if (distance >= minDist && distance <= maxDist) {
              candidates.push({ activity, diff });
            }
          }
        });

        // Select the SINGLE BEST match from candidates for this filter
        // Priority: 1) Fastest pace, 2) Closest distance, 3) Most recent
        if (candidates.length > 0) {
          let bestMatch = candidates[0];

          for (let i = 1; i < candidates.length; i++) {
            const curr = candidates[i];

            // Step 1: Compare by pace (minutes per km) - FASTEST wins
            const currPace = curr.activity.movingTimeMinutes / curr.activity.distanceKm;
            const bestPace = bestMatch.activity.movingTimeMinutes / bestMatch.activity.distanceKm;

            if (Math.abs(currPace - bestPace) > 0.01) {
              if (currPace < bestPace) {
                bestMatch = curr;
              }
            } else {
              // Same pace - compare by distance difference (closest to target wins)
              const currDiff = curr.diff;
              const bestDiff = bestMatch.diff;

              if (Math.abs(currDiff - bestDiff) > 0.001) {
                if (currDiff < bestDiff) {
                  bestMatch = curr;
                }
              } else {
                // Same pace and distance - compare by date (latest wins)
                const currDate = new Date(curr.activity.date);
                const bestDate = new Date(bestMatch.activity.date);
                if (currDate > bestDate) {
                  bestMatch = curr;
                }
              }
            }
          }

          filterMatches.set(filterKey, {
            distFilter,
            activity: bestMatch.activity,
            diff: bestMatch.diff,
          });
        }
      });

      // Now process the best matches and mark activities as used
      for (const match of filterMatches.values()) {
        const { distFilter, activity, diff: _diff } = match;

        // Double-check: skip if already added by another filter
        if (customFilteredActivityIds.has(activity.id)) {
          continue;
        }

        // Activity has already been filtered by ignore patterns, so no need to check again here
        customFilteredActivityIds.add(activity.id);

        // Create a descriptive badge based on the filter and activity type
        let badgeLabel = '';
        if (
          distFilter.operator === '±' ||
          distFilter.operator === '=' ||
          distFilter.operator === 'eq'
        ) {
          // For distance-based filters, show proper names for standard distances
          const value = distFilter.value;
          const type = activity.type;

          // Running standard distances
          if (type === 'Run') {
            if (value === 5) badgeLabel = '5km';
            else if (value === 10) badgeLabel = '10km';
            else if (value === 15) badgeLabel = '15km';
            else if (value === 21) badgeLabel = 'Half Marathon';
            else if (value === 42) badgeLabel = 'Marathon';
            else badgeLabel = `${Math.round(value)}km`;
          }
          // Cycling standard distances
          else if (type === 'Ride' || type === 'VirtualRide') {
            if (value === 40) badgeLabel = '40km';
            else if (value === 50) badgeLabel = '50km';
            else if (value === 90) badgeLabel = '90km';
            else if (value === 100) badgeLabel = '100km';
            else if (value === 150) badgeLabel = '150km';
            else if (value === 200) badgeLabel = '200km';
            else badgeLabel = `${Math.round(value)}km`;
          }
          // Swimming standard distances
          else if (type === 'Swim') {
            if (value === 0.5) badgeLabel = '500m';
            else if (value === 1) badgeLabel = '1000m';
            else if (value === 1.5) badgeLabel = '1500m';
            else if (value === 2) badgeLabel = '2000m';
            else if (value < 1) badgeLabel = `${Math.round(value * 1000)}m`;
            else badgeLabel = `${value}km`;
          } else {
            badgeLabel = `${Math.round(value)}${distFilter.unit}`;
          }
        } else if (distFilter.operator === 'gte') {
          badgeLabel = `${Math.round(distFilter.value)}${distFilter.unit}+`;
        } else if (distFilter.operator === 'lte') {
          badgeLabel = `≤${Math.round(distFilter.value)}${distFilter.unit}`;
        }

        highlights.push({
          id: activity.id,
          name: activity.name,
          date: activity.date,
          type: 'custom-highlight',
          distance: activity.distanceKm,
          duration: activity.movingTimeMinutes,
          badge: badgeLabel,
          activityType: activity.type,
        });
      }

      // Process title patterns (these can match multiple activities)
      activityFilter.titlePatterns.forEach((pattern) => {
        filteredTypeActivities.forEach((activity) => {
          // Skip if already matched
          if (customFilteredActivityIds.has(activity.id)) return;

          if (activity.name.toLowerCase().includes(pattern.toLowerCase())) {
            // Activity has already been filtered by ignore patterns earlier
            customFilteredActivityIds.add(activity.id);
            const typeEmoji =
              activity.type === 'Run' ? '🏃' : activity.type.includes('Ride') ? '🚴' : '🏊';
            highlights.push({
              id: activity.id,
              name: activity.name,
              date: activity.date,
              type: 'custom-highlight',
              distance: activity.distanceKm,
              duration: activity.movingTimeMinutes,
              badge: `${typeEmoji} ${pattern}`,
              activityType: activity.type,
            });
          }
        });
      });
    });
  }

  // Detect triathlons
  const triathlons = detectTriathlons(activities);
  triathlons.forEach((tri) => {
    const activities = [tri.activities.swim, tri.activities.bike, tri.activities.run].filter(
      Boolean
    ) as Activity[];

    // Use shared function to get display name and badge
    const { name, badge } = getTriathlonDisplayInfo(tri, activities);

    highlights.push({
      id: `tri-${tri.date.toISOString()}`,
      name,
      date: tri.date,
      type: 'triathlon',
      distance: tri.totalDistance,
      duration: tri.totalTime,
      elevation: tri.totalElevation,
      activities,
      badge,
    });
  });

  // All distance-based achievements are now handled by custom filters
  // Hardcoded distance detections have been removed

  // Deduplicate highlights by activity ID (keep only first occurrence)
  const seenIds = new Set<string>();
  const deduplicatedHighlights = highlights.filter((h) => {
    if (seenIds.has(h.id)) {
      return false;
    }
    seenIds.add(h.id);
    return true;
  });

  // Sort by distance descending for better visual order
  return deduplicatedHighlights.sort((a, b) => b.distance - a.distance);
}

export function detectRaceHighlightsWithExcluded(
  activities: Activity[],
  settings?: RaceDetectionSettings
): { highlights: RaceHighlight[]; excludedActivityIds: Set<string> } {
  const highlights: RaceHighlight[] = [];

  // Track activities matched by custom filters to prevent double-categorization
  const customFilteredActivityIds = new Set<string>();

  // Process custom filters FIRST (before standard detection) so they take precedence
  if (settings?.activityFilters && settings.activityFilters.length > 0) {
    // Process each activity type filter separately
    settings.activityFilters.forEach((activityFilter) => {
      // Get activities of this type
      const typeActivities = activities.filter((a) => a.type === activityFilter.activityType);

      // FIRST: Remove activities that match ignore patterns
      const filteredTypeActivities = typeActivities.filter(
        (a) => !shouldExcludeFromHighlights(a, settings?.titleIgnorePatterns)
      );

      // Collect all filter matches FIRST, then sort by proximity to pick the single best match per filter
      const allMatches: {
        distFilter: (typeof activityFilter.distanceFilters)[0];
        activity: Activity;
        diff: number;
      }[] = [];

      // For each distance filter, find ALL candidates
      activityFilter.distanceFilters.forEach((distFilter) => {
        filteredTypeActivities.forEach((activity) => {
          // Skip if already matched by another filter
          if (customFilteredActivityIds.has(activity.id)) return;

          const distance =
            distFilter.unit === 'km' ? activity.distanceKm : activity.distanceKm * 0.621371;
          const diff = Math.abs(distance - distFilter.value);

          // Handle different operators
          if (distFilter.operator === 'gte') {
            // For gte, if distance >= value, it's a candidate
            if (distance >= distFilter.value) {
              allMatches.push({ distFilter, activity, diff: distance - distFilter.value });
            }
          } else if (distFilter.operator === 'lte') {
            // For lte, if distance <= value, it's a candidate
            if (distance <= distFilter.value) {
              allMatches.push({ distFilter, activity, diff: distFilter.value - distance });
            }
          } else {
            // For eq, ±, and = operators, check if within tolerance
            let minDist = 0;
            let maxDist = 0;

            if (distFilter.operator === 'eq') {
              // For legacy 'eq', use ±10% tolerance (widest match)
              const tolerance = distFilter.value * 0.1;
              minDist = distFilter.value - tolerance;
              maxDist = distFilter.value + tolerance;
            } else if (distFilter.operator === '±') {
              // For ±, use ±5% tolerance (best match)
              const tolerance = distFilter.value * 0.05;
              minDist = distFilter.value - tolerance;
              maxDist = distFilter.value + tolerance;
            } else if (distFilter.operator === '=') {
              // For =, use ±0.1km tolerance (exact match)
              minDist = distFilter.value - 0.1;
              maxDist = distFilter.value + 0.1;
            }

            // Check if distance is within range
            if (distance >= minDist && distance <= maxDist) {
              allMatches.push({ distFilter, activity, diff });
            }
          }
        });
      });

      // Group matches by FILTER, and for each filter, keep only the SINGLE BEST match
      const filterToMatch = new Map<string, (typeof allMatches)[0]>();

      for (const match of allMatches) {
        const filterKey = `${match.distFilter.operator}${match.distFilter.value}${match.distFilter.unit}`;
        const existing = filterToMatch.get(filterKey);
        if (!existing) {
          filterToMatch.set(filterKey, match);
        } else {
          // Compare: closer distance wins; if equal, fastest pace wins; if equal, latest date wins
          const distDiff = Math.abs(match.diff - existing.diff);

          if (match.diff < existing.diff - 0.001) {
            // match is closer to target distance
            filterToMatch.set(filterKey, match);
          } else if (distDiff <= 0.001) {
            // Same distance difference - compare by pace (minutes per km)
            const matchPace = match.activity.movingTimeMinutes / match.activity.distanceKm;
            const existingPace = existing.activity.movingTimeMinutes / existing.activity.distanceKm;

            if (matchPace < existingPace - 0.01) {
              // match is faster (better pace)
              filterToMatch.set(filterKey, match);
            } else if (Math.abs(matchPace - existingPace) <= 0.01) {
              // Same pace - compare by date (latest wins)
              const matchDate = new Date(match.activity.date);
              const existingDate = new Date(existing.activity.date);

              if (matchDate > existingDate) {
                filterToMatch.set(filterKey, match);
              }
            }
          }
        }
      }

      // Now process the best matches (one per filter)
      for (const match of filterToMatch.values()) {
        const { distFilter, activity } = match;

        customFilteredActivityIds.add(activity.id);

        // Create a descriptive badge based on the filter
        let badgeLabel = '';
        if (
          distFilter.operator === '±' ||
          distFilter.operator === '=' ||
          distFilter.operator === 'eq'
        ) {
          // For distance-based filters, show the target distance
          badgeLabel = `${Math.round(distFilter.value)}${distFilter.unit}`;
        } else if (distFilter.operator === 'gte') {
          badgeLabel = `${Math.round(distFilter.value)}${distFilter.unit}+`;
        } else if (distFilter.operator === 'lte') {
          badgeLabel = `≤${Math.round(distFilter.value)}${distFilter.unit}`;
        }

        highlights.push({
          id: activity.id,
          name: activity.name,
          date: activity.date,
          type: 'custom-highlight',
          distance: activity.distanceKm,
          duration: activity.movingTimeMinutes,
          badge: badgeLabel,
          activityType: activity.type,
        });
      }

      // Process title patterns (these can match multiple activities)
      activityFilter.titlePatterns.forEach((pattern) => {
        filteredTypeActivities.forEach((activity) => {
          // Skip if already matched
          if (customFilteredActivityIds.has(activity.id)) return;

          if (activity.name.toLowerCase().includes(pattern.toLowerCase())) {
            // Activity has already been filtered by ignore patterns earlier
            customFilteredActivityIds.add(activity.id);
            const typeEmoji =
              activity.type === 'Run' ? '🏃' : activity.type.includes('Ride') ? '🚴' : '🏊';
            highlights.push({
              id: activity.id,
              name: activity.name,
              date: activity.date,
              type: 'custom-highlight',
              distance: activity.distanceKm,
              duration: activity.movingTimeMinutes,
              badge: `${typeEmoji} ${pattern}`,
              activityType: activity.type,
            });
          }
        });
      });
    });
  }

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
      elevation: tri.totalElevation,
      activities,
      badge,
    });
  });

  // Detect half marathons (runs ~21km) - skip if matched by custom filter
  activities.forEach((activity) => {
    if (customFilteredActivityIds.has(activity.id)) return;
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

  // Detect 15km runs (14-16km range) - skip if matched by custom filter
  activities.forEach((activity) => {
    if (customFilteredActivityIds.has(activity.id)) return;
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
  // Long runs (25km+) - skip if matched by custom filter
  activities.forEach((activity) => {
    if (customFilteredActivityIds.has(activity.id)) return;
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

  // Long rides (100km+) - skip if matched by custom filter
  activities.forEach((activity) => {
    if (customFilteredActivityIds.has(activity.id)) return;
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
          badge: '🚴 Fondo',
        });
      }
    }
  });

  // 10km runs - skip if matched by custom filter
  activities.forEach((activity) => {
    if (customFilteredActivityIds.has(activity.id)) return;
    if (activity.type === 'Run' && activity.distanceKm >= 9.5 && activity.distanceKm <= 10.5) {
      highlights.push({
        id: activity.id,
        name: activity.name,
        date: activity.date,
        type: '10k-run',
        distance: activity.distanceKm,
        duration: activity.movingTimeMinutes,
        badge: '🏃 10K Run',
      });
    }
  });

  // 5km runs - skip if matched by custom filter
  activities.forEach((activity) => {
    if (customFilteredActivityIds.has(activity.id)) return;
    if (activity.type === 'Run' && activity.distanceKm >= 4.5 && activity.distanceKm <= 5.5) {
      highlights.push({
        id: activity.id,
        name: activity.name,
        date: activity.date,
        type: '5k-run',
        distance: activity.distanceKm,
        duration: activity.movingTimeMinutes,
        badge: '🏃 5K Run',
      });
    }
  });

  // Deduplicate highlights by activity ID (keep only first occurrence)
  const seenIds = new Set<string>();
  const deduplicatedHighlights = highlights.filter((h) => {
    if (seenIds.has(h.id)) {
      return false;
    }
    seenIds.add(h.id);
    return true;
  });

  return {
    highlights: deduplicatedHighlights.sort((a, b) => b.distance - a.distance),
    excludedActivityIds: customFilteredActivityIds,
  };
}
