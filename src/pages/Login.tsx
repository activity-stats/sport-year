import { useAuth } from '../hooks/useAuth.ts';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const domain = window.location.host;

  // If already authenticated, redirect to home
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-orange-500 to-red-600">
      <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Sport Year</h1>
          <p className="text-gray-600">Track your annual sports performance</p>
        </div>

        <div className="space-y-4">
          <div className="text-sm text-gray-700">
            <p className="mb-2">Connect with Strava to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>View your yearly statistics</li>
              <li>Analyze running, cycling, and swimming activities</li>
              <li>Track your progress over time</li>
            </ul>
          </div>

          <button
            onClick={login}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
            </svg>
            Connect with Strava
          </button>

          <p className="text-xs text-gray-500 text-center">
            We only request read access to your activities
          </p>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="font-semibold text-blue-900 mb-2 text-sm">
              📋 Strava App Configuration Required:
            </p>
            <div className="space-y-2 text-xs text-blue-800">
              <div>
                <p className="font-semibold">Authorization Callback Domain:</p>
                <code className="bg-white px-2 py-1 rounded border border-blue-300 block mt-1 break-all">
                  {domain.split(':')[0]}
                </code>
                <p className="text-[10px] text-blue-600 mt-1">
                  ⚠️ Use ONLY the domain (no http://, no port number)
                </p>
              </div>
              <div className="pt-2 border-t border-blue-300">
                <p className="font-semibold mb-1">If you're experiencing a redirect loop:</p>
                <ul className="list-disc list-inside space-y-1 text-[11px] ml-2">
                  <li>Check that your Strava app's callback domain matches above</li>
                  <li>Verify Client ID and Secret are correct in Settings</li>
                  <li>Make sure you saved the Strava app configuration</li>
                  <li>Try clearing browser localStorage and re-entering credentials</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
