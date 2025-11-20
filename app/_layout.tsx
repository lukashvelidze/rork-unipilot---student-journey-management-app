import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { useColors } from "@/hooks/useColors";
import { useThemeStore } from "@/store/themeStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";
import { useUserStore } from "@/store/userStore";

// Conditionally import ElevenLabsProvider - it requires native modules and won't work in Expo Go
let ElevenLabsProvider: any = null;
try {
  const elevenLabsModule = require("@elevenlabs/react-native");
  ElevenLabsProvider = elevenLabsModule.ElevenLabsProvider;
} catch (error) {
  console.log("ElevenLabs SDK not available (likely running in Expo Go)");
}

// Check if running in Expo Go
const isExpoGo = Constants.executionEnvironment === "storeClient";

// Create a client
const queryClient = new QueryClient();

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) {
      console.error("Font loading error:", error);
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded && !error) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const Colors = useColors();
  const { isDarkMode } = useThemeStore();
  const initializeUser = useUserStore((state) => state.initializeUser);
  
  useEffect(() => {
    // Initialize user when app starts
    if (initializeUser) {
      try {
        initializeUser();
      } catch (error) {
        console.error("Error initializing user:", error);
      }
    }
  }, [initializeUser]);

  // Wrap with ElevenLabsProvider only if available (not in Expo Go)
  const AppContent = (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: Colors.background,
              },
              headerTintColor: Colors.text,
              headerTitleStyle: {
                fontWeight: "600",
                color: Colors.text,
              },
              headerBackTitle: "Back",
              headerBackTitleVisible: false,
              contentStyle: {
                backgroundColor: Colors.background,
              },
              headerShadowVisible: false,
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding/step0-welcome" options={{ title: "Welcome", headerShown: false }} />
            <Stack.Screen name="onboarding/step1-account" options={{ title: "Step 1: Account" }} />
            <Stack.Screen name="onboarding/step2-home-country" options={{ title: "Step 2: Home Country" }} />
            <Stack.Screen name="onboarding/step3-education" options={{ title: "Step 3: Education" }} />
            <Stack.Screen name="onboarding/step4-destination" options={{ title: "Step 4: Destination" }} />
            <Stack.Screen name="onboarding/step5-visa" options={{ title: "Step 5: Visa Type" }} />
            <Stack.Screen name="onboarding/step6-finish" options={{ title: "Step 6: Complete" }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="journey/[id]" options={{ title: "Stage Details" }} />
            <Stack.Screen name="documents/new" options={{ title: "Add Document" }} />
            <Stack.Screen name="documents/[id]" options={{ title: "Document Details" }} />
            <Stack.Screen name="community/new" options={{ title: "New Discussion" }} />
            <Stack.Screen name="community/[id]" options={{ title: "Discussion" }} />
            <Stack.Screen name="memories/new" options={{ title: "New Memory" }} />
            <Stack.Screen name="memories/[id]" options={{ title: "Memory Details" }} />
            <Stack.Screen name="profile/edit" options={{ title: "Edit Profile" }} />
            <Stack.Screen name="profile/personal" options={{ title: "Personal Information" }} />
            <Stack.Screen name="profile/education" options={{ title: "Education" }} />
            <Stack.Screen name="profile/countries" options={{ title: "Countries" }} />
            <Stack.Screen name="profile/budget" options={{ title: "Budget" }} />
            <Stack.Screen name="profile/timeline" options={{ title: "Timeline" }} />
            <Stack.Screen name="profile/goals" options={{ title: "Career Goals" }} />
            <Stack.Screen name="settings" options={{ title: "Settings" }} />
            <Stack.Screen name="tasks" options={{ title: "Tasks" }} />
            <Stack.Screen name="calendar" options={{ title: "Calendar" }} />
            <Stack.Screen name="premium" options={{ title: "UniPilot Premium", headerShown: true }} />
            <Stack.Screen name="premium/index" options={{ title: "UniPilot Premium", headerShown: true }} />
            <Stack.Screen name="premium/interview-simulator" options={{ title: "Interview Simulator", headerShown: true }} />
            <Stack.Screen name="payment-success" options={{ title: "Payment Success", headerShown: true }} />
            <Stack.Screen name="unipilot-ai" options={{ title: "AI Assistant" }} />
          </Stack>
        </QueryClientProvider>
      </trpc.Provider>
  );

  return (
    <SafeAreaProvider>
      <StatusBar 
        style={isDarkMode ? "light" : "dark"} 
        backgroundColor={Colors.background}
      />
      {ElevenLabsProvider && !isExpoGo ? (
        <ElevenLabsProvider>
          {AppContent}
        </ElevenLabsProvider>
      ) : (
        AppContent
      )}
    </SafeAreaProvider>
  );
}