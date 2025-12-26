import type { Activity } from '../types';
import { useSettingsStore } from '../stores/settingsStore';

type Settings = ReturnType<typeof useSettingsStore.getState>['yearInReview'];

export function filterActivities(
  activities: Activity[],
  settings: Settings,
  target: 'highlights' | 'stats' = 'highlights'
): Activity[] {
  return activities.filter((activity) => {
    // Filter by activity type exclusions (always applies)
    if (settings.excludedActivityTypes.includes(activity.type)) {
      return false;
    }

    // Filter virtual activities per sport based on target
    if (activity.type === 'VirtualRide' && settings.excludeVirtualPerSport.cycling[target]) {
      return false;
    }
    // Note: Currently no VirtualRun or VirtualSwim in Strava data, but prepared for future

    // Filter by title ignore patterns based on target
    for (const patternObj of settings.titleIgnorePatterns) {
      const shouldExclude =
        target === 'highlights' ? patternObj.excludeFromHighlights : patternObj.excludeFromStats;

      if (shouldExclude && activity.name.toLowerCase().includes(patternObj.pattern.toLowerCase())) {
        return false;
      }
    }

    // NOTE: Activity filters are NOT applied here - they're used separately
    // to ADD custom highlights, not to filter the base activity list
    // This ensures race detection and other features still work normally

    return true;
  });
}

// New function to check if activity matches custom filters (for adding to highlights)
export function matchesCustomFilters(activity: Activity, settings: Settings): boolean {
  const activityFilter = settings.activityFilters.find((f) => f.activityType === activity.type);
  if (!activityFilter) {
    return false;
  }

  // If there are distance filters, at least one must match
  if (activityFilter.distanceFilters.length > 0) {
    let anyDistanceMatches = false;

    for (const distFilter of activityFilter.distanceFilters) {
      const distance =
        distFilter.unit === 'km' ? activity.distanceKm : activity.distanceKm * 0.621371;
      let matches = false;

      switch (distFilter.operator) {
        case 'gt':
          matches = distance > distFilter.value;
          break;
        case 'gte':
          matches = distance >= distFilter.value;
          break;
        case 'lt':
          matches = distance < distFilter.value;
          break;
        case 'lte':
          matches = distance <= distFilter.value;
          break;
        case 'eq':
          // Legacy: For equals, use a 10% tolerance
          matches = Math.abs(distance - distFilter.value) <= distFilter.value * 0.1;
          break;
        case '±':
          // Best match: ± operator uses 5% tolerance
          matches = Math.abs(distance - distFilter.value) <= distFilter.value * 0.05;
          break;
        case '=':
          // Exact match: = operator uses 0.1 km tolerance
          matches = Math.abs(distance - distFilter.value) <= 0.1;
          break;
      }

      if (matches) {
        anyDistanceMatches = true;
        break;
      }
    }

    if (!anyDistanceMatches) {
      return false;
    }
  }

  // If there are title filters, at least one must match
  if (activityFilter.titlePatterns.length > 0) {
    let anyTitleMatches = false;

    for (const pattern of activityFilter.titlePatterns) {
      if (activity.name.toLowerCase().includes(pattern.toLowerCase())) {
        anyTitleMatches = true;
        break;
      }
    }

    if (!anyTitleMatches) {
      return false;
    }
  }

  return true;
}
