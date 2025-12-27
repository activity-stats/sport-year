import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '../i18n';

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
      name: 'sport-year-language',
    }
  )
);
