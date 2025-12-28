import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { Login, Callback, Dashboard, Welcome } from './pages/index.ts';
import { SetupWizard } from './components/setup/SetupWizard';
import { useAuth } from './hooks/useAuth.ts';
import { useStravaConfigStore } from './stores/stravaConfigStore';
import { ErrorBoundary } from './components/ErrorBoundary';

// Check if we're in demo mode
const isDemoMode = typeof import.meta !== 'undefined' && import.meta.env?.VITE_USE_MOCKS === 'true';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  const { isConfigured } = useStravaConfigStore();

  return (
    <ErrorBoundary>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            zIndex: 99999,
          },
        }}
        containerStyle={{
          zIndex: 99999,
        }}
      />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            <Route path="/setup" element={<SetupWizard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/callback" element={<Callback />} />
            <Route
              path="/"
              element={
                isDemoMode ? (
                  <Dashboard />
                ) : !isConfigured ? (
                  <Welcome />
                ) : (
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                )
              }
            />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
