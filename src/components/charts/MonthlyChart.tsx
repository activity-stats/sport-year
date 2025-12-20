import { useState } from 'react';
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
import type { MonthlyStats } from '../../types/activity.ts';

interface MonthlyChartProps {
  data: MonthlyStats[];
}

type MetricType = 'distance' | 'time' | 'elevation' | 'activities';

export const MonthlyChart = ({ data }: MonthlyChartProps) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('distance');

  const chartData = data.map((month) => ({
    name: month.monthName.slice(0, 3),
    distance: Math.round(month.distanceKm),
    time: Math.round(month.timeHours * 10) / 10,
    elevation: Math.round(month.elevationMeters),
    activities: month.activityCount,
  }));

  const metrics = {
    distance: { key: 'distance', label: 'Distance', unit: 'km', color: '#3b82f6' },
    time: { key: 'time', label: 'Time', unit: 'hours', color: '#8b5cf6' },
    elevation: { key: 'elevation', label: 'Elevation', unit: 'm', color: '#f59e0b' },
    activities: { key: 'activities', label: 'Activities', unit: 'count', color: '#10b981' },
  };

  const currentMetric = metrics[selectedMetric];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Monthly Trends</h3>
        <div className="flex gap-2">
          {(Object.keys(metrics) as MetricType[]).map((metric) => (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                selectedMetric === metric
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {metrics[metric].label}
            </button>
          ))}
        </div>
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
