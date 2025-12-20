// DRY: Reusable formatters for consistent display across the app

export const formatDistance = (meters: number): string => {
  const km = meters / 1000;
  return km < 10 ? km.toFixed(2) : km.toFixed(1);
};

export const formatDistanceWithUnit = (meters: number): string => {
  return `${formatDistance(meters)} km`;
};

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
};

export const formatPace = (
  metersPerSecond: number,
  type: 'Run' | 'Ride' | 'Swim' | string
): string => {
  if (type === 'Run' || type === 'Swim') {
    // min/km for running and swimming
    const secondsPerKm = 1000 / metersPerSecond;
    const minutes = Math.floor(secondsPerKm / 60);
    const seconds = Math.floor(secondsPerKm % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')} /km`;
  } else {
    // km/h for cycling and others
    const kmh = (metersPerSecond * 3.6).toFixed(1);
    return `${kmh} km/h`;
  }
};

export const formatElevation = (meters: number): string => {
  return `${Math.round(meters)} m`;
};

export const formatHeartRate = (bpm?: number): string => {
  return bpm ? `${Math.round(bpm)} bpm` : 'N/A';
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};
