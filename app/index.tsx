import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useUserStore } from "@/store/userStore";
import { useColors } from "@/hooks/useColors";

export default function IndexScreen() {
  const router = useRouter();
  const Colors = useColors();
  const { user, initializeUser } = useUserStore();
  
  // Initialize user on mount
  useEffect(() => {
    initializeUser();
  }, [initializeUser]);

  useEffect(() => {
    // Small delay to ensure store is properly initialized
    const timer = setTimeout(() => {
      const currentUser = useUserStore.getState().user;
      if (!currentUser || !currentUser.onboardingCompleted) {
        console.log("Redirecting to onboarding - user:", currentUser);
        router.replace("/onboarding/index");
      } else {
        console.log("Redirecting to tabs - user:", currentUser.name);
        router.replace("/(tabs)");
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [user, router]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}