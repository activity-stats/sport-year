import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  getEffectiveTheme: () => 'light' | 'dark';
}

// Apply theme directly to DOM
function applyThemeToDom(theme: Theme) {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  const effectiveTheme =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;

  // Apply immediately - no need for RAF as this is not during React render
  if (effectiveTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (newTheme) => {
        // Apply to DOM immediately
        applyThemeToDom(newTheme);

        // Update state - this will trigger persist middleware to save
        set({ theme: newTheme });
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
        if (state) {
          // Apply theme immediately after rehydration
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

  // Apply theme eagerly on module load to prevent flash
  // This will be overridden by onRehydrateStorage if there's a saved theme
  const initialState = useThemeStore.getState();
  applyThemeToDom(initialState.theme);
}
