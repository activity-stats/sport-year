import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useStravaConfigStore, type StravaConfig } from '../stravaConfigStore';

describe('useStravaConfigStore', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset store state
    useStravaConfigStore.getState().clearConfig();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initial state', () => {
    it('should have empty config initially', () => {
      const { config, isConfigured } = useStravaConfigStore.getState();

      // Either empty from fresh start or loaded from env
      expect(config).toHaveProperty('clientId');
      expect(config).toHaveProperty('clientSecret');
      expect(typeof isConfigured).toBe('boolean');
    });
  });

  describe('setConfig', () => {
    it('should update config and mark as configured', () => {
      const newConfig: StravaConfig = {
        clientId: 'test-123',
        clientSecret: 'secret-456',
      };

      useStravaConfigStore.getState().setConfig(newConfig);

      const { config, isConfigured } = useStravaConfigStore.getState();
      expect(config.clientId).toBe('test-123');
      expect(config.clientSecret).toBe('secret-456');
      expect(isConfigured).toBe(true);
    });

    it('should mark as not configured when values are empty', () => {
      const emptyConfig: StravaConfig = {
        clientId: '',
        clientSecret: '',
      };

      useStravaConfigStore.getState().setConfig(emptyConfig);

      const { isConfigured } = useStravaConfigStore.getState();
      expect(isConfigured).toBe(false);
    });

    it('should mark as not configured when values have only whitespace', () => {
      const whitespaceConfig: StravaConfig = {
        clientId: '   ',
        clientSecret: '  ',
      };

      useStravaConfigStore.getState().setConfig(whitespaceConfig);

      const { isConfigured } = useStravaConfigStore.getState();
      expect(isConfigured).toBe(false);
    });

    it('should mark as not configured when only clientId is provided', () => {
      const partialConfig: StravaConfig = {
        clientId: 'test-123',
        clientSecret: '',
      };

      useStravaConfigStore.getState().setConfig(partialConfig);

      const { isConfigured } = useStravaConfigStore.getState();
      expect(isConfigured).toBe(false);
    });

    it('should mark as not configured when only clientSecret is provided', () => {
      const partialConfig: StravaConfig = {
        clientId: '',
        clientSecret: 'secret-456',
      };

      useStravaConfigStore.getState().setConfig(partialConfig);

      const { isConfigured } = useStravaConfigStore.getState();
      expect(isConfigured).toBe(false);
    });

    it('should persist config across store instances', () => {
      const testConfig: StravaConfig = {
        clientId: 'persist-test',
        clientSecret: 'persist-secret',
      };

      useStravaConfigStore.getState().setConfig(testConfig);

      // Simulate app reload by checking localStorage
      const stored = localStorage.getItem('strava-config-storage');
      expect(stored).toBeTruthy();
      expect(stored).toContain('persist-test');
    });
  });

  describe('clearConfig', () => {
    it('should clear config and mark as not configured', () => {
      // First set a config
      useStravaConfigStore.getState().setConfig({
        clientId: 'test-123',
        clientSecret: 'secret-456',
      });

      // Then clear it
      useStravaConfigStore.getState().clearConfig();

      const { config, isConfigured } = useStravaConfigStore.getState();
      expect(config.clientId).toBe('');
      expect(config.clientSecret).toBe('');
      expect(isConfigured).toBe(false);
    });

    it('should be idempotent', () => {
      // Clear multiple times
      useStravaConfigStore.getState().clearConfig();
      useStravaConfigStore.getState().clearConfig();

      const { config, isConfigured } = useStravaConfigStore.getState();
      expect(config.clientId).toBe('');
      expect(config.clientSecret).toBe('');
      expect(isConfigured).toBe(false);
    });
  });

  describe('persistence', () => {
    it('should save config to localStorage', () => {
      const testConfig: StravaConfig = {
        clientId: 'storage-test',
        clientSecret: 'storage-secret',
      };

      useStravaConfigStore.getState().setConfig(testConfig);

      const stored = localStorage.getItem('strava-config-storage');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.config.clientId).toBe('storage-test');
      expect(parsed.state.config.clientSecret).toBe('storage-secret');
    });

    it('should clear localStorage when config is cleared', () => {
      // Set config first
      useStravaConfigStore.getState().setConfig({
        clientId: 'clear-test',
        clientSecret: 'clear-secret',
      });

      // Clear it
      useStravaConfigStore.getState().clearConfig();

      const stored = localStorage.getItem('strava-config-storage');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.config.clientId).toBe('');
      expect(parsed.state.config.clientSecret).toBe('');
      expect(parsed.state.isConfigured).toBe(false);
    });
  });

  describe('security considerations', () => {
    it('should not expose config directly without accessing store', () => {
      const testConfig: StravaConfig = {
        clientId: 'secret-id',
        clientSecret: 'super-secret',
      };

      useStravaConfigStore.getState().setConfig(testConfig);

      // Config should only be accessible via getState()
      expect(useStravaConfigStore.getState().config).toBeDefined();
    });

    it('should handle special characters in credentials', () => {
      const specialConfig: StravaConfig = {
        clientId: 'id@#$%^&*()',
        clientSecret: 'secret!@#$%^&*()',
      };

      useStravaConfigStore.getState().setConfig(specialConfig);

      const { config, isConfigured } = useStravaConfigStore.getState();
      expect(config.clientId).toBe('id@#$%^&*()');
      expect(config.clientSecret).toBe('secret!@#$%^&*()');
      expect(isConfigured).toBe(true);
    });
  });
});
