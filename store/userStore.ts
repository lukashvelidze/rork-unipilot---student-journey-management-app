import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserProfile, Country, EducationLevel } from "@/types/user";
import { getJourneyProgressForCountry } from "@/mocks/journeyTasks";
import { SafeAsyncStorage } from "@/utils/safeNativeModules";

// Enhanced error-safe AsyncStorage wrapper with iOS crash prevention
const safeAsyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      // Use SafeAsyncStorage for iOS crash prevention
      const result = await SafeAsyncStorage.getItem(key);
      return result;
    } catch (error) {
      console.error(`AsyncStorage getItem error for key "${key}":`, error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      // Use SafeAsyncStorage for iOS crash prevention
      await SafeAsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`AsyncStorage setItem error for key "${key}":`, error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      // Use SafeAsyncStorage for iOS crash prevention
      await SafeAsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`AsyncStorage removeItem error for key "${key}":`, error);
    }
  },
};

interface UserState {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  isPremium: boolean;
  setUser: (user: UserProfile) => void;
  updateUser: (userData: Partial<UserProfile>) => void;
  clearUser: () => void;
  logout: () => void;
  completeOnboarding: () => void;
  setOnboardingStep: (step: number) => void;
  updateOnboardingStep: (step: number) => void;
  initializeUser: () => void;
  createUser: (userData: {
    name: string;
    email: string;
    homeCountry: Country;
    destinationCountry: Country;
  }) => void;
  setPremium: (isPremium: boolean) => void;
  updateDestinationCountry: (country: Country) => void;
  updateHomeCountry: (country: Country) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,
      isPremium: false,
      
      setUser: (user) => set({ user, isPremium: user.isPremium || false }),
      
      updateUser: (userData) =>
        set((state) => {
          const updatedUser = state.user ? { ...state.user, ...userData } : null;
          return {
            user: updatedUser,
            isPremium: updatedUser?.isPremium || state.isPremium,
          };
        }),
      
      clearUser: () => set({ user: null, isPremium: false }),
      
      logout: () => set({ user: null, isPremium: false, error: null }),
      
      completeOnboarding: () =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                onboardingCompleted: true,
                onboardingStep: 0,
              }
            : null,
        })),
      
      setOnboardingStep: (step) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, onboardingStep: step }
            : null,
        })),
      
      updateOnboardingStep: (step) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, onboardingStep: step }
            : null,
        })),
      
      initializeUser: () => {
        try {
          // This function is called to initialize the user state
          // The actual user data is loaded from AsyncStorage via the persist middleware
          const state = get();
          if (state.user) {
            console.log("User initialized:", state.user.name);
            set({ isPremium: state.user.isPremium || state.isPremium });
          } else {
            console.log("No user found in storage");
          }
        } catch (error) {
          console.error("Error in initializeUser:", error);
          // Don't crash the app if user initialization fails
          set({ error: "Failed to initialize user" });
        }
      },
      
      createUser: (userData) => {
        const newUser: UserProfile = {
          id: Math.random().toString(36).substring(2, 15),
          name: userData.name,
          email: userData.email,
          bio: "",
          careerGoal: "",
          homeCountry: userData.homeCountry,
          destinationCountry: userData.destinationCountry,
          educationBackground: {
            level: "bachelors" as EducationLevel,
          },
          testScores: [],
          universities: [],
          documents: [],
          journeyProgress: getJourneyProgressForCountry(userData.destinationCountry.code),
          memories: [],
          onboardingCompleted: false,
          onboardingStep: 0,
          isPremium: false,
          premiumSince: null,
        };
        set({ user: newUser, isPremium: false });
      },
      
      setPremium: (isPremium) =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                isPremium,
                premiumSince: isPremium ? new Date().toISOString() : null,
              }
            : null,
          isPremium,
        })),
      
      updateDestinationCountry: (country) =>
        set((state) => {
          if (!state.user) return state;
          
          console.log("Updating destination country to:", country.name);
          
          // Generate new journey progress for the new destination country
          const newJourneyProgress = getJourneyProgressForCountry(country.code);
          console.log("Generated new journey progress with", newJourneyProgress.length, "stages");
          
          const updatedUser = {
            ...state.user,
            destinationCountry: country,
            journeyProgress: newJourneyProgress,
          };
          
          // Note: Journey store update should be handled by the component
          // that calls this action, not here, to avoid side effects in render path
          
          return {
            user: updatedUser,
          };
        }),
      
      updateHomeCountry: (country) =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                homeCountry: country,
              }
            : null,
        })),
    }),
    {
      name: "user-storage",
      storage: createJSONStorage(() => safeAsyncStorage),
    }
  )
);