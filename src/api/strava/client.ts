import axios, { type AxiosInstance } from 'axios';
import type { StravaActivity, StravaTokenResponse, StravaAthlete } from '../../types/strava';
import { useStravaConfigStore } from '../../stores/stravaConfigStore';

const STRAVA_API_BASE = 'https://www.strava.com/api/v3';
const STRAVA_AUTH_BASE = 'https://www.strava.com/oauth';

class StravaClient {
  private axiosInstance: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: STRAVA_API_BASE,
    });

    // Add auth interceptor
    this.axiosInstance.interceptors.request.use((config) => {
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });

    // Add response interceptor for rate limiting
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Log rate limit info (useful for debugging)
        const rateLimit = response.headers['x-ratelimit-limit'];
        const rateUsage = response.headers['x-ratelimit-usage'];

        if (rateLimit && rateUsage) {
          console.log(`Rate Limit: ${rateUsage}/${rateLimit}`);
        }

        return response;
      },
      (error) => {
        if (error.response?.status === 429) {
          console.error('Rate limit exceeded. Please try again later.');
        }
        return Promise.reject(error);
      }
    );
  }

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  getAuthUrl(): string {
    const { config } = useStravaConfigStore.getState();
    const clientId = config.clientId;
    const redirectUri = `${window.location.origin}/callback`;
    const scope = 'read,activity:read_all';

    return `${STRAVA_AUTH_BASE}/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;
  }

  async exchangeToken(code: string): Promise<StravaTokenResponse> {
    const { config } = useStravaConfigStore.getState();
    const clientId = config.clientId;
    const clientSecret = config.clientSecret;

    const response = await axios.post<StravaTokenResponse>(`${STRAVA_AUTH_BASE}/token`, {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
    });

    this.setAccessToken(response.data.access_token);
    return response.data;
  }

  async refreshToken(refreshToken: string): Promise<StravaTokenResponse> {
    const { config } = useStravaConfigStore.getState();
    const clientId = config.clientId;
    const clientSecret = config.clientSecret;

    const response = await axios.post<StravaTokenResponse>(`${STRAVA_AUTH_BASE}/token`, {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    this.setAccessToken(response.data.access_token);
    return response.data;
  }

  async getAthlete(): Promise<StravaAthlete> {
    const response = await this.axiosInstance.get<StravaAthlete>('/athlete');
    return response.data;
  }

  async getActivities(params?: {
    before?: number; // Unix timestamp
    after?: number; // Unix timestamp
    page?: number;
    per_page?: number; // Max 200
  }): Promise<StravaActivity[]> {
    const response = await this.axiosInstance.get<StravaActivity[]>('/athlete/activities', {
      params: {
        per_page: 200, // Max allowed
        ...params,
      },
    });
    return response.data;
  }

  async getActivitiesForYear(year: number): Promise<StravaActivity[]> {
    const after = Math.floor(new Date(year, 0, 1).getTime() / 1000);
    const before = Math.floor(new Date(year + 1, 0, 1).getTime() / 1000);

    let allActivities: StravaActivity[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const activities = await this.getActivities({
        after,
        before,
        page,
        per_page: 200,
      });

      allActivities = [...allActivities, ...activities];

      // If we got less than 200, we've reached the end
      hasMore = activities.length === 200;
      page++;
    }

    return allActivities;
  }

  /**
   * Fetch only new activities after a given timestamp (minus 1 day buffer)
   * This minimizes API calls by only fetching recent data
   */
  async getActivitiesIncremental(
    year: number,
    lastActivityTimestamp?: number
  ): Promise<StravaActivity[]> {
    const yearStart = Math.floor(new Date(year, 0, 1).getTime() / 1000);
    const yearEnd = Math.floor(new Date(year + 1, 0, 1).getTime() / 1000);

    // If we have a last activity timestamp, fetch from 1 day before it
    // This provides a buffer in case of activity updates
    let after: number;
    if (lastActivityTimestamp) {
      const oneDayInSeconds = 24 * 60 * 60;
      after = Math.max(lastActivityTimestamp - oneDayInSeconds, yearStart);
    } else {
      // No previous data, fetch all for the year
      after = yearStart;
    }

    let allActivities: StravaActivity[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const activities = await this.getActivities({
        after,
        before: yearEnd,
        page,
        per_page: 200,
      });

      allActivities = [...allActivities, ...activities];

      // If we got less than 200, we've reached the end
      hasMore = activities.length === 200;
      page++;
    }

    return allActivities;
  }

  async getActivity(id: number): Promise<StravaActivity> {
    const response = await this.axiosInstance.get<StravaActivity>(`/activities/${id}`);
    return response.data;
  }
}

// Singleton instance
export const stravaClient = new StravaClient();
