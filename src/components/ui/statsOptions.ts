import type { YearStats } from '../../types';

export type StatOption = {
  id: string;
  label: string;
  icon: string;
  getValue: (stats: YearStats, daysActive: number) => string;
};

export const availableStats: StatOption[] = [
  {
    id: 'distance',
    label: 'km Distance',
    icon: '🏃',
    getValue: (stats) => `${Math.round(stats.totalDistanceKm).toLocaleString('de-DE')} km`,
  },
  {
    id: 'elevation',
    label: 'm Elevation',
    icon: '⛰️',
    getValue: (stats) => `${Math.round(stats.totalElevationMeters).toLocaleString('de-DE')} m`,
  },
  {
    id: 'time',
    label: 'Hours Time',
    icon: '⏱️',
    getValue: (stats) => {
      const hours = Math.round(stats.totalTimeHours);
      return `${hours.toLocaleString('de-DE')} h`;
    },
  },
  {
    id: 'activities',
    label: 'Activities',
    icon: '🎯',
    getValue: (stats) => `${stats.activityCount.toLocaleString('de-DE')}`,
  },
  {
    id: 'avg-speed',
    label: 'km/h Speed',
    icon: '⚡',
    getValue: (stats) => {
      if (!stats.totalDistanceKm || !stats.totalTimeHours) return '0 km/h';
      const avgSpeed = stats.totalDistanceKm / stats.totalTimeHours;
      return `${avgSpeed.toFixed(1)} km/h`;
    },
  },
  {
    id: 'days-active',
    label: 'Days Active',
    icon: '📅',
    getValue: (_, daysActive) => `${daysActive.toLocaleString('de-DE')}`,
  },
  {
    id: 'longest-activity',
    label: 'km Longest',
    icon: '🏆',
    getValue: (stats) => {
      if (!stats.longestActivity) return '0 km';
      return `${stats.longestActivity.distanceKm.toFixed(1)} km`;
    },
  },
  {
    id: 'biggest-climb',
    label: 'm Climb',
    icon: '🗻',
    getValue: (stats) => {
      if (!stats.highestElevation) return '0 m';
      return `${Math.round(stats.highestElevation.elevationGainMeters).toLocaleString('de-DE')} m`;
    },
  },
];
