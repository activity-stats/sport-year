import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TIMING } from '../../constants/timing';
import { useStravaConfigStore } from '../../stores/stravaConfigStore';
import { useDataSyncStore } from '../../stores/dataSyncStore';
import { useQueryClient } from '@tanstack/react-query';
import { useRefreshActivities } from '../../hooks/useActivities';
import { showSuccess, showError, showInfo } from '../../utils/toast';

interface StravaSettingsProps {
  onClose: () => void;
}

export function StravaSettings({ onClose }: StravaSettingsProps) {
  const { t } = useTranslation();
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
    if (confirm(t('stravaSettings.clearCredentialsConfirm'))) {
      clearConfig();
    }
  };

  const handleClearData = async () => {
    if (!confirm(t('stravaSettings.dataManagement.clearConfirm'))) {
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
      showSuccess(t('errors.cacheClearSuccess'));
    } catch (error) {
      // Log critical cache clear error for debugging
      console.error('Failed to clear data:', error);
      showError(t('errors.cacheClearFailed'));
    } finally {
      setIsClearing(false);
    }
  };

  const handleSync = async () => {
    if (!confirm(t('stravaSettings.dataManagement.syncConfirm'))) {
      return;
    }

    setIsSyncing(true);
    try {
      refreshActivities(currentYear);
      // Wait a bit for the query to start
      await new Promise((resolve) => setTimeout(resolve, TIMING.RETRY_DELAY_MS));
      showInfo(t('errors.syncStarted'));
    } catch (error) {
      // Log critical sync error for debugging
      console.error('Failed to sync:', error);
      showError(t('errors.syncFailed'));
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
        <div className="bg-linear-to-r from-orange-500 to-orange-600 p-6 text-white flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-2xl font-black">{t('stravaSettings.title')}</h2>
            <p className="text-orange-100 text-sm mt-1">{t('stravaSettings.subtitle')}</p>
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
                <strong>{t('stravaSettings.technicalNotice')}</strong>{' '}
                {t('stravaSettings.technicalDescription')}
              </div>
            </div>
          </div>

          {/* Step-by-step Guide */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">
              {t('stravaSettings.setupInstructions')}
            </h3>

            {/* Step 1 */}
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="bg-orange-500 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    {t('stravaSettings.step1.title')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {t('stravaSettings.step1.description')}
                  </p>
                  <a
                    href="https://www.strava.com/settings/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-orange-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm"
                  >
                    <span>{t('stravaSettings.step1.button')}</span>
                    <span className="text-lg">→</span>
                  </a>
                  <p className="text-xs text-gray-500 mt-2">{t('stravaSettings.step1.note')}</p>
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
                    {t('stravaSettings.step2.title')}
                  </p>
                  <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <p className="font-semibold text-gray-700 dark:text-gray-300">
                        {t('stravaSettings.step2.applicationName')}
                      </p>
                      <p>{t('stravaSettings.step2.applicationNameDesc')}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700 dark:text-gray-300">
                        {t('stravaSettings.step2.category')}
                      </p>
                      <p>{t('stravaSettings.step2.categoryDesc')}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700 dark:text-gray-300">
                        {t('stravaSettings.step2.website')}
                      </p>
                      <p>{t('stravaSettings.step2.websiteDesc')}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700 dark:text-gray-300">
                        {t('stravaSettings.step2.callbackDomain')}
                      </p>
                      <p className="mb-2">{t('stravaSettings.step2.callbackImportant')}</p>
                      <div className="bg-gray-900 text-white px-3 py-2 rounded font-mono text-xs break-all">
                        {callbackDomain}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {t('stravaSettings.step2.callbackNote')}
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
                    {t('stravaSettings.step3.title')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('stravaSettings.step3.description')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Credentials Input */}
          <div className="pt-4 border-t space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {t('stravaSettings.credentials.title')}
            </h3>

            <div>
              <label
                htmlFor="settings-clientId"
                className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2"
              >
                {t('stravaSettings.credentials.clientId')}
              </label>
              <input
                id="settings-clientId"
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder={t('stravaSettings.credentials.clientIdPlaceholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono"
              />
            </div>

            <div>
              <label
                htmlFor="settings-clientSecret"
                className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2"
              >
                {t('stravaSettings.credentials.clientSecret')}
              </label>
              <div className="relative">
                <input
                  id="settings-clientSecret"
                  type={showSecret ? 'text' : 'password'}
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder={t('stravaSettings.credentials.clientSecretPlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono pr-20"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-900 font-semibold"
                >
                  {showSecret
                    ? t('stravaSettings.credentials.hide')
                    : t('stravaSettings.credentials.show')}
                </button>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex gap-2">
                <span className="text-yellow-600">⚠️</span>
                <div className="text-sm text-yellow-900">
                  <strong>{t('stravaSettings.securityNote')}</strong>{' '}
                  {t('stravaSettings.securityDescription')}
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
                  {t('stravaSettings.saveChanges')}
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-semibold"
                >
                  {t('stravaSettings.cancel')}
                </button>
              </div>

              {/* Data Management Section */}
              <div className="border-t pt-4 mt-2 space-y-3">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  {t('stravaSettings.dataManagement.title')}
                </h4>

                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="w-full bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSyncing ? (
                    <>
                      <span className="animate-spin">🔄</span>
                      <span>{t('stravaSettings.dataManagement.syncing')}</span>
                    </>
                  ) : (
                    <>
                      <span>🔄</span>
                      <span>{t('stravaSettings.dataManagement.syncButton')}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleClearData}
                  disabled={isClearing}
                  className="w-full bg-yellow-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isClearing
                    ? t('stravaSettings.dataManagement.clearing')
                    : `🗑️ ${t('stravaSettings.dataManagement.clearCacheButton')}`}
                </button>

                <p className="text-xs text-gray-500">{t('stravaSettings.dataManagement.note')}</p>
              </div>

              <button
                onClick={handleClear}
                className="w-full text-red-600 hover:text-red-700 font-semibold py-2 text-sm border-t pt-3 mt-2"
              >
                {t('stravaSettings.clearCredentials')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
