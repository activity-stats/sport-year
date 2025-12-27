import { useMemo, useEffect } from 'react';
import { useActivities } from './useActivities.ts';
import { aggregateYearStats } from '../utils/index.ts';
import { useLoadingStore } from '../stores/loadingStore.ts';

export const useYearStats = (year: number | 'last365') => {
  const { data: activities, isLoading, error } = useActivities(year);
  const setLoadingStage = useLoadingStore((state) => state.setStage);
  const reset = useLoadingStore((state) => state.reset);

  const stats = useMemo(() => {
    if (!activities) return undefined;

    // Stage 4: Aggregating statistics
    setLoadingStage('aggregating');
    const actualYear = year === 'last365' ? new Date().getFullYear() : year;
    const result = aggregateYearStats(activities, actualYear);

    // Stage 5: Complete
    setLoadingStage('complete');

    return result;
  }, [activities, year, setLoadingStage]);

  // Reset loading state when component unmounts or year changes
  useEffect(() => {
    return () => {
      reset();
    };
  }, [year, reset]);

  return {
    stats,
    isLoading,
    error,
  };
};
