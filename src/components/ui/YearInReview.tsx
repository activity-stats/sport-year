import { useMemo, useRef, useState } from 'react';
import type { Activity, YearStats } from '../../types';
import type { StravaAthlete } from '../../types/strava';
import {
  detectRaceHighlights,
  detectRaceHighlightsWithExcluded,
  type RaceHighlight,
} from '../../utils/raceDetection';
import { formatDistanceWithUnit, formatDuration } from '../../utils/formatters';
import { calculateSportHighlights, type SportHighlights } from '../../utils/sportHighlights';
import { filterActivities } from '../../utils/activityFilters';
import type { ActivityType } from '../../types';
import type { TitlePattern, StatType, ActivityTypeFilter } from '../../stores/settingsStore';
import { ActivitySelector } from './ActivitySelector';
import { SocialCard } from './SocialCard';
import { StatsSelector } from './StatsSelector';
import type { StatOption } from './statsOptions';
import { HeatmapCalendar } from '../charts/HeatmapCalendar';

interface HighlightFilters {
  backgroundImageUrl: string | null;
  backgroundImagePosition: { x: number; y: number; scale: number };
  excludedActivityTypes: ActivityType[];
  excludeVirtualPerSport: {
    cycling: { highlights: boolean; stats: boolean };
    running: { highlights: boolean; stats: boolean };
    swimming: { highlights: boolean; stats: boolean };
  };
  titleIgnorePatterns: TitlePattern[];
  highlightStats: StatType[];
  activityTypeSettings: {
    order: ActivityType[];
    includeInStats: ActivityType[];
    includeInHighlights: ActivityType[];
  };
  specialOptions: {
    enableTriathlonHighlights: boolean;
    mergeCycling: boolean;
  };
  activityFilters: ActivityTypeFilter[];
}

interface YearInReviewProps {
  year: number;
  stats: YearStats;
  activities: Activity[];
  athlete: StravaAthlete | null;
  highlightFilters: HighlightFilters;
  backgroundImageUrl?: string | null;
}

function SportDetailSection({
  highlights,
  customHighlights = [],
}: {
  highlights: SportHighlights;
  customHighlights?: RaceHighlight[];
}) {
  const sportConfig = {
    running: {
      emoji: '🏃',
      title: 'Running',
      gradient: 'from-orange-500 to-red-600',
      paceLabel: 'Avg Pace',
      paceUnit: 'min/km',
    },
    cycling: {
      emoji: '🚴',
      title: 'Cycling',
      gradient: 'from-blue-500 to-cyan-600',
      paceLabel: 'Avg Speed',
      paceUnit: 'km/h',
    },
    swimming: {
      emoji: '🏊',
      title: 'Swimming',
      gradient: 'from-teal-500 to-blue-600',
      paceLabel: 'Avg Pace',
      paceUnit: 'min/100m',
    },
  };

  const config = sportConfig[highlights.sport];
  const paceValue = highlights.averagePace || highlights.averageSpeed || 0;

  const formatPace = (pace: number) => {
    if (highlights.sport === 'cycling') {
      return pace.toFixed(1);
    }
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto px-6 py-16 md:py-20">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="text-5xl">{config.emoji}</div>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white">
            {config.title} Highlights
          </h2>
        </div>
        <div
          className={`h-1.5 w-32 bg-gradient-to-r ${config.gradient} mx-auto rounded-full mb-6`}
        ></div>

        {/* Overview stats */}
        <div className="flex flex-wrap justify-center gap-6 text-lg text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 dark:text-white">
              {formatDistanceWithUnit(highlights.totalDistance * 1000)}
            </span>
            <span>total</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 dark:text-white">{config.paceLabel}:</span>
            <span>
              {formatPace(paceValue)} {config.paceUnit}
            </span>
          </div>
          {highlights.totalElevation > 100 && (
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 dark:text-white">
                ⛰️ {Math.round(highlights.totalElevation).toLocaleString('de-DE')}m
              </span>
              <span>elevation</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Custom Highlights - activities matching custom filters */}
        {customHighlights.map((highlight) => {
          // Check if this is the longest activity
          const isLongest = highlight.id === highlights.longestActivity.id;
          const sportColors = getSportBadgeColors(highlight.type);
          const paceSpeed = formatPaceSpeed(
            highlight.activityType || highlight.type,
            highlight.distance,
            highlight.duration || 0
          );

          return (
            <a
              key={highlight.id}
              href={`https://www.strava.com/activities/${highlight.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200/50 dark:border-gray-600 p-6 hover:shadow-xl hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-2 flex-wrap">
                  <div
                    className={`inline-block px-4 py-2 rounded-lg ${sportColors.bg} ${sportColors.text} text-sm font-bold shadow-sm`}
                  >
                    {highlight.badge}
                  </div>
                  {isLongest && (
                    <div className="inline-block px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold shadow-sm">
                      🏆 Longest
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {highlight.date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-4 line-clamp-2 text-lg">
                {highlight.name}
              </h4>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-3 border border-blue-100 dark:border-blue-800">
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">
                    Distance
                  </div>
                  <div className="text-xl font-black text-gray-900 dark:text-white">
                    {formatDistanceWithUnit(highlight.distance * 1000)}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl p-3 border border-purple-100 dark:border-purple-800">
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">
                    Time
                  </div>
                  <div className="text-xl font-black text-gray-900 dark:text-white">
                    {formatDuration((highlight.duration || 0) * 60)}
                  </div>
                </div>
              </div>

              {/* Pace row */}
              {paceSpeed && highlight.type !== 'triathlon' && (
                <div className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-600">
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">
                    Pace
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{paceSpeed}</div>
                </div>
              )}
            </a>
          );
        })}

        {/* Longest activity - only show if not already displayed, or merge badges if it's in distanceRecords */}
        {(() => {
          // Check if longest activity is already shown in distance records or custom highlights
          const inDistanceRecords = highlights.distanceRecords.find(
            (r) => r.activity.id === highlights.longestActivity.id
          );
          const inCustomHighlights = customHighlights.some(
            (h) => h.id === highlights.longestActivity.id
          );

          // If it's in custom highlights, don't show it again
          if (inCustomHighlights) {
            return null;
          }

          // If it's in distance records, ADD the "🏆 Longest" badge to that card instead of showing separately
          if (inDistanceRecords) {
            // Already shown in distance records with Marathon/Half Marathon badge
            // The distance record card will be enhanced to show both badges
            return null;
          }

          // Show as separate "Longest" card
          const paceSpeed = formatPaceSpeed(
            highlights.longestActivity.type,
            highlights.longestActivity.distanceKm,
            highlights.longestActivity.movingTimeMinutes
          );

          return (
            <a
              href={`https://www.strava.com/activities/${highlights.longestActivity.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200/50 dark:border-gray-600 p-6 hover:shadow-xl hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="inline-block px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold shadow-sm">
                  🏆 Longest
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {highlights.longestActivity.date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-4 line-clamp-2 text-lg">
                {highlights.longestActivity.name}
              </h4>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-3 border border-blue-100 dark:border-blue-800">
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">
                    Distance
                  </div>
                  <div className="text-xl font-black text-gray-900 dark:text-white">
                    {formatDistanceWithUnit(highlights.longestActivity.distanceKm * 1000)}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl p-3 border border-purple-100 dark:border-purple-800">
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">
                    Time
                  </div>
                  <div className="text-xl font-black text-gray-900 dark:text-white">
                    {formatDuration(highlights.longestActivity.movingTimeMinutes * 60)}
                  </div>
                </div>
              </div>

              {/* Pace and Elevation */}
              {paceSpeed && (
                <div className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-600 mb-3">
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">
                    Pace
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{paceSpeed}</div>
                </div>
              )}
              {highlights.longestActivity.elevationGainMeters &&
                highlights.longestActivity.elevationGainMeters > 50 && (
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 rounded-xl p-3 border border-emerald-100 dark:border-emerald-800">
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">
                      Elevation
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      ⛰️ {Math.round(highlights.longestActivity.elevationGainMeters)}m
                    </div>
                  </div>
                )}
            </a>
          );
        })()}

        {/* Biggest Climb - only show if exists and not already shown */}
        {highlights.biggestClimb &&
          highlights.biggestClimb.elevationGainMeters &&
          highlights.biggestClimb.elevationGainMeters > 50 &&
          (() => {
            // Check if already shown as custom highlight or longest
            const inCustomHighlights = customHighlights.some(
              (h) => h.id === highlights.biggestClimb!.id
            );
            const isLongest = highlights.biggestClimb.id === highlights.longestActivity.id;

            // If already shown, don't duplicate
            if (inCustomHighlights || isLongest) {
              return null;
            }

            const paceSpeed = formatPaceSpeed(
              highlights.biggestClimb.type,
              highlights.biggestClimb.distanceKm,
              highlights.biggestClimb.movingTimeMinutes
            );

            return (
              <a
                href={`https://www.strava.com/activities/${highlights.biggestClimb.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200/50 dark:border-gray-600 p-6 hover:shadow-xl hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="inline-block px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-bold shadow-sm">
                    ⛰️ Biggest Climb
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {highlights.biggestClimb.date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-4 line-clamp-2 text-lg">
                  {highlights.biggestClimb.name}
                </h4>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 rounded-xl p-3 border border-emerald-100 dark:border-emerald-800">
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">
                      Elevation
                    </div>
                    <div className="text-xl font-black text-gray-900 dark:text-white">
                      {Math.round(highlights.biggestClimb.elevationGainMeters)}m
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-3 border border-blue-100 dark:border-blue-800">
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">
                      Distance
                    </div>
                    <div className="text-xl font-black text-gray-900 dark:text-white">
                      {formatDistanceWithUnit(highlights.biggestClimb.distanceKm * 1000)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl p-3 border border-purple-100 dark:border-purple-800">
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">
                      Time
                    </div>
                    <div className="text-xl font-black text-gray-900 dark:text-white">
                      {formatDuration(highlights.biggestClimb.movingTimeMinutes * 60)}
                    </div>
                  </div>
                  {paceSpeed && (
                    <div className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-600">
                      <div className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">
                        Pace
                      </div>
                      <div className="text-xl font-black text-gray-900 dark:text-white">
                        {paceSpeed}
                      </div>
                    </div>
                  )}
                </div>
              </a>
            );
          })()}
      </div>
    </div>
  );
}

interface YearInReviewProps {
  year: number;
  stats: YearStats;
  activities: Activity[];
}

function RaceCard({ highlight }: { highlight: RaceHighlight }) {
  const formattedDate = highlight.date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });

  // For triathlons, link to the first activity (swim usually), otherwise use the highlight ID
  const activityId =
    highlight.activities && highlight.activities.length > 0
      ? highlight.activities[0].id
      : highlight.id;
  const stravaUrl = `https://www.strava.com/activities/${activityId}`;

  return (
    <a
      href={stravaUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 dark:border-gray-700 block"
    >
      {/* Colorful top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>

      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative p-6">
        {/* Header with emoji and date */}
        <div className="flex items-start justify-between mb-4">
          <div className="text-5xl transform group-hover:scale-110 transition-transform duration-300">
            {highlight.badge.split(' ')[0]}
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400 font-semibold bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
            {formattedDate}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 line-clamp-2 min-h-[3.5rem] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {highlight.name}
        </h3>

        {/* Badge label */}
        <p className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 mb-5">
          {highlight.badge}
        </p>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
            <div className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">
              Distance
            </div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">
              {formatDistanceWithUnit(highlight.distance * 1000)}
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
            <div className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">
              Time
            </div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">
              {formatDuration(highlight.duration * 60)}
            </div>
          </div>
        </div>

        {/* Activity splits for triathlons */}
        {highlight.activities && highlight.activities.length > 1 && (
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
            <div className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider mb-3">
              Splits
            </div>
            <div className="flex justify-between gap-2">
              {highlight.activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex flex-col items-center bg-white dark:bg-gray-700 px-3 py-2 rounded-lg shadow-sm flex-1"
                >
                  <span className="text-2xl mb-1">
                    {activity.type === 'Swim' ? '🏊' : activity.type.includes('Ride') ? '🚴' : '🏃'}
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {formatDistanceWithUnit(activity.distanceKm * 1000)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </a>
  );
}

// Sport-specific badge colors for a modern, athletic look
const getSportBadgeColors = (activityType: string) => {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    Run: { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-600' },
    Ride: { bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-600' },
    VirtualRide: { bg: 'bg-teal-500', text: 'text-white', border: 'border-teal-600' },
    Swim: { bg: 'bg-cyan-500', text: 'text-white', border: 'border-cyan-600' },
    Walk: { bg: 'bg-violet-500', text: 'text-white', border: 'border-violet-600' },
    Hike: { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-600' },
  };
  return (
    colors[activityType] || { bg: 'bg-gray-500', text: 'text-white', border: 'border-gray-600' }
  );
};

// Format pace/speed based on activity type
const formatPaceSpeed = (activityType: string, distance: number, duration: number) => {
  if (!distance || !duration || distance === 0 || duration === 0) return null;

  if (activityType === 'Run') {
    // Running: min/km
    const pace = duration / distance;
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')} min/km`;
  } else if (activityType === 'Ride' || activityType === 'VirtualRide') {
    // Cycling: km/h
    const speed = (distance / duration) * 60;
    return `${speed.toFixed(1)} km/h`;
  } else if (activityType === 'Swim') {
    // Swimming: min/100m
    const pace = duration / distance / 10; // min per 100m
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')} min/100m`;
  }
  return null;
};

export function YearInReview({
  year,
  stats,
  activities,
  athlete,
  highlightFilters,
  backgroundImageUrl,
}: YearInReviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showStatsSelector, setShowStatsSelector] = useState(false);
  const [showActivitySelector, setShowActivitySelector] = useState(false);
  const [showSocialCard, setShowSocialCard] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<Activity[]>([]);
  const [selectedHighlights, setSelectedHighlights] = useState<RaceHighlight[]>([]);
  const [selectedStats, setSelectedStats] = useState<StatOption[]>([]);

  // Filter activities to exclude virtual rides if disabled and respect title patterns for highlight cards
  const _filteredActivities = useMemo(
    () => filterActivities(activities, highlightFilters),
    [activities, highlightFilters]
  );

  // For sport highlights totals, use activities filtered only by type exclusions
  // (not title patterns or virtual ride settings) to match the stats page totals
  // Virtual ride exclusion only affects which highlight CARDS are shown, not the totals
  const activitiesForTotals = useMemo(() => {
    return activities.filter((activity) => {
      // Filter by activity type exclusions only
      if (highlightFilters.excludedActivityTypes.includes(activity.type)) {
        return false;
      }
      return true;
    });
  }, [activities, highlightFilters.excludedActivityTypes]);

  const highlights = useMemo(
    () =>
      detectRaceHighlights(activities, {
        // Use ALL activities, not filtered
        titleIgnorePatterns: highlightFilters.titleIgnorePatterns,
        activityFilters: highlightFilters.activityFilters,
      }),
    [activities, highlightFilters.titleIgnorePatterns, highlightFilters.activityFilters]
  );

  // Get excluded activity IDs from custom filters to prevent duplicates in sport highlights
  const excludedActivityIds = useMemo(() => {
    const result = detectRaceHighlightsWithExcluded(activities, {
      titleIgnorePatterns: highlightFilters.titleIgnorePatterns,
      activityFilters: highlightFilters.activityFilters,
    });
    return result.excludedActivityIds;
  }, [activities, highlightFilters.titleIgnorePatterns, highlightFilters.activityFilters]);

  // Use activitiesForTotals to calculate sport highlights so totals match stats page
  const sportHighlights = useMemo(
    () =>
      calculateSportHighlights(
        activitiesForTotals,
        highlightFilters.activityFilters,
        excludedActivityIds
      ),
    [activitiesForTotals, highlightFilters.activityFilters, excludedActivityIds]
  );

  // Convert highlights to activities for selection, including triathlon activities
  const highlightActivities = useMemo(() => {
    const activityList: Activity[] = [];
    highlights.forEach((highlight) => {
      if (highlight.activities && highlight.activities.length > 0) {
        // For triathlons, include all sub-activities
        activityList.push(...highlight.activities);
      }
    });
    return activityList;
  }, [highlights]);

  const handleCreateSocialCard = () => {
    setShowStatsSelector(true);
  };

  const handleStatsSelected = (stats: StatOption[]) => {
    setSelectedStats(stats);
    setShowStatsSelector(false);
    setShowActivitySelector(true);
  };

  const handleActivitiesSelected = (
    selected: Activity[],
    selectedHighlightItems: RaceHighlight[]
  ) => {
    setSelectedActivities(selected);
    setSelectedHighlights(selectedHighlightItems);
    setShowActivitySelector(false);
    setShowSocialCard(true);
  };

  // Calculate days with activities
  const daysActive = useMemo(() => {
    const uniqueDays = new Set(activities.map((a) => a.date.toISOString().split('T')[0]));
    return uniqueDays.size;
  }, [activities]);

  // Calculate additional stats
  const additionalStats = useMemo(() => {
    const activitiesWithHR = activities.filter((a) => a.averageHeartRate);
    const avgHeartRate =
      activitiesWithHR.length > 0
        ? Math.round(
            activitiesWithHR.reduce((sum, a) => sum + (a.averageHeartRate || 0), 0) /
              activitiesWithHR.length
          )
        : 0;

    const maxSpeed = Math.round(Math.max(...activities.map((a) => a.maxSpeedKmh), 0));
    const avgSpeed = stats.totalTimeHours > 0 ? stats.totalDistanceKm / stats.totalTimeHours : 0;

    const activitiesWithCalories = activities.filter((a) => a.calories);
    const totalCalories =
      activitiesWithCalories.length > 0
        ? Math.round(activitiesWithCalories.reduce((sum, a) => sum + (a.calories || 0), 0))
        : 0;

    return {
      avgHeartRate,
      maxSpeed,
      avgSpeed,
      totalCalories,
    };
  }, [activities, stats]);

  // Generate stat cards based on user selection
  const statCards = useMemo(() => {
    const cards: Array<{
      value: string;
      label: string;
      colorClass: string;
    }> = [];

    // Use default stats if highlightStats is undefined (for backward compatibility)
    const selectedStats = highlightFilters.highlightStats || [
      'hours',
      'daysActive',
      'distance',
      'elevation',
    ];

    selectedStats.forEach((statType) => {
      switch (statType) {
        case 'daysActive':
          cards.push({
            value: daysActive.toString(),
            label: 'Days Active',
            colorClass: 'hover:shadow-purple-500/50',
          });
          break;
        case 'hours':
          cards.push({
            value: Math.round(stats.totalTimeHours).toLocaleString('de-DE'),
            label: 'Active Hours',
            colorClass: 'hover:shadow-blue-500/50',
          });
          break;
        case 'distance':
          cards.push({
            value: Math.round(stats.totalDistanceKm).toLocaleString('de-DE'),
            label: 'km Distance',
            colorClass: 'hover:shadow-pink-500/50',
          });
          break;
        case 'elevation':
          cards.push({
            value: Math.round(stats.totalElevationMeters).toLocaleString('de-DE'),
            label: 'm Elevation',
            colorClass: 'hover:shadow-green-500/50',
          });
          break;
        case 'activities':
          cards.push({
            value: stats.activityCount.toLocaleString('de-DE'),
            label: 'Activities',
            colorClass: 'hover:shadow-orange-500/50',
          });
          break;
        case 'avgSpeed':
          cards.push({
            value: Math.round(additionalStats.avgSpeed).toLocaleString('de-DE'),
            label: 'Avg Speed (km/h)',
            colorClass: 'hover:shadow-cyan-500/50',
          });
          break;
        case 'longestActivity':
          if (stats.longestActivity) {
            cards.push({
              value: Math.round(stats.longestActivity.distanceKm).toLocaleString('de-DE'),
              label: 'Longest (km)',
              colorClass: 'hover:shadow-indigo-500/50',
            });
          }
          break;
        case 'biggestClimb':
          if (stats.highestElevation) {
            cards.push({
              value: Math.round(stats.highestElevation.elevationGainMeters).toLocaleString('de-DE'),
              label: 'Biggest Climb (m)',
              colorClass: 'hover:shadow-emerald-500/50',
            });
          }
          break;
        case 'avgHeartRate':
          if (additionalStats.avgHeartRate > 0) {
            cards.push({
              value: additionalStats.avgHeartRate.toString(),
              label: 'Avg Heart Rate',
              colorClass: 'hover:shadow-red-500/50',
            });
          }
          break;
        case 'maxSpeed':
          if (additionalStats.maxSpeed > 0) {
            cards.push({
              value: additionalStats.maxSpeed.toLocaleString('de-DE'),
              label: 'Max Speed (km/h)',
              colorClass: 'hover:shadow-yellow-500/50',
            });
          }
          break;
        case 'calories':
          if (additionalStats.totalCalories > 0) {
            cards.push({
              value: additionalStats.totalCalories.toLocaleString('de-DE'),
              label: 'Calories Burned',
              colorClass: 'hover:shadow-amber-500/50',
            });
          }
          break;
      }
    });

    return cards;
  }, [stats, daysActive, additionalStats, highlightFilters.highlightStats]);

  // Generate monthly duration data for background chart
  const monthlyDurations = useMemo(() => {
    const months = Array(12).fill(0);
    activities.forEach((a) => {
      const month = a.date.getMonth();
      months[month] += a.movingTimeMinutes;
    });
    return months;
  }, [activities]);

  // Create SVG path for area chart
  const chartPath = useMemo(() => {
    if (monthlyDurations.length === 0) return '';

    const max = Math.max(...monthlyDurations, 1);
    const width = 100;
    const height = 100;
    const padding = 10;

    const points = monthlyDurations.map((value, index) => {
      const x = padding + (index / (monthlyDurations.length - 1)) * (width - padding * 2);
      const y = height - padding - (value / max) * (height - padding * 2);
      return `${x},${y}`;
    });

    // Create smooth area path
    const pathData = `M ${padding},${height - padding} L ${points.join(' L ')} L ${width - padding},${height - padding} Z`;
    return pathData;
  }, [monthlyDurations]);

  // Categorize highlights
  const triathlons = highlights.filter((h) => h.type === 'triathlon');
  // For "Other Achievements" section, only include standard long-run/long-ride types
  // Custom highlights should ONLY appear in their sport-specific sections
  const longRuns = highlights.filter((h) => h.type === 'long-run');
  const fondos = highlights.filter((h) => h.type === 'long-ride');

  // Extract custom highlights per sport for SportDetailSection
  // Sort by distance to ensure proper ordering
  const runningCustomHighlights = highlights
    .filter((h) => h.type === 'custom-highlight' && h.activityType === 'Run')
    .sort((a, b) => a.distance - b.distance);
  const cyclingCustomHighlights = highlights
    .filter(
      (h) =>
        h.type === 'custom-highlight' &&
        (h.activityType === 'Ride' || h.activityType === 'VirtualRide')
    )
    .sort((a, b) => a.distance - b.distance);
  const swimmingCustomHighlights = highlights
    .filter((h) => h.type === 'custom-highlight' && h.activityType === 'Swim')
    .sort((a, b) => a.distance - b.distance);

  // Get sport breakdowns
  const cycling = activities.filter((a) => ['Ride', 'VirtualRide'].includes(a.type));
  const running = activities.filter((a) => a.type === 'Run');
  const swimming = activities.filter((a) => a.type === 'Swim');

  const _cyclingDistance = cycling.reduce((sum, a) => sum + a.distanceKm, 0);
  const _runningDistance = running.reduce((sum, a) => sum + a.distanceKm, 0);
  const _swimmingDistance = swimming.reduce((sum, a) => sum + a.distanceKm, 0);

  return (
    <>
      <div
        ref={containerRef}
        className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-black"
      >
        {/* Social Card Button - Fixed bottom right */}
        <button
          onClick={handleCreateSocialCard}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold py-4 px-6 rounded-full hover:from-purple-600 hover:to-pink-700 transition-all shadow-2xl flex items-center gap-3 hover:scale-105 print:hidden"
          title="Create Social Card"
        >
          <span className="text-2xl">📱</span>
          <span className="text-lg">Share</span>
        </button>

        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-gray-900 dark:via-black dark:to-gray-900 text-white">
          {/* Background image or pattern */}
          {backgroundImageUrl ? (
            <>
              <div
                className="absolute inset-0 bg-cover"
                style={{
                  backgroundImage: `url(${backgroundImageUrl})`,
                  backgroundPosition: `${highlightFilters.backgroundImagePosition.x}% ${highlightFilters.backgroundImagePosition.y}%`,
                  transform: `scale(${highlightFilters.backgroundImagePosition.scale})`,
                  transformOrigin: 'center',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/70 via-indigo-700/70 to-purple-800/70 dark:from-gray-900/80 dark:via-black/70 dark:to-gray-900/80" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-20" />

              {/* Activity trend chart background */}
              <svg
                className="absolute inset-0 w-full h-full opacity-30"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="white" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="white" stopOpacity="0.1" />
                  </linearGradient>
                </defs>
                <path
                  d={chartPath}
                  fill="url(#chartGradient)"
                  stroke="white"
                  strokeWidth="1"
                  strokeOpacity="0.6"
                />
              </svg>
            </>
          )}

          <div className="relative container mx-auto px-6 py-20 md:py-32">
            <div className="text-center">
              <div className="inline-block">
                <h1 className="text-7xl md:text-9xl font-black mb-6 tracking-tight drop-shadow-2xl">
                  {year}
                </h1>
                <div className="h-1.5 w-32 bg-gradient-to-r from-transparent via-white to-transparent mx-auto mb-8 rounded-full"></div>
                <p className="text-3xl md:text-4xl font-light mb-4 text-white/90 tracking-wide">
                  Your Epic Year in Sports
                </p>
              </div>

              {/* Key Stats - Beautiful glassmorphism cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto mt-16">
                {statCards.map((card, index) => (
                  <div
                    key={index}
                    className={`group bg-white/20 backdrop-blur-lg rounded-3xl p-6 md:p-8 border border-white/30 shadow-2xl hover:bg-white/30 hover:scale-105 transition-all duration-300 ${card.colorClass}`}
                  >
                    <div className="text-4xl md:text-5xl font-black mb-2 text-white drop-shadow-lg">
                      {card.value}
                    </div>
                    <div className="text-xs md:text-sm text-white/90 font-bold tracking-widest uppercase">
                      {card.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Bottom fade effect */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-slate-50 dark:from-gray-900 to-transparent"></div>
        </div>

        {/* Heatmap Calendar */}
        <div className="container mx-auto px-6 py-16 md:py-20">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="text-5xl">📅</div>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white">
                Activity Calendar
              </h2>
            </div>
            <div className="h-1.5 w-32 bg-gradient-to-r from-emerald-500 to-teal-600 mx-auto rounded-full mb-6"></div>
            <p className="text-xl text-gray-600 dark:text-gray-400 font-semibold">
              Your training consistency throughout the year
            </p>
          </div>
          <HeatmapCalendar year={year} activities={activities} />
        </div>

        {/* Sport Detail Sections */}
        {sportHighlights.running && (
          <SportDetailSection
            highlights={sportHighlights.running}
            customHighlights={runningCustomHighlights}
          />
        )}
        {sportHighlights.cycling && (
          <SportDetailSection
            highlights={sportHighlights.cycling}
            customHighlights={cyclingCustomHighlights}
          />
        )}
        {sportHighlights.swimming && (
          <SportDetailSection
            highlights={sportHighlights.swimming}
            customHighlights={swimmingCustomHighlights}
          />
        )}

        {/* Race Highlights */}
        {triathlons.length > 0 && (
          <div className="container mx-auto px-6 py-16 md:py-20">
            <div className="mb-12">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="text-5xl">🏊🚴🏃</div>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white">
                  Triathlons
                </h2>
              </div>
              <p className="text-xl text-gray-600 dark:text-gray-400 text-center font-semibold mb-4">
                {triathlons.length} epic multi-sport adventure{triathlons.length !== 1 ? 's' : ''}
              </p>
              <div className="h-1.5 w-32 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto rounded-full"></div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {triathlons.map((highlight) => (
                <RaceCard key={highlight.id} highlight={highlight} />
              ))}
            </div>
          </div>
        )}

        {/* Other Achievements */}
        {(longRuns.length > 0 || fondos.length > 0) && (
          <div className="container mx-auto px-6 py-16 md:py-20">
            <div className="mb-12">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="text-5xl">🌟</div>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white">
                  Other Achievements
                </h2>
              </div>
              <p className="text-xl text-gray-600 dark:text-gray-400 text-center font-semibold mb-4">
                Even more incredible performances
              </p>
              <div className="h-1.5 w-32 bg-gradient-to-r from-yellow-500 to-orange-600 mx-auto rounded-full"></div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {[...longRuns, ...fondos].map((highlight) => (
                <RaceCard key={highlight.id} highlight={highlight} />
              ))}
            </div>
          </div>
        )}

        {/* Footer Message */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-gray-900 dark:via-black dark:to-gray-900 text-white py-20 md:py-24 mt-16">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-20" />
          <div className="container mx-auto px-6 text-center relative">
            <div className="inline-block mb-8">
              <div className="text-7xl mb-6">🎉</div>
              <h2 className="text-4xl md:text-5xl font-black mb-6 drop-shadow-2xl">
                What an Epic Year!
              </h2>
              <div className="h-1.5 w-32 bg-gradient-to-r from-transparent via-white to-transparent mx-auto rounded-full mb-8"></div>
            </div>

            <div className="bg-white/15 backdrop-blur-lg rounded-3xl p-8 md:p-10 border border-white/20 shadow-2xl max-w-4xl mx-auto">
              <p className="text-2xl md:text-3xl font-light leading-relaxed mb-4">
                You crushed{' '}
                <span className="font-black">
                  {formatDistanceWithUnit(stats.totalDistanceKm * 1000)}
                </span>{' '}
                across <span className="font-black">{stats.activityCount} activities</span>,
                dedicating{' '}
                <span className="font-black">{Math.round(stats.totalTimeHours)} hours</span> to your
                passion.
              </p>
              <p className="text-xl md:text-2xl font-light">
                Here's to even more epic adventures in{' '}
                <span className="font-black text-3xl">{year + 1}</span>! 🚀
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Selector Modal */}
      {showStatsSelector && (
        <StatsSelector
          stats={stats}
          daysActive={daysActive}
          onConfirm={handleStatsSelected}
          onClose={() => setShowStatsSelector(false)}
        />
      )}

      {/* Activity Selector Modal */}
      {showActivitySelector && (
        <ActivitySelector
          activities={activities}
          highlightActivities={highlightActivities}
          highlights={highlights}
          onConfirm={handleActivitiesSelected}
          onClose={() => setShowActivitySelector(false)}
        />
      )}

      {/* Social Card Modal */}
      {showSocialCard && (
        <SocialCard
          year={year}
          stats={stats}
          athlete={athlete}
          daysActive={daysActive}
          selectedActivities={selectedActivities}
          selectedHighlights={selectedHighlights}
          selectedStats={selectedStats}
          backgroundImageUrl={backgroundImageUrl || null}
          onClose={() => {
            setShowSocialCard(false);
            setSelectedActivities([]);
            setSelectedHighlights([]);
          }}
        />
      )}
    </>
  );
}
