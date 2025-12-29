import { useMemo, useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Activity, YearStats } from '../../types';
import type { StravaAthlete } from '../../types/strava';
import {
  detectRaceHighlights,
  detectRaceHighlightsWithExcluded,
  detectTriathlons,
  getTriathlonDisplayInfo,
  type RaceHighlight,
} from '../../utils/raceDetection';
import {
  formatDistanceWithUnit,
  formatDuration,
  formatDistanceForClosing,
  formatAthleteSlug,
  formatElevation,
} from '../../utils/formatters';
import { calculateSportHighlights, type SportHighlights } from '../../utils/sportHighlights';
import { filterActivities } from '../../utils/activityFilters';
import type { ActivityType } from '../../types';
import type { TitlePattern, StatType, ActivityTypeFilter } from '../../stores/settingsStore';
import type { CropArea } from '../../utils/imageCrop';
import { getCroppedImage } from '../../utils/imageCrop';
import { ActivitySelector } from './ActivitySelector';
import { SocialCard } from './SocialCard';
import { StatsSelector } from './StatsSelector';
import type { StatOption } from './statsOptions';
import { HeatmapCalendar } from '../charts/HeatmapCalendar';
import { useAdvancedExport } from '../../hooks/useAdvancedExport';
import { ExportDialog, type ExportSection, type ExportFormat } from './ExportDialog';
import { showError } from '../../utils/toast';

interface HighlightFilters {
  backgroundImageUrl: string | null;
  backgroundImageCrop: CropArea | null;
  backgroundImageOpacity: number;
  socialCardCrops: {
    landscape?: CropArea;
    opengraph?: CropArea;
    square?: CropArea;
  };
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
  year: number | 'last365';
  stats: YearStats;
  activities: Activity[];
  athlete: StravaAthlete | null;
  highlightFilters: HighlightFilters;
  backgroundImageUrl?: string | null;
  onDateClick?: (date: Date) => void;
  onActivityClick?: (activityIds: string | string[]) => void;
}

function SportDetailSection({
  highlights,
  customHighlights = [],
  sectionId,
  onActivityClick,
}: {
  highlights: SportHighlights;
  customHighlights?: RaceHighlight[];
  sectionId?: string;
  onActivityClick?: (activityIds: string | string[]) => void;
}) {
  const { t } = useTranslation();
  const sportConfig = {
    running: {
      emoji: '🏃',
      title: t('activityTypes.Run'),
      gradient: 'from-orange-500 to-red-600',
      paceLabel: t('yearInReview.avgPace'),
      paceUnit: 'min/km',
    },
    cycling: {
      emoji: '🚴',
      title: t('activityTypes.Ride'),
      gradient: 'from-blue-500 to-cyan-600',
      paceLabel: t('yearInReview.avgSpeed'),
      paceUnit: 'km/h',
    },
    swimming: {
      emoji: '🏊',
      title: t('activityTypes.Swim'),
      gradient: 'from-teal-500 to-blue-600',
      paceLabel: t('yearInReview.avgPace'),
      paceUnit: 'min/100m',
    },
  };

  const config = sportConfig[highlights.sport];
  const paceValue = highlights.averagePace || highlights.averageSpeed || 0;

  const formatPace = (pace: number) => {
    if (highlights.sport === 'cycling') {
      return pace.toFixed(1);
    }
    let minutes = Math.floor(pace);
    let seconds = Math.round((pace - minutes) * 60);
    if (seconds >= 60) {
      minutes += 1;
      seconds = 0;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div id={sectionId} className="container mx-auto px-3 sm:px-6 py-8 sm:py-16 md:py-20">
      <div className="text-center mb-8 sm:mb-12">
        <div className="flex items-center justify-center gap-3 sm:gap-4 mb-3 sm:mb-4 flex-wrap">
          <div className="text-3xl sm:text-5xl">{config.emoji}</div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-gray-900 dark:text-white whitespace-nowrap">
            {config.title} {t('yearInReview.highlights')}
          </h2>
        </div>
        <div
          className={`h-1.5 w-24 sm:w-32 bg-gradient-to-r ${config.gradient} mx-auto rounded-full mb-4 sm:mb-6`}
        ></div>

        {/* Overview stats */}
        <div className="flex flex-wrap justify-center gap-3 sm:gap-6 text-sm sm:text-lg text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 dark:text-white">
              {formatDistanceWithUnit(highlights.totalDistance * 1000)}
            </span>
            <span>{t('yearInReview.total')}</span>
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
              <span>{t('yearInReview.elevation')}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Custom Highlights - activities matching custom filters */}
        {customHighlights.map((highlight) => {
          // Check if this custom highlight is also the longest activity
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
              onClick={(e) => {
                if (onActivityClick) {
                  e.preventDefault();
                  onActivityClick(highlight.id);
                }
              }}
              className="flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200/50 dark:border-gray-600 p-6 hover:shadow-xl hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 cursor-pointer"
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
                      🏆 {t('yearInReview.longest')}
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
              <h4 className="font-bold text-gray-900 dark:text-white mb-4 line-clamp-2 text-lg flex-grow">
                {highlight.name}
              </h4>

              {/* Stats grid - 2x2 layout */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-3 border border-blue-100 dark:border-blue-800">
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">
                    {t('yearInReview.distance')}
                  </div>
                  <div className="text-xl font-black text-gray-900 dark:text-white">
                    📏 {formatDistanceWithUnit(highlight.distance * 1000)}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl p-3 border border-purple-100 dark:border-purple-800">
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">
                    {t('yearInReview.time')}
                  </div>
                  <div className="text-xl font-black text-gray-900 dark:text-white">
                    ⏱️ {formatDuration((highlight.duration || 0) * 60)}
                  </div>
                </div>
                {paceSpeed && highlight.type !== 'triathlon' && (
                  <div className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-600">
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">
                      {t('yearInReview.pace')}
                    </div>
                    <div className="text-lg font-black text-gray-900 dark:text-white whitespace-nowrap">
                      ⚡ {paceSpeed}
                    </div>
                  </div>
                )}
              </div>
            </a>
          );
        })}

        {/* Longest activity - only show if not already displayed in custom highlights or distance records */}
        {(() => {
          // Check if longest activity is already shown in distance records or custom highlights
          const inDistanceRecords = highlights.distanceRecords.find(
            (r) => r.activity.id === highlights.longestActivity.id
          );
          const inCustomHighlights = customHighlights.some(
            (h) => h.id === highlights.longestActivity.id
          );

          // If the longest is already displayed, don't show it again (it has the badge added)
          if (inCustomHighlights || inDistanceRecords) {
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
              onClick={(e) => {
                if (onActivityClick) {
                  e.preventDefault();
                  onActivityClick(highlights.longestActivity.id);
                }
              }}
              className="flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200/50 dark:border-gray-600 p-6 hover:shadow-xl hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="inline-block px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold shadow-sm">
                  🏆 {t('yearInReview.longest')}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {highlights.longestActivity.date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-4 line-clamp-2 text-lg flex-grow">
                {highlights.longestActivity.name}
              </h4>

              {/* Stats grid - 2x2 layout */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-3 border border-blue-100 dark:border-blue-800">
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">
                    {t('yearInReview.distance')}
                  </div>
                  <div className="text-xl font-black text-gray-900 dark:text-white">
                    📏 {formatDistanceWithUnit(highlights.longestActivity.distanceKm * 1000)}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl p-3 border border-purple-100 dark:border-purple-800">
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">
                    {t('yearInReview.time')}
                  </div>
                  <div className="text-xl font-black text-gray-900 dark:text-white">
                    ⏱️ {formatDuration(highlights.longestActivity.movingTimeMinutes * 60)}
                  </div>
                </div>
                {paceSpeed && (
                  <div className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-600">
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">
                      {t('yearInReview.pace')}
                    </div>
                    <div className="text-lg font-black text-gray-900 dark:text-white whitespace-nowrap">
                      ⚡ {paceSpeed}
                    </div>
                  </div>
                )}
                {highlights.longestActivity.elevationGainMeters &&
                  highlights.longestActivity.elevationGainMeters > 50 && (
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 rounded-xl p-3 border border-emerald-100 dark:border-emerald-800">
                      <div className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">
                        {t('yearInReview.elevation')}
                      </div>
                      <div className="text-xl font-black text-gray-900 dark:text-white">
                        ⛰️ {Math.round(highlights.longestActivity.elevationGainMeters)}m
                      </div>
                    </div>
                  )}
              </div>
            </a>
          );
        })()}

        {/* Biggest Climb - only show if exists and not already shown */}
        {highlights.biggestClimb &&
          highlights.biggestClimb.elevationGainMeters &&
          highlights.biggestClimb.elevationGainMeters > 50 &&
          (() => {
            // Check if biggest climb is already shown
            const inCustomHighlights = customHighlights.some(
              (h) => h.id === highlights.biggestClimb!.id
            );
            const inDistanceRecords = highlights.distanceRecords.some(
              (r) => r.activity.id === highlights.biggestClimb!.id
            );

            // If already shown, don't duplicate
            if (inCustomHighlights || inDistanceRecords) {
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
                onClick={(e) => {
                  if (onActivityClick) {
                    e.preventDefault();
                    onActivityClick(highlights.biggestClimb!.id);
                  }
                }}
                className="flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200/50 dark:border-gray-600 p-6 hover:shadow-xl hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="inline-block px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-bold shadow-sm">
                    ⛰️ {t('yearInReview.biggestClimb')}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {highlights.biggestClimb.date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-4 line-clamp-2 text-lg flex-grow">
                  {highlights.biggestClimb.name}
                </h4>

                {/* Stats grid - 2x2 layout */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-3 border border-blue-100 dark:border-blue-800">
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">
                      {t('yearInReview.distance')}
                    </div>
                    <div className="text-xl font-black text-gray-900 dark:text-white">
                      📏 {formatDistanceWithUnit(highlights.biggestClimb.distanceKm * 1000)}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl p-3 border border-purple-100 dark:border-purple-800">
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">
                      {t('yearInReview.time')}
                    </div>
                    <div className="text-xl font-black text-gray-900 dark:text-white">
                      ⏱️ {formatDuration(highlights.biggestClimb.movingTimeMinutes * 60)}
                    </div>
                  </div>
                  {paceSpeed && (
                    <div className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-600">
                      <div className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">
                        {t('yearInReview.pace')}
                      </div>
                      <div className="text-lg font-black text-gray-900 dark:text-white whitespace-nowrap">
                        ⚡ {paceSpeed}
                      </div>
                    </div>
                  )}
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 rounded-xl p-3 border border-emerald-100 dark:border-emerald-800">
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">
                      {t('yearInReview.elevation')}
                    </div>
                    <div className="text-xl font-black text-gray-900 dark:text-white">
                      ⛰️ {Math.round(highlights.biggestClimb.elevationGainMeters)}m
                    </div>
                  </div>
                </div>
              </a>
            );
          })()}
      </div>
    </div>
  );
}

function RaceCard({
  highlight,
  onActivityClick,
}: {
  highlight: RaceHighlight;
  onActivityClick?: (activityIds: string | string[]) => void;
}) {
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

  // Get all activity IDs for multi-sport events
  const activityIds =
    highlight.activities && highlight.activities.length > 0
      ? highlight.activities.map((a) => a.id)
      : [highlight.id];

  return (
    <a
      href={stravaUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        if (onActivityClick) {
          e.preventDefault();
          onActivityClick(activityIds);
        }
      }}
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
              {highlight.badge.includes('Mountain Triathlon')
                ? 'Total Elevation'
                : highlight.type === 'triathlon'
                  ? 'Total Distance'
                  : 'Distance'}
            </div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">
              {highlight.badge.includes('Mountain Triathlon')
                ? formatElevation(highlight.elevation || 0)
                : formatDistanceWithUnit(highlight.distance * 1000)}
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
    let minutes = Math.floor(pace);
    let seconds = Math.round((pace - minutes) * 60);
    if (seconds >= 60) {
      minutes += 1;
      seconds = 0;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')} min/km`;
  } else if (activityType === 'Ride' || activityType === 'VirtualRide') {
    // Cycling: km/h
    const speed = (distance / duration) * 60;
    return `${speed.toFixed(1)} km/h`;
  } else if (activityType === 'Swim') {
    // Swimming: min/100m
    const pace = duration / distance / 10; // min per 100m
    let minutes = Math.floor(pace);
    let seconds = Math.round((pace - minutes) * 60);
    // Handle case where seconds rounds to 60
    if (seconds >= 60) {
      minutes += 1;
      seconds = 0;
    }
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
  onDateClick,
  onActivityClick,
}: YearInReviewProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [showStatsSelector, setShowStatsSelector] = useState(false);
  const [showActivitySelector, setShowActivitySelector] = useState(false);
  const [showSocialCard, setShowSocialCard] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<Activity[]>([]);
  const [selectedHighlights, setSelectedHighlights] = useState<RaceHighlight[]>([]);
  const [selectedStats, setSelectedStats] = useState<StatOption[]>([]);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [croppedBackgroundUrl, setCroppedBackgroundUrl] = useState<string | null>(null);
  const {
    exportWithOptions,
    isExporting: isAdvancedExporting,
    progress: advancedProgress,
  } = useAdvancedExport();

  // Generate cropped background image when crop settings change
  useEffect(() => {
    if (!backgroundImageUrl || !highlightFilters.backgroundImageCrop) {
      // Defer setState to avoid cascading renders warning
      Promise.resolve().then(() => setCroppedBackgroundUrl(null));
      return;
    }

    let isCancelled = false;

    // Use a larger dimension for better quality (hero section is typically wide)
    const targetWidth = 1920;
    const targetHeight = 1080;

    getCroppedImage(
      backgroundImageUrl,
      highlightFilters.backgroundImageCrop,
      targetWidth,
      targetHeight
    )
      .then((result) => {
        if (!isCancelled) {
          setCroppedBackgroundUrl(result.url);
        }
      })
      .catch((error) => {
        console.error('Failed to crop background image:', error);
        if (!isCancelled) {
          setCroppedBackgroundUrl(null);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [backgroundImageUrl, highlightFilters.backgroundImageCrop]);

  const handleAdvancedExport = async (sections: ExportSection[], format: ExportFormat) => {
    try {
      // Create filename with athlete name if available
      const athleteName = formatAthleteSlug(athlete);
      const filename = `${athleteName}-year-in-sports-review-${year}`;

      await exportWithOptions(sections, format, {
        filename,
        quality: 0.95,
        scale: 2,
      });
      // Close the dialog after successful export
      setShowExportDialog(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      showError(`${t('yearInReview.exportFailed')}\n\n${errorMessage}`);
      // Close the dialog even on error so user can try again
      setShowExportDialog(false);
    }
  };

  // Define available sections for export
  const availableSections: Omit<ExportSection, 'enabled' | 'order'>[] = [
    { id: 'hero', name: t('yearInReview.heroSection') },
    { id: 'calendar', name: t('yearInReview.activityCalendar') },
    { id: 'triathlons', name: t('yearInReview.triathlonsSection') },
    { id: 'running', name: t('activityTypes.Run') },
    { id: 'cycling', name: t('activityTypes.Ride') },
    { id: 'swimming', name: t('activityTypes.Swim') },
    { id: 'custom-highlights', name: t('yearInReview.customHighlights') },
    { id: 'closing', name: t('yearInReview.closingSection') },
  ];

  // Filter activities to exclude virtual rides if disabled and respect title patterns for highlight cards
  useMemo(() => filterActivities(activities, highlightFilters), [activities, highlightFilters]);

  // For sport highlights totals, use activities filtered only by type exclusions
  // (not title patterns or virtual ride settings) to match the stats page totals
  // Virtual ride exclusion only affects which highlight CARDS are shown, not the totals
  const activitiesForTotals = useMemo(() => {
    return activities.filter((activity) => {
      // Filter by activity type exclusions only
      if (highlightFilters.excludedActivityTypes.includes(activity.type)) {
        return false;
      }

      // Also apply title ignore patterns for stats (not highlights)
      for (const patternObj of highlightFilters.titleIgnorePatterns) {
        if (
          patternObj.excludeFromStats &&
          activity.name.toLowerCase().includes(patternObj.pattern.toLowerCase())
        ) {
          return false;
        }
      }

      return true;
    });
  }, [activities, highlightFilters.excludedActivityTypes, highlightFilters.titleIgnorePatterns]);

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
        excludedActivityIds,
        highlightFilters.titleIgnorePatterns,
        highlightFilters.activityTypeSettings.includeInHighlights
      ),
    [
      activitiesForTotals,
      highlightFilters.activityFilters,
      excludedActivityIds,
      highlightFilters.titleIgnorePatterns,
      highlightFilters.activityTypeSettings.includeInHighlights,
    ]
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

  const handleBackToStats = () => {
    setShowActivitySelector(false);
    setShowStatsSelector(true);
  };

  const handleBackToActivities = () => {
    setShowSocialCard(false);
    setShowActivitySelector(true);
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
            label: t('stats.daysActive'),
            colorClass: 'hover:shadow-purple-500/50',
          });
          break;
        case 'hours':
          cards.push({
            value: Math.round(stats.totalTimeHours).toLocaleString('de-DE'),
            label: t('stats.activeHours'),
            colorClass: 'hover:shadow-blue-500/50',
          });
          break;
        case 'distance':
          cards.push({
            value: Math.round(stats.totalDistanceKm).toLocaleString('de-DE'),
            label: t('stats.kmDistance'),
            colorClass: 'hover:shadow-pink-500/50',
          });
          break;
        case 'elevation':
          cards.push({
            value: Math.round(stats.totalElevationMeters).toLocaleString('de-DE'),
            label: t('stats.mElevation'),
            colorClass: 'hover:shadow-green-500/50',
          });
          break;
        case 'activities':
          cards.push({
            value: stats.activityCount.toLocaleString('de-DE'),
            label: t('stats.activities'),
            colorClass: 'hover:shadow-orange-500/50',
          });
          break;
        case 'avgSpeed':
          cards.push({
            value: Math.round(additionalStats.avgSpeed).toLocaleString('de-DE'),
            label: t('stats.avgSpeedKmh'),
            colorClass: 'hover:shadow-cyan-500/50',
          });
          break;
        case 'longestActivity':
          if (stats.longestActivity) {
            cards.push({
              value: Math.round(stats.longestActivity.distanceKm).toLocaleString('de-DE'),
              label: t('stats.longestKm'),
              colorClass: 'hover:shadow-indigo-500/50',
            });
          }
          break;
        case 'biggestClimb':
          if (stats.highestElevation) {
            cards.push({
              value: Math.round(stats.highestElevation.elevationGainMeters).toLocaleString('de-DE'),
              label: t('stats.biggestClimbM'),
              colorClass: 'hover:shadow-emerald-500/50',
            });
          }
          break;
        case 'avgHeartRate':
          if (additionalStats.avgHeartRate > 0) {
            cards.push({
              value: additionalStats.avgHeartRate.toString(),
              label: t('stats.avgHeartRate'),
              colorClass: 'hover:shadow-red-500/50',
            });
          }
          break;
        case 'maxSpeed':
          if (additionalStats.maxSpeed > 0) {
            cards.push({
              value: additionalStats.maxSpeed.toLocaleString('de-DE'),
              label: t('stats.maxSpeedKmh'),
              colorClass: 'hover:shadow-yellow-500/50',
            });
          }
          break;
        case 'calories':
          if (additionalStats.totalCalories > 0) {
            cards.push({
              value: additionalStats.totalCalories.toLocaleString('de-DE'),
              label: t('stats.caloriesBurned'),
              colorClass: 'hover:shadow-amber-500/50',
            });
          }
          break;
        case 'kudos':
          cards.push({
            value: stats.totalKudos.toLocaleString('de-DE'),
            label: t('stats.kudos'),
            colorClass: 'hover:shadow-rose-500/50',
          });
          break;
      }
    });

    return cards;
  }, [stats, daysActive, additionalStats, highlightFilters.highlightStats, t]);

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

  // Extract all race-marked activities and triathlons (workout_type === 1)
  const raceItems = useMemo(() => {
    const items: Array<{
      type: 'activity' | 'triathlon';
      data: Activity | RaceHighlight;
      date: Date;
      displayName?: string;
      badge?: string;
    }> = [];
    const triathlonActivityIds = new Set<string>();

    // Get all triathlons first to check which ones have race markers
    const allTriathlons = detectTriathlons(activities);

    // First, add triathlons if any component is marked as race
    triathlons.forEach((tri) => {
      if (tri.activities) {
        const hasRaceMarker = tri.activities.some((a) => a.workoutType === 1);
        if (hasRaceMarker) {
          // Mark all triathlon activities to exclude them from standalone list
          tri.activities.forEach((a) => triathlonActivityIds.add(a.id));

          // Find the corresponding TriathlonRace to get the type info
          const triathlonRace = allTriathlons.find(
            (t) =>
              t.date.toISOString().split('T')[0] ===
              tri.activities![0].date.toISOString().split('T')[0]
          );

          // Get proper display name using shared algorithm
          const { name, badge } = triathlonRace
            ? getTriathlonDisplayInfo(triathlonRace, tri.activities)
            : { name: tri.name, badge: tri.badge };

          // Add the triathlon as a single item
          items.push({
            type: 'triathlon',
            data: tri,
            date: tri.activities[0].date,
            displayName: name,
            badge,
          });
        }
      }
    });

    // Then add all other race-marked activities (excluding triathlon components)
    activities
      .filter((a) => a.workoutType === 1 && !triathlonActivityIds.has(a.id))
      .forEach((a) => {
        items.push({
          type: 'activity',
          data: a,
          date: a.date,
        });
      });

    // Sort by date
    return items.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [activities, triathlons]);

  // Extract custom highlights per sport for SportDetailSection
  // Sort by distance to ensure proper ordering
  // IMPORTANT: Only include activity types that are in includeInHighlights
  const includeInHighlights = highlightFilters.activityTypeSettings.includeInHighlights || [];

  const runningCustomHighlights = highlights
    .filter(
      (h) =>
        h.type === 'custom-highlight' &&
        h.activityType === 'Run' &&
        includeInHighlights.includes('Run')
    )
    .sort((a, b) => a.distance - b.distance);
  const cyclingCustomHighlights = highlights
    .filter(
      (h) =>
        h.type === 'custom-highlight' &&
        (h.activityType === 'Ride' || h.activityType === 'VirtualRide') &&
        includeInHighlights.includes(h.activityType)
    )
    .sort((a, b) => a.distance - b.distance);
  const swimmingCustomHighlights = highlights
    .filter(
      (h) =>
        h.type === 'custom-highlight' &&
        h.activityType === 'Swim' &&
        includeInHighlights.includes('Swim')
    )
    .sort((a, b) => a.distance - b.distance);

  // Get sport breakdowns
  const cycling = activities.filter((a) => ['Ride', 'VirtualRide'].includes(a.type));
  const running = activities.filter((a) => a.type === 'Run');
  const swimming = activities.filter((a) => a.type === 'Swim');

  cycling.reduce((sum, a) => sum + a.distanceKm, 0);
  running.reduce((sum, a) => sum + a.distanceKm, 0);
  swimming.reduce((sum, a) => sum + a.distanceKm, 0);

  return (
    <>
      <div
        ref={containerRef}
        id="year-in-review-content"
        className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-black"
      >
        {/* Action Buttons - Fixed bottom right */}
        <div className="fixed bottom-24 md:bottom-6 right-6 z-40 flex flex-col gap-3 print:hidden">
          {/* Export PDF Button */}
          <button
            onClick={() => setShowExportDialog(true)}
            disabled={isAdvancedExporting}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-4 px-6 rounded-full hover:from-blue-600 hover:to-indigo-700 transition-all shadow-2xl flex items-center gap-3 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('yearInReview.exportPDF')}
          >
            {isAdvancedExporting ? (
              <>
                <span className="text-2xl animate-spin">⏳</span>
                <span className="text-lg">{advancedProgress}%</span>
              </>
            ) : (
              <>
                <span className="text-2xl">📄</span>
                <span className="text-lg">{t('yearInReview.export')}</span>
              </>
            )}
          </button>

          {/* Social Card Button */}
          <button
            onClick={handleCreateSocialCard}
            className="bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold py-4 px-6 rounded-full hover:from-purple-600 hover:to-pink-700 transition-all shadow-2xl flex items-center gap-3 hover:scale-105"
            title="Create Social Card"
          >
            <span className="text-2xl">📱</span>
            <span className="text-lg">{t('yearInReview.share')}</span>
          </button>
        </div>

        {/* Hero Section */}
        <div
          id="hero"
          className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-gray-900 dark:via-black dark:to-gray-900 text-white"
        >
          {/* Background image or pattern */}
          {croppedBackgroundUrl ? (
            <>
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${croppedBackgroundUrl})`,
                }}
              />
              <div
                className="absolute inset-0 bg-gradient-to-br from-blue-600/70 via-indigo-700/80 to-purple-800/70 dark:from-gray-900/80 dark:via-black/90 dark:to-gray-900/80"
                style={{
                  opacity: highlightFilters.backgroundImageOpacity || 0.7,
                }}
              />
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
                  {year === 'last365' ? t('yearInReview.last365Title') : year}
                </h1>
                <div className="h-1.5 w-32 bg-gradient-to-r from-transparent via-white to-transparent mx-auto mb-8 rounded-full"></div>
                <p className="text-3xl md:text-4xl font-light mb-4 text-white/90 tracking-wide">
                  {t('app.tagline')}
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
        <div id="calendar" className="container mx-auto px-6 py-16 md:py-20">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-4 flex-wrap">
              <div className="text-5xl">📅</div>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white whitespace-nowrap">
                {t('yearInReview.activityCalendar')}
              </h2>
            </div>
            <div className="h-1.5 w-32 bg-gradient-to-r from-emerald-500 to-teal-600 mx-auto rounded-full mb-6"></div>
            <p className="text-xl text-gray-600 dark:text-gray-400 font-semibold">
              {t('yearInReview.trainingConsistency')}
            </p>
          </div>
          <HeatmapCalendar year={year} activities={activities} onDateClick={onDateClick} />
        </div>

        {/* Race Overview - Timeline View */}
        {raceItems.length > 0 && (
          <div className="container mx-auto px-6 py-16 md:py-20">
            <div className="mb-12">
              <div className="flex items-center justify-center gap-4 mb-4 flex-wrap">
                <div className="text-5xl">🏆</div>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white whitespace-nowrap">
                  {t('yearInReview.raceOverview')}
                </h2>
              </div>
              <div className="h-1.5 w-24 sm:w-32 bg-gradient-to-r from-yellow-500 to-red-600 mx-auto rounded-full mb-4 sm:mb-6"></div>
              <p className="text-xl text-gray-600 dark:text-gray-400 text-center font-semibold">
                {t(
                  raceItems.length === 1
                    ? 'yearInReview.racesCompleted'
                    : 'yearInReview.racesCompletedPlural',
                  { count: raceItems.length }
                )}
              </p>
            </div>

            {/* Timeline View */}
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                {/* Vertical timeline line */}
                <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-yellow-500 via-orange-500 to-red-600"></div>

                {/* Timeline items */}
                <div className="space-y-8">
                  {raceItems.map((item, index) => {
                    const isLeft = index % 2 === 0;

                    if (item.type === 'triathlon') {
                      const tri = item.data as RaceHighlight;
                      const displayDate =
                        tri.activities && tri.activities[0] ? tri.activities[0].date : new Date();
                      const displayName = item.displayName || tri.name;
                      const badge = item.badge || tri.badge;

                      const triathlonActivityIds =
                        tri.activities && tri.activities.length > 0
                          ? tri.activities.map((a) => a.id)
                          : [tri.id];

                      return (
                        <div
                          key={tri.id}
                          className={`relative flex items-center ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'} flex-row`}
                        >
                          {/* Timeline dot */}
                          <div className="absolute left-8 md:left-1/2 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full border-4 border-white dark:border-gray-900 shadow-lg transform -translate-x-1/2 z-10"></div>

                          {/* Content card */}
                          <div
                            className={`flex-1 ${isLeft ? 'md:pr-12 pl-16 md:pl-0' : 'md:pl-12 pl-16 md:pr-0'}`}
                          >
                            <div
                              onClick={() => {
                                if (onActivityClick) {
                                  onActivityClick(triathlonActivityIds);
                                }
                              }}
                              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-yellow-200 dark:border-yellow-900 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl">🏊🚴🏃</span>
                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                      {displayDate.toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                      })}
                                    </span>
                                  </div>
                                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                    {displayName}
                                  </h3>
                                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                                    <div className="flex items-center gap-1">
                                      <span className="font-semibold">
                                        {badge.includes('Mountain Triathlon')
                                          ? '⛰️ Elevation:'
                                          : '📏 Total:'}
                                      </span>
                                      <span>
                                        {badge.includes('Mountain Triathlon')
                                          ? formatElevation(tri.elevation || 0)
                                          : formatDistanceWithUnit(tri.distance * 1000)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="font-semibold">⏱️</span>
                                      <span>{formatDuration((tri.duration || 0) * 60)}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-xs font-bold">
                                        {badge.split(' ').slice(1).join(' ') || 'Triathlon'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                                    <span className="text-2xl">🏆</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    } else {
                      const activity = item.data as Activity;
                      const activityIcon =
                        activity.type === 'Run'
                          ? '🏃'
                          : activity.type.includes('Ride')
                            ? '🚴'
                            : activity.type === 'Swim'
                              ? '🏊'
                              : '🏃';

                      return (
                        <div
                          key={activity.id}
                          className={`relative flex items-center ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'} flex-row`}
                        >
                          {/* Timeline dot */}
                          <div className="absolute left-8 md:left-1/2 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full border-4 border-white dark:border-gray-900 shadow-lg transform -translate-x-1/2 z-10"></div>

                          {/* Content card */}
                          <div
                            className={`flex-1 ${isLeft ? 'md:pr-12 pl-16 md:pl-0' : 'md:pl-12 pl-16 md:pr-0'}`}
                          >
                            <div
                              onClick={() => {
                                if (onActivityClick) {
                                  onActivityClick(activity.id);
                                }
                              }}
                              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-yellow-200 dark:border-yellow-900 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl">{activityIcon}</span>
                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                      {new Date(activity.date).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                      })}
                                    </span>
                                  </div>
                                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                    {activity.name}
                                  </h3>
                                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                                    <div className="flex items-center gap-1">
                                      <span className="font-semibold">📏</span>
                                      <span>
                                        {formatDistanceWithUnit(activity.distanceKm * 1000)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="font-semibold">⏱️</span>
                                      <span>{formatDuration(activity.movingTimeMinutes * 60)}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                                    <span className="text-2xl">🏆</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Triathlons Section - Moved to top */}
        {triathlons.length > 0 && (
          <div id="triathlons" className="container mx-auto px-6 py-16 md:py-20">
            <div className="mb-12">
              <div className="flex items-center justify-center gap-4 mb-4 flex-wrap">
                <div className="text-5xl">🏊🚴🏃</div>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white whitespace-nowrap">
                  {t('yearInReview.triathlons')}
                </h2>
              </div>
              <div className="h-1.5 w-24 sm:w-32 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto rounded-full mb-4 sm:mb-6"></div>
              <p className="text-xl text-gray-600 dark:text-gray-400 text-center font-semibold">
                {triathlons.length}{' '}
                {triathlons.length === 1
                  ? t('yearInReview.epicMultiSport')
                  : t('yearInReview.epicMultiSportPlural')}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {triathlons.map((highlight) => (
                <RaceCard
                  key={highlight.id}
                  highlight={highlight}
                  onActivityClick={onActivityClick}
                />
              ))}
            </div>
          </div>
        )}

        {/* Sport Detail Sections */}
        {sportHighlights.running && (
          <SportDetailSection
            sectionId="running"
            highlights={sportHighlights.running}
            customHighlights={runningCustomHighlights}
            onActivityClick={onActivityClick}
          />
        )}
        {sportHighlights.cycling && (
          <SportDetailSection
            sectionId="cycling"
            highlights={sportHighlights.cycling}
            customHighlights={cyclingCustomHighlights}
            onActivityClick={onActivityClick}
          />
        )}
        {sportHighlights.swimming && (
          <SportDetailSection
            sectionId="swimming"
            highlights={sportHighlights.swimming}
            customHighlights={swimmingCustomHighlights}
            onActivityClick={onActivityClick}
          />
        )}

        {/* Other Achievements */}
        {(longRuns.length > 0 || fondos.length > 0) && (
          <div id="custom-highlights" className="container mx-auto px-6 py-16 md:py-20">
            <div className="mb-12">
              <div className="flex items-center justify-center gap-4 mb-4 flex-wrap">
                <div className="text-5xl">🌟</div>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white whitespace-nowrap">
                  {t('yearInReview.otherAchievements')}
                </h2>
              </div>
              <div className="h-1.5 w-24 sm:w-32 bg-gradient-to-r from-yellow-500 to-orange-600 mx-auto rounded-full mb-4 sm:mb-6"></div>
              <p className="text-xl text-gray-600 dark:text-gray-400 text-center font-semibold">
                {t('yearInReview.morePerformances')}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {[...longRuns, ...fondos].map((highlight) => (
                <RaceCard
                  key={highlight.id}
                  highlight={highlight}
                  onActivityClick={onActivityClick}
                />
              ))}
            </div>
          </div>
        )}

        {/* Footer Message */}
        <div
          id="closing"
          className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-gray-900 dark:via-black dark:to-gray-900 text-white py-20 md:py-24 mt-16"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-20" />
          <div className="container mx-auto px-6 text-center relative">
            <div className="inline-block mb-8">
              <div className="text-7xl mb-6">🎉</div>
              <h2 className="text-4xl md:text-5xl font-black mb-6 drop-shadow-2xl">
                {t('yearInReview.epicYear')}
              </h2>
              <div className="h-1.5 w-32 bg-gradient-to-r from-transparent via-white to-transparent mx-auto rounded-full mb-8"></div>
            </div>

            <div className="bg-white/15 backdrop-blur-lg rounded-3xl p-8 md:p-10 border border-white/20 shadow-2xl max-w-4xl mx-auto">
              <p className="text-2xl md:text-3xl font-light leading-relaxed mb-4">
                {t('yearInReview.crushedDistance')}{' '}
                <span className="font-black">
                  {formatDistanceForClosing(stats.totalDistanceKm * 1000)}
                </span>{' '}
                {t('yearInReview.across')}{' '}
                <span className="font-black">
                  {stats.activityCount} {t('stats.activities').toLowerCase()}
                </span>
                , {t('yearInReview.dedicating')}{' '}
                <span className="font-black">
                  {Math.round(stats.totalTimeHours)} {t('units.hours')}
                </span>{' '}
                {t('yearInReview.toYourPassion')}.
              </p>
              <p className="text-xl md:text-2xl font-light">
                {t('yearInReview.closingMessage')}
                {year === 'last365' ? (
                  ` ${t('yearInReview.closingMessageAhead')}`
                ) : (
                  <span className="font-black text-3xl">
                    {' '}
                    {t('yearInReview.closingMessageYear', { year: year + 1 })}
                  </span>
                )}
                ! 🚀
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
          initialSelectedStats={selectedStats}
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
          initialSelectedActivities={selectedActivities}
          initialSelectedHighlights={selectedHighlights}
          onConfirm={handleActivitiesSelected}
          onBack={handleBackToStats}
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
          onBack={handleBackToActivities}
          onClose={() => setShowSocialCard(false)}
        />
      )}

      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={handleAdvancedExport}
        availableSections={availableSections}
        isExporting={isAdvancedExporting}
        exportProgress={advancedProgress}
      />
    </>
  );
}
