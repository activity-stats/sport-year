import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import i18n, { getBrowserLanguage } from '../i18n';

describe('i18n', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Spy on console.error
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('getBrowserLanguage', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should return stored language if it exists', () => {
      localStorage.setItem('sport-year-language', 'nl');
      expect(getBrowserLanguage()).toBe('nl');
    });

    it('should return stored language even if different from browser', () => {
      localStorage.setItem('sport-year-language', 'en');
      expect(getBrowserLanguage()).toBe('en');
    });

    it('should use browser language when no stored preference (en)', () => {
      const originalLanguage = navigator.language;
      Object.defineProperty(navigator, 'language', {
        value: 'en-US',
        configurable: true,
      });

      expect(getBrowserLanguage()).toBe('en');

      // Restore
      Object.defineProperty(navigator, 'language', {
        value: originalLanguage,
        configurable: true,
      });
    });

    it('should use browser language when no stored preference (nl)', () => {
      const originalLanguage = navigator.language;
      Object.defineProperty(navigator, 'language', {
        value: 'nl-NL',
        configurable: true,
      });

      expect(getBrowserLanguage()).toBe('nl');

      // Restore
      Object.defineProperty(navigator, 'language', {
        value: originalLanguage,
        configurable: true,
      });
    });

    it('should fallback to en for unsupported browser languages', () => {
      const originalLanguage = navigator.language;
      Object.defineProperty(navigator, 'language', {
        value: 'fr-FR',
        configurable: true,
      });

      expect(getBrowserLanguage()).toBe('en');

      // Restore
      Object.defineProperty(navigator, 'language', {
        value: originalLanguage,
        configurable: true,
      });
    });

    it('should handle browser language without country code', () => {
      const originalLanguage = navigator.language;
      Object.defineProperty(navigator, 'language', {
        value: 'nl',
        configurable: true,
      });

      expect(getBrowserLanguage()).toBe('nl');

      // Restore
      Object.defineProperty(navigator, 'language', {
        value: originalLanguage,
        configurable: true,
      });
    });
  });

  describe('i18n initialization', () => {
    it('should be initialized', () => {
      expect(i18n.isInitialized).toBe(true);
    });

    it('should have a language set (en or nl)', () => {
      expect(['en', 'nl']).toContain(i18n.language);
    });

    it('should have correct fallback language', () => {
      // fallbackLng is an array in i18next
      expect(i18n.options.fallbackLng).toEqual(['en']);
    });

    it('should have both en and nl resources', () => {
      expect(i18n.hasResourceBundle('en', 'translation')).toBe(true);
      expect(i18n.hasResourceBundle('nl', 'translation')).toBe(true);
    });

    it('should disable escaping for interpolation', () => {
      expect(i18n.options.interpolation?.escapeValue).toBe(false);
    });

    it('should be able to translate keys', () => {
      // Test a key that exists in both locales
      const translation = i18n.t('app.title');
      expect(translation).toBeTruthy();
      expect(typeof translation).toBe('string');
    });

    it('should support language switching', async () => {
      const originalLang = i18n.language;
      const targetLang = originalLang === 'en' ? 'nl' : 'en';

      await i18n.changeLanguage(targetLang);
      expect(i18n.language).toBe(targetLang);

      // Switch back
      await i18n.changeLanguage(originalLang);
      expect(i18n.language).toBe(originalLang);
    });

    it('should not throw during initialization', () => {
      // No errors should have been logged during initialization
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });
});
