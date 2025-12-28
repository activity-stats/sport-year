import type { StravaActivity, StravaAthlete, StravaTokenResponse } from '../../types/strava';
import { mockStravaActivities, mockStravaAthlete } from '../../mocks/stravaActivities';

// Lightweight mock Strava client that serves static data for local mock mode
export class MockStravaClient {
  private athlete: StravaAthlete = mockStravaAthlete as StravaAthlete;
  private activities: StravaActivity[] = mockStravaActivities as StravaActivity[];

  // No-op for compatibility with real client interface
  setAccessToken(_token: string) {}

  getAuthUrl(): string {
    return 'mock://strava/auth';
  }

  async exchangeToken(_code: string): Promise<StravaTokenResponse> {
    return {
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      expires_in: 3600,
      token_type: 'Bearer',
      athlete: this.athlete,
    } as StravaTokenResponse;
  }

  async refreshToken(_refreshToken: string): Promise<StravaTokenResponse> {
    return this.exchangeToken('refresh');
  }

  async getAthlete(): Promise<StravaAthlete> {
    return this.athlete;
  }

  async getActivities(params?: {
    before?: number;
    after?: number;
    page?: number;
    per_page?: number;
  }): Promise<StravaActivity[]> {
    let filtered = this.activities;
    const after = params?.after;
    const before = params?.before;
    if (typeof after === 'number') {
      filtered = filtered.filter((a) => new Date(a.start_date).getTime() / 1000 >= after);
    }
    if (typeof before === 'number') {
      filtered = filtered.filter((a) => new Date(a.start_date).getTime() / 1000 < before);
    }
    // Simple paging to mimic API
    const page = params?.page ?? 1;
    const perPage = params?.per_page ?? 200;
    const start = (page - 1) * perPage;
    const end = start + perPage;
    return filtered.slice(start, end);
  }

  async getActivitiesForYear(year: number): Promise<StravaActivity[]> {
    const after = Math.floor(new Date(year, 0, 1).getTime() / 1000);
    const before = Math.floor(new Date(year + 1, 0, 1).getTime() / 1000);
    return this.getActivities({ after, before, per_page: 500 });
  }

  async getActivitiesIncremental(
    year: number,
    lastActivityTimestamp?: number
  ): Promise<StravaActivity[]> {
    const after = lastActivityTimestamp
      ? Math.max(
          lastActivityTimestamp - 24 * 60 * 60,
          Math.floor(new Date(year, 0, 1).getTime() / 1000)
        )
      : Math.floor(new Date(year, 0, 1).getTime() / 1000);
    const before = Math.floor(new Date(year + 1, 0, 1).getTime() / 1000);
    return this.getActivities({ after, before, per_page: 500 });
  }

  async getActivitiesLast365Days(_lastActivityTimestamp?: number): Promise<StravaActivity[]> {
    const now = Date.now();
    const after = Math.floor((now - 365 * 24 * 60 * 60 * 1000) / 1000);
    return this.getActivities({ after, per_page: 500 });
  }

  async getActivity(id: number): Promise<StravaActivity> {
    const found = this.activities.find((a) => a.id === id);
    if (!found) {
      throw new Error('Activity not found');
    }
    return found;
  }
}
