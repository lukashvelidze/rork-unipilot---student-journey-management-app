import { create } from "zustand";

interface AppState {
  inCriticalFlow: boolean;
  hasBootstrappedNavigation: boolean;
  setInCriticalFlow: (value: boolean) => void;
  setHasBootstrappedNavigation: (value: boolean) => void;
}

// Ephemeral app-level flags (not persisted)
export const useAppStateStore = create<AppState>((set) => ({
  inCriticalFlow: false,
  hasBootstrappedNavigation: false,
  setInCriticalFlow: (value) => set({ inCriticalFlow: value }),
  setHasBootstrappedNavigation: (value) => set({ hasBootstrappedNavigation: value }),
}));
