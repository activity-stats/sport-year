import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  EnvConfigProvider,
  StorageConfigProvider,
  CompositeConfigProvider,
  ConfigProviderFactory,
  type IConfigProvider,
} from '../stravaConfigProvider';

describe('EnvConfigProvider', () => {
  it('should return config from environment variables', () => {
    const provider = new EnvConfigProvider();
    const config = provider.getConfig();

    expect(config).toHaveProperty('clientId');
    expect(config).toHaveProperty('clientSecret');
  });

  it('should return empty strings when env vars are not set', () => {
    // Environment variables are already empty in test environment
    const provider = new EnvConfigProvider();
    const config = provider.getConfig();

    expect(config.clientId).toBe('');
    expect(config.clientSecret).toBe('');
  });

  it('should report not configured when env vars are empty', () => {
    const provider = new EnvConfigProvider();
    expect(provider.isConfigured()).toBe(false);
  });
});

describe('StorageConfigProvider', () => {
  let mockStorage: Storage;

  beforeEach(() => {
    mockStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    };
  });

  it('should load config from storage', () => {
    const storedData = {
      state: {
        config: {
          clientId: 'test-client-id',
          clientSecret: 'test-secret',
        },
      },
    };
    (mockStorage.getItem as any).mockReturnValue(JSON.stringify(storedData));

    const provider = new StorageConfigProvider(mockStorage, 'test-key');
    const config = provider.getConfig();

    expect(config.clientId).toBe('test-client-id');
    expect(config.clientSecret).toBe('test-secret');
    expect(mockStorage.getItem).toHaveBeenCalledWith('test-key');
  });

  it('should return empty config when storage is empty', () => {
    (mockStorage.getItem as any).mockReturnValue(null);

    const provider = new StorageConfigProvider(mockStorage);
    const config = provider.getConfig();

    expect(config.clientId).toBe('');
    expect(config.clientSecret).toBe('');
  });

  it('should handle corrupted storage data gracefully', () => {
    (mockStorage.getItem as any).mockReturnValue('invalid-json');

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const provider = new StorageConfigProvider(mockStorage);
    const config = provider.getConfig();

    expect(config.clientId).toBe('');
    expect(config.clientSecret).toBe('');
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should report configured when storage has valid data', () => {
    const storedData = {
      state: {
        config: {
          clientId: 'test-id',
          clientSecret: 'test-secret',
        },
      },
    };
    (mockStorage.getItem as any).mockReturnValue(JSON.stringify(storedData));

    const provider = new StorageConfigProvider(mockStorage);
    expect(provider.isConfigured()).toBe(true);
  });

  it('should report not configured when storage has empty values', () => {
    const storedData = {
      state: {
        config: {
          clientId: '',
          clientSecret: '',
        },
      },
    };
    (mockStorage.getItem as any).mockReturnValue(JSON.stringify(storedData));

    const provider = new StorageConfigProvider(mockStorage);
    expect(provider.isConfigured()).toBe(false);
  });

  it('should handle whitespace-only values as not configured', () => {
    const storedData = {
      state: {
        config: {
          clientId: '   ',
          clientSecret: '  ',
        },
      },
    };
    (mockStorage.getItem as any).mockReturnValue(JSON.stringify(storedData));

    const provider = new StorageConfigProvider(mockStorage);
    expect(provider.isConfigured()).toBe(false);
  });
});

describe('CompositeConfigProvider', () => {
  it('should return config from first configured provider', () => {
    const provider1: IConfigProvider = {
      getConfig: () => ({ clientId: 'id1', clientSecret: 'secret1' }),
      isConfigured: () => true,
    };
    const provider2: IConfigProvider = {
      getConfig: () => ({ clientId: 'id2', clientSecret: 'secret2' }),
      isConfigured: () => true,
    };

    const composite = new CompositeConfigProvider([provider1, provider2]);
    const config = composite.getConfig();

    expect(config.clientId).toBe('id1');
    expect(config.clientSecret).toBe('secret1');
  });

  it('should skip unconfigured providers', () => {
    const provider1: IConfigProvider = {
      getConfig: () => ({ clientId: '', clientSecret: '' }),
      isConfigured: () => false,
    };
    const provider2: IConfigProvider = {
      getConfig: () => ({ clientId: 'id2', clientSecret: 'secret2' }),
      isConfigured: () => true,
    };

    const composite = new CompositeConfigProvider([provider1, provider2]);
    const config = composite.getConfig();

    expect(config.clientId).toBe('id2');
    expect(config.clientSecret).toBe('secret2');
  });

  it('should return empty config when no provider is configured', () => {
    const provider1: IConfigProvider = {
      getConfig: () => ({ clientId: '', clientSecret: '' }),
      isConfigured: () => false,
    };
    const provider2: IConfigProvider = {
      getConfig: () => ({ clientId: '', clientSecret: '' }),
      isConfigured: () => false,
    };

    const composite = new CompositeConfigProvider([provider1, provider2]);
    const config = composite.getConfig();

    expect(config.clientId).toBe('');
    expect(config.clientSecret).toBe('');
  });

  it('should report configured if any provider is configured', () => {
    const provider1: IConfigProvider = {
      getConfig: () => ({ clientId: '', clientSecret: '' }),
      isConfigured: () => false,
    };
    const provider2: IConfigProvider = {
      getConfig: () => ({ clientId: 'id2', clientSecret: 'secret2' }),
      isConfigured: () => true,
    };

    const composite = new CompositeConfigProvider([provider1, provider2]);
    expect(composite.isConfigured()).toBe(true);
  });

  it('should handle empty provider list', () => {
    const composite = new CompositeConfigProvider([]);

    expect(composite.isConfigured()).toBe(false);
    expect(composite.getConfig()).toEqual({ clientId: '', clientSecret: '' });
  });
});

describe('ConfigProviderFactory', () => {
  it('should create a composite provider with env and storage providers', () => {
    const provider = ConfigProviderFactory.createDefault();

    expect(provider).toBeDefined();
    expect(provider).toHaveProperty('getConfig');
    expect(provider).toHaveProperty('isConfigured');
  });

  it('should return valid config structure', () => {
    const provider = ConfigProviderFactory.createDefault();
    const config = provider.getConfig();

    expect(config).toHaveProperty('clientId');
    expect(config).toHaveProperty('clientSecret');
    expect(typeof config.clientId).toBe('string');
    expect(typeof config.clientSecret).toBe('string');
  });
});
