import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { Login, Callback, Dashboard } from './pages/index.ts';
import { useAuth } from './hooks/useAuth.ts';
import { useStravaConfigStore } from './stores/stravaConfigStore';
import { SetupWizard } from './components/setup/SetupWizard';
import { ErrorBoundary } from './components/ErrorBoundary';

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

  // Show setup wizard if not configured
  if (!isConfigured) {
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
        <SetupWizard />
      </ErrorBoundary>
    );
  }

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
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/callback" element={<Callback />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
