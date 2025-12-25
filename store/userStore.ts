import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserProfile, Country, EducationLevel, SubscriptionTier } from "@/types/user";
import { flattedStorage } from "@/utils/hermesStorage";

interface UserState {
  user: UserProfile | null;
  isLoading: boolean;
  authInitializing: boolean;
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
  setAuthInitializing: (value: boolean) => void;
}

const normalizeTier = (tier?: string | null): SubscriptionTier => {
  if (!tier) return "free";
  const lower = tier.toLowerCase();
  if (lower === "premium" || lower === "pro" || lower === "standard" || lower === "basic") {
    return lower as SubscriptionTier;
  }
  return "free";
};

const isPremiumTier = (tier?: string | null) => {
  if (!tier) return false;
  const lower = tier.toLowerCase();
  return lower === "premium" || lower === "pro";
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      authInitializing: true,
      error: null,
      isPremium: false,
      
      setUser: (user) => {
        const tier = user.subscriptionTier ? normalizeTier(user.subscriptionTier) : (user.isPremium ? "premium" : "free");
        set({ 
          user: { ...user, subscriptionTier: tier },
          isPremium: user.isPremium || isPremiumTier(tier) 
        });
      },
      
      updateUser: (userData) =>
        set((state) => {
          const updatedUser = state.user ? { ...state.user, ...userData } : null;
          const tier = updatedUser
            ? (updatedUser.subscriptionTier
                ? normalizeTier(updatedUser.subscriptionTier)
                : (updatedUser.isPremium ? "premium" : (state.user?.subscriptionTier || "free")))
            : "free";
          return {
            user: updatedUser ? { ...updatedUser, subscriptionTier: tier } : null,
            isPremium: updatedUser ? (updatedUser.isPremium || isPremiumTier(tier)) : state.isPremium,
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
          set({ isPremium: state.user.isPremium || state.isPremium });
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
          journeyProgress: [], // Journey progress will be loaded from database
          memories: [],
          onboardingCompleted: false,
          onboardingStep: 0,
          isPremium: false,
          premiumSince: null,
          subscriptionTier: "free",
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
                subscriptionTier: isPremium ? "premium" : state.user.subscriptionTier || "free",
              }
            : null,
          isPremium,
        })),
      
      updateDestinationCountry: (country) =>
        set((state) => {
          if (!state.user) return state;
          
          console.log("Updating destination country to:", country.name);
          
          // Update destination country - journey progress will be fetched from database
          // by the journey screen when it detects the country change
          const updatedUser = {
            ...state.user,
            destinationCountry: country,
            // Clear journey progress - it will be reloaded from database
            journeyProgress: [],
          };
          
          // Don't call refreshJourney here - it causes race conditions
          // The journey screen will automatically fetch new data when it detects
          // the destination country change via useEffect dependency
          
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

      setAuthInitializing: (value) => set({ authInitializing: value }),
    }),
    {
      name: "user-storage",
      storage: flattedStorage,
      version: 3, // Bump to clear old incorrectly serialized data
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('❌ User store rehydration error, using defaults:', error);
        } else if (state) {
          console.log('✅ User store rehydrated successfully');
        } else {
          console.log('ℹ️  User store: no persisted data, using defaults');
        }
      },
    }
  )
);
