import { create } from "zustand";
import { persist } from "zustand/middleware";
import { flattedStorage } from "@/utils/hermesStorage";

interface ThemeState {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDarkMode: false,
      
      toggleDarkMode: () =>
        set((state) => ({ isDarkMode: !state.isDarkMode })),
      
      setDarkMode: (isDark) =>
        set({ isDarkMode: isDark }),
    }),
    {
      name: "theme-storage",
      storage: flattedStorage,
      // v4: the redesign is light-only, so drop any saved dark-mode choice.
      version: 4,
      migrate: () => ({ isDarkMode: false }) as ThemeState,
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('❌ Theme store rehydration error, using defaults:', error);
        } else if (state) {
          console.log('✅ Theme store rehydrated successfully');
        } else {
          console.log('ℹ️  Theme store: no persisted data, using defaults');
        }
      },
    }
  )
);