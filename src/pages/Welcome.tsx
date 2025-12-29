import { useNavigate } from 'react-router-dom';
import { useLanguageStore } from '../stores/languageStore';
import { useTranslation } from 'react-i18next';
import { useStravaConfigStore } from '../stores/stravaConfigStore';

export const Welcome = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguageStore();
  const { isConfigured } = useStravaConfigStore();
  const demoUrl = `${window.location.origin}/demo/`;

  const handleSetupOwn = () => {
    // If not configured, go to setup wizard, otherwise go to login
    navigate(isConfigured ? '/login' : '/setup');
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Language Selector */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={() => setLanguage('en')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm ${
            language === 'en'
              ? 'bg-linear-to-r from-orange-600 to-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          EN
        </button>
        <button
          onClick={() => setLanguage('nl')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm ${
            language === 'nl'
              ? 'bg-linear-to-r from-orange-600 to-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          NL
        </button>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo/Icon */}
          <div className="text-6xl mb-8 flex items-center justify-center gap-4">🏊 🚴 🏃 💪 🧘</div>

          {/* Title */}
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-linear-to-r from-orange-600 to-blue-600 bg-clip-text text-transparent">
            {t('welcome.title')}
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-4">
            {t('welcome.subtitle')}
          </p>

          {/* Description */}
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            {t('welcome.description')}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <a
              href={demoUrl}
              className="group relative inline-flex items-center gap-3 bg-linear-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <span className="text-2xl">👀</span>
              <span>{t('welcome.exploreDemo')}</span>
            </a>

            <button
              onClick={handleSetupOwn}
              className="group relative inline-flex items-center gap-3 bg-linear-to-r from-orange-600 to-orange-700 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-orange-700 hover:to-orange-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <span className="text-2xl">🚀</span>
              <span>{t('welcome.setupOwn')}</span>
            </button>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                {t('welcome.features.analytics.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('welcome.features.analytics.description')}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
              <div className="text-4xl mb-3">🎨</div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                {t('welcome.features.design.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('welcome.features.design.description')}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
              <div className="text-4xl mb-3">🔒</div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                {t('welcome.features.privacy.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('welcome.features.privacy.description')}
              </p>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-16 text-sm text-gray-500 dark:text-gray-500">
            <p className="flex items-center justify-center gap-2">
              <span>{t('welcome.footer.enjoying')}</span>
              <a
                href="https://buymeacoffee.com/niekos"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 font-semibold transition-colors"
              >
                ☕ {t('welcome.footer.buyMeCoffee')}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
