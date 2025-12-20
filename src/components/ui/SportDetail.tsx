import type { Activity } from '../../types/activity.ts';
import {
  formatDistanceWithUnit,
  formatDuration,
  formatPace,
  formatElevation,
} from '../../utils/index.ts';

interface SportDetailProps {
  sport: 'cycling' | 'running' | 'swimming';
  activities: Activity[];
}

const sportConfig = {
  cycling: {
    icon: '🚴',
    title: 'Cycling',
    gradient: 'from-blue-500 to-cyan-500',
    types: ['Ride', 'VirtualRide'],
  },
  running: {
    icon: '🏃',
    title: 'Running',
    gradient: 'from-orange-500 to-red-500',
    types: ['Run'],
  },
  swimming: {
    icon: '🏊',
    title: 'Swimming',
    gradient: 'from-teal-500 to-blue-500',
    types: ['Swim'],
  },
};

export function SportDetail({ sport, activities }: SportDetailProps) {
  const config = sportConfig[sport];
  const sportActivities = activities.filter((a) => config.types.includes(a.type));

  if (sportActivities.length === 0) return null;

  const totalDistance = sportActivities.reduce((sum, a) => sum + a.distanceKm, 0);
  const totalTime = sportActivities.reduce((sum, a) => sum + a.movingTimeMinutes, 0);
  const totalElevation = sportActivities.reduce((sum, a) => sum + a.elevationGainMeters, 0);
  const longestActivity = sportActivities.reduce((max, a) =>
    a.distanceKm > max.distanceKm ? a : max
  );
  const avgDistance = totalDistance / sportActivities.length;
  const avgSpeed =
    sportActivities.reduce((sum, a) => sum + a.averageSpeedKmh, 0) / sportActivities.length;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className={`bg-gradient-to-r ${config.gradient} p-6 text-white`}>
        <div className="flex items-center gap-3">
          <span className="text-5xl">{config.icon}</span>
          <div>
            <h3 className="text-2xl font-bold">{config.title}</h3>
            <p className="text-white/90">{sportActivities.length} activities</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-gray-600 text-sm font-medium mb-1">Total Distance</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatDistanceWithUnit(totalDistance * 1000)}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-gray-600 text-sm font-medium mb-1">Total Time</div>
            <div className="text-2xl font-bold text-gray-900">{formatDuration(totalTime * 60)}</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-gray-600 text-sm font-medium mb-1">Avg Distance</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatDistanceWithUnit(avgDistance * 1000)}
            </div>
          </div>

          {sport === 'cycling' || sport === 'running' ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-gray-600 text-sm font-medium mb-1">
                {sport === 'cycling' ? 'Avg Speed' : 'Avg Pace'}
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {sport === 'cycling'
                  ? `${avgSpeed.toFixed(1)} km/h`
                  : formatPace((totalDistance * 1000) / (totalTime * 60), 'Run')}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-gray-600 text-sm font-medium mb-1">Avg Pace</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatPace((totalDistance * 1000) / (totalTime * 60), 'Swim')}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🏆</span>
              <h4 className="font-semibold text-gray-900">Longest Activity</h4>
            </div>
            <div className="text-gray-700 font-medium mb-1">{longestActivity.name}</div>
            <div className="flex gap-4 text-sm text-gray-600">
              <span>{formatDistanceWithUnit(longestActivity.distanceKm * 1000)}</span>
              <span>{formatDuration(longestActivity.movingTimeMinutes * 60)}</span>
            </div>
          </div>

          {(sport === 'cycling' || sport === 'running') && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">⛰️</span>
                <h4 className="font-semibold text-gray-900">Total Elevation</h4>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {formatElevation(totalElevation)}
              </div>
              <div className="text-sm text-gray-600">
                Avg {(totalElevation / sportActivities.length).toFixed(0)} m per activity
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
