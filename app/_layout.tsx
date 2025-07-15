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
import { BridgeErrorHandler } from "@/utils/bridgeErrorHandler";

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
  const Colors = useColors();
  const { isDarkMode } = useThemeStore();
  const initializeUser = useUserStore((state) => state.initializeUser);
  const [isAppReady, setIsAppReady] = useState(false);
  
  useEffect(() => {
    // Sequential app initialization to prevent race conditions
    const initializeApp = async () => {
      try {
        console.log('Starting app initialization...');
        
        // Step 1: Initialize user store with bridge safety
        if (initializeUser) {
          await BridgeErrorHandler.withTimeout(
            () => Promise.resolve(initializeUser()),
            3000,
            'user-initialization'
          );
        }
        
        // Step 2: Small delay to ensure bridge stability
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Step 3: Set app as ready
        setIsAppReady(true);
        console.log('App initialization complete');
        
      } catch (error) {
        console.error('App initialization error:', error);
        // Continue anyway - don't block app startup
        setIsAppReady(true);
      }
    };
    
    initializeApp();
    
    // Setup global error handlers
    const unhandledRejectionHandler = (event: any) => {
      console.error('Unhandled promise rejection:', event.reason);
      // Don't crash the app
      if (event.preventDefault) {
        event.preventDefault();
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', unhandledRejectionHandler);
      
      return () => {
        window.removeEventListener('unhandledrejection', unhandledRejectionHandler);
      };
    }
  }, [initializeUser]);
  
  // Show loading screen while app initializes
  if (!isAppReady) {
    return null; // or a loading component
  }

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