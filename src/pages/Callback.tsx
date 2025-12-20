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

    console.log('Callback page - Current URL:', window.location.href);
    console.log('Callback page - Code:', code);
    console.log('Callback page - Error:', error);

    if (error) {
      console.error('OAuth error:', error);
      navigate('/login', { replace: true });
      return;
    }

    if (code) {
      handleCallback(code).catch((err) => {
        console.error('Failed to handle callback:', err);
        navigate('/login', { replace: true });
      });
    } else {
      console.warn('No code or error in callback URL');
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
