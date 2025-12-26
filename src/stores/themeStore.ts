import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  getEffectiveTheme: () => 'light' | 'dark';
}

// Apply theme directly to DOM - this must work immediately
function applyThemeToDom(theme: Theme) {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  const effectiveTheme =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;

  console.log('[Theme] Applying:', theme, '→', effectiveTheme);

  // Force immediate update
  if (effectiveTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  console.log('[Theme] Classes after update:', root.classList.toString());
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'system',
      setTheme: (newTheme) => {
        console.log('[Theme Store] setTheme called with:', newTheme);

        // Update state
        set({ theme: newTheme });

        // Apply to DOM immediately - don't wait for anything
        applyThemeToDom(newTheme);

        // Also save to localStorage directly to ensure persistence
        try {
          localStorage.setItem(
            'theme-storage',
            JSON.stringify({ state: { theme: newTheme }, version: 0 })
          );
        } catch (e) {
          console.error('[Theme] Failed to save to localStorage:', e);
        }
      },
      getEffectiveTheme: () => {
        const { theme } = get();
        if (theme === 'system') {
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return theme;
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        console.log('[Theme] Rehydrated from storage:', state?.theme);
        if (state) {
          applyThemeToDom(state.theme);
        }
      },
    }
  )
);

// Listen for system theme changes
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const { theme } = useThemeStore.getState();
    if (theme === 'system') {
      applyThemeToDom('system');
    }
  });

  // Initialize on first load
  setTimeout(() => {
    const initialTheme = useThemeStore.getState().theme;
    console.log('[Theme] Initial load, applying:', initialTheme);
    applyThemeToDom(initialTheme);
  }, 0);
}
