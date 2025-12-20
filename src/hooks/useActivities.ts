import { useQuery } from '@tanstack/react-query';
import { stravaClient } from '../api/strava/index.ts';
import { transformActivities } from '../utils/index.ts';

export const useActivities = (year: number) => {
  return useQuery({
    queryKey: ['activities', year],
    queryFn: async () => {
      const stravaActivities = await stravaClient.getActivitiesForYear(year);
      return transformActivities(stravaActivities);
    },
    staleTime: 1000 * 60 * 60, // 1 hour - critical for rate limits
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    enabled: true,
  });
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
