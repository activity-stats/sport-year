import { useMemo, useRef, useState } from 'react';
import type { Activity, YearStats } from '../../types';
import type { StravaAthlete } from '../../types/strava';
import { detectRaceHighlights, type RaceHighlight } from '../../utils/raceDetection';
import { formatDistanceWithUnit, formatDuration } from '../../utils/formatters';
import { calculateSportHighlights, type SportHighlights } from '../../utils/sportHighlights';
import { filterActivities } from '../../utils/activityFilters';
import type { ActivityType } from '../../types';
import type { TitlePattern, StatType } from '../../stores/settingsStore';
import { ActivitySelector } from './ActivitySelector';
import { SocialCard } from './SocialCard';

interface HighlightFilters {
  backgroundImageUrl: string | null;
  excludedActivityTypes: ActivityType[];
  excludeVirtualPerSport: {
    cycling: { highlights: boolean; stats: boolean };
    running: { highlights: boolean; stats: boolean };
    swimming: { highlights: boolean; stats: boolean };
  };
  titleIgnorePatterns: TitlePattern[];
  highlightStats: StatType[];
}

interface YearInReviewProps {
  year: number;
  stats: YearStats;
  activities: Activity[];
  athlete: StravaAthlete | null;
  highlightFilters: HighlightFilters;
  backgroundImageUrl?: string | null;
}

function SportDetailSection({ highlights }: { highlights: SportHighlights }) {
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
          <h2 className="text-4xl md:text-5xl font-black text-gray-900">
            {config.title} Highlights
          </h2>
        </div>
        <div
          className={`h-1.5 w-32 bg-gradient-to-r ${config.gradient} mx-auto rounded-full mb-6`}
        ></div>

        {/* Overview stats */}
        <div className="flex flex-wrap justify-center gap-6 text-lg text-gray-600">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">
              {formatDistanceWithUnit(highlights.totalDistance * 1000)}
            </span>
            <span>total</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">{config.paceLabel}:</span>
            <span>
              {formatPace(paceValue)} {config.paceUnit}
            </span>
          </div>
          {highlights.totalElevation > 100 && (
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900">
                ⛰️ {Math.round(highlights.totalElevation).toLocaleString('de-DE')}m
              </span>
              <span>elevation</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Distance records */}
        {highlights.distanceRecords.map((record) => (
          <div
            key={record.distance}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow"
          >
            <div
              className={`inline-block px-3 py-1 rounded-full bg-gradient-to-r ${config.gradient} text-white text-sm font-bold mb-3`}
            >
              {record.distance}
            </div>
            <h4 className="font-bold text-gray-900 mb-2 line-clamp-1">{record.activity.name}</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Time</span>
                <span className="font-bold text-gray-900">
                  {formatDuration(record.activity.movingTimeMinutes * 60)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{config.paceLabel}</span>
                <span className="font-bold text-gray-900">
                  {formatPace(record.pace || record.speed || 0)} {config.paceUnit}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>
                  {record.activity.date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <span>{formatDistanceWithUnit(record.activity.distanceKm * 1000)}</span>
              </div>
            </div>
          </div>
        ))}

        {/* Longest activity */}
        <div
          className={`bg-gradient-to-br ${config.gradient} rounded-2xl shadow-lg p-6 text-white hover:shadow-xl transition-shadow`}
        >
          <div className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-sm font-bold mb-3">
            🏆 Longest
          </div>
          <h4 className="font-bold mb-2 line-clamp-1">{highlights.longestActivity.name}</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/80">Distance</span>
              <span className="font-bold">
                {formatDistanceWithUnit(highlights.longestActivity.distanceKm * 1000)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/80">Time</span>
              <span className="font-bold">
                {formatDuration(highlights.longestActivity.movingTimeMinutes * 60)}
              </span>
            </div>
            {highlights.longestActivity.elevationGainMeters &&
              highlights.longestActivity.elevationGainMeters > 50 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/80">Elevation</span>
                  <span className="font-bold">
                    ⛰️ {Math.round(highlights.longestActivity.elevationGainMeters)}m
                  </span>
                </div>
              )}
            <div className="text-xs text-white/70 mt-2">
              {highlights.longestActivity.date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </div>
        </div>
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
      className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 block"
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
          <span className="text-sm text-gray-500 font-semibold bg-gray-100 px-3 py-1 rounded-full">
            {formattedDate}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-black text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem] group-hover:text-blue-600 transition-colors">
          {highlight.name}
        </h3>

        {/* Badge label */}
        <p className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 mb-5">
          {highlight.badge}
        </p>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
            <div className="text-xs text-gray-600 font-bold uppercase tracking-wider mb-1">
              Distance
            </div>
            <div className="text-2xl font-black text-gray-900">
              {formatDistanceWithUnit(highlight.distance * 1000)}
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
            <div className="text-xs text-gray-600 font-bold uppercase tracking-wider mb-1">
              Time
            </div>
            <div className="text-2xl font-black text-gray-900">
              {formatDuration(highlight.duration * 60)}
            </div>
          </div>
        </div>

        {/* Activity splits for triathlons */}
        {highlight.activities && highlight.activities.length > 1 && (
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="text-xs text-gray-600 font-bold uppercase tracking-wider mb-3">
              Splits
            </div>
            <div className="flex justify-between gap-2">
              {highlight.activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex flex-col items-center bg-white px-3 py-2 rounded-lg shadow-sm flex-1"
                >
                  <span className="text-2xl mb-1">
                    {activity.type === 'Swim' ? '🏊' : activity.type.includes('Ride') ? '🚴' : '🏃'}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
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

export function YearInReview({
  year,
  stats,
  activities,
  athlete,
  highlightFilters,
  backgroundImageUrl,
}: YearInReviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showActivitySelector, setShowActivitySelector] = useState(false);
  const [showSocialCard, setShowSocialCard] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<Activity[]>([]);
  const [selectedHighlights, setSelectedHighlights] = useState<RaceHighlight[]>([]);

  // Filter activities only for highlights
  const filteredActivities = useMemo(
    () => filterActivities(activities, highlightFilters),
    [activities, highlightFilters]
  );

  const highlights = useMemo(() => detectRaceHighlights(filteredActivities), [filteredActivities]);
  const sportHighlights = useMemo(
    () => calculateSportHighlights(filteredActivities),
    [filteredActivities]
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
    const avgSpeed = stats.totalTimeHours > 0 ? (stats.totalDistanceKm / stats.totalTimeHours) : 0;

    return {
      avgHeartRate,
      maxSpeed,
      avgSpeed,
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
            label: 'Distance (km)',
            colorClass: 'hover:shadow-pink-500/50',
          });
          break;
        case 'elevation':
          cards.push({
            value: Math.round(stats.totalElevationMeters).toLocaleString('de-DE'),
            label: 'Climbing (m)',
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
  const longRuns = highlights.filter((h) => h.type === 'long-run');
  const centuryRides = highlights.filter((h) => h.type === 'long-ride');

  // Get sport breakdowns
  const cycling = activities.filter((a) => ['Ride', 'VirtualRide'].includes(a.type));
  const running = activities.filter((a) => a.type === 'Run');
  const swimming = activities.filter((a) => a.type === 'Swim');

  const cyclingDistance = cycling.reduce((sum, a) => sum + a.distanceKm, 0);
  const runningDistance = running.reduce((sum, a) => sum + a.distanceKm, 0);
  const swimmingDistance = swimming.reduce((sum, a) => sum + a.distanceKm, 0);

  return (
    <>
      <div
        ref={containerRef}
        className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"
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
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white">
          {/* Background image or pattern */}
          {backgroundImageUrl ? (
            <>
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${backgroundImageUrl})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/70 via-indigo-700/70 to-purple-800/70" />
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
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-slate-50 to-transparent"></div>
        </div>

        {/* Sport Breakdown Section */}
        <div className="container mx-auto px-6 py-16 md:py-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Sport Breakdown</h2>
            <div className="h-1.5 w-24 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mx-auto rounded-full"></div>
          </div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {/* Cycling Card */}
            <div className="group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden hover:-translate-y-2 border border-gray-100">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-600 opacity-90 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative p-8 text-white">
                <div className="text-7xl mb-6 transform group-hover:scale-110 transition-transform duration-300">
                  🚴
                </div>
                <h3 className="text-3xl font-black mb-3 tracking-tight">Cycling</h3>
                <div className="text-5xl font-black mb-4 tracking-tight">
                  {formatDistanceWithUnit(cyclingDistance * 1000)}
                </div>
              </div>
            </div>

            {/* Running Card */}
            <div className="group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden hover:-translate-y-2 border border-gray-100">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-600 opacity-90 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative p-8 text-white">
                <div className="text-7xl mb-6 transform group-hover:scale-110 transition-transform duration-300">
                  🏃
                </div>
                <h3 className="text-3xl font-black mb-3 tracking-tight">Running</h3>
                <div className="text-5xl font-black mb-4 tracking-tight">
                  {formatDistanceWithUnit(runningDistance * 1000)}
                </div>
              </div>
            </div>

            {/* Swimming Card */}
            <div className="group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden hover:-translate-y-2 border border-gray-100">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-blue-600 opacity-90 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative p-8 text-white">
                <div className="text-7xl mb-6 transform group-hover:scale-110 transition-transform duration-300">
                  🏊
                </div>
                <h3 className="text-3xl font-black mb-3 tracking-tight">Swimming</h3>
                <div className="text-5xl font-black mb-4 tracking-tight">
                  {formatDistanceWithUnit(swimmingDistance * 1000)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sport Detail Sections */}
        {sportHighlights.running && <SportDetailSection highlights={sportHighlights.running} />}
        {sportHighlights.cycling && <SportDetailSection highlights={sportHighlights.cycling} />}
        {sportHighlights.swimming && <SportDetailSection highlights={sportHighlights.swimming} />}

        {/* Race Highlights */}
        {triathlons.length > 0 && (
          <div className="container mx-auto px-6 py-16 md:py-20">
            <div className="mb-12">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="text-5xl">🏊🚴🏃</div>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900">Triathlons</h2>
              </div>
              <p className="text-xl text-gray-600 text-center font-semibold mb-4">
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
        {(longRuns.length > 0 || centuryRides.length > 0) && (
          <div className="container mx-auto px-6 py-16 md:py-20">
            <div className="mb-12">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="text-5xl">🌟</div>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900">
                  Other Achievements
                </h2>
              </div>
              <p className="text-xl text-gray-600 text-center font-semibold mb-4">
                Even more incredible performances
              </p>
              <div className="h-1.5 w-32 bg-gradient-to-r from-yellow-500 to-orange-600 mx-auto rounded-full"></div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {[...longRuns, ...centuryRides].map((highlight) => (
                <RaceCard key={highlight.id} highlight={highlight} />
              ))}
            </div>
          </div>
        )}

        {/* Footer Message */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white py-20 md:py-24 mt-16">
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
