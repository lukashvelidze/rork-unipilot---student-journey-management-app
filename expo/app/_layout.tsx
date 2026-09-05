import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack, usePathname, useGlobalSearchParams } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { PostHogProvider } from "posthog-react-native";
import { posthog } from "@/src/config/posthog";
import { useColors } from "@/hooks/useColors";
import { useThemeStore } from "@/store/themeStore";
import BackButton from "@/components/BackButton";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useUserStore } from "@/store/userStore";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { preRehydrationCleanup } from "@/utils/hermesStorage";
import { supabase } from "@/lib/supabase";
import { ElevenLabsProvider } from "@elevenlabs/react-native";
import { useRevenueCatSync } from "@/hooks/useRevenueCatSync";
import { clearAuthenticatedSessionState } from "@/lib/authSession";

// Import iOS crash prevention at module level (synchronous)
// Wrapped in try/catch for Expo Go compatibility
let IOSCrashPrevention: any = null;
try {
  if (Platform.OS === 'ios') {
    const iosCrashModule = require('@/utils/iosCrashPrevention');
    IOSCrashPrevention = iosCrashModule.IOSCrashPrevention;
  }
} catch (error) {
  console.log("iOS crash prevention not available (likely Expo Go or web)");
}

// Check if running in Expo Go
const isExpoGo = Constants.executionEnvironment === "storeClient";

// Initialize iOS crash prevention IMMEDIATELY (synchronous, before any React rendering)
if (Platform.OS === 'ios' && !isExpoGo && IOSCrashPrevention) {
  try {
    IOSCrashPrevention.initialize();
    console.log('✅ iOS crash prevention initialized synchronously');
  } catch (error) {
    console.error("❌ Failed to initialize iOS crash prevention:", error);
  }
}

// Initialize storage cleanup IMMEDIATELY (before any Zustand rehydration)
// This runs asynchronously in the background but starts before React renders
let cleanupAttempted = false;
async function ensureCleanStorage() {
  if (cleanupAttempted) return;
  cleanupAttempted = true;

  try {
    await preRehydrationCleanup();
    console.log('✅ Storage cleanup completed before rehydration');
  } catch (error) {
    console.error('❌ Failed to pre-cleanup storage:', error);
    // Continue anyway - Layer 2 (enhanced getItem) will handle corrupted data
  }
}

// Call immediately on module load (don't await - let it run in background)
// Zustand stores are created lazily, so this runs before they try to rehydrate
ensureCleanStorage().catch(e => console.error('❌ Cleanup error:', e));

// Create a client with error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

const ONBOARDING_TRANSITION = {
  animation: "fade_from_bottom" as const,
  animationDuration: 360,
  animationTypeForReplace: "push" as const,
  contentStyle: { backgroundColor: "#FFFFFF" },
  freezeOnBlur: true,
  gestureEnabled: true,
  headerShown: false,
};

const ONBOARDING_ENTRY_TRANSITION = {
  ...ONBOARDING_TRANSITION,
  animation: "fade" as const,
  animationDuration: 280,
};

const APP_REVEAL_TRANSITION = {
  animation: "fade" as const,
  animationDuration: 320,
  freezeOnBlur: true,
  headerShown: false,
};

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
  const setAuthInitializing = useUserStore((state) => state.setAuthInitializing);
  const { syncForUser } = useRevenueCatSync();
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const previousPathname = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      posthog.screen(pathname, {
        previous_screen: previousPathname.current ?? null,
        ...params,
      });
      previousPathname.current = pathname;
    }
  }, [pathname, params]);

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

  useEffect(() => {
    let isMounted = true;

    const hydrateSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        await syncForUser(data?.session?.user ?? null);
      } catch (error) {
        console.error("Error hydrating auth session:", error);
      } finally {
        if (isMounted) {
          setAuthInitializing(false);
        }
      }
    };

    hydrateSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        clearAuthenticatedSessionState();
      }

      syncForUser(session?.user ?? null).catch((error) => {
        console.error("RevenueCat sync failed:", error);
      });
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [setAuthInitializing, syncForUser]);


  const AppContent = (
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
            headerLeft: ({ tintColor, canGoBack }) =>
              canGoBack ? <BackButton color={tintColor || Colors.text} /> : null,
            contentStyle: {
              backgroundColor: Colors.background,
            },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="index" options={ONBOARDING_ENTRY_TRANSITION} />
          <Stack.Screen
            name="sign-in"
            options={{ ...ONBOARDING_TRANSITION, title: "Sign In" }}
          />
          <Stack.Screen
            name="onboarding/index"
            options={ONBOARDING_ENTRY_TRANSITION}
          />
          <Stack.Screen
            name="onboarding/step0-welcome"
            options={{ ...ONBOARDING_ENTRY_TRANSITION, title: "Welcome" }}
          />
          <Stack.Screen
            name="onboarding/step1-account"
            options={ONBOARDING_TRANSITION}
          />
          <Stack.Screen
            name="onboarding/step2-home-country"
            options={ONBOARDING_TRANSITION}
          />
          <Stack.Screen
            name="onboarding/step3-education"
            options={ONBOARDING_TRANSITION}
          />
          <Stack.Screen
            name="onboarding/step4-destination"
            options={ONBOARDING_TRANSITION}
          />
          <Stack.Screen
            name="onboarding/step5-visa"
            options={ONBOARDING_TRANSITION}
          />
          <Stack.Screen name="(tabs)" options={APP_REVEAL_TRANSITION} />
          <Stack.Screen name="journey/[id]" options={{ title: "Stage Details" }} />
          <Stack.Screen name="documents/new" options={{ title: "Add Document" }} />
          <Stack.Screen name="documents/[id]" options={{ title: "Document Details" }} />
          <Stack.Screen name="memories/new" options={{ title: "New Memory" }} />
          <Stack.Screen name="memories/[id]" options={{ title: "Memory Details" }} />
          <Stack.Screen name="profile/edit" options={{ title: "Edit Profile" }} />
          <Stack.Screen name="profile/personal" options={{ title: "Personal Information" }} />
          <Stack.Screen name="profile/education" options={{ title: "Education" }} />
          <Stack.Screen name="profile/countries" options={{ title: "Countries" }} />
          <Stack.Screen name="profile/budget" options={{ title: "Budget" }} />
          <Stack.Screen name="profile/timeline" options={{ title: "Timeline" }} />
          <Stack.Screen name="profile/goals" options={{ title: "Career Goals" }} />
          <Stack.Screen name="settings/index" options={{ title: "Settings" }} />
          <Stack.Screen name="premium/index" options={{ title: "UniPilot Premium", headerShown: true }} />
          <Stack.Screen name="premium/interview-simulator" options={{ title: "Interview Simulator", headerShown: true }} />
          <Stack.Screen name="payment-success" options={{ title: "Payment Success", headerShown: true }} />
          <Stack.Screen name="unipilot-ai/index" options={{ title: "AI Assistant" }} />
        </Stack>
      </QueryClientProvider>
  );

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Root error boundary caught error:', error);
        console.error('Error info:', errorInfo);
        posthog.captureException(error instanceof Error ? error : new Error(String(error)));
      }}
    >
      <SafeAreaProvider>
        <StatusBar
          style={isDarkMode ? "light" : "dark"}
          backgroundColor={Colors.background}
        />
        <PostHogProvider
          client={posthog}
          autocapture={{
            captureScreens: false,
            captureTouches: true,
            propsToCapture: ['testID'],
          }}
        >
          <ElevenLabsProvider>
            {AppContent}
          </ElevenLabsProvider>
        </PostHogProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
