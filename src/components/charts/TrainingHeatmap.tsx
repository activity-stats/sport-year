import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { HourDayHeatmapCell } from '../../types/activity';

interface TrainingHeatmapProps {
  data: Map<string, HourDayHeatmapCell>;
}

type MetricType = 'activities' | 'time' | 'distance';

export const TrainingHeatmap = ({ data }: TrainingHeatmapProps) => {
  const { t } = useTranslation();
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('activities');

  // Week starts on Monday
  const dayNames = [
    t('days.mon'),
    t('days.tue'),
    t('days.wed'),
    t('days.thu'),
    t('days.fri'),
    t('days.sat'),
    t('days.sun'),
  ];

  // Calculate max value for color scaling
  const maxValue = useMemo(() => {
    let max = 0;
    data.forEach((cell) => {
      let value = 0;
      switch (selectedMetric) {
        case 'activities':
          value = cell.activityCount;
          break;
        case 'time':
          value = cell.timeHours;
          break;
        case 'distance':
          value = cell.distanceKm;
          break;
      }
      if (value > max) max = value;
    });
    return max;
  }, [data, selectedMetric]);

  // Get color intensity based on value
  const getColor = (value: number): string => {
    if (value === 0) return 'bg-gray-100 dark:bg-gray-800';

    const intensity = maxValue > 0 ? value / maxValue : 0;

    if (intensity < 0.25) return 'bg-blue-200 dark:bg-blue-900/30';
    if (intensity < 0.5) return 'bg-blue-300 dark:bg-blue-700/50';
    if (intensity < 0.75) return 'bg-blue-400 dark:bg-blue-600/70';
    return 'bg-blue-500 dark:bg-blue-500';
  };

  const getCellValue = (cell: HourDayHeatmapCell | undefined): number => {
    if (!cell) return 0;
    switch (selectedMetric) {
      case 'activities':
        return cell.activityCount;
      case 'time':
        return cell.timeHours;
      case 'distance':
        return cell.distanceKm;
    }
  };

  const metrics = {
    activities: { label: t('charts.metrics.activities'), unit: '' },
    time: { label: t('charts.metrics.time'), unit: 'h' },
    distance: { label: t('charts.metrics.distance'), unit: 'km' },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        🕐 {t('charts.trainingHeatmap')}
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

      {/* Heatmap grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Day labels */}
          <div className="flex mb-2">
            <div className="w-12 shrink-0"></div> {/* Hour label space */}
            {dayNames.map((day, index) => (
              <div
                key={index}
                className="flex-1 text-center text-xs font-medium text-gray-600 dark:text-gray-400"
                style={{ minWidth: '40px' }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Hour rows */}
          {Array.from({ length: 24 }, (_, hour) => (
            <div key={hour} className="flex mb-1">
              {/* Hour label - show every 3 hours */}
              <div className="w-12 shrink-0 text-right pr-2 text-xs text-gray-500 dark:text-gray-500">
                {hour % 3 === 0 ? `${hour.toString().padStart(2, '0')}:00` : ''}
              </div>

              {/* Day cells */}
              {dayNames.map((_, mondayBasedIndex) => {
                // Convert Monday-first index (0=Mon) to JS getDay() index (0=Sun) for data lookup
                const jsDayIndex = mondayBasedIndex === 6 ? 0 : mondayBasedIndex + 1;
                const key = `${jsDayIndex}-${hour}`;
                const cell = data.get(key);
                const value = getCellValue(cell);
                const color = getColor(value);

                return (
                  <div
                    key={mondayBasedIndex}
                    className={`flex-1 ${color} rounded-sm transition-all hover:ring-2 hover:ring-blue-400 dark:hover:ring-blue-500 cursor-pointer group relative`}
                    style={{ minWidth: '40px', height: '8px' }}
                    title={
                      cell
                        ? `${dayNames[mondayBasedIndex]} ${hour}:00 - ${value.toFixed(1)}${metrics[selectedMetric].unit ? ' ' + metrics[selectedMetric].unit : ''} (${cell.activityCount} activities)`
                        : `${dayNames[mondayBasedIndex]} ${hour}:00 - No activities`
                    }
                  >
                    {/* Tooltip on hover */}
                    {cell && cell.activityCount > 0 && (
                      <div className="hidden group-hover:block absolute z-10 bg-gray-900 text-white text-xs rounded px-2 py-1 -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                        {value.toFixed(1)}
                        {metrics[selectedMetric].unit && ` ${metrics[selectedMetric].unit}`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-600 dark:text-gray-400">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 bg-gray-100 dark:bg-gray-800 rounded-sm"></div>
          <div className="w-3 h-3 bg-blue-200 dark:bg-blue-900/30 rounded-sm"></div>
          <div className="w-3 h-3 bg-blue-300 dark:bg-blue-700/50 rounded-sm"></div>
          <div className="w-3 h-3 bg-blue-400 dark:bg-blue-600/70 rounded-sm"></div>
          <div className="w-3 h-3 bg-blue-500 dark:bg-blue-500 rounded-sm"></div>
        </div>
        <span>More</span>
      </div>
    </div>
  );
};
