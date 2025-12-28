import { Page } from '@playwright/test';

/**
 * Mock Strava API responses for E2E tests
 */

export const mockStravaAthlete = {
  id: 12345678,
  username: 'test_athlete',
  firstname: 'Test',
  lastname: 'Athlete',
  profile: 'https://dgalywyr863hv.cloudfront.net/pictures/athletes/12345678/1234567/1/large.jpg',
  city: 'San Francisco',
  state: 'California',
  country: 'United States',
  sex: 'M',
  created_at: '2015-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockStravaActivities = [
  // Recent activities
  {
    id: 10001,
    name: 'Morning Run',
    type: 'Run',
    distance: 10000,
    moving_time: 3000,
    elapsed_time: 3120,
    total_elevation_gain: 50,
    start_date: '2024-12-15T08:00:00Z',
    start_date_local: '2024-12-15T08:00:00Z',
    average_speed: 3.33,
    max_speed: 4.5,
    kudos_count: 5,
    map: {
      summary_polyline: 'encoded_polyline_data',
    },
  },
  {
    id: 10002,
    name: 'Lunch Ride',
    type: 'Ride',
    distance: 50000,
    moving_time: 7200,
    elapsed_time: 7500,
    total_elevation_gain: 500,
    start_date: '2024-12-15T12:00:00Z',
    start_date_local: '2024-12-15T12:00:00Z',
    average_speed: 6.94,
    max_speed: 12.5,
    kudos_count: 12,
    map: {
      summary_polyline: 'encoded_polyline_data',
    },
  },
  {
    id: 10003,
    name: 'Evening Swim',
    type: 'Swim',
    distance: 2000,
    moving_time: 2400,
    elapsed_time: 2520,
    total_elevation_gain: 0,
    start_date: '2024-12-15T18:00:00Z',
    start_date_local: '2024-12-15T18:00:00Z',
    average_speed: 0.83,
    max_speed: 1.2,
    kudos_count: 3,
    map: {
      summary_polyline: '',
    },
  },
  {
    id: 10004,
    name: 'Half Marathon',
    type: 'Run',
    distance: 21097,
    moving_time: 6300,
    elapsed_time: 6480,
    total_elevation_gain: 120,
    start_date: '2024-12-10T09:00:00Z',
    start_date_local: '2024-12-10T09:00:00Z',
    average_speed: 3.35,
    max_speed: 4.2,
    kudos_count: 25,
    workout_type: 1,
    map: {
      summary_polyline: 'encoded_polyline_data',
    },
  },
  {
    id: 10005,
    name: 'Century Ride',
    type: 'Ride',
    distance: 100000,
    moving_time: 14400,
    elapsed_time: 15000,
    total_elevation_gain: 1200,
    start_date: '2024-12-08T07:00:00Z',
    start_date_local: '2024-12-08T07:00:00Z',
    average_speed: 6.94,
    max_speed: 15.0,
    kudos_count: 45,
    map: {
      summary_polyline: 'encoded_polyline_data',
    },
  },
  // Triathlon activity (multisport)
  {
    id: 10006,
    name: 'Olympic Triathlon',
    type: 'Triathlon',
    distance: 51500, // 1.5km swim + 40km bike + 10km run
    moving_time: 9000,
    elapsed_time: 9300,
    total_elevation_gain: 350,
    start_date: '2024-11-20T07:00:00Z',
    start_date_local: '2024-11-20T07:00:00Z',
    average_speed: 5.72,
    max_speed: 15.0,
    kudos_count: 78,
    workout_type: 3,
    map: {
      summary_polyline: 'encoded_polyline_data',
    },
  },
  // More varied activity types
  {
    id: 10007,
    name: 'Mountain Hike',
    type: 'Hike',
    distance: 15000,
    moving_time: 18000,
    elapsed_time: 19200,
    total_elevation_gain: 800,
    start_date: '2024-10-05T10:00:00Z',
    start_date_local: '2024-10-05T10:00:00Z',
    average_speed: 0.83,
    max_speed: 1.5,
    kudos_count: 15,
    map: {
      summary_polyline: 'encoded_polyline_data',
    },
  },
  {
    id: 10008,
    name: 'Zwift Race',
    type: 'VirtualRide',
    distance: 35000,
    moving_time: 3600,
    elapsed_time: 3600,
    total_elevation_gain: 450,
    start_date: '2024-09-12T19:00:00Z',
    start_date_local: '2024-09-12T19:00:00Z',
    average_speed: 9.72,
    max_speed: 18.5,
    kudos_count: 8,
    map: {
      summary_polyline: '',
    },
  },
  {
    id: 10009,
    name: 'Morning Walk',
    type: 'Walk',
    distance: 5000,
    moving_time: 3600,
    elapsed_time: 3720,
    total_elevation_gain: 20,
    start_date: '2024-08-01T08:00:00Z',
    start_date_local: '2024-08-01T08:00:00Z',
    average_speed: 1.39,
    max_speed: 2.0,
    kudos_count: 2,
    map: {
      summary_polyline: 'encoded_polyline_data',
    },
  },
  // Activity with missing map data (edge case)
  {
    id: 10010,
    name: 'Indoor Workout',
    type: 'Workout',
    distance: 0,
    moving_time: 2700,
    elapsed_time: 2700,
    total_elevation_gain: 0,
    start_date: '2024-07-15T06:00:00Z',
    start_date_local: '2024-07-15T06:00:00Z',
    average_speed: 0,
    max_speed: 0,
    kudos_count: 5,
    map: {
      summary_polyline: '',
    },
  },
  // Earlier year activities for better heatmap coverage
  {
    id: 10011,
    name: 'New Year Run',
    type: 'Run',
    distance: 8000,
    moving_time: 2400,
    elapsed_time: 2520,
    total_elevation_gain: 30,
    start_date: '2024-01-01T10:00:00Z',
    start_date_local: '2024-01-01T10:00:00Z',
    average_speed: 3.33,
    max_speed: 4.0,
    kudos_count: 20,
    map: {
      summary_polyline: 'encoded_polyline_data',
    },
  },
  {
    id: 10012,
    name: 'Spring Century',
    type: 'Ride',
    distance: 160000,
    moving_time: 21600,
    elapsed_time: 22500,
    total_elevation_gain: 1800,
    start_date: '2024-04-15T06:00:00Z',
    start_date_local: '2024-04-15T06:00:00Z',
    average_speed: 7.41,
    max_speed: 16.5,
    kudos_count: 55,
    map: {
      summary_polyline: 'encoded_polyline_data',
    },
  },
];

export const mockStravaStats = {
  recent_run_totals: {
    count: 10,
    distance: 150000,
    moving_time: 45000,
    elapsed_time: 46800,
    elevation_gain: 500,
  },
  recent_ride_totals: {
    count: 8,
    distance: 400000,
    moving_time: 57600,
    elapsed_time: 60000,
    elevation_gain: 3000,
  },
  recent_swim_totals: {
    count: 5,
    distance: 10000,
    moving_time: 12000,
    elapsed_time: 12600,
    elevation_gain: 0,
  },
  ytd_run_totals: {
    count: 120,
    distance: 1800000,
    moving_time: 540000,
    elapsed_time: 561600,
    elevation_gain: 6000,
  },
  ytd_ride_totals: {
    count: 96,
    distance: 4800000,
    moving_time: 691200,
    elapsed_time: 720000,
    elevation_gain: 36000,
  },
  ytd_swim_totals: {
    count: 60,
    distance: 120000,
    moving_time: 144000,
    elapsed_time: 151200,
    elevation_gain: 0,
  },
};

/**
 * Setup Strava API mocks for a page
 */
export async function setupStravaMocks(page: Page) {
  // Block any navigation to Strava and redirect to callback
  await page.route('**/*strava.com/**', async (route) => {
    const url = route.request().url();

    if (url.includes('/oauth/authorize')) {
      // Extract redirect_uri from the URL
      const urlObj = new URL(url);
      const redirectUri =
        urlObj.searchParams.get('redirect_uri') || 'http://localhost:5173/callback';
      const callbackUrl = `${redirectUri}?code=mock_auth_code&scope=read,activity:read_all`;

      // Abort the request and navigate directly (WebKit doesn't support redirect status in route.fulfill)
      await route.abort();
      // Navigate to callback URL asynchronously
      setTimeout(() => {
        page.goto(callbackUrl).catch(() => {});
      }, 100);
    } else if (url.includes('/oauth/token')) {
      // Mock token exchange
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock_access_token',
          refresh_token: 'mock_refresh_token',
          expires_at: Math.floor(Date.now() / 1000) + 21600,
          athlete: mockStravaAthlete,
        }),
      });
    } else if (url.includes('/api/v3/athlete/activities')) {
      // Mock activities endpoint
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockStravaActivities),
      });
    } else if (url.includes('/api/v3/athletes/') && url.includes('/stats')) {
      // Mock stats endpoint
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockStravaStats),
      });
    } else if (url.includes('/api/v3/athlete')) {
      // Mock athlete endpoint (must come after /activities check)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockStravaAthlete),
      });
    } else if (url.includes('/oauth/deauthorize')) {
      // Mock deauthorize
      await route.fulfill({ status: 200 });
    } else {
      // Continue with other Strava requests
      await route.continue();
    }
  });
}

/**
 * Setup authentication state
 * Mocks localStorage with Strava auth tokens and config
 */
export async function setupAuthState(page: Page) {
  await page.addInitScript(() => {
    // Set Strava config
    const configState = {
      state: {
        config: {
          clientId: 'mock_client_id',
          clientSecret: 'mock_client_secret',
        },
        isConfigured: true,
      },
      version: 1,
    };
    localStorage.setItem('strava-config-storage', JSON.stringify(configState));

    // Set auth state
    const authState = {
      state: {
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
        expiresAt: Date.now() / 1000 + 21600, // 6 hours (in seconds)
        athlete: {
          id: 12345678,
          username: 'test_athlete',
          firstname: 'Test',
          lastname: 'Athlete',
          profile:
            'https://dgalywyr863hv.cloudfront.net/pictures/athletes/12345678/1234567/1/large.jpg',
          city: 'San Francisco',
          state: 'California',
          country: 'United States',
        },
      },
      version: 0,
    };
    localStorage.setItem('strava-auth-storage', JSON.stringify(authState));

    // Skip onboarding guide
    localStorage.setItem('sport-year-onboarding-seen', 'true');
  });
}

/**
 * Setup Strava config only (without auth)
 * Use this when you need config but not authentication
 */
export async function setupStravaConfig(page: Page) {
  await page.addInitScript(() => {
    const configState = {
      state: {
        config: {
          clientId: 'mock_client_id',
          clientSecret: 'mock_client_secret',
        },
        isConfigured: true,
      },
      version: 1,
    };
    localStorage.setItem('strava-config-storage', JSON.stringify(configState));
  });
}

/**
 * Dismiss any onboarding or welcome dialogs
 */
export async function dismissOnboarding(page: Page) {
  // Wait briefly for dialogs to appear
  await page.waitForTimeout(500);

  // Try multiple button patterns in parallel
  const closeX = page.getByRole('button', { name: /^×$|^✕$/ }).first();
  const doneBtn = page.getByRole('button', { name: /^done$|^ok$/i }).first();
  const dismissBtn = page
    .getByRole('button', { name: /got it|dismiss|close|skip|continue/i })
    .first();

  // Check which button is visible and click it
  for (const button of [closeX, doneBtn, dismissBtn]) {
    if (await button.isVisible({ timeout: 500 }).catch(() => false)) {
      await button.click({ timeout: 1000 }).catch(() => {});
      await page.waitForTimeout(300);
      return;
    }
  }
}

/**
 * Navigate to Year in Review (presentation mode)
 */
export async function navigateToYearInReview(page: Page) {
  // Look for Year in Review navigation button
  const yearInReviewButton = page.getByRole('button', { name: /year in review|presentation/i });

  if (await yearInReviewButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await yearInReviewButton.click();
    await page.waitForTimeout(1000);
  }
}
