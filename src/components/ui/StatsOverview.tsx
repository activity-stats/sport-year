import type { YearStats } from '../../types/activity.ts';
import { formatDistanceWithUnit, formatElevation, formatDuration } from '../../utils/index.ts';

interface StatsOverviewProps {
  stats: YearStats;
}

export const StatsOverview = ({ stats }: StatsOverviewProps) => {
  const statCards = [
    {
      label: 'Total Distance',
      value: formatDistanceWithUnit(stats.totalDistanceKm * 1000),
      icon: '🏃',
      color: 'bg-blue-500',
    },
    {
      label: 'Total Elevation',
      value: formatElevation(stats.totalElevationMeters),
      icon: '⛰️',
      color: 'bg-green-500',
    },
    {
      label: 'Total Time',
      value: formatDuration(stats.totalTimeHours * 3600),
      icon: '⏱️',
      color: 'bg-purple-500',
    },
    {
      label: 'Activities',
      value: stats.activityCount.toString(),
      icon: '📊',
      color: 'bg-orange-500',
    },
  ];

  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 px-3 sm:px-0">
        {stats.year} Overview 🏆
      </h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 px-3 sm:px-0">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
          >
            <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-gradient-to-br from-blue-500 to-purple-500 opacity-10 dark:opacity-20 rounded-bl-full"></div>
            <div className="relative p-3 sm:p-6">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <span className="text-2xl sm:text-4xl">{card.icon}</span>
              </div>
              <div className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 break-words">
                {card.value}
              </div>
              <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">
                {card.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Highlights */}
      {(stats.longestActivity || stats.highestElevation) && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {stats.longestActivity && (
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                🏆 Longest Activity
              </h3>
              <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                {stats.longestActivity.name}
              </p>
              <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {formatDistanceWithUnit(stats.longestActivity.distanceKm * 1000)}
              </p>
            </div>
          )}

          {stats.highestElevation && (
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                ⛰️ Most Elevation
              </h3>
              <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                {stats.highestElevation.name}
              </p>
              <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {formatElevation(stats.highestElevation.elevationGainMeters)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
