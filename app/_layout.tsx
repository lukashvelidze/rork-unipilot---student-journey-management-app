// CRITICAL: Import emergency error handler FIRST - before any other imports
import { EmergencyErrorHandler } from "@/utils/emergencyErrorHandler";
// CRITICAL: Import native module interceptor SECOND - to catch bridge calls
import { NativeModuleInterceptor } from "@/utils/nativeModuleInterceptor";
// CRITICAL: Import RCTExceptionsManager override THIRD - to block fatal reports
import { RCTExceptionsManagerOverride } from "@/utils/rctExceptionsManagerOverride";

import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Platform, ErrorUtils } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useThemeStore } from "@/store/themeStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";
import { useUserStore } from "@/store/userStore";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BridgeErrorHandler } from "@/utils/bridgeErrorHandler";
import { CrashProtectionBoundary } from "@/components/CrashProtectionBoundary";
import { memoryProtection, safeAsyncOperation } from "@/utils/memoryProtection";
import { IOSCrashPrevention } from "@/utils/iosCrashPrevention";

// Initialize emergency error handler first (already done via import)
// Initialize iOS crash prevention
IOSCrashPrevention.initialize();

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on bridge errors
        if (error?.message?.includes('bridge') || error?.message?.includes('TurboModule')) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Set up global error handling immediately
const setupGlobalErrorHandling = () => {
  // Store original handler
  const originalHandler = ErrorUtils.getGlobalHandler();
  
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error('🚨 Global error caught:', error);
    console.error('🚨 Is fatal:', isFatal);
    
    // Check for specific crash patterns from the crash report
    const errorString = String(error);
    const stackTrace = error?.stack || '';
    
    // Detect bridge-related errors
    if (errorString.includes('RCTExceptionsManager') || 
        errorString.includes('facebook::react::invokeInner') ||
        errorString.includes('TurboModule') ||
        stackTrace.includes('RCTNativeModule')) {
      console.error('🚨 Bridge error detected - preventing crash');
      
      // Don't let bridge errors crash the app
      if (isFatal) {
        console.error('🚨 Fatal bridge error converted to non-fatal');
        // Call original handler with non-fatal flag
        if (originalHandler) {
          originalHandler(error, false);
        }
        return;
      }
    }
    
    // Handle memory/alignment errors
    if (errorString.includes('alignment') || 
        errorString.includes('EXC_BAD_ACCESS') ||
        errorString.includes('SIGABRT')) {
      console.error('🚨 Memory/alignment error detected');
      memoryProtection.performMemoryCheck();
      
      // Don't crash on memory errors
      if (isFatal) {
        console.error('🚨 Fatal memory error converted to non-fatal');
        if (originalHandler) {
          originalHandler(error, false);
        }
        return;
      }
    }
    
    // For all other errors, use original handler
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
};

// Set up global error handling immediately
setupGlobalErrorHandling();

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
    // Initialize memory protection
    memoryProtection.performMemoryCheck();
    
    // Sequential app initialization with memory protection
    const initializeApp = async () => {
      try {
        console.log('Starting app initialization with crash protection...');
        
        // Step 1: Initialize user store with iOS crash prevention
        if (initializeUser) {
          await IOSCrashPrevention.safeExecute(
            async () => {
              await BridgeErrorHandler.withTimeout(
                () => Promise.resolve(initializeUser()),
                3000,
                'user-initialization'
              );
            },
            'user-store-initialization',
            undefined
          );
        }
        
        // Step 2: Memory check and small delay to ensure bridge stability
        memoryProtection.performMemoryCheck();
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Step 3: Set app as ready
        setIsAppReady(true);
        console.log('App initialization complete with crash protection');
        
      } catch (error) {
        console.error('App initialization error:', error);
        // Trigger memory cleanup before continuing
        memoryProtection.performMemoryCheck();
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
    <CrashProtectionBoundary>
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
    </CrashProtectionBoundary>
  );
}