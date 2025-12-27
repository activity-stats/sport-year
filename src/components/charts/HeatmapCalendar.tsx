import { useMemo } from 'react';
import type { Activity } from '../../types/activity';

interface HeatmapCalendarProps {
  year: number | 'last365';
  activities: Activity[];
}

interface DayData {
  date: Date;
  distanceKm: number;
  timeMinutes: number;
  activityCount: number;
  activities: Activity[];
}

export function HeatmapCalendar({ year, activities }: HeatmapCalendarProps) {
  // Calculate daily totals
  const dailyData = useMemo(() => {
    const days = new Map<string, DayData>();

    // Initialize all days based on year type
    let startDate: Date;
    let endDate: Date;

    if (year === 'last365') {
      // Last 365 days from today
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 365);
    } else {
      // Specific calendar year
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31);
    }

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0];
      days.set(key, {
        date: new Date(d),
        distanceKm: 0,
        timeMinutes: 0,
        activityCount: 0,
        activities: [],
      });
    }

    // Aggregate activities by day
    activities.forEach((activity) => {
      const key = activity.date.toISOString().split('T')[0];
      const dayData = days.get(key);
      if (dayData) {
        dayData.distanceKm += activity.distanceKm;
        dayData.timeMinutes += activity.movingTimeMinutes;
        dayData.activityCount += 1;
        dayData.activities.push(activity);
      }
    });

    return days;
  }, [year, activities]);

  // Organize days into weeks (starting Monday)
  const weeks = useMemo(() => {
    const weekArray: DayData[][] = [];
    let startDate: Date;
    let endDate: Date;

    if (year === 'last365') {
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 365);
    } else {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31);
    }

    // Find the Monday of the week containing Jan 1
    const currentDate = new Date(startDate);
    const dayOfWeek = currentDate.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    currentDate.setDate(currentDate.getDate() + daysToMonday);

    let week: DayData[] = [];

    // Iterate through all days from start to end
    while (currentDate <= endDate || week.length > 0) {
      const key = currentDate.toISOString().split('T')[0];
      const dayData = dailyData.get(key);

      if (dayData) {
        week.push(dayData);
      } else {
        // Day outside the year - add empty placeholder
        week.push({
          date: new Date(currentDate),
          distanceKm: 0,
          timeMinutes: 0,
          activityCount: 0,
          activities: [],
        });
      }

      // If week is complete (7 days), add to weeks array
      if (week.length === 7) {
        weekArray.push(week);
        week = [];
      }

      currentDate.setDate(currentDate.getDate() + 1);

      // Stop after end of period + completing current week
      if (currentDate > endDate) {
        // Add any remaining days to complete the week
        const nextWeek = new Date(endDate);
        nextWeek.setDate(nextWeek.getDate() + 7);
        if (currentDate > nextWeek) break;
      }
    }

    return weekArray;
  }, [year, dailyData]);

  // Calculate intensity levels (0-4) based on time
  const getIntensity = (timeMinutes: number): number => {
    if (timeMinutes === 0) return 0;
    if (timeMinutes < 45) return 1;
    if (timeMinutes < 90) return 2;
    if (timeMinutes < 150) return 3;
    return 4;
  };

  const getColorClass = (intensity: number): string => {
    switch (intensity) {
      case 0:
        return 'bg-gray-100 border-gray-200';
      case 1:
        return 'bg-emerald-200 border-emerald-300';
      case 2:
        return 'bg-emerald-400 border-emerald-500';
      case 3:
        return 'bg-emerald-600 border-emerald-700';
      case 4:
        return 'bg-emerald-800 border-emerald-900';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="flex gap-1">
            {/* Day labels */}
            <div className="flex flex-col gap-1 pr-2">
              <div className="h-3"></div>
              {daysOfWeek.map((day, i) => (
                <div
                  key={day}
                  className="h-3 text-xs text-gray-600 dark:text-gray-400 flex items-center"
                  style={{ lineHeight: '12px' }}
                >
                  {i % 2 === 0 ? day : ''}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            <div className="flex gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {/* Month label */}
                  <div className="h-3 text-xs text-gray-600 dark:text-gray-400">
                    {week[0] && week[0].date.getDate() <= 7
                      ? week[0].date.toLocaleDateString('en-US', { month: 'short' })
                      : ''}
                  </div>
                  {week.map((day, dayIndex) => {
                    const intensity = getIntensity(day.timeMinutes);
                    // For last365, all days in range are considered "in period"
                    const isInPeriod =
                      year === 'last365'
                        ? true
                        : day.date >= new Date(year, 0, 1) && day.date <= new Date(year, 11, 31);

                    const formatTime = (minutes: number) => {
                      if (minutes < 60) return `${Math.round(minutes)}min`;
                      const hours = Math.floor(minutes / 60);
                      const mins = Math.round(minutes % 60);
                      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
                    };

                    return (
                      <div
                        key={dayIndex}
                        className={`w-3 h-3 border rounded-sm transition-all hover:scale-125 hover:shadow-md cursor-pointer ${
                          isInPeriod
                            ? getColorClass(intensity)
                            : 'bg-transparent border-transparent'
                        }`}
                        title={
                          isInPeriod && day.activityCount > 0
                            ? `${formatDate(day.date)}: ${formatTime(day.timeMinutes)} • ${day.activityCount} ${
                                day.activityCount === 1 ? 'activity' : 'activities'
                              } • ${day.distanceKm.toFixed(1)} km`
                            : isInPeriod
                              ? `${formatDate(day.date)}: Rest day`
                              : ''
                        }
                      ></div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-4 text-xs text-gray-600 dark:text-gray-400">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`w-3 h-3 border rounded-sm ${getColorClass(level)}`}
              ></div>
            ))}
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
