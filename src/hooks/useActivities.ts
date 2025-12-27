import { useQuery, useQueryClient } from '@tanstack/react-query';
import { stravaClient } from '../api/strava/index.ts';
import { transformActivities } from '../utils/index.ts';
import { useDataSyncStore } from '../stores/dataSyncStore.ts';
import { useLoadingStore } from '../stores/loadingStore.ts';
import type { Activity } from '../types/activity.ts';
export const useActivities = (year: number | 'last365') => {
  const { getLastActivityTimestamp, setLastActivityTimestamp, setLastSyncTime } =
    useDataSyncStore();
  const setLoadingStage = useLoadingStore((state) => state.setStage);
  const setLoadingError = useLoadingStore((state) => state.setError);
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['activities', year],
    queryFn: async () => {
      try {
        // Stage 1: Checking Strava connection
        setLoadingStage('checking');

        // Stage 2: Fetching data from Strava
        setLoadingStage('fetching');

        // Handle 'last365' differently - use current timestamp
        const queryYear = year === 'last365' ? 'last365' : year;
        const lastTimestamp = getLastActivityTimestamp(queryYear);

        // Get existing cached activities (will be empty on first load)
        const existingActivities = queryClient.getQueryData<Activity[]>(['activities', year]) || [];

        // Only do incremental fetch if we have BOTH lastTimestamp AND existing cached data
        // This ensures first load always gets all activities
        let transformed;
        if (lastTimestamp && existingActivities.length > 0) {
          // Incremental update - fetch only new activities and merge
          const newStravaActivities =
            year === 'last365'
              ? await stravaClient.getActivitiesLast365Days(lastTimestamp)
              : await stravaClient.getActivitiesIncremental(year, lastTimestamp);

          // Stage 3: Transforming activities
          setLoadingStage('transforming');
          const newTransformed = transformActivities(newStravaActivities);

          // Merge new activities with existing ones, avoiding duplicates
          const existingIds = new Set(existingActivities.map((a: Activity) => a.id));
          const uniqueNewActivities = newTransformed.filter((a) => !existingIds.has(a.id));

          transformed = [...existingActivities, ...uniqueNewActivities];
        } else {
          // First time fetch OR no cache - get all activities for the period
          const stravaActivities =
            year === 'last365'
              ? await stravaClient.getActivitiesLast365Days()
              : await stravaClient.getActivitiesForYear(year);

          // Stage 3: Transforming activities
          setLoadingStage('transforming');
          transformed = transformActivities(stravaActivities);
        }

        // Update last activity timestamp if we have activities
        if (transformed.length > 0) {
          // Find the most recent activity
          const mostRecent = transformed.reduce((latest, activity) => {
            return new Date(activity.date) > new Date(latest.date) ? activity : latest;
          });
          const timestamp = Math.floor(new Date(mostRecent.date).getTime() / 1000);
          setLastActivityTimestamp(queryYear, timestamp);
        }

        // Update last sync time
        setLastSyncTime(queryYear, Date.now());

        return transformed;
      } catch (error) {
        setLoadingError(error instanceof Error ? error.message : 'Failed to load activities');
        throw error;
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hour - critical for rate limits
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    enabled: true,
  });
};

// Hook to manually trigger a sync
export const useRefreshActivities = () => {
  const queryClient = useQueryClient();

  return (year: number) => {
    queryClient.invalidateQueries({ queryKey: ['activities', year] });
  };
};

export const useActivity = (id: string) => {
  return useQuery({
    queryKey: ['activity', id],
    queryFn: async () => {
      const stravaActivity = await stravaClient.getActivity(Number(id));
      return transformActivities([stravaActivity])[0];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    enabled: !!id,
  });
};

// Get all activities (useful for multi-year views)
export const useAllActivities = () => {
  const currentYear = new Date().getFullYear();

  return useQuery({
    queryKey: ['activities', 'all'],
    queryFn: async () => {
      // Fetch last 3 years of data
      const years = [currentYear, currentYear - 1, currentYear - 2];
      const promises = years.map((year) => stravaClient.getActivitiesForYear(year));

      const results = await Promise.all(promises);
      const allActivities = results.flat();

      return transformActivities(allActivities);
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};
