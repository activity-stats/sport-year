import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.ts';

export const Callback = () => {
  const [searchParams] = useSearchParams();
  const { handleCallback } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    console.log('=== CALLBACK DEBUG ===');
    console.log('Current URL:', window.location.href);
    console.log('Code parameter:', code);
    console.log('Error parameter:', error);
    console.log('All params:', Object.fromEntries(searchParams.entries()));

    if (error) {
      console.error('OAuth error from Strava:', error);
      const errorDescription = searchParams.get('error_description');
      alert(`OAuth Error: ${error}${errorDescription ? `\n${errorDescription}` : ''}\n\nCheck browser console for details.`);
      navigate('/login', { replace: true });
      return;
    }

    if (code) {
      console.log('Code received, exchanging for token...');
      handleCallback(code).catch((err) => {
        console.error('Token exchange failed:', err);
        
        // Only show alert for actual API errors (not navigation/component unmount errors)
        if (err.response || err.message?.includes('token') || err.message?.includes('auth')) {
          console.error('API Error details:', {
            status: err.response?.status,
            data: err.response?.data,
            message: err.message
          });
          alert(`Failed to connect to Strava. Please check:\n1. Client ID and Secret are correct\n2. Strava app callback domain is set to: ${window.location.hostname}\n\nError: ${err.message || 'Unknown error'}\n\nSee console for details.`);
        } else {
          console.log('Navigation or minor error after successful auth, ignoring');
        }
        
        navigate('/login', { replace: true });
      });
    } else {
      console.warn('No code or error in callback URL - possible redirect loop');
      alert('OAuth callback received without code. This might indicate:\n1. Wrong callback domain in Strava app settings\n2. Strava app configuration mismatch\n\nExpected domain: ' + window.location.hostname);
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
