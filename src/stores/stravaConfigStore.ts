import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ConfigProviderFactory, type StravaConfig } from '../services/stravaConfigProvider';

interface StravaConfigState {
  config: StravaConfig;
  isConfigured: boolean;
  setConfig: (config: StravaConfig) => void;
  clearConfig: () => void;
}

/**
 * Store for managing Strava configuration
 * Following Single Responsibility Principle - only manages state
 * Delegates config loading to ConfigProvider
 */
const configProvider = ConfigProviderFactory.createDefault();
const initialConfig = configProvider.getConfig();
const initialIsConfigured = configProvider.isConfigured();

export const useStravaConfigStore = create<StravaConfigState>()(
  persist(
    (set) => ({
      config: initialConfig,
      isConfigured: initialIsConfigured,
      setConfig: (config: StravaConfig) => {
        const isConfigured = config.clientId.trim() !== '' && config.clientSecret.trim() !== '';
        set({ config, isConfigured });
      },
      clearConfig: () => {
        set({ config: { clientId: '', clientSecret: '' }, isConfigured: false });
      },
    }),
    {
      name: 'strava-config-storage',
      version: 1,
    }
  )
);

// Export type for testing
export type { StravaConfig };
