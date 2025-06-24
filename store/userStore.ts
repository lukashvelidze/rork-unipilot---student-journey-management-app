import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserProfile, Country, EducationLevel } from "@/types/user";
import { initialJourneyProgress } from "@/mocks/journeyTasks";

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
            isPremium: updatedUser?.isPremium || false,
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
        // This function is called to initialize the user state
        // The actual user data is loaded from AsyncStorage via the persist middleware
        const state = get();
        if (state.user) {
          console.log("User initialized:", state.user.name);
          set({ isPremium: state.user.isPremium || false });
        } else {
          console.log("No user found in storage");
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
          journeyProgress: initialJourneyProgress,
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
    }),
    {
      name: "user-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);