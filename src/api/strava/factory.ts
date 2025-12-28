import { StravaClient } from './client';
import { MockStravaClient } from './mockClient';
import { useStravaConfigStore } from '../../stores/stravaConfigStore';
import { useAuthStore } from '../../stores/authStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { mockStravaAthlete } from '../../mocks/stravaActivities';

const useMocks = typeof import.meta !== 'undefined' && import.meta.env?.VITE_USE_MOCKS === 'true';

// When using mocks, pre-populate config and auth to bypass setup
if (useMocks) {
  // Set mock Strava config
  const configStore = useStravaConfigStore.getState();
  if (!configStore.isConfigured) {
    configStore.setConfig({
      clientId: 'mock_client_id',
      clientSecret: 'mock_client_secret',
    });
  }

  // Set mock auth state
  const authStore = useAuthStore.getState();
  if (!authStore.accessToken) {
    authStore.setTokens(
      'mock_access_token',
      'mock_refresh_token',
      Math.floor(Date.now() / 1000) + 21600, // 6 hours from now
      mockStravaAthlete
    );
  }

  // Set demo background image (T100.jpg) for demo mode
  // In demo build, T100.jpg is in public-demo/ folder (separate from production)
  // Uses BASE_URL so the path is correct: /demo/T100.jpg
  const settingsStore = useSettingsStore.getState();
  if (!settingsStore.yearInReview.backgroundImageUrl) {
    const baseUrl = typeof import.meta !== 'undefined' ? import.meta.env.BASE_URL : '/';
    settingsStore.setBackgroundImage(`${baseUrl}T100.jpg`);
  }
}

export const stravaClient = useMocks ? new MockStravaClient() : new StravaClient();
