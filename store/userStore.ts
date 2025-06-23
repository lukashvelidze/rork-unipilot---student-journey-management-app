import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserProfile } from "@/types/user";
import { generateId } from "@/utils/helpers";

interface UserState {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  isPremium: boolean;
  setUser: (user: UserProfile) => void;
  updateUser: (userData: Partial<UserProfile>) => void;
  updateOnboardingStep: (step: number) => void;
  completeOnboarding: () => void;
  setPremium: (status: boolean) => void;
  logout: () => void;
  initializeUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,
      isPremium: false,
      setUser: (user) => {
        console.log("Setting user in store:", user);
        set({ user });
      },
      updateUser: (userData) => {
        console.log("Updating user with data:", userData);
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } });
        }
      },
      updateOnboardingStep: (step) => {
        console.log("Updating onboarding step to:", step);
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, onboardingStep: step } });
        }
      },
      completeOnboarding: () => {
        console.log("Completing onboarding");
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, onboardingCompleted: true } });
        }
      },
      setPremium: (status) => {
        console.log("Setting premium status:", status);
        set({ isPremium: status });
        const currentUser = get().user;
        if (currentUser) {
          set({ 
            user: { 
              ...currentUser, 
              isPremium: status,
              premiumSince: status ? new Date().toISOString() : null 
            } 
          });
        }
      },
      logout: () => {
        console.log("Logging out user");
        set({ user: null, isPremium: false });
      },
      initializeUser: () => {
        console.log("Initializing user if none exists");
        const currentUser = get().user;
        if (!currentUser) {
          const defaultUser: UserProfile = {
            id: generateId(),
            name: "",
            email: "",
            homeCountry: { code: "", name: "", flag: "" },
            destinationCountry: { code: "", name: "", flag: "" },
            educationBackground: { level: "bachelors" },
            testScores: [],
            universities: [],
            documents: [],
            journeyProgress: [],
            memories: [],
            onboardingCompleted: false,
            onboardingStep: 0,
          };
          set({ user: defaultUser });
        }
      },
    }),
    {
      name: "user-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => {
        console.log("Rehydrating user store");
        return (state) => {
          console.log("Rehydrated state:", state);
        };
      },
    }
  )
);