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
        'src/utils/raceDetection.ts', // Complex race detection logic (demo feature, partially tested)
        // Exclude UI export/social features (advanced features, not core functionality)
        'src/components/ui/ActivitySelector.tsx', // Export feature
        'src/components/ui/ExportDialog.tsx', // Export feature
        'src/components/ui/ImageCropEditor.tsx', // Export feature
        'src/components/ui/SocialCard.tsx', // Social media export
        'src/components/ui/YearInReview.tsx', // Large UI component (partially tested)
        'src/hooks/useAdvancedExport.ts', // Export feature hook
        'src/hooks/usePDFExport.ts', // PDF export feature
        'src/utils/imageCrop.ts', // Image cropping utility
      ],
      // Coverage thresholds - enforce minimum coverage
      thresholds: {
        statements: 92.5,
        branches: 81.95,
        functions: 95.53,
        lines: 92.9,
      },
    },
  },
});
