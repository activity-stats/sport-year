import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.ts';
import { showError } from '../utils/toast';

export const Callback = () => {
  const [searchParams] = useSearchParams();
  const { handleCallback } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      const errorDescription = searchParams.get('error_description');
      showError(
        `OAuth Error: ${error}${errorDescription ? `\n${errorDescription}` : ''}\n\nCheck browser console for details.`
      );
      navigate('/login', { replace: true });
      return;
    }

    if (code) {
      handleCallback(code).catch((err) => {
        // Only show error for actual API errors (not navigation/component unmount errors)
        if (err.response || err.message?.includes('token') || err.message?.includes('auth')) {
          showError(
            `Failed to connect to Strava. Please check:\n1. Client ID and Secret are correct\n2. Strava app callback domain is set to: ${window.location.hostname}\n\nError: ${err.message || 'Unknown error'}\n\nSee console for details.`
          );
        }

        navigate('/login', { replace: true });
      });
    } else {
      showError(
        'OAuth callback received without code. This might indicate:\n1. Wrong callback domain in Strava app settings\n2. Strava app configuration mismatch\n\nExpected domain: ' +
          window.location.hostname
      );
      navigate('/login', { replace: true });
    }
  }, [searchParams, handleCallback, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Connecting to Strava...</p>
      </div>
    </div>
  );
};
