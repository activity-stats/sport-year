/**
 * Interface for Strava configuration
 * Following Interface Segregation Principle - keep interfaces focused
 */
export interface StravaConfig {
  clientId: string;
  clientSecret: string;
}

/**
 * Interface for configuration provider
 * Following Dependency Inversion Principle - depend on abstractions
 */
export interface IConfigProvider {
  getConfig(): StravaConfig;
  isConfigured(): boolean;
}

/**
 * Environment variable configuration provider
 * Single Responsibility: Load config from environment variables
 */
export class EnvConfigProvider implements IConfigProvider {
  getConfig(): StravaConfig {
    return {
      clientId: import.meta.env.VITE_STRAVA_CLIENT_ID || '',
      clientSecret: import.meta.env.VITE_STRAVA_CLIENT_SECRET || '',
    };
  }

  isConfigured(): boolean {
    const config = this.getConfig();
    return config.clientId.trim() !== '' && config.clientSecret.trim() !== '';
  }
}

/**
 * Storage configuration provider
 * Single Responsibility: Load config from storage
 */
export class StorageConfigProvider implements IConfigProvider {
  private storage: Storage;
  private key: string;

  constructor(storage: Storage, key: string = 'strava-config') {
    this.storage = storage;
    this.key = key;
  }

  getConfig(): StravaConfig {
    try {
      const stored = this.storage.getItem(this.key);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          clientId: parsed.state?.config?.clientId || '',
          clientSecret: parsed.state?.config?.clientSecret || '',
        };
      }
    } catch (error) {
      console.error('Failed to load config from storage:', error);
    }
    return { clientId: '', clientSecret: '' };
  }

  isConfigured(): boolean {
    const config = this.getConfig();
    return config.clientId.trim() !== '' && config.clientSecret.trim() !== '';
  }
}

/**
 * Composite configuration provider with fallback chain
 * Following Open/Closed Principle - open for extension via provider chain
 */
export class CompositeConfigProvider implements IConfigProvider {
  private providers: IConfigProvider[];

  constructor(providers: IConfigProvider[]) {
    this.providers = providers;
  }

  getConfig(): StravaConfig {
    for (const provider of this.providers) {
      if (provider.isConfigured()) {
        return provider.getConfig();
      }
    }
    return { clientId: '', clientSecret: '' };
  }

  isConfigured(): boolean {
    return this.providers.some((p) => p.isConfigured());
  }
}

/**
 * Factory for creating the default configuration provider chain
 * Single Responsibility: Create and configure providers
 */
export class ConfigProviderFactory {
  static createDefault(): IConfigProvider {
    return new CompositeConfigProvider([
      new EnvConfigProvider(),
      new StorageConfigProvider(localStorage, 'strava-config-storage'),
    ]);
  }
}
