import type {
  Activity,
  YearStats,
  MonthlyStats,
  TypeStats,
  DayOfWeekStats,
  HourDayHeatmapCell,
  MostActiveDay,
  PreferredTrainingTime,
} from '../types/activity.ts';
import type { ActivityType } from '../types/strava.ts';

// DRY: Aggregate activities into statistics
export const aggregateYearStats = (activities: Activity[], year: number): YearStats => {
  const yearActivities = activities.filter((a) => a.date.getFullYear() === year);

  const byMonth = aggregateByMonth(yearActivities);
  const byType = aggregateByType(yearActivities);
  const byDayOfWeek = aggregateByDayOfWeek(yearActivities);
  const hourDayHeatmap = aggregateByHourAndDay(yearActivities);
  const mostActiveDay = getMostActiveDay(byDayOfWeek);
  const preferredTrainingTime = getPreferredTrainingTime(yearActivities);

  const totalDistanceKm = yearActivities.reduce((sum, a) => sum + a.distanceKm, 0);
  const totalElevationMeters = yearActivities.reduce((sum, a) => sum + a.elevationGainMeters, 0);
  const totalTimeHours = yearActivities.reduce((sum, a) => sum + a.durationMinutes, 0) / 60;
  const totalKudos = yearActivities.reduce((sum, a) => sum + (a.kudosCount || 0), 0);

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
    totalKudos,
    byMonth,
    byType,
    byDayOfWeek,
    hourDayHeatmap,
    mostActiveDay,
    preferredTrainingTime,
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

// Aggregate activities by day of week (Monday-first)
export const aggregateByDayOfWeek = (activities: Activity[]): DayOfWeekStats[] => {
  // Translation keys for day names (Monday = 0, Sunday = 6)
  const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayData: Record<number, DayOfWeekStats> = {};

  activities.forEach((activity) => {
    // Convert JS getDay() (0=Sunday) to Monday-first (0=Monday)
    const jsDayOfWeek = activity.date.getDay();
    const dayOfWeek = jsDayOfWeek === 0 ? 6 : jsDayOfWeek - 1; // Monday=0, Sunday=6

    if (!dayData[dayOfWeek]) {
      dayData[dayOfWeek] = {
        dayOfWeek,
        dayName: dayNames[dayOfWeek],
        distanceKm: 0,
        timeHours: 0,
        activityCount: 0,
        averageDistance: 0,
        averageTime: 0,
      };
    }

    dayData[dayOfWeek].distanceKm += activity.distanceKm;
    dayData[dayOfWeek].timeHours += activity.durationMinutes / 60;
    dayData[dayOfWeek].activityCount++;
  });

  // Calculate averages and return all 7 days
  return dayNames.map((dayName, index) => {
    const data = dayData[index] || {
      dayOfWeek: index,
      dayName,
      distanceKm: 0,
      timeHours: 0,
      activityCount: 0,
      averageDistance: 0,
      averageTime: 0,
    };

    if (data.activityCount > 0) {
      data.averageDistance = data.distanceKm / data.activityCount;
      data.averageTime = data.timeHours / data.activityCount;
    }

    return data;
  });
};

// Aggregate activities by hour and day for heatmap
export const aggregateByHourAndDay = (activities: Activity[]): Map<string, HourDayHeatmapCell> => {
  const heatmapData = new Map<string, HourDayHeatmapCell>();

  activities.forEach((activity) => {
    const day = activity.date.getDay();
    const hour = activity.date.getHours();
    const key = `${day}-${hour}`;

    if (!heatmapData.has(key)) {
      heatmapData.set(key, {
        day,
        hour,
        activityCount: 0,
        distanceKm: 0,
        timeHours: 0,
        activities: [],
      });
    }

    const cell = heatmapData.get(key)!;
    cell.activityCount++;
    cell.distanceKm += activity.distanceKm;
    cell.timeHours += activity.durationMinutes / 60;
    cell.activities.push(activity);
  });

  return heatmapData;
};

// Get most active day
export const getMostActiveDay = (dayOfWeekStats: DayOfWeekStats[]): MostActiveDay | undefined => {
  if (dayOfWeekStats.length === 0) return undefined;

  // Find day with highest total time (best indicator of training volume)
  const mostActive = dayOfWeekStats.reduce((max, current) =>
    current.timeHours > max.timeHours ? current : max
  );

  if (mostActive.activityCount === 0) return undefined;

  return {
    dayName: mostActive.dayName,
    activityCount: mostActive.activityCount,
    distanceKm: mostActive.distanceKm,
    timeHours: mostActive.timeHours,
  };
};

// Get preferred training time
export const getPreferredTrainingTime = (
  activities: Activity[]
): PreferredTrainingTime | undefined => {
  if (activities.length === 0) return undefined;

  const timeBlocks = [
    { name: 'earlyMorning', start: 5, end: 9 },
    { name: 'morning', start: 9, end: 12 },
    { name: 'afternoon', start: 12, end: 17 },
    { name: 'evening', start: 17, end: 21 },
    { name: 'night', start: 21, end: 5 },
  ];

  const timeData: Record<string, { count: number; block: (typeof timeBlocks)[number] }> = {};

  activities.forEach((activity) => {
    const hour = activity.date.getHours();

    const block = timeBlocks.find((b) => {
      if (b.start < b.end) {
        return hour >= b.start && hour < b.end;
      } else {
        // Night block wraps around midnight
        return hour >= b.start || hour < b.end;
      }
    });

    if (block) {
      if (!timeData[block.name]) {
        timeData[block.name] = { count: 0, block };
      }
      timeData[block.name].count++;
    }
  });

  // Find time block with most activities
  const entries = Object.values(timeData);
  if (entries.length === 0) return undefined;

  const preferred = entries.reduce((max, current) => (current.count > max.count ? current : max));

  return {
    timeBlock: preferred.block.name,
    startHour: preferred.block.start,
    endHour: preferred.block.end,
    activityCount: preferred.count,
  };
};
