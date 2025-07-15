import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useUserStore } from "@/store/userStore";
import Colors from "@/constants/colors";

export default function IndexScreen() {
  const router = useRouter();
  const { user } = useUserStore();

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      try {
        // Wait for user store to be properly initialized (handled in _layout.tsx)
        // Small delay to ensure store hydration is complete
        await new Promise(resolve => setTimeout(resolve, 800));
        
        if (!user || !user.onboardingCompleted) {
          console.log("Redirecting to onboarding - user:", user);
          router.replace("/onboarding");
        } else {
          console.log("Redirecting to tabs - user:", user.name);
          router.replace("/(tabs)");
        }
      } catch (error) {
        console.error("Error during initialization redirect:", error);
        // Fallback to onboarding if there's any error
        router.replace("/onboarding");
      }
    };

    checkUserAndRedirect();
  }, [user, router]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}