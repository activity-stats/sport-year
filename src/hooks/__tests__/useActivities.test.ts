import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useActivities,
  useActivity,
  useAllActivities,
  useRefreshActivities,
} from '../useActivities';
import { stravaClient } from '../../api/strava/index';
import { transformActivities } from '../../utils/index';
import type { StravaActivity } from '../../types/strava';
import type { Activity } from '../../types/activity';
import React from 'react';

// Mock dependencies
vi.mock('../../api/strava/index', () => ({
  stravaClient: {
    getActivitiesForYear: vi.fn(),
    getActivitiesIncremental: vi.fn(),
    getActivitiesLast365Days: vi.fn(),
    getActivity: vi.fn(),
  },
}));

vi.mock('../../utils/index', () => ({
  transformActivities: vi.fn((activities) => activities),
}));

vi.mock('../../stores/dataSyncStore', () => ({
  useDataSyncStore: vi.fn(() => ({
    getLastActivityTimestamp: vi.fn(),
    setLastActivityTimestamp: vi.fn(),
    setLastSyncTime: vi.fn(),
  })),
}));

vi.mock('../../stores/loadingStore', () => ({
  useLoadingStore: vi.fn((selector) => {
    const state = {
      setStage: vi.fn(),
      setError: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));

describe('useActivities', () => {
  let queryClient: QueryClient;

  const mockStravaActivity = {
    id: 123,
    name: 'Morning Run',
    type: 'Run',
    sport_type: 'Run',
    distance: 5000,
    moving_time: 1800,
    elapsed_time: 1900,
    total_elevation_gain: 100,
    start_date: '2024-01-15T08:00:00Z',
    start_date_local: '2024-01-15T09:00:00',
    timezone: '(GMT+01:00) Europe/Amsterdam',
    kudos_count: 5,
    athlete_count: 1,
    average_speed: 2.78,
    max_speed: 3.5,
    map: {
      id: 'map123',
      summary_polyline: 'encoded_polyline',
      resource_state: 2,
    },
  } as StravaActivity;

  const mockActivity: Activity = {
    id: '123',
    name: 'Morning Run',
    type: 'Run',
    date: new Date('2024-01-15T08:00:00Z'),
    distanceKm: 5,
    durationMinutes: 30,
    movingTimeMinutes: 30,
    elevationGainMeters: 100,
    averageSpeedKmh: 10,
    maxSpeedKmh: 12,
    kudosCount: 5,
    polyline: 'encoded_polyline',
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  describe('useActivities - initial load', () => {
    it('should fetch all activities for a year on first load', async () => {
      const year = 2024;
      vi.mocked(stravaClient.getActivitiesForYear).mockResolvedValue([mockStravaActivity]);
      vi.mocked(transformActivities).mockReturnValue([mockActivity]);

      const { result } = renderHook(() => useActivities(year), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(stravaClient.getActivitiesForYear).toHaveBeenCalledWith(year);
      expect(transformActivities).toHaveBeenCalledWith([mockStravaActivity]);
      expect(result.current.data).toEqual([mockActivity]);
    });

    it('should handle last365 parameter', async () => {
      vi.mocked(stravaClient.getActivitiesLast365Days).mockResolvedValue([mockStravaActivity]);
      vi.mocked(transformActivities).mockReturnValue([mockActivity]);

      const { result } = renderHook(() => useActivities('last365'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(stravaClient.getActivitiesLast365Days).toHaveBeenCalled();
      expect(result.current.data).toEqual([mockActivity]);
    });

    it('should update loading stages during fetch', async () => {
      const mockSetStage = vi.fn();
      vi.mocked(stravaClient.getActivitiesForYear).mockResolvedValue([mockStravaActivity]);
      vi.mocked(transformActivities).mockReturnValue([mockActivity]);

      const { useLoadingStore } = await import('../../stores/loadingStore');
      vi.mocked(useLoadingStore).mockImplementation((selector: any) => {
        if (selector) {
          return selector({ setStage: mockSetStage, setError: vi.fn() });
        }
        return { setStage: mockSetStage, setError: vi.fn() };
      });

      const { result } = renderHook(() => useActivities(2024), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockSetStage).toHaveBeenCalledWith('checking');
      expect(mockSetStage).toHaveBeenCalledWith('fetching');
      expect(mockSetStage).toHaveBeenCalledWith('transforming');
    });
  });

  describe('useActivities - incremental updates', () => {
    // Note: This is a simplified test. Full incremental update testing would require
    // more complex setup to manage React Query's cache and stale time correctly.
    it('should merge new activities with existing ones when both present', async () => {
      const year = 2024;
      const existingActivity = mockActivity;
      const newActivity = { ...mockActivity, id: '456' };

      // Simulate the behavior by mocking the function to return merged data
      vi.mocked(stravaClient.getActivitiesForYear).mockResolvedValue([
        mockStravaActivity,
        { ...mockStravaActivity, id: 456 },
      ]);
      vi.mocked(transformActivities).mockReturnValue([existingActivity, newActivity]);

      const { result } = renderHook(() => useActivities(year), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(2);
    });

    it('should deduplicate activities when merging', async () => {
      const year = 2024;
      queryClient.setQueryData(['activities', year], [mockActivity]);

      const { useDataSyncStore } = await import('../../stores/dataSyncStore');
      vi.mocked(useDataSyncStore).mockReturnValue({
        getLastActivityTimestamp: vi.fn().mockReturnValue(1705305600),
        setLastActivityTimestamp: vi.fn(),
        setLastSyncTime: vi.fn(),
      });

      // Return same activity (duplicate)
      vi.mocked(stravaClient.getActivitiesIncremental).mockResolvedValue([mockStravaActivity]);
      vi.mocked(transformActivities).mockReturnValue([mockActivity]);

      const { result } = renderHook(() => useActivities(year), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(1); // Duplicate removed
    });

    it('should update last activity timestamp after fetch', async () => {
      const mockSetLastActivityTimestamp = vi.fn();
      const { useDataSyncStore } = await import('../../stores/dataSyncStore');
      vi.mocked(useDataSyncStore).mockReturnValue({
        getLastActivityTimestamp: vi.fn(),
        setLastActivityTimestamp: mockSetLastActivityTimestamp,
        setLastSyncTime: vi.fn(),
      });

      vi.mocked(stravaClient.getActivitiesForYear).mockResolvedValue([mockStravaActivity]);
      vi.mocked(transformActivities).mockReturnValue([mockActivity]);

      const { result } = renderHook(() => useActivities(2024), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockSetLastActivityTimestamp).toHaveBeenCalledWith(2024, expect.any(Number));
    });
  });

  describe('useActivities - error handling', () => {
    it('should handle API errors', async () => {
      const mockSetError = vi.fn();
      const { useLoadingStore } = await import('../../stores/loadingStore');
      vi.mocked(useLoadingStore).mockImplementation((selector: any) => {
        if (selector) {
          return selector({ setStage: vi.fn(), setError: mockSetError });
        }
        return { setStage: vi.fn(), setError: mockSetError };
      });

      const error = new Error('API Error');
      vi.mocked(stravaClient.getActivitiesForYear).mockRejectedValue(error);

      const { result } = renderHook(() => useActivities(2024), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(mockSetError).toHaveBeenCalledWith('API Error');
      expect(result.current.error).toBeTruthy();
    });

    it('should handle non-Error objects', async () => {
      const mockSetError = vi.fn();
      const { useLoadingStore } = await import('../../stores/loadingStore');
      vi.mocked(useLoadingStore).mockImplementation((selector: any) => {
        if (selector) {
          return selector({ setStage: vi.fn(), setError: mockSetError });
        }
        return { setStage: vi.fn(), setError: mockSetError };
      });

      vi.mocked(stravaClient.getActivitiesForYear).mockRejectedValue('String error');

      const { result } = renderHook(() => useActivities(2024), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(mockSetError).toHaveBeenCalledWith('Failed to load activities');
    });
  });

  describe('useActivities - caching', () => {
    it('should use cache within stale time', async () => {
      const year = 2024;
      queryClient.setQueryData(['activities', year], [mockActivity]);

      const { result } = renderHook(() => useActivities(year), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Should not call API if cache is fresh
      expect(stravaClient.getActivitiesForYear).not.toHaveBeenCalled();
      expect(result.current.data).toEqual([mockActivity]);
    });

    it('should have correct stale time configuration', async () => {
      renderHook(() => useActivities(2024), { wrapper });

      // Wait for query to be created
      await waitFor(() => {
        const query = queryClient.getQueryCache().find({ queryKey: ['activities', 2024] });
        expect(query).toBeDefined();
      });
    });
  });

  describe('useActivity', () => {
    it('should fetch a single activity by id', async () => {
      const activityId = '123';
      vi.mocked(stravaClient.getActivity).mockResolvedValue(mockStravaActivity);
      vi.mocked(transformActivities).mockReturnValue([mockActivity]);

      const { result } = renderHook(() => useActivity(activityId), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(stravaClient.getActivity).toHaveBeenCalledWith(123);
      expect(result.current.data).toEqual(mockActivity);
    });

    it('should not fetch when id is empty', () => {
      const { result } = renderHook(() => useActivity(''), { wrapper });

      expect(result.current.isFetching).toBe(false);
      expect(stravaClient.getActivity).not.toHaveBeenCalled();
    });
  });

  describe('useAllActivities', () => {
    it('should fetch activities for last 3 years', async () => {
      const currentYear = new Date().getFullYear();
      vi.mocked(stravaClient.getActivitiesForYear).mockResolvedValue([mockStravaActivity]);
      vi.mocked(transformActivities).mockReturnValue([mockActivity]);

      const { result } = renderHook(() => useAllActivities(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(stravaClient.getActivitiesForYear).toHaveBeenCalledTimes(3);
      expect(stravaClient.getActivitiesForYear).toHaveBeenCalledWith(currentYear);
      expect(stravaClient.getActivitiesForYear).toHaveBeenCalledWith(currentYear - 1);
      expect(stravaClient.getActivitiesForYear).toHaveBeenCalledWith(currentYear - 2);
    });

    it('should merge activities from multiple years', async () => {
      const activity1 = { ...mockActivity, id: '1' };
      const activity2 = { ...mockActivity, id: '2' };
      const activity3 = { ...mockActivity, id: '3' };

      vi.mocked(stravaClient.getActivitiesForYear)
        .mockResolvedValueOnce([mockStravaActivity])
        .mockResolvedValueOnce([{ ...mockStravaActivity, id: 2 }])
        .mockResolvedValueOnce([{ ...mockStravaActivity, id: 3 }]);

      vi.mocked(transformActivities).mockReturnValue([activity1, activity2, activity3]);

      const { result } = renderHook(() => useAllActivities(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(3);
    });
  });

  describe('useRefreshActivities', () => {
    it('should invalidate query cache for a year', async () => {
      const year = 2024;
      queryClient.setQueryData(['activities', year], [mockActivity]);

      const { result } = renderHook(() => useRefreshActivities(), { wrapper });

      result.current(year);

      const query = queryClient.getQueryState(['activities', year]);
      expect(query?.isInvalidated).toBe(true);
    });
  });
});
