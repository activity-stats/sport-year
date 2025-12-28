import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**', // Exclude Playwright E2E tests
      '**/.{idea,git,cache,output,temp}/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'dist/',
        'src/locales/*.json',
        'e2e/', // Exclude E2E tests from coverage
        'src/api/strava/factory.ts', // Demo mode factory
        'src/api/strava/mockClient.ts', // Demo mode mock client
        'src/api/strava/index.ts', // Main entry point (mostly re-exports)
        'src/mocks/**', // Mock data files
        'src/utils/index.ts', // Re-exports only
        'src/pages/index.ts', // Re-exports only
        '**/index.ts', // Exclude all index.ts files (re-exports)
      ],
      // Coverage thresholds - enforce minimum coverage
      thresholds: {
        statements: 62,
        branches: 43,
        functions: 81,
        lines: 63,
      },
    },
  },
});
