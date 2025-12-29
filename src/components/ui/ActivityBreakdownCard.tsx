import { useTranslation } from 'react-i18next';
import type { Activity } from '../../types/activity.ts';
import type { SportBreakdownActivity } from '../../stores/settingsStore.ts';
import {
  formatDistanceWithUnit,
  formatDuration,
  formatPace,
  formatElevation,
} from '../../utils/index.ts';

interface ActivityBreakdownCardProps {
  config: SportBreakdownActivity;
  activities: Activity[];
}

export function ActivityBreakdownCard({ config, activities }: ActivityBreakdownCardProps) {
  const { t } = useTranslation();
  // Filter activities based on Strava types
  const filteredActivities = activities.filter((a) => config.stravaTypes.includes(a.type));

  // Don't render if no activities
  if (filteredActivities.length === 0) return null;

  // Calculate stats
  const totalDistance = filteredActivities.reduce((sum, a) => sum + a.distanceKm, 0);
  const totalTime = filteredActivities.reduce((sum, a) => sum + a.movingTimeMinutes, 0);
  const totalElevation = filteredActivities.reduce((sum, a) => sum + a.elevationGainMeters, 0);
  const longestActivity = filteredActivities.reduce((max, a) =>
    a.distanceKm > max.distanceKm ? a : max
  );
  const avgDistance = totalDistance / filteredActivities.length;
  const avgSpeed =
    filteredActivities.reduce((sum, a) => sum + a.averageSpeedKmh, 0) / filteredActivities.length;

  // Determine if this is a cycling/running sport for pace/speed display
  const isCycling = config.stravaTypes.some((t) => t === 'Ride' || t === 'VirtualRide');
  const isRunning = config.stravaTypes.includes('Run');
  const isSwimming = config.stravaTypes.includes('Swim');

  const showElevation = isCycling || isRunning;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      <div className={`bg-linear-to-r ${config.gradient} p-6 text-white`}>
        <div className="flex items-center gap-3">
          <span className="text-5xl">{config.icon}</span>
          <div>
            <h3 className="text-2xl font-bold">{config.label}</h3>
            <p className="text-white/90">
              {filteredActivities.length} {t('activityBreakdown.activities')}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">
              {t('activityBreakdown.totalDistance')}
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatDistanceWithUnit(totalDistance * 1000)}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">
              {t('activityBreakdown.totalTime')}
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatDuration(totalTime * 60)}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">
              {t('activityBreakdown.avgDistance')}
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatDistanceWithUnit(avgDistance * 1000)}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">
              {isCycling ? t('activityBreakdown.avgSpeed') : t('activityBreakdown.avgPace')}
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {isCycling
                ? `${avgSpeed.toFixed(1)} km/h`
                : isRunning
                  ? formatPace((totalDistance * 1000) / (totalTime * 60), 'Run')
                  : isSwimming
                    ? formatPace((totalDistance * 1000) / (totalTime * 60), 'Swim')
                    : `${avgSpeed.toFixed(1)} km/h`}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href={`https://www.strava.com/activities/${longestActivity.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-orange-400 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🏆</span>
              <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-orange-600">
                {t('activityBreakdown.longestActivity')}
              </h4>
            </div>
            <div className="text-gray-700 dark:text-gray-300 font-medium mb-1 hover:text-orange-600 transition-colors">
              {longestActivity.name}
            </div>
            <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>{formatDistanceWithUnit(longestActivity.distanceKm * 1000)}</span>
              <span>{formatDuration(longestActivity.movingTimeMinutes * 60)}</span>
            </div>
          </a>

          {showElevation && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">⛰️</span>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {t('activityBreakdown.totalElevation')}
                </h4>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {formatElevation(totalElevation)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t('activityBreakdown.avgPerActivity', {
                  value: (totalElevation / filteredActivities.length).toFixed(0),
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
