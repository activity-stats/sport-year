import { useState, useEffect } from 'react';
import { useStravaConfigStore } from '../../stores/stravaConfigStore';
import { useDataSyncStore } from '../../stores/dataSyncStore';
import { useQueryClient } from '@tanstack/react-query';
import { useRefreshActivities } from '../../hooks/useActivities';

interface StravaSettingsProps {
  onClose: () => void;
}

export function StravaSettings({ onClose }: StravaSettingsProps) {
  const { config, setConfig, clearConfig } = useStravaConfigStore();
  const { clearData } = useDataSyncStore();
  const queryClient = useQueryClient();
  const refreshActivities = useRefreshActivities();
  const [clientId, setClientId] = useState(config.clientId);
  const [clientSecret, setClientSecret] = useState(config.clientSecret);
  const [showSecret, setShowSecret] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const currentYear = new Date().getFullYear();

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

  const handleClearData = async () => {
    if (
      !confirm(
        'Are you sure you want to clear all cached activity data? This will force a full refresh on the next sync. This does NOT delete your Strava data, only the local cache.'
      )
    ) {
      return;
    }

    setIsClearing(true);
    try {
      // Clear data sync store
      clearData();
      // Clear React Query cache
      queryClient.clear();
      // Force a fresh fetch for current year
      await queryClient.refetchQueries({ queryKey: ['activities', currentYear] });
      alert('Local cache cleared successfully. Data will be refreshed.');
    } catch (error) {
      console.error('Failed to clear data:', error);
      alert('Failed to clear data. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  const handleSync = async () => {
    if (!confirm('Sync activities from Strava? This will check for new or updated activities.')) {
      return;
    }

    setIsSyncing(true);
    try {
      refreshActivities(currentYear);
      // Wait a bit for the query to start
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert('Sync started! Your activities are being updated.');
    } catch (error) {
      console.error('Failed to sync:', error);
      alert('Failed to sync. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 dark:bg-black/90 flex items-center justify-center p-6 z-50"
      onClick={onClose}
    >
      <div
        className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
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
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="bg-orange-500 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Go to Strava's API Settings
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
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
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="bg-orange-500 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Configure Your Application
                  </p>
                  <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <p className="font-semibold text-gray-700 dark:text-gray-300">
                        Application Name:
                      </p>
                      <p>Choose any name you like (e.g., "My Sport Year")</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700 dark:text-gray-300">Category:</p>
                      <p>Select any category that fits</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700 dark:text-gray-300">Website:</p>
                      <p>
                        Enter any website URL (e.g., your personal site or just use a placeholder
                        like https://example.com)
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700 dark:text-gray-300">
                        Authorization Callback Domain:
                      </p>
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
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="bg-orange-500 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Copy Your Credentials
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    After creating your app, Strava will show you a <strong>Client ID</strong> and{' '}
                    <strong>Client Secret</strong>. Copy these values and enter them below.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Credentials Input */}
          <div className="pt-4 border-t space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Enter Your Credentials
            </h3>

            <div>
              <label
                htmlFor="settings-clientId"
                className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2"
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
                className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2"
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
                  className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-semibold"
                >
                  Cancel
                </button>
              </div>

              {/* Data Management Section */}
              <div className="border-t pt-4 mt-2 space-y-3">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  Data Management
                </h4>

                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="w-full bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSyncing ? (
                    <>
                      <span className="animate-spin">🔄</span>
                      <span>Syncing...</span>
                    </>
                  ) : (
                    <>
                      <span>🔄</span>
                      <span>Sync Activities</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleClearData}
                  disabled={isClearing}
                  className="w-full bg-yellow-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isClearing ? 'Clearing...' : '🗑️ Clear Cached Data'}
                </button>

                <p className="text-xs text-gray-500">
                  Sync checks for new activities. Clear cache to force a full refresh.
                </p>
              </div>

              <button
                onClick={handleClear}
                className="w-full text-red-600 hover:text-red-700 font-semibold py-2 text-sm border-t pt-3 mt-2"
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
