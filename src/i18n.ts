import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import nl from './locales/nl.json';

// Get browser language or use stored preference
const getBrowserLanguage = (): string => {
  const stored = localStorage.getItem('sport-year-language');
  if (stored) return stored;

  const browserLang = navigator.language.split('-')[0];
  return ['en', 'nl'].includes(browserLang) ? browserLang : 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      nl: { translation: nl },
    },
    lng: getBrowserLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })
  .catch((error) => {
    console.error('i18n initialization failed:', error);
  });

export default i18n;
