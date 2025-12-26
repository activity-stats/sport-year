import { useMemo } from 'react';
import type { Activity } from '../../types/activity';
import { formatDistanceWithUnit, formatDuration } from '../../utils/formatters';
import type { RaceHighlight } from '../../utils/raceDetection';
import type { SportHighlights } from '../../utils/sportHighlights';

interface AchievementTimelineProps {
  year: number;
  highlights: RaceHighlight[];
  sportHighlights: {
    running?: SportHighlights;
    cycling?: SportHighlights;
    swimming?: SportHighlights;
  };
}

interface Achievement {
  date: Date;
  type: 'custom-highlight' | 'longest' | 'biggest-climb';
  activity: Activity;
  label: string;
  value: string;
  icon: string;
  color: string;
}

export function AchievementTimeline({
  year,
  highlights,
  sportHighlights,
}: AchievementTimelineProps) {
  const achievements = useMemo(() => {
    const results: Achievement[] = [];

    // Add custom highlights (from distance filters)
    highlights
      .filter((h) => h.type === 'custom-highlight')
      .forEach((highlight) => {
        // For custom highlights, we need to construct an activity object from the highlight data
        // or use the first activity from the activities array (if available)
        const activity =
          highlight.activities?.[0] ||
          ({
            id: highlight.id,
            name: highlight.name,
            date: highlight.date,
            distanceKm: highlight.distance,
            movingTimeMinutes: highlight.duration,
            type: highlight.activityType || 'Run',
          } as Activity);

        const distanceLabel = highlight.badge || `${Math.round(highlight.distance)}km`;

        results.push({
          date: activity.date,
          type: 'custom-highlight',
          activity,
          label: distanceLabel,
          value: highlight.pace
            ? `${Math.floor(highlight.pace)}:${Math.round((highlight.pace % 1) * 60)
                .toString()
                .padStart(2, '0')} min/km`
            : formatDuration(highlight.duration * 60),
          icon: '⚡',
          color: 'bg-gradient-to-r from-blue-500 to-indigo-600',
        });
      });

    // Add longest activities
    if (sportHighlights.running?.longestActivity) {
      const activity = sportHighlights.running.longestActivity;
      results.push({
        date: activity.date,
        type: 'longest',
        activity,
        label: 'Longest Run',
        value: formatDistanceWithUnit(activity.distanceKm * 1000),
        icon: '🏆',
        color: 'bg-gradient-to-r from-blue-400 to-blue-600',
      });
    }

    if (sportHighlights.cycling?.longestActivity) {
      const activity = sportHighlights.cycling.longestActivity;
      results.push({
        date: activity.date,
        type: 'longest',
        activity,
        label: 'Longest Ride',
        value: formatDistanceWithUnit(activity.distanceKm * 1000),
        icon: '🏆',
        color: 'bg-gradient-to-r from-emerald-400 to-emerald-600',
      });
    }

    if (sportHighlights.swimming?.longestActivity) {
      const activity = sportHighlights.swimming.longestActivity;
      results.push({
        date: activity.date,
        type: 'longest',
        activity,
        label: 'Longest Swim',
        value: formatDistanceWithUnit(activity.distanceKm * 1000),
        icon: '🏆',
        color: 'bg-gradient-to-r from-cyan-400 to-cyan-600',
      });
    }

    // Add biggest climbs
    if (sportHighlights.running?.biggestClimb) {
      const activity = sportHighlights.running.biggestClimb;
      results.push({
        date: activity.date,
        type: 'biggest-climb',
        activity,
        label: 'Biggest Climb (Run)',
        value: `${Math.round(activity.elevationGainMeters || 0)}m`,
        icon: '⛰️',
        color: 'bg-gradient-to-r from-green-500 to-emerald-600',
      });
    }

    if (sportHighlights.cycling?.biggestClimb) {
      const activity = sportHighlights.cycling.biggestClimb;
      results.push({
        date: activity.date,
        type: 'biggest-climb',
        activity,
        label: 'Biggest Climb (Ride)',
        value: `${Math.round(activity.elevationGainMeters || 0)}m`,
        icon: '⛰️',
        color: 'bg-gradient-to-r from-green-500 to-emerald-600',
      });
    }

    // Remove duplicates (same activity ID)
    const seen = new Set<string>();
    const unique = results.filter((achievement) => {
      if (seen.has(achievement.activity.id)) return false;
      seen.add(achievement.activity.id);
      return true;
    });

    return unique.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [highlights, sportHighlights]);

  const getAchievementLabel = (achievement: Achievement): string => {
    return achievement.label;
  };

  const formatMonth = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (achievements.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Achievement Timeline</h3>
        <p className="text-gray-600">No achievements recorded this year yet. Keep training!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Achievement Timeline</h3>
        <p className="text-sm text-gray-600">
          Your personal records and milestones throughout {year}
        </p>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-purple-200 to-pink-200"></div>

        {/* Achievements */}
        <div className="space-y-4">
          {achievements.map((achievement) => (
            <a
              key={`${achievement.date.getTime()}-${achievement.type}`}
              href={`https://www.strava.com/activities/${achievement.activity.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex gap-4 items-start hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors"
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
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {getAchievementLabel(achievement)}
                      </h4>
                      <span className="text-sm font-semibold text-gray-500">
                        {formatMonth(achievement.date)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate mb-1">
                      {achievement.activity.name}
                    </p>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-bold text-blue-600">{achievement.value}</span>
                      <span className="text-gray-500">
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
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span className="font-semibold">
            {achievements.length} achievement{achievements.length !== 1 ? 's' : ''} unlocked
          </span>
          <span>Keep pushing your limits! 💪</span>
        </div>
      </div>
    </div>
  );
}
