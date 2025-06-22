import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserProfile } from "@/types/user";

interface UserState {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  isPremium: boolean;
  premiumResources: string[];
  setUser: (user: UserProfile) => void;
  updateUser: (userData: Partial<UserProfile>) => void;
  updateOnboardingStep: (step: number) => void;
  completeOnboarding: () => void;
  setPremium: (status: boolean) => void;
  addPremiumResource: (resourceId: string) => void;
  removePremiumResource: (resourceId: string) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,
      isPremium: false,
      premiumResources: [],
      setUser: (user) => set({ user }),
      updateUser: (userData) => 
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
      updateOnboardingStep: (step) => 
        set((state) => ({
          user: state.user ? { ...state.user, onboardingStep: step } : null,
        })),
      completeOnboarding: () => 
        set((state) => ({
          user: state.user ? { ...state.user, onboardingCompleted: true } : null,
        })),
      setPremium: (status) => set({ isPremium: status }),
      addPremiumResource: (resourceId) =>
        set((state) => ({
          premiumResources: [...state.premiumResources, resourceId]
        })),
      removePremiumResource: (resourceId) =>
        set((state) => ({
          premiumResources: state.premiumResources.filter(id => id !== resourceId)
        })),
      logout: () => set({ user: null, isPremium: false, premiumResources: [] }),
    }),
    {
      name: "user-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);