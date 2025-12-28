import { Page } from '@playwright/test';

/**
 * Mock Strava API responses for E2E tests
 */

import { mockStravaActivities, mockStravaAthlete } from '../../src/mocks/stravaActivities';

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
    count: 140,
    distance: 2000000,
    moving_time: 600000,
    elapsed_time: 624000,
    elevation_gain: 7800,
  },
  ytd_ride_totals: {
    count: 120,
    distance: 10000000,
    moving_time: 1260000,
    elapsed_time: 1300000,
    elevation_gain: 52000,
  },
  ytd_swim_totals: {
    count: 75,
    distance: 140000,
    moving_time: 168000,
    elapsed_time: 178000,
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
