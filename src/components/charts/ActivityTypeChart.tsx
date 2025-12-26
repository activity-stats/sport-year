import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { ActivityType } from '../../types/strava.ts';
import type { TypeStats } from '../../types/activity.ts';

interface ActivityTypeChartProps {
  data: Record<ActivityType, TypeStats>;
}

const COLORS: Record<string, string> = {
  Run: '#ef4444',
  Ride: '#3b82f6',
  Swim: '#06b6d4',
  VirtualRide: '#8b5cf6',
  Walk: '#84cc16',
  Hike: '#f59e0b',
};

type MetricType = 'distance' | 'time' | 'count';

export const ActivityTypeChart = ({ data }: ActivityTypeChartProps) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('distance');

  const getChartData = () => {
    return Object.entries(data)
      .filter(([_, stats]) => stats.count > 0)
      .map(([type, stats]) => ({
        name: type,
        distance: Math.round(stats.distanceKm),
        time: Math.round(stats.timeHours * 10) / 10,
        count: stats.count,
      }))
      .sort((a, b) => b[selectedMetric] - a[selectedMetric]);
  };

  const chartData = getChartData();

  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activity Types</h3>
        <p className="text-gray-600 dark:text-gray-400">No activities yet</p>
      </div>
    );
  }

  const metrics = {
    distance: { label: 'Distance', unit: 'km' },
    time: { label: 'Time', unit: 'hours' },
    count: { label: 'Count', unit: 'activities' },
  };

  const currentMetric = metrics[selectedMetric];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">By Activity Type</h3>
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
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey={selectedMetric}
            strokeWidth={2}
            stroke="#fff"
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name] || '#6b7280'} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number | undefined, name: string | undefined) => {
              if (value === undefined) return ['', ''];
              return [`${value} ${currentMetric.unit}`, name ?? ''];
            }}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
