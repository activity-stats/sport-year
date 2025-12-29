import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Activity } from '../../types/activity';
import { formatDistanceWithUnit, formatDuration } from '../../utils/formatters';
import type { RaceHighlight } from '../../utils/raceDetection';
import type { SportHighlights } from '../../utils/sportHighlights';

interface AchievementTimelineProps {
  year: number | 'last365';
  highlights: RaceHighlight[];
  sportHighlights: {
    running?: SportHighlights;
    cycling?: SportHighlights;
    swimming?: SportHighlights;
  };
}

interface Achievement {
  date: Date;
  type: 'race' | 'triathlon' | 'custom-highlight' | 'longest' | 'biggest-climb';
  activity: Activity;
  activityName: string; // First line: activity name
  achievementLabel: string; // Second line: achievement description (e.g., "🏆 Full Distance Triathlon")
  value: string;
  icon: string;
  color: string;
}

export function AchievementTimeline({
  year: _year,
  highlights,
  sportHighlights,
}: AchievementTimelineProps) {
  const { t } = useTranslation();
  const achievements = useMemo(() => {
    const results: Achievement[] = [];

    // Add ALL race highlights (including triathlons, half marathons, 10Ks, etc.)
    highlights.forEach((highlight) => {
      const activity = highlight.activities?.[0];
      if (!activity) return;

      let icon = '🏃';
      let color = 'bg-linear-to-r from-orange-500 to-red-600';

      // Determine icon and color based on type
      if (highlight.type === 'triathlon') {
        icon = '🏊🚴🏃';
        color = 'bg-linear-to-r from-cyan-500 via-green-500 to-orange-500';
      } else if (highlight.activityType === 'Ride') {
        icon = '🚴';
        color = 'bg-linear-to-r from-blue-500 to-cyan-600';
      } else if (highlight.activityType === 'Swim') {
        icon = '🏊';
        color = 'bg-linear-to-r from-teal-500 to-blue-600';
      }

      results.push({
        date: highlight.date,
        type: highlight.type === 'triathlon' ? 'triathlon' : 'race',
        activity,
        // For triathlons, use the processed name from highlight.name (from getTriathlonDisplayInfo)
        // For other activities, use the raw activity name
        activityName: highlight.type === 'triathlon' ? highlight.name : activity.name,
        achievementLabel: highlight.badge ? `${highlight.badge}` : highlight.name,
        value: `${highlight.distance.toFixed(1)} km`,
        icon,
        color,
      });
    });

    // Add sport highlights - distance records, longest activities, and biggest climbs
    [sportHighlights.running, sportHighlights.cycling, sportHighlights.swimming]
      .filter((sh): sh is SportHighlights => sh !== undefined)
      .forEach((sportHighlight) => {
        let icon = '🏃';
        let color = 'bg-linear-to-r from-orange-500 to-red-600';

        if (sportHighlight.sport === 'cycling') {
          icon = '🚴';
          color = 'bg-linear-to-r from-blue-500 to-cyan-600';
        } else if (sportHighlight.sport === 'swimming') {
          icon = '🏊';
          color = 'bg-linear-to-r from-teal-500 to-blue-600';
        }

        // Add all distance records (e.g., marathons, half marathons, 5Ks, 10Ks, etc.)
        sportHighlight.distanceRecords.forEach((record) => {
          results.push({
            date: record.activity.date,
            type: 'race',
            activity: record.activity,
            activityName: record.activity.name,
            achievementLabel: record.distance,
            value: `${record.activity.distanceKm.toFixed(1)} km`,
            icon,
            color,
          });
        });

        // Add longest activity (if not already in distance records)
        const longestInRecords = sportHighlight.distanceRecords.some(
          (r) => r.activity.id === sportHighlight.longestActivity.id
        );
        if (!longestInRecords) {
          const activity = sportHighlight.longestActivity;
          let longestLabel = t('achievements.longestRun');
          if (sportHighlight.sport === 'cycling') {
            longestLabel = t('achievements.longestRide');
          } else if (sportHighlight.sport === 'swimming') {
            longestLabel = t('achievements.longestSwim');
          }

          results.push({
            date: activity.date,
            type: 'longest',
            activity,
            activityName: activity.name,
            achievementLabel: longestLabel,
            value: formatDistanceWithUnit(activity.distanceKm * 1000),
            icon: '🏆',
            color,
          });
        }

        // Add biggest climb
        if (sportHighlight.biggestClimb) {
          results.push({
            date: sportHighlight.biggestClimb.date,
            type: 'biggest-climb',
            activity: sportHighlight.biggestClimb,
            activityName: sportHighlight.biggestClimb.name,
            achievementLabel: t('achievements.biggestClimb'),
            value: `${Math.round(sportHighlight.biggestClimb.elevationGainMeters || 0)}m`,
            icon: '⛰️',
            color,
          });
        }
      });

    // Remove duplicates (same activity ID)
    const seen = new Set<string>();
    const unique = results.filter((achievement) => {
      if (seen.has(achievement.activity.id)) return false;
      seen.add(achievement.activity.id);
      return true;
    });

    return unique.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [highlights, sportHighlights, t]);

  const formatMonth = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (achievements.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('achievements.title')}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">{t('charts.noActivitiesYet')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('achievements.title')}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{t('achievements.subtitle')}</p>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-linear-to-b from-blue-200 via-purple-200 to-pink-200"></div>

        {/* Achievements */}
        <div className="space-y-4">
          {achievements.map((achievement) => (
            <a
              key={`${achievement.date.getTime()}-${achievement.type}`}
              href={`https://www.strava.com/activities/${achievement.activity.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex gap-4 items-start hover:bg-gray-50 dark:hover:bg-gray-900 -mx-2 px-2 py-2 rounded-lg transition-colors"
            >
              {/* Icon */}
              <div
                className={`relative z-10 flex-shrink-0 w-12 h-12 ${achievement.color} text-white rounded-full flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}
              >
                {achievement.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Activity name - first line */}
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 transition-colors truncate">
                        {achievement.activityName}
                      </h4>
                      <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 flex-shrink-0">
                        {formatMonth(achievement.date)}
                      </span>
                    </div>
                    {/* Achievement label - second line */}
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                      {achievement.achievementLabel}
                    </p>
                    {/* Stats - third line */}
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-bold text-blue-600">{achievement.value}</span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {formatDistanceWithUnit(achievement.activity.distanceKm * 1000)}
                      </span>
                      <span className="text-gray-500">
                        {formatDuration(achievement.activity.movingTimeMinutes * 60)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span className="font-semibold">
            {achievements.length} achievement{achievements.length !== 1 ? 's' : ''} unlocked
          </span>
          <span>Keep pushing your limits! 💪</span>
        </div>
      </div>
    </div>
  );
}
