import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { DayOfWeekStats } from '../../types/activity';

interface DayOfWeekChartProps {
  data: DayOfWeekStats[];
}

type MetricType = 'distance' | 'time' | 'activities';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      day: string;
      distance: number;
      time: number;
      activities: number;
    };
  }>;
  selectedMetric?: MetricType;
  metrics?: Record<MetricType, { label: string; unit: string; color: string }>;
}

const CustomTooltip = ({ active, payload, selectedMetric, metrics }: CustomTooltipProps) => {
  if (active && payload && payload.length && selectedMetric && metrics) {
    const data = payload[0].payload;
    const metricInfo = metrics[selectedMetric];
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{data.day}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {metricInfo.label}: {data[selectedMetric].toFixed(1)} {metricInfo.unit}
        </p>
      </div>
    );
  }
  return null;
};

export const DayOfWeekChart = ({ data }: DayOfWeekChartProps) => {
  const { t } = useTranslation();
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('time');

  const chartData = useMemo(() => {
    return data.map((day) => ({
      day: t(`days.${day.dayName}`).slice(0, 3), // Translate and abbreviate
      distance: Math.round(day.distanceKm * 10) / 10,
      time: Math.round(day.timeHours * 10) / 10,
      activities: day.activityCount,
    }));
  }, [data, t]);

  const metrics = {
    distance: { label: t('charts.metrics.distance'), unit: 'km', color: '#3b82f6' },
    time: { label: t('charts.metrics.time'), unit: 'h', color: '#8b5cf6' },
    activities: { label: t('charts.metrics.activities'), unit: '', color: '#10b981' },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        📅 {t('charts.weeklyPattern')}
      </h3>

      {/* Metric toggles */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(Object.keys(metrics) as MetricType[]).map((metric) => (
          <button
            key={metric}
            onClick={() => setSelectedMetric(metric)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedMetric === metric
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {metrics[metric].label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={chartData}>
          <PolarGrid stroke="#d1d5db" strokeDasharray="3 3" className="dark:stroke-gray-600" />
          <PolarAngleAxis
            dataKey="day"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            className="dark:fill-gray-400"
          />
          <PolarRadiusAxis
            angle={90}
            tick={{ fill: '#6b7280', fontSize: 10 }}
            className="dark:fill-gray-400"
          />
          <Tooltip content={<CustomTooltip selectedMetric={selectedMetric} metrics={metrics} />} />
          <Radar
            name={metrics[selectedMetric].label}
            dataKey={selectedMetric}
            stroke={metrics[selectedMetric].color}
            fill={metrics[selectedMetric].color}
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
