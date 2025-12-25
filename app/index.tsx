import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useUserStore } from "@/store/userStore";
import { useColors } from "@/hooks/useColors";
import { useAppStateStore } from "@/store/appStateStore";

export default function IndexScreen() {
  const router = useRouter();
  const Colors = useColors();
  const {
    inCriticalFlow,
    hasBootstrappedNavigation,
  } = useAppStateStore();

  useEffect(() => {
    // Only run redirect logic once, and not during critical flows
    if (hasBootstrappedNavigation || inCriticalFlow) return;

    // Small delay to ensure store is properly initialized
    const timer = setTimeout(() => {
      // Double-check conditions at execution time
      const appState = useAppStateStore.getState();
      if (appState.hasBootstrappedNavigation || appState.inCriticalFlow) return;

      const currentUser = useUserStore.getState().user;
      if (!currentUser || !currentUser.onboardingCompleted) {
        console.log("Redirecting to onboarding - user:", currentUser);
        router.replace("/onboarding");
      } else {
        console.log("Redirecting to tabs - user:", currentUser.name);
        router.replace("/(tabs)");
      }

      // Mark that we bootstrapped - prevents future redirects
      appState.setHasBootstrappedNavigation(true);
    }, 800);

    return () => clearTimeout(timer);
  }, [router, inCriticalFlow, hasBootstrappedNavigation]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}
