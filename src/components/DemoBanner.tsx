import { useTranslation } from 'react-i18next';

/**
 * Banner shown only in demo mode to inform users this is a demo
 */
export const DemoBanner = () => {
  const { t } = useTranslation();
  // Link to setup page instead of login
  const setupUrl = `${window.location.origin}/setup`;

  return (
    <div className="bg-linear-to-r from-blue-600 to-blue-700 text-white py-3 px-4 shadow-md">
      <div className="container mx-auto flex items-center justify-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-2xl">ℹ️</span>
          <p className="text-sm md:text-base font-medium">
            {t('demoBanner.message')} <strong>{t('demoBanner.demo')}</strong>{' '}
            {t('demoBanner.withSampleData')}
          </p>
        </div>
        <a
          href={setupUrl}
          className="bg-white text-blue-700 px-4 py-1.5 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors shadow-sm"
        >
          {t('demoBanner.setupOwn')} →
        </a>
      </div>
    </div>
  );
};
