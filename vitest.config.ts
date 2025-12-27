import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
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
      ],
      // Coverage thresholds - enforce minimum coverage
      thresholds: {
        statements: 88.05,
        branches: 76.72,
        functions: 92.1,
        lines: 88.97,
      },
    },
  },
});
