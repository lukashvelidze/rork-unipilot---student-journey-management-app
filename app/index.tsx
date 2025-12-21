import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useUserStore } from "@/store/userStore";
import { useColors } from "@/hooks/useColors";
import { useAppStateStore } from "@/store/appStateStore";

export default function IndexScreen() {
  const router = useRouter();
  const Colors = useColors();
  const { user, initializeUser } = useUserStore();
  const {
    inCriticalFlow,
    hasBootstrappedNavigation,
    setHasBootstrappedNavigation,
  } = useAppStateStore();
  
  // Initialize user on mount
  useEffect(() => {
    initializeUser();
  }, [initializeUser]);

  useEffect(() => {
    // Prevent global redirects during critical flows (e.g., interview session)
    if (inCriticalFlow) return;

    // Small delay to ensure store is properly initialized
    const timer = setTimeout(() => {
      // Bail out if another part of the app marked a critical flow
      if (useAppStateStore.getState().inCriticalFlow) return;

      const currentUser = useUserStore.getState().user;
      if (!currentUser || !currentUser.onboardingCompleted) {
        console.log("Redirecting to onboarding - user:", currentUser);
        router.replace("/onboarding");
      } else {
        console.log("Redirecting to tabs - user:", currentUser.name);
        router.replace("/(tabs)");
      }

      // Mark that we bootstrapped at least once (used elsewhere for logging)
      setHasBootstrappedNavigation(true);
    }, 800);

    return () => clearTimeout(timer);
  }, [user, router, inCriticalFlow, hasBootstrappedNavigation, setHasBootstrappedNavigation]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}
