import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { StravaActivity, StravaTokenResponse } from '../../../types/strava';

// Mock axios before importing anything else
vi.mock('axios', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  };

  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
      post: vi.fn(),
    },
  };
});

// Mock store
vi.mock('../../../stores/stravaConfigStore', () => ({
  useStravaConfigStore: {
    getState: vi.fn(() => ({
      config: {
        clientId: 'test_client_id',
        clientSecret: 'test_client_secret',
      },
    })),
  },
}));

// Import after mocks
import axios from 'axios';
import { stravaClient } from '../index';

describe('StravaClient', () => {
  // Get the mocked instance for assertions
  const mockAxiosInstance = (axios.create as any)();

  const mockAthlete = {
    id: 123,
    firstname: 'Test',
    lastname: 'User',
    username: 'testuser',
    profile: 'https://example.com/profile.jpg',
    city: 'Amsterdam',
    state: 'Noord-Holland',
    country: 'Netherlands',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset console.log and console.error mocks
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication', () => {
    it('should generate correct auth URL', () => {
      const authUrl = stravaClient.getAuthUrl();

      expect(authUrl).toContain('test_client_id');
      expect(authUrl).toContain('response_type=code');
      expect(authUrl).toContain('scope=read,activity:read_all');
      expect(authUrl).toContain(encodeURIComponent(`${window.location.origin}/callback`));
    });

    it('should exchange authorization code for token', async () => {
      const mockTokenResponse: StravaTokenResponse = {
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        expires_at: Date.now() / 1000 + 3600,
        expires_in: 3600,
        token_type: 'Bearer',
        athlete: mockAthlete,
      };

      vi.mocked(axios.post).mockResolvedValue({ data: mockTokenResponse });

      const result = await stravaClient.exchangeToken('auth_code_123');

      expect(axios.post).toHaveBeenCalledWith(
        'https://www.strava.com/oauth/token',
        expect.objectContaining({
          client_id: 'test_client_id',
          client_secret: 'test_client_secret',
          code: 'auth_code_123',
          grant_type: 'authorization_code',
        })
      );

      expect(result).toEqual(mockTokenResponse);
    });

    it('should refresh access token', async () => {
      const mockTokenResponse: StravaTokenResponse = {
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
        expires_at: Date.now() / 1000 + 3600,
        expires_in: 3600,
        token_type: 'Bearer',
        athlete: mockAthlete,
      };

      vi.mocked(axios.post).mockResolvedValue({ data: mockTokenResponse });

      const result = await stravaClient.refreshToken('old_refresh_token');

      expect(axios.post).toHaveBeenCalledWith(
        'https://www.strava.com/oauth/token',
        expect.objectContaining({
          client_id: 'test_client_id',
          client_secret: 'test_client_secret',
          refresh_token: 'old_refresh_token',
          grant_type: 'refresh_token',
        })
      );

      expect(result).toEqual(mockTokenResponse);
    });
  });

  describe('API Calls', () => {
    beforeEach(() => {
      stravaClient.setAccessToken('test_token');
    });

    it('should fetch athlete profile', async () => {
      const athleteData = {
        id: 123,
        firstname: 'John',
        lastname: 'Doe',
        username: 'johndoe',
        profile: 'https://example.com/profile.jpg',
        city: 'Amsterdam',
        state: 'Noord-Holland',
        country: 'Netherlands',
      };
      mockAxiosInstance.get.mockResolvedValue({ data: athleteData });

      const result = await stravaClient.getAthlete();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/athlete');
      expect(result).toEqual(athleteData);
    });

    it('should fetch activities with parameters', async () => {
      const mockActivities: StravaActivity[] = [
        {
          id: 1,
          name: 'Morning Run',
          type: 'Run',
          distance: 5000,
          moving_time: 1800,
        } as StravaActivity,
      ];

      mockAxiosInstance.get.mockResolvedValue({ data: mockActivities });

      const params = {
        after: 1640995200,
        before: 1672531200,
        page: 1,
        per_page: 50,
      };

      const result = await stravaClient.getActivities(params);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/athlete/activities',
        expect.objectContaining({
          params: expect.objectContaining({
            ...params,
            per_page: 50,
          }),
        })
      );

      expect(result).toEqual(mockActivities);
    });

    it('should use default per_page of 200', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: [] });

      await stravaClient.getActivities();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/athlete/activities',
        expect.objectContaining({
          params: expect.objectContaining({
            per_page: 200,
          }),
        })
      );
    });
  });

  describe('getActivitiesForYear', () => {
    it('should fetch all activities for a year with pagination', async () => {
      const year = 2024;
      const activities200 = Array(200).fill({ id: 1 }) as StravaActivity[];
      const activities50 = Array(50).fill({ id: 2 }) as StravaActivity[];

      mockAxiosInstance.get
        .mockResolvedValueOnce({ data: activities200 })
        .mockResolvedValueOnce({ data: activities50 });

      const result = await stravaClient.getActivitiesForYear(year);

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(250);

      // Check first call
      expect(mockAxiosInstance.get).toHaveBeenNthCalledWith(
        1,
        '/athlete/activities',
        expect.objectContaining({
          params: expect.objectContaining({
            after: Math.floor(new Date(2024, 0, 1).getTime() / 1000),
            before: Math.floor(new Date(2025, 0, 1).getTime() / 1000),
            page: 1,
          }),
        })
      );

      // Check second call
      expect(mockAxiosInstance.get).toHaveBeenNthCalledWith(
        2,
        '/athlete/activities',
        expect.objectContaining({
          params: expect.objectContaining({
            page: 2,
          }),
        })
      );
    });

    it('should stop pagination when less than 200 activities returned', async () => {
      const activities = Array(150).fill({ id: 1 }) as StravaActivity[];

      mockAxiosInstance.get.mockResolvedValue({ data: activities });

      const result = await stravaClient.getActivitiesForYear(2024);

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(150);
    });
  });

  describe('getActivitiesIncremental', () => {
    it('should fetch activities after last timestamp with buffer', async () => {
      const year = 2024;
      const lastTimestamp = 1705305600; // Jan 15, 2024
      const oneDayInSeconds = 24 * 60 * 60;

      mockAxiosInstance.get.mockResolvedValue({ data: [] });

      await stravaClient.getActivitiesIncremental(year, lastTimestamp);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/athlete/activities',
        expect.objectContaining({
          params: expect.objectContaining({
            after: lastTimestamp - oneDayInSeconds,
            before: Math.floor(new Date(2025, 0, 1).getTime() / 1000),
          }),
        })
      );
    });

    it('should fetch all activities when no last timestamp provided', async () => {
      const year = 2024;

      mockAxiosInstance.get.mockResolvedValue({ data: [] });

      await stravaClient.getActivitiesIncremental(year);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/athlete/activities',
        expect.objectContaining({
          params: expect.objectContaining({
            after: Math.floor(new Date(2024, 0, 1).getTime() / 1000),
          }),
        })
      );
    });

    it('should not fetch before year start even with buffer', async () => {
      const year = 2024;
      const yearStart = Math.floor(new Date(2024, 0, 1).getTime() / 1000);
      const lastTimestamp = yearStart + 3600; // 1 hour into the year

      mockAxiosInstance.get.mockResolvedValue({ data: [] });

      await stravaClient.getActivitiesIncremental(year, lastTimestamp);

      const call = mockAxiosInstance.get.mock.calls[0][1];
      expect(call.params.after).toBeGreaterThanOrEqual(yearStart);
    });
  });

  describe('getActivitiesLast365Days', () => {
    it('should fetch activities from last 365 days', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: [] });

      await stravaClient.getActivitiesLast365Days();

      const now = Date.now();
      const expectedAfter = Math.floor((now - 365 * 24 * 60 * 60 * 1000) / 1000);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/athlete/activities',
        expect.objectContaining({
          params: expect.objectContaining({
            after: expect.any(Number),
          }),
        })
      );

      const call = mockAxiosInstance.get.mock.calls[0][1];
      // Allow 1 second tolerance
      expect(call.params.after).toBeGreaterThanOrEqual(expectedAfter - 1);
      expect(call.params.after).toBeLessThanOrEqual(expectedAfter + 1);
    });

    it('should use incremental fetch with last timestamp', async () => {
      const lastTimestamp = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60; // 7 days ago

      mockAxiosInstance.get.mockResolvedValue({ data: [] });

      await stravaClient.getActivitiesLast365Days(lastTimestamp);

      const call = mockAxiosInstance.get.mock.calls[0][1];
      expect(call.params.after).toBe(lastTimestamp - 24 * 60 * 60);
    });
  });

  describe('getActivity', () => {
    it('should fetch a single activity by id', async () => {
      const mockActivity: StravaActivity = {
        id: 123,
        name: 'Test Activity',
        type: 'Run',
      } as StravaActivity;

      mockAxiosInstance.get.mockResolvedValue({ data: mockActivity });

      const result = await stravaClient.getActivity(123);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/activities/123');
      expect(result).toEqual(mockActivity);
    });
  });

  describe('Rate Limiting', () => {
    it('should handle 429 rate limit errors', async () => {
      const error = {
        response: {
          status: 429,
        },
      };

      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(stravaClient.getActivities()).rejects.toEqual(error);
    });

    it('should reject with error for non-rate-limit errors', async () => {
      const error = new Error('Network error');
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(stravaClient.getActivities()).rejects.toThrow('Network error');
    });
  });
});
