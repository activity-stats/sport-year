import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ConfigProviderFactory, type StravaConfig } from '../services/stravaConfigProvider';

// Check if we're in mock mode (demo build)
const useMocks = typeof import.meta !== 'undefined' && import.meta.env?.VITE_USE_MOCKS === 'true';

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

// In mock mode, use demo credentials; otherwise load from config provider
const initialConfig: StravaConfig = useMocks
  ? { clientId: 'mock_client_id', clientSecret: 'mock_client_secret' }
  : configProvider.getConfig();

const initialIsConfigured = useMocks ? true : configProvider.isConfigured();

// Store configuration function
const storeConfig = (set: any): StravaConfigState => ({
  config: initialConfig,
  isConfigured: initialIsConfigured,
  setConfig: (config: StravaConfig) => {
    const isConfigured = config.clientId.trim() !== '' && config.clientSecret.trim() !== '';
    set({ config, isConfigured });
  },
  clearConfig: () => {
    set({ config: { clientId: '', clientSecret: '' }, isConfigured: false });
  },
});

// In mock mode, skip persist middleware to prevent localStorage interference
// In production mode, use persist middleware for configuration persistence
export const useStravaConfigStore = useMocks
  ? create<StravaConfigState>()(storeConfig)
  : create<StravaConfigState>()(
      persist(storeConfig, {
        name: 'strava-config-storage',
        version: 1,
      })
    );

// Export type for testing
export type { StravaConfig };
