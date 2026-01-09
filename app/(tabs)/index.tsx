import React, { useEffect, useState, useCallback, useRef } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Award, TrendingUp, Crown, Zap, Target, Calendar, UserCheck, BarChart3, Video, CheckSquare, Mic, MessageSquare, BookOpen } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import Card from "@/components/Card";
import ProgressBar from "@/components/ProgressBar";
import QuoteCard from "@/components/QuoteCard";
import { useUserStore } from "@/store/userStore";
import { useJourneyStore } from "@/store/journeyStore";
import { useAppStateStore } from "@/store/appStateStore";
import { calculateOverallProgress } from "@/utils/helpers";
import { getRandomQuote, generalQuotes } from "@/mocks/quotes";
import { supabase, getCountries } from "@/lib/supabase";
import { formatEnumValue } from "@/utils/safeStringOps";
import { SubscriptionTier, Country } from "@/types/user";

// Timeout wrapper for Supabase calls
const withTimeout = <T,>(
  promise: PromiseLike<T>,
  timeoutMs: number = 10000,
  errorMessage: string = 'Operation timed out'
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);

    Promise.resolve(promise)
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error: unknown) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
};

export default function HomeScreen() {
  const router = useRouter();
  const Colors = useColors();
  const { user, setUser, updateUser, logout } = useUserStore();
  const { journeyProgress, setJourneyProgress } = useJourneyStore();
  const { inCriticalFlow } = useAppStateStore();
  const authInitializing = useUserStore((state) => state.authInitializing);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);

  // Cleanup tracking
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Abort any ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Check subscription status
  const checkSubscriptionStatus = useCallback(async () => {
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const getUserPromise = supabase.auth.getUser();
      const { data: { user: authUser } } = await withTimeout(
        getUserPromise,
        10000,
        'Failed to get user - timeout'
      );

      // Check if component unmounted during async operation
      if (!isMountedRef.current) {
        console.log('Component unmounted, skipping subscription update');
        return;
      }

      if (!authUser) {
        if (isMountedRef.current) {
          setHasActiveSubscription(false);
          setIsCheckingSubscription(false);
        }
        return;
      }

      const getProfilePromise = supabase
        .from("profiles")
        .select("subscription_tier")
        .eq("id", authUser.id)
        .single();

      const { data: profile } = await withTimeout(
        getProfilePromise,
        10000,
        'Failed to fetch profile - timeout'
      );

      // Check again after second async operation
      if (!isMountedRef.current) {
        console.log('Component unmounted, skipping subscription update');
        return;
      }

      const tier = (profile?.subscription_tier || "free").toLowerCase();
      const isSubscribed = ["basic", "standard", "pro", "premium"].includes(tier);

      if (isMountedRef.current) {
        setHasActiveSubscription(isSubscribed);
        updateUser({
          subscriptionTier: tier as SubscriptionTier,
          isPremium: tier === "premium" || tier === "pro",
        });
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
      if (isMountedRef.current) {
        setHasActiveSubscription(false);
      }
    } finally {
      if (isMountedRef.current) {
        setIsCheckingSubscription(false);
      }
    }
  }, []);

  // Check subscription on mount and when screen comes into focus
  useEffect(() => {
    checkSubscriptionStatus();
  }, [checkSubscriptionStatus]);

  useFocusEffect(
    useCallback(() => {
      checkSubscriptionStatus();
    }, [checkSubscriptionStatus])
  );
  
  // Fetch user data from database on mount
  useEffect(() => {
    async function fetchUserData() {
      try {
        const getUserPromise = supabase.auth.getUser();
        const { data: { user: authUser } } = await withTimeout(
          getUserPromise,
          10000,
          'Failed to get user - timeout'
        );

        if (!isMountedRef.current) return;
        if (!authUser) return;

        // Fetch profile from database
        const getProfilePromise = supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();

        const { data: profile, error: profileError } = await withTimeout(
          getProfilePromise,
          10000,
          'Failed to fetch profile - timeout'
        );

        if (!isMountedRef.current) return;

        if (profile) {
          // Fetch countries - using top-level import
          const getCountriesPromise = getCountries();
          const countries = await withTimeout(
            getCountriesPromise,
            10000,
            'Failed to fetch countries - timeout'
          );

          if (!isMountedRef.current) return;

          const homeCountryMatch = profile.country_origin
            ? countries.origin.find((c: Country) => c.code === profile.country_origin)
            : undefined;

          const destinationCountryMatch = profile.destination_country
            ? countries.destination.find((c: Country) => c.code === profile.destination_country)
            : undefined;

          const resolvedHomeCountry: Country =
            homeCountryMatch ??
            user?.homeCountry ??
            (profile.country_origin
              ? { code: profile.country_origin, name: profile.country_origin, flag: "" }
              : { code: "UNK", name: "Unknown", flag: "" });

          const resolvedDestinationCountry: Country =
            destinationCountryMatch ??
            user?.destinationCountry ??
            (profile.destination_country
              ? { code: profile.destination_country, name: profile.destination_country, flag: "" }
              : { code: "UNK", name: "Unknown", flag: "" });

          // Final check before state update
          if (!isMountedRef.current) return;

          const subscriptionTier = (profile.subscription_tier || user?.subscriptionTier || "free").toLowerCase() as SubscriptionTier;
          const premiumPlan = subscriptionTier === "premium" || subscriptionTier === "pro";

          // Update user store with database data
          setUser({
            ...user!,
            id: authUser.id,
            name: profile.full_name || "",
            email: profile.email || authUser.email || "",
            homeCountry: resolvedHomeCountry,
            destinationCountry: resolvedDestinationCountry,
            educationBackground: {
              level: (profile.level_of_study as any) || user?.educationBackground?.level || "bachelors",
            },
            bio: profile.bio ?? undefined,
            onboardingCompleted: !!profile.visa_type,
            subscriptionTier,
            isPremium: premiumPlan,
          });

          // Journey progress is now fetched from Supabase in the journey page
          // No need to initialize here with mock data
        } else {
          console.error("Error fetching profile:", profileError);
          // If the profile is missing (e.g., deleted), sign out and reset to onboarding
          await supabase.auth.signOut();
          await logout();
          router.replace("/onboarding/step1-account");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        // Don't update state on error if unmounted
      }
    }

    if (user && isMountedRef.current) {
      fetchUserData();
    }
  }, []); // Empty dependency array - only run once on mount

  // Redirect to onboarding if user is not set up
  // Skip redirect if in a critical flow (e.g., interview simulator)
  useEffect(() => {
    // Don't redirect during critical flows like interview simulator
    if (inCriticalFlow || authInitializing) {
      return;
    }

    if (!user) {
      console.log("No user found, redirecting to onboarding");
      router.replace("/onboarding");
      return;
    }

    if (!user.onboardingCompleted) {
      console.log("Onboarding not completed, redirecting");
      router.replace("/onboarding");
      return;
    }
  }, [user, router, inCriticalFlow, authInitializing]);
  
  if (!user) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: Colors.background }]}>
        <Text style={[styles.loadingText, { color: Colors.lightText }]}>Setting up your journey...</Text>
      </SafeAreaView>
    );
  }
  
  const overallProgress = calculateOverallProgress(journeyProgress);
  const dailyQuote = getRandomQuote(generalQuotes);
  const tierLabels: Record<string, string> = {
    free: "Free",
    basic: "Basic",
    standard: "Standard",
    premium: "Premium",
    pro: "Premium",
  };
  const effectiveTier = (user.subscriptionTier || (hasActiveSubscription ? "standard" : "free")).toLowerCase();
  const subscriptionLabel = tierLabels[effectiveTier] || "Free";
  const isTopTier = effectiveTier === "premium" || effectiveTier === "pro";
  const tierOrder: Record<string, number> = { free: 0, basic: 1, standard: 2, premium: 3, pro: 3 };
  const hasStandardAccess = (tierOrder[effectiveTier] || 0) >= tierOrder["standard"];
  
  // Get current active stage (first incomplete stage)
  const currentStage = journeyProgress.find(stage => !stage.completed) || journeyProgress[0];
  const completedStages = journeyProgress.filter(stage => stage.completed).length;
  
  // Get next few tasks from current stage
  const upcomingTasks = currentStage?.tasks.filter(task => !task.completed).slice(0, 3) || [];
  
  // Handle premium feature access
  const handlePremiumFeature = (featureName: string, route: string) => {
    if (hasActiveSubscription) {
      router.push(route as any);
    } else {
      Alert.alert(
        "Premium Feature",
        `${featureName} is available with a premium subscription. Upgrade to unlock this feature and more!`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "View Plans", onPress: () => router.push("/premium") },
        ]
      );
    }
  };

  const handleStandardFeature = (featureName: string, route: string) => {
    if (hasStandardAccess) {
      router.push(route as any);
    } else {
      Alert.alert(
        "Upgrade required",
        `${featureName} is available on the Standard plan or higher.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "View Plans", onPress: () => router.push("/premium") },
        ]
      );
    }
  };

  // Base quick actions (always available)
  const baseQuickActions = [
    {
      title: "Application Checklist",
      description: "Complete guide to applications",
      icon: CheckSquare,
      color: Colors.primary,
      onPress: () => router.push("/application-checklist"),
      isPremium: false,
    },
    {
      title: "Continue Journey",
      description: `${formatEnumValue(currentStage?.stage || '').toUpperCase()} stage`,
      icon: TrendingUp,
      color: Colors.secondary,
      onPress: () => router.push("/(tabs)/journey"),
      isPremium: false,
    },
  ];

  // Premium quick actions (advertising)
  const premiumQuickActions = [
    {
      title: "Articles",
      description: hasActiveSubscription ? "Read curated guides" : "Premium: curated guides",
      icon: BookOpen,
      color: Colors.primary,
      onPress: () => handlePremiumFeature("Articles", "/premium/articles"),
      isPremium: true,
    },
    {
      title: "AI Assistant",
      description: hasActiveSubscription ? "Get personalized guidance" : "Premium: AI-powered help",
      icon: MessageSquare,
      color: Colors.accent,
      onPress: () => handlePremiumFeature("AI Assistant", "/(tabs)/premium"),
      isPremium: true,
    },
    {
      title: "Interview Simulator",
      description: hasActiveSubscription ? "Practice visa interviews" : "Premium: Practice interviews",
      icon: Mic,
      color: Colors.accent,
      onPress: () => handlePremiumFeature("Interview Simulator", "/premium/interview-simulator"),
      isPremium: true,
    },
  ];

  // Combine actions - show premium actions for advertising
  const quickActions = [...baseQuickActions, ...premiumQuickActions];
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]} edges={['top']}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.greeting, { color: Colors.lightText }]}>
                Welcome back,
              </Text>
              <Text style={[styles.name, { color: Colors.text }]}>
                {user.name?.split(' ')[0] || user.name}!
              </Text>
              <View style={[
                styles.subscriptionBadge,
                { backgroundColor: Colors.lightBackground }
              ]}>
                <Crown size={14} color={Colors.primary} />
                <Text style={[
                  styles.subscriptionBadgeText,
                  { color: isTopTier ? Colors.primary : Colors.lightText }
                ]}>
                  {subscriptionLabel} Plan
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        <QuoteCard 
          quote={dailyQuote.text} 
          author={dailyQuote.author} 
          variant="highlight"
        />
        
        <Card style={[styles.progressCard, { backgroundColor: Colors.card }]}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={[styles.progressTitle, { color: Colors.text }]}>Your Journey Progress</Text>
              <Text style={[styles.progressSubtitle, { color: Colors.lightText }]}>
                {completedStages} of {journeyProgress.length} stages completed
              </Text>
            </View>
            <View style={[styles.progressBadge, { backgroundColor: Colors.lightBackground }]}>
              <Award size={20} color={Colors.primary} />
              <Text style={[styles.progressPercent, { color: Colors.primary }]}>{overallProgress}%</Text>
            </View>
          </View>
          
          <ProgressBar 
            progress={overallProgress} 
            height={8} 
            animated={true}
          />
          
          <TouchableOpacity 
            style={[styles.viewJourneyButton, { backgroundColor: Colors.lightBackground }]}
            onPress={() => router.push("/(tabs)/journey")}
          >
            <Text style={[styles.viewJourneyText, { color: Colors.primary }]}>View Full Journey</Text>
          </TouchableOpacity>
        </Card>
        
        {upcomingTasks.length > 0 && (
          <Card style={[styles.tasksCard, { backgroundColor: Colors.card }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: Colors.text }]}>Upcoming Tasks</Text>
              <TouchableOpacity onPress={() => router.push(`/journey/${currentStage?.stage}`)}>
                <Text style={[styles.viewAllText, { color: Colors.primary }]}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {upcomingTasks.map((task, index) => (
              <TouchableOpacity 
                key={task.id} 
                style={styles.taskItem}
                onPress={() => router.push(`/journey/${currentStage?.stage}`)}
              >
                <View style={[styles.taskIndicator, { backgroundColor: task.completed ? Colors.success : Colors.primary }]} />
                <Text style={[styles.taskTitle, { color: Colors.text, textDecorationLine: task.completed ? 'line-through' : 'none' }]}>
                  {task.title}
                </Text>
                {task.completed && (
                  <View style={[styles.taskCompleted, { backgroundColor: Colors.success }]}>
                    <Text style={styles.taskCompletedText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </Card>
        )}
        
        <View style={styles.quickActions}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.actionCard, 
                  { backgroundColor: Colors.white, borderLeftColor: action.color },
                  action.isPremium && !hasActiveSubscription && styles.premiumActionCard
                ]}
                onPress={action.onPress}
              >
                <View style={styles.actionIconContainer}>
                  <action.icon size={24} color={action.color} />
                  {action.isPremium && !hasActiveSubscription && (
                    <View style={[styles.premiumBadge, { backgroundColor: Colors.primary }]}>
                      <Crown size={12} color="#FFFFFF" />
                    </View>
                  )}
                </View>
                <Text style={[styles.actionTitle, { color: Colors.text }]}>{action.title}</Text>
                <Text style={[styles.actionDescription, { color: Colors.lightText }]}>{action.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 16,
    marginBottom: 4,
  },
  name: {
    fontSize: 28,
    fontWeight: "700",
  },
  subscriptionBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    gap: 6,
  },
  subscriptionBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  progressCard: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 14,
  },
  progressBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 6,
  },
  viewJourneyButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  viewJourneyText: {
    fontSize: 14,
    fontWeight: "600",
  },
  premiumFeaturesCard: {
    marginBottom: 20,
    borderWidth: 1,
  },
  premiumSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  premiumGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 16,
  },
  premiumFeatureCard: {
    width: "48%",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  premiumFeatureTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 4,
  },
  premiumFeatureDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  premiumActionsCard: {
    marginBottom: 20,
    borderWidth: 1,
  },
  premiumActionsGrid: {
    marginTop: 12,
  },
  premiumActionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    opacity: 0.9,
  },
  tasksCard: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "500",
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  taskIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  taskTitle: {
    fontSize: 14,
    flex: 1,
  },
  taskCompleted: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  taskCompletedText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  quickActions: {
    marginBottom: 20,
  },
  actionsGrid: {
    marginTop: 12,
  },
  actionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
  },
  actionIconContainer: {
    position: "relative",
  },
  premiumBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  upgradeCard: {
    borderWidth: 1,
    marginBottom: 20,
  },
  upgradeContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  upgradeText: {
    flex: 1,
    marginLeft: 16,
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  upgradeDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  upgradeButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
