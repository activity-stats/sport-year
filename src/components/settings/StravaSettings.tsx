import { useState } from 'react';
import { useStravaConfigStore } from '../../stores/stravaConfigStore';

interface StravaSettingsProps {
  onClose: () => void;
}

export function StravaSettings({ onClose }: StravaSettingsProps) {
  const { config, setConfig, clearConfig } = useStravaConfigStore();
  const [clientId, setClientId] = useState(config.clientId);
  const [clientSecret, setClientSecret] = useState(config.clientSecret);
  const [showSecret, setShowSecret] = useState(false);

  // Extract domain without port for Strava callback
  const hostname = window.location.hostname; // e.g., "localhost" or "example.com"
  const callbackDomain = hostname === 'localhost' ? 'localhost' : hostname;

  const handleSave = () => {
    if (clientId.trim() && clientSecret.trim()) {
      setConfig({ clientId: clientId.trim(), clientSecret: clientSecret.trim() });
      onClose();
    }
  };

  const handleClear = () => {
    if (
      confirm(
        'Are you sure you want to clear your Strava credentials? You will need to set them up again.'
      )
    ) {
      clearConfig();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50"
      onClick={onClose}
    >
      <div
        className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-2xl font-black">Strava Settings</h2>
            <p className="text-orange-100 text-sm mt-1">Manage your Strava app credentials</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-orange-100 text-3xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Technical Notice */}
          <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
            <div className="flex gap-2">
              <span className="text-purple-600 text-xl">🔧</span>
              <div className="text-sm text-purple-900">
                <strong>Technical Setup Required:</strong> This process requires creating a Strava
                API application. Please follow these steps carefully.
              </div>
            </div>
          </div>

          {/* Step-by-step Guide */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Setup Instructions</h3>

            {/* Step 1 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="bg-orange-500 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 mb-2">
                    Go to Strava's API Settings
                  </p>
                  <p className="text-sm text-gray-600 mb-3">
                    Click the button below. It will open Strava's API settings page in a new tab so
                    you can easily switch back here to copy your credentials.
                  </p>
                  <a
                    href="https://www.strava.com/settings/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-orange-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm"
                  >
                    <span>Open Strava API Settings</span>
                    <span className="text-lg">→</span>
                  </a>
                  <p className="text-xs text-gray-500 mt-2">
                    This will open in a new tab so you can easily copy your credentials.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="bg-orange-500 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 mb-2">
                    Configure Your Application
                  </p>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div>
                      <p className="font-semibold text-gray-700">Application Name:</p>
                      <p>Choose any name you like (e.g., "My Sport Year")</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">Category:</p>
                      <p>Select any category that fits</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">Website:</p>
                      <p>
                        Enter any website URL (e.g., your personal site or just use a placeholder
                        like https://example.com)
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">Authorization Callback Domain:</p>
                      <p className="mb-2">
                        ⚠️ <strong>Important:</strong> Enter ONLY the domain without port number:
                      </p>
                      <div className="bg-gray-900 text-white px-3 py-2 rounded font-mono text-xs break-all">
                        {callbackDomain}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Copy this value exactly. Do not include "http://", "https://", or port
                        numbers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="bg-orange-500 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Copy Your Credentials</p>
                  <p className="text-sm text-gray-600">
                    After creating your app, Strava will show you a <strong>Client ID</strong> and{' '}
                    <strong>Client Secret</strong>. Copy these values and enter them below.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Credentials Input */}
          <div className="pt-4 border-t space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Enter Your Credentials</h3>

            <div>
              <label
                htmlFor="settings-clientId"
                className="block text-sm font-bold text-gray-700 mb-2"
              >
                Client ID
              </label>
              <input
                id="settings-clientId"
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="e.g., 123456"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono"
              />
            </div>

            <div>
              <label
                htmlFor="settings-clientSecret"
                className="block text-sm font-bold text-gray-700 mb-2"
              >
                Client Secret
              </label>
              <div className="relative">
                <input
                  id="settings-clientSecret"
                  type={showSecret ? 'text' : 'password'}
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="Enter your client secret"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono pr-20"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-900 font-semibold"
                >
                  {showSecret ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex gap-2">
                <span className="text-yellow-600">⚠️</span>
                <div className="text-sm text-yellow-900">
                  <strong>Security Note:</strong> Your credentials are stored locally in your
                  browser only. They never leave your device.
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={!clientId.trim() || !clientSecret.trim()}
                  className="flex-1 bg-orange-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Changes
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 text-gray-700 hover:text-gray-900 font-semibold"
                >
                  Cancel
                </button>
              </div>

              <button
                onClick={handleClear}
                className="w-full text-red-600 hover:text-red-700 font-semibold py-2 text-sm"
              >
                Clear Credentials
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
