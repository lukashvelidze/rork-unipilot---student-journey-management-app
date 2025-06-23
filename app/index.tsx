import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useUserStore } from "@/store/userStore";
import Colors from "@/constants/colors";

export default function IndexScreen() {
  const router = useRouter();
  const { user, initializeUser } = useUserStore();

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      // Initialize user if needed
      initializeUser();
      
      // Small delay to ensure store is properly initialized
      setTimeout(() => {
        if (!user || !user.onboardingCompleted) {
          console.log("Redirecting to onboarding");
          router.replace("/onboarding");
        } else {
          console.log("Redirecting to tabs");
          router.replace("/(tabs)");
        }
      }, 100);
    };

    checkUserAndRedirect();
  }, [user, router, initializeUser]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}