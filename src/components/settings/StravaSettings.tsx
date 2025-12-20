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

  const domain = window.location.host; // e.g., "localhost:5173" or "example.com"

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
        className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white flex justify-between items-center">
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
        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-sm text-blue-900">
              <strong>Authorization Callback Domain:</strong> Make sure your Strava app is
              configured with this domain:
            </p>
            <div className="mt-2 bg-gray-900 text-white px-3 py-2 rounded font-mono text-xs break-all">
              {domain}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Note: Strava asks for the domain only, not the full callback URL
            </p>
          </div>

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
                <strong>Security Note:</strong> Your credentials are stored locally in your browser
                only. They never leave your device.
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

          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500">
              Need to create a new Strava app? Visit{' '}
              <a
                href="https://www.strava.com/settings/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 hover:text-orange-700 font-semibold"
              >
                Strava API Settings
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
