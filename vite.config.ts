import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Check if mocks should be enabled: either demo mode or VITE_USE_MOCKS env var
  const useMocks = mode === 'demo' || process.env.VITE_USE_MOCKS === 'true';

  return {
    plugins: [react()],
    // Use separate public directories for demo and production
    // Demo uses public-demo/ (contains T100.jpg), production uses public/
    // Dev with mocks also uses public-demo/
    publicDir: mode === 'demo' || useMocks ? 'public-demo' : 'public',
    server: {
      host: '0.0.0.0', // Listen on all interfaces
      // Prevent aggressive browser caching during development
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    },
    // Force Vite to clear dependency cache
    optimizeDeps: {
      force: true,
    },
    // Define environment variables at build time
    // In demo mode or with VITE_USE_MOCKS=true, enable mocks; otherwise use real Strava API
    define: {
      'import.meta.env.VITE_USE_MOCKS': useMocks ? '"true"' : '"false"',
    },
  };
});
