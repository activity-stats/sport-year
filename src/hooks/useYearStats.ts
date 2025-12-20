import { useMemo } from 'react';
import { useActivities } from './useActivities.ts';
import { aggregateYearStats } from '../utils/index.ts';

export const useYearStats = (year: number) => {
  const { data: activities, isLoading, error } = useActivities(year);

  const stats = useMemo(() => {
    if (!activities) return undefined;
    return aggregateYearStats(activities, year);
  }, [activities, year]);

  return {
    stats,
    isLoading,
    error,
  };
};
