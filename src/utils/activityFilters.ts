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

    return true;
  });
}
