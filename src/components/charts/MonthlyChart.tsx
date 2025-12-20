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

export const MonthlyChart = ({ data }: MonthlyChartProps) => {
  const chartData = data.map((month) => ({
    name: month.monthName.slice(0, 3), // Short month names
    distance: Math.round(month.distanceKm),
    elevation: Math.round(month.elevationMeters),
    activities: month.activityCount,
  }));

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Monthly Distance</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '14px', fontWeight: 500 }} />
          <YAxis stroke="#6b7280" style={{ fontSize: '14px', fontWeight: 500 }} />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === 'distance') return [`${value} km`, 'Distance'];
              if (name === 'elevation') return [`${value} m`, 'Elevation'];
              return [value, name];
            }}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          />
          <Legend />
          <Bar dataKey="distance" fill="#3b82f6" name="Distance (km)" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
