import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { MonthlyStats, Activity } from '../../types/activity.ts';
import type { ActivityType } from '../../types';

interface MonthlyChartProps {
  data: MonthlyStats[];
  activities?: Activity[];
}

type MetricType = 'distance' | 'time' | 'elevation' | 'activities';
type ViewMode = 'month' | 'week';

export const MonthlyChart = ({ data, activities }: MonthlyChartProps) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('time');
  const [selectedSport, setSelectedSport] = useState<ActivityType | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  // Get unique sport types from activities
  const availableSports = useMemo(() => {
    if (!activities) return [];
    const types = new Set<ActivityType>();
    activities.forEach((a) => types.add(a.type));
    return Array.from(types).sort();
  }, [activities]);

  // Helper function to get ISO week number
  const getWeekNumber = (date: Date): number => {
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
    }
    return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  };

  // Calculate weekly stats filtered by sport
  const weeklyChartData = useMemo(() => {
    if (!activities) return [];

    const filteredActivities =
      selectedSport === 'all' ? activities : activities.filter((a) => a.type === selectedSport);

    const weeklyTotals = new Map<
      number,
      {
        week: number;
        distanceKm: number;
        timeHours: number;
        elevationMeters: number;
        activityCount: number;
      }
    >();

    filteredActivities.forEach((activity) => {
      const weekNum = getWeekNumber(activity.date);
      if (!weeklyTotals.has(weekNum)) {
        weeklyTotals.set(weekNum, {
          week: weekNum,
          distanceKm: 0,
          timeHours: 0,
          elevationMeters: 0,
          activityCount: 0,
        });
      }
      const weekData = weeklyTotals.get(weekNum)!;
      weekData.distanceKm += activity.distanceKm;
      weekData.timeHours += activity.movingTimeMinutes / 60;
      weekData.elevationMeters += activity.elevationGainMeters || 0;
      weekData.activityCount += 1;
    });

    return Array.from(weeklyTotals.values())
      .sort((a, b) => a.week - b.week)
      .map((week) => ({
        name: `W${week.week}`,
        distance: Math.round(week.distanceKm),
        time: Math.round(week.timeHours * 10) / 10,
        elevation: Math.round(week.elevationMeters),
        activities: week.activityCount,
      }));
  }, [activities, selectedSport]);

  // Calculate monthly stats filtered by sport
  const filteredChartData = useMemo(() => {
    if (!activities || selectedSport === 'all') {
      return data.map((month) => ({
        name: month.monthName.slice(0, 3),
        distance: Math.round(month.distanceKm),
        time: Math.round(month.timeHours * 10) / 10,
        elevation: Math.round(month.elevationMeters),
        activities: month.activityCount,
      }));
    }

    // Filter activities by selected sport and calculate monthly totals
    const monthlyTotals = Array.from({ length: 12 }, (_, i) => ({
      month: i,
      monthName: new Date(2000, i).toLocaleString('en-US', { month: 'long' }),
      distanceKm: 0,
      timeHours: 0,
      elevationMeters: 0,
      activityCount: 0,
    }));

    activities
      .filter((a) => a.type === selectedSport)
      .forEach((activity) => {
        const month = activity.date.getMonth();
        monthlyTotals[month].distanceKm += activity.distanceKm;
        monthlyTotals[month].timeHours += activity.movingTimeMinutes / 60;
        monthlyTotals[month].elevationMeters += activity.elevationGainMeters || 0;
        monthlyTotals[month].activityCount += 1;
      });

    return monthlyTotals.map((month) => ({
      name: month.monthName.slice(0, 3),
      distance: Math.round(month.distanceKm),
      time: Math.round(month.timeHours * 10) / 10,
      elevation: Math.round(month.elevationMeters),
      activities: month.activityCount,
    }));
  }, [data, activities, selectedSport]);

  const chartData = viewMode === 'month' ? filteredChartData : weeklyChartData;

  const metrics = {
    distance: { key: 'distance', label: 'Distance', unit: 'km', color: '#3b82f6' },
    time: { key: 'time', label: 'Time', unit: 'hours', color: '#8b5cf6' },
    elevation: { key: 'elevation', label: 'Elevation', unit: 'm', color: '#f59e0b' },
    activities: { key: 'activities', label: 'Activities', unit: 'count', color: '#10b981' },
  };

  const currentMetric = metrics[selectedMetric];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {viewMode === 'month' ? 'Monthly' : 'Weekly'} Trends
          </h3>
          <div className="flex gap-2">
            {(Object.keys(metrics) as MetricType[]).map((metric) => (
              <button
                key={metric}
                onClick={() => setSelectedMetric(metric)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  selectedMetric === metric
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {metrics[metric].label}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">View:</span>
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              viewMode === 'month'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              viewMode === 'week'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Week
          </button>
        </div>

        {/* Sport Filter */}
        {activities && availableSports.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700">Sport:</span>
            <button
              onClick={() => setSelectedSport('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                selectedSport === 'all'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Sports
            </button>
            {availableSports.map((sport) => (
              <button
                key={sport}
                onClick={() => setSelectedSport(sport)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  selectedSport === sport
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {sport}
              </button>
            ))}
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '14px', fontWeight: 500 }} />
          <YAxis stroke="#6b7280" style={{ fontSize: '14px', fontWeight: 500 }} />
          <Tooltip
            formatter={(value: number | undefined) => {
              if (value === undefined) return ['', ''];
              return [`${value} ${currentMetric.unit}`, currentMetric.label];
            }}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          />
          <Legend formatter={() => `${currentMetric.label} (${currentMetric.unit})`} />
          <Bar
            dataKey={currentMetric.key}
            fill={currentMetric.color}
            name={currentMetric.label}
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
