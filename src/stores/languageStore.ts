import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '../i18n';

const useMocks = typeof import.meta !== 'undefined' && import.meta.env?.VITE_USE_MOCKS === 'true';

interface LanguageState {
  language: string;
  setLanguage: (lang: string) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: i18n.language,
      setLanguage: (lang: string) => {
        i18n.changeLanguage(lang).catch((error) => {
          console.error('Failed to change language:', error);
        });
        set({ language: lang });
      },
    }),
    {
      name: useMocks ? 'sport-year-language-demo' : 'sport-year-language',
    }
  )
);
