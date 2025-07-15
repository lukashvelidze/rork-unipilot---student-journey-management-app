import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useThemeStore } from "@/store/themeStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";
import { useUserStore } from "@/store/userStore";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { checkAndResetIfNeeded } from "@/utils/emergencyReset";

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
      // Don't block app startup due to font errors
      SplashScreen.hideAsync();
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
  const [isStoreReady, setIsStoreReady] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    // Safely initialize stores with proper error handling and timing
    const initializeStores = async () => {
      try {
        // Check if we need to perform emergency reset due to repeated crashes
        const wasReset = await checkAndResetIfNeeded();
        if (wasReset) {
          console.log('Emergency reset performed, continuing with fresh state');
        }
        
        // Small delay to let stores hydrate from AsyncStorage
        await new Promise(resolve => setTimeout(resolve, wasReset ? 500 : 200));
        
        // Safely access theme store
        const themeStore = useThemeStore.getState();
        if (themeStore) {
          setIsDarkMode(themeStore.isDarkMode);
        }
        
        // Safely initialize user store
        const userStore = useUserStore.getState();
        if (userStore && userStore.initializeUser) {
          await userStore.initializeUser();
        }
        
        setIsStoreReady(true);
      } catch (error) {
        console.error("Error initializing stores:", error);
        // Set ready anyway to prevent infinite loading
        setIsStoreReady(true);
      }
    };
    
    initializeStores();
  }, []);
  
  // Use default colors until stores are ready
  const defaultColors = {
    background: isDarkMode ? '#000000' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#000000',
  };
  
  const Colors = isStoreReady ? useColors() : defaultColors;

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar 
          style={isDarkMode ? "light" : "dark"} 
          backgroundColor={Colors.background}
        />
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
              contentStyle: {
                backgroundColor: Colors.background,
              },
              headerShadowVisible: false,
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
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
            <Stack.Screen name="premium" options={{ title: "UniPilot Premium" }} />
            <Stack.Screen name="premium/resources" options={{ title: "Premium Resources" }} />
            <Stack.Screen name="premium/[id]" options={{ title: "Resource" }} />
            <Stack.Screen name="unipilot-ai" options={{ title: "AI Assistant" }} />
            </Stack>
          </QueryClientProvider>
        </trpc.Provider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}