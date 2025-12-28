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

  // Set demo background image after a micro-task to ensure stores are fully hydrated
  queueMicrotask(() => {
    const settingsStore = useSettingsStore.getState();
    // In dev mode, image is at /T100.jpg (public-demo/ at root)
    // In built demo, image is at /demo/T100.jpg (public-demo/ built to /demo/)
    const imagePath = import.meta.env.DEV ? '/T100.jpg' : '/demo/T100.jpg';
    // Always set the demo background image (force override any stored value)
    settingsStore.setBackgroundImage(imagePath);
  });
}

export const stravaClient = useMocks ? new MockStravaClient() : new StravaClient();
