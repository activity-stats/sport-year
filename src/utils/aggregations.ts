import type { Activity, YearStats, MonthlyStats, TypeStats } from '../types/activity.ts';
import type { ActivityType } from '../types/strava.ts';

// DRY: Aggregate activities into statistics
export const aggregateYearStats = (activities: Activity[], year: number): YearStats => {
  const yearActivities = activities.filter((a) => a.date.getFullYear() === year);

  const byMonth = aggregateByMonth(yearActivities);
  const byType = aggregateByType(yearActivities);

  const totalDistanceKm = yearActivities.reduce((sum, a) => sum + a.distanceKm, 0);
  const totalElevationMeters = yearActivities.reduce((sum, a) => sum + a.elevationGainMeters, 0);
  const totalTimeHours = yearActivities.reduce((sum, a) => sum + a.durationMinutes, 0) / 60;

  const longestActivity = yearActivities.reduce(
    (longest, current) => (current.distanceKm > (longest?.distanceKm ?? 0) ? current : longest),
    undefined as Activity | undefined
  );

  const highestElevation = yearActivities.reduce(
    (highest, current) =>
      current.elevationGainMeters > (highest?.elevationGainMeters ?? 0) ? current : highest,
    undefined as Activity | undefined
  );

  return {
    year,
    totalDistanceKm,
    totalElevationMeters,
    totalTimeHours,
    activityCount: yearActivities.length,
    byMonth,
    byType,
    longestActivity,
    highestElevation,
  };
};

const aggregateByMonth = (activities: Activity[]): MonthlyStats[] => {
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const monthlyData: Record<number, MonthlyStats> = {};

  activities.forEach((activity) => {
    const month = activity.date.getMonth();

    if (!monthlyData[month]) {
      monthlyData[month] = {
        month,
        monthName: monthNames[month],
        distanceKm: 0,
        elevationMeters: 0,
        timeHours: 0,
        activityCount: 0,
      };
    }

    monthlyData[month].distanceKm += activity.distanceKm;
    monthlyData[month].elevationMeters += activity.elevationGainMeters;
    monthlyData[month].timeHours += activity.durationMinutes / 60;
    monthlyData[month].activityCount++;
  });

  // Return all 12 months, filling missing months with zeros
  return monthNames.map(
    (monthName, index) =>
      monthlyData[index] || {
        month: index,
        monthName,
        distanceKm: 0,
        elevationMeters: 0,
        timeHours: 0,
        activityCount: 0,
      }
  );
};

const aggregateByType = (activities: Activity[]): Record<ActivityType, TypeStats> => {
  const typeData: Partial<Record<ActivityType, TypeStats>> = {};

  activities.forEach((activity) => {
    if (!typeData[activity.type]) {
      typeData[activity.type] = {
        count: 0,
        distanceKm: 0,
        elevationMeters: 0,
        timeHours: 0,
      };
    }

    const stats = typeData[activity.type]!;
    stats.count++;
    stats.distanceKm += activity.distanceKm;
    stats.elevationMeters += activity.elevationGainMeters;
    stats.timeHours += activity.durationMinutes / 60;
  });

  return typeData as Record<ActivityType, TypeStats>;
};
