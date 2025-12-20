import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
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

export const ActivityTypeChart = ({ data }: ActivityTypeChartProps) => {
  const chartData = Object.entries(data)
    .filter(([_, stats]) => stats.count > 0)
    .map(([type, stats]) => ({
      name: type,
      value: Math.round(stats.distanceKm),
      count: stats.count,
    }))
    .sort((a, b) => b.value - a.value);

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Types</h3>
        <p className="text-gray-600">No activities yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Activity Types</h3>
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
            dataKey="value"
            strokeWidth={2}
            stroke="#fff"
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name] || '#6b7280'} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name, props: any) => [
              `${value ?? 0} km (${props.payload.count} activities)`,
              name ?? '',
            ]}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
