import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, Stack, useFocusEffect } from "expo-router";
import { Crown, Check, Zap, Star, ArrowLeft, Mic, MessageSquare, BookOpen, Lock } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import Button from "@/components/Button";
import Card from "@/components/Card";
import { supabase } from "@/lib/supabase";
import { BillingPlan, getAvailablePlans, purchasePlan, isAppleIapAvailable } from "@/lib/billing";

interface PremiumResource {
  id: string;
  title: string;
  description: string;
  icon: any;
  comingSoon: boolean;
  route?: string;
  proOnly?: boolean;
}

const PLAN_ICONS: Record<string, any> = {
  basic: Zap,
  standard: Star,
  premium: Crown,
  pro: Crown,
};

const normalizeTierForUi = (tier?: string | null) => {
  if (!tier) return null;
  return tier === "premium" ? "pro" : tier;
};

const displayTierName = (tier: string) => {
  if (tier === "premium" || tier === "pro") return "Pro";
  return tier.charAt(0).toUpperCase() + tier.slice(1);
};

export default function PremiumScreen() {
  const Colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [currentTier, setCurrentTier] = useState<string | null>(null);
  const [subscriptionPlatform, setSubscriptionPlatform] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);

  const checkSubscriptionStatus = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setIsLoading(false);
        setSubscriptionPlatform(null);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("subscription_tier, subscription_platform")
        .eq("id", authUser.id)
        .single();

      if (profileError) {
        console.error("Error fetching subscription profile:", profileError);
        setCurrentTier(null);
        setSubscriptionPlatform(null);
        return;
      }

      const tier = normalizeTierForUi(profile?.subscription_tier);
      const hasTier = tier && tier !== "free";
      setSubscriptionPlatform(profile?.subscription_platform || null);

      if (hasTier) {
        setCurrentTier(tier);
      } else {
        setCurrentTier(null);
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
      setCurrentTier(null);
      setSubscriptionPlatform(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadPlans = useCallback(async () => {
    try {
      setIsLoadingPlans(true);
      setPlansError(null);
      const availablePlans = await getAvailablePlans();
      setPlans(availablePlans);
    } catch (error) {
      console.error("Error loading available plans:", error);
      setPlansError("Unable to load plans right now. Please try again.");
    } finally {
      setIsLoadingPlans(false);
    }
  }, []);

  const handlePurchase = async (plan: BillingPlan) => {
    try {
      setIsProcessing(plan.id);

      const result = await purchasePlan(plan.id);

      if (!result.success) {
        Alert.alert("Purchase failed", result.error || "Please try again.");
        return;
      }

      if (result.platform === "apple") {
        Alert.alert(
          "Processing purchase",
          "We're verifying your Apple subscription with Supabase. Your access will update once confirmed."
        );
        await checkSubscriptionStatus();
      } else {
        Alert.alert(
          "Checkout opened",
          "Complete the Paddle checkout to activate your subscription."
        );
      }
    } catch (error: any) {
      console.error("Error handling purchase:", error);
      Alert.alert("Error", "Failed to start purchase. Please try again.");
    } finally {
      setIsProcessing(null);
    }
  };

  useEffect(() => {
    checkSubscriptionStatus();
    loadPlans();
  }, [checkSubscriptionStatus, loadPlans]);

  useFocusEffect(
    useCallback(() => {
      checkSubscriptionStatus();
    }, [checkSubscriptionStatus])
  );

  // Check if user has an active subscription (basic, standard, or pro/premium)
  const hasActiveSubscription = currentTier && ["basic", "standard", "pro", "premium"].includes(currentTier);

  // Check if user has Pro tier access
  const hasProAccess = currentTier === "pro" || currentTier === "premium";

  // Premium resources that will be linked to checklist items later
  const premiumResources: PremiumResource[] = [
    {
      id: "interview-simulator",
      title: "Interview Simulator",
      description: "Practice visa and university interviews with AI-powered simulations",
      icon: Mic,
      comingSoon: false,
      route: "/premium/interview-simulator",
      proOnly: true,
    },
    {
      id: "ai-chats",
      title: "AI Chats",
      description: "Get personalized guidance and answers from our AI assistant",
      icon: MessageSquare,
      comingSoon: true,
      proOnly: false,
    },
    {
      id: "articles",
      title: "Articles",
      description: "Curated guides, webinars, and articles for your journey",
      icon: BookOpen,
      comingSoon: false,
      route: "/premium/articles",
      proOnly: false,
    },
  ];

  const handleResourcePress = (resourceId: string) => {
    const resource = premiumResources.find(r => r.id === resourceId);
    if (!resource) return;

    if (resource.comingSoon) {
      Alert.alert(
        "Coming Soon",
        `${resource.title} will be available soon. This feature will be linked to help icons in your checklist items.`
      );
    } else if (resource.route) {
      router.push(resource.route as any);
    }
  };

  if (isLoading || isLoadingPlans) {
    const loadingMessage = isLoading ? "Loading subscription status..." : "Loading plans...";
    return (
      <View style={[styles.container, { backgroundColor: Colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.loadingText, { color: Colors.lightText }]}>{loadingMessage}</Text>
        </View>
      </View>
    );
  }

  // Show premium resources home page if user has active subscription
  if (hasActiveSubscription) {
    return (
      <ScrollView 
        style={[styles.container, { backgroundColor: Colors.background, paddingBottom: insets.bottom }]} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Stack.Screen
          options={{
            title: "Premium Resources",
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => router.replace("/(tabs)")}
                style={{ marginLeft: 8 }}
              >
                <ArrowLeft size={24} color={Colors.text} />
              </TouchableOpacity>
            ),
          }}
        />
        {/* Header */}
        <View style={styles.header}>
          <Crown size={48} color={Colors.primary} />
          <Text style={[styles.title, { color: Colors.text }]}>
            Premium Resources
          </Text>
          <Text style={[styles.subtitle, { color: Colors.lightText }]}>
            Access exclusive resources to enhance your journey
          </Text>
          {currentTier && (
            <View style={[styles.currentTierBadge, { backgroundColor: Colors.success + "20" }]}>
              <Text style={[styles.currentTierText, { color: Colors.success }]}>
                {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)} Plan
              </Text>
            </View>
          )}
          {subscriptionPlatform && (
            <Text style={[styles.subscriptionPlatformText, { color: Colors.lightText }]}>
              Managed via {subscriptionPlatform === "apple" ? "Apple" : "Paddle"}
            </Text>
          )}
        </View>

        {/* Premium Resources */}
        <View style={styles.resourcesContainer}>
          {premiumResources.map((resource) => {
            const IconComponent = resource.icon;
            return (
              <Card
                key={resource.id}
                style={[
                  styles.resourceCard,
                  { backgroundColor: Colors.card },
                ]}
                variant="elevated"
              >
                <TouchableOpacity
                  onPress={() => handleResourcePress(resource.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.resourceContent}>
                    <View style={[styles.resourceIconContainer, { backgroundColor: Colors.primary + "20" }]}>
                      <IconComponent size={32} color={Colors.primary} />
                    </View>
                    <View style={styles.resourceTextContainer}>
                      <Text style={[styles.resourceTitle, { color: Colors.text }]}>
                        {resource.title}
                      </Text>
                      <Text style={[styles.resourceDescription, { color: Colors.lightText }]}>
                        {resource.description}
                      </Text>
                    </View>
                    {resource.comingSoon && (
                      <View style={[styles.comingSoonBadge, { backgroundColor: Colors.primary + "20" }]}>
                        <Text style={[styles.comingSoonText, { color: Colors.primary }]}>
                          Soon
                        </Text>
                      </View>
                    )}
                    {!resource.comingSoon && resource.proOnly && !hasProAccess && (
                      <View style={[styles.proOnlyBadge, { backgroundColor: Colors.warning + "20" }]}>
                        <Lock size={12} color={Colors.warning} />
                        <Text style={[styles.proOnlyText, { color: Colors.warning }]}>
                          Pro
                        </Text>
                      </View>
                    )}
                    {!resource.comingSoon && (!resource.proOnly || hasProAccess) && (
                      <View style={[styles.availableBadge, { backgroundColor: Colors.success + "20" }]}>
                        <Text style={[styles.availableText, { color: Colors.success }]}>
                          Available
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </Card>
            );
          })}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={[styles.infoTitle, { color: Colors.text }]}>
            How It Works
          </Text>
          <Text style={[styles.infoText, { color: Colors.lightText }]}>
            These resources will be linked to help icons within your checklist items. Click on help icons to access detailed guides, webinars, and interactive tools for each task.
          </Text>
        </View>
      </ScrollView>
    );
  }

  // Show pricing tiers for free users
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: Colors.background, paddingBottom: insets.bottom }]} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Stack.Screen
        options={{
          title: "UniPilot Premium",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.replace("/(tabs)")}
              style={{ marginLeft: 8 }}
            >
              <ArrowLeft size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      {/* Header */}
      <View style={styles.header}>
        <Crown size={48} color={Colors.primary} />
        <Text style={[styles.title, { color: Colors.text }]}>
          Choose Your Plan
        </Text>
        <Text style={[styles.subtitle, { color: Colors.lightText }]}>
          Unlock premium features and accelerate your journey
        </Text>
      </View>

      {/* Subscription Tiers */}
      <View style={styles.tiersContainer}>
        {plansError && (
          <Text style={[styles.planErrorText, { color: Colors.error }]}>
            {plansError}
          </Text>
        )}
        {plans.length === 0 && !plansError ? (
          <Text style={[styles.planErrorText, { color: Colors.lightText }]}>
            No plans available right now. Please try again shortly.
          </Text>
        ) : (
          plans.map((plan) => {
            const IconComponent = PLAN_ICONS[plan.tier] || Crown;
            const normalizedPlanTier = normalizeTierForUi(plan.tier) || plan.tier;
            const normalizedCurrent = normalizeTierForUi(currentTier);
            const isCurrentTier = normalizedCurrent === normalizedPlanTier;
            const isProcessingTier = isProcessing === plan.id;
            const displayName = plan.title || displayTierName(normalizedPlanTier);
            const priceLabel = plan.localizedPrice || "Price at checkout";
            const isPopular = normalizedPlanTier === "standard";
            const appleUnavailable = plan.platform === "apple" && !isAppleIapAvailable();

            return (
              <Card
                key={plan.id}
                style={[
                  styles.tierCard,
                  { backgroundColor: Colors.card },
                  isPopular && styles.popularTier,
                  isPopular && { borderColor: Colors.primary, borderWidth: 2 },
                  isCurrentTier && { borderColor: Colors.success, borderWidth: 2 },
                ]}
                variant={isPopular ? "elevated" : "default"}
              >
                {isPopular && (
                  <View style={[styles.popularBadge, { backgroundColor: Colors.primary }]}>
                    <Text style={styles.popularBadgeText}>Most Popular</Text>
                  </View>
                )}
                
                {isCurrentTier && (
                  <View style={[styles.currentBadge, { backgroundColor: Colors.success }]}>
                    <Text style={styles.currentBadgeText}>Current Plan</Text>
                  </View>
                )}

                <View style={styles.tierHeader}>
                  <IconComponent size={32} color={isPopular ? Colors.primary : Colors.text} />
                  <Text style={[styles.tierName, { color: Colors.text }]}>
                    {displayName}
                  </Text>
                  <View style={styles.priceContainer}>
                    <Text style={[styles.price, { color: Colors.text }]}>
                      {priceLabel}
                    </Text>
                    {plan.localizedPrice && (
                      <Text style={[styles.pricePeriod, { color: Colors.lightText }]}>
                        /month
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.featuresList}>
                  {(plan.features || []).map((feature, index) => (
                    <View key={`${plan.id}-feature-${index}`} style={styles.featureItem}>
                      <Check size={18} color={Colors.success} />
                      <Text style={[styles.featureText, { color: Colors.text }]}>
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>

                <Button
                  title={isCurrentTier ? "Current Plan" : `Subscribe to ${displayName}`}
                  onPress={() => handlePurchase(plan)}
                  disabled={isCurrentTier || isProcessingTier || appleUnavailable}
                  loading={isProcessingTier}
                  fullWidth
                  variant={isPopular ? "default" : "outline"}
                  style={styles.subscribeButton}
                />
                {appleUnavailable && (
                  <Text style={[styles.unavailableText, { color: Colors.lightText }]}>
                    Available in iOS dev/TestFlight builds.
                  </Text>
                )}
              </Card>
            );
          })
        )}
      </View>

      {/* Footer Info */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: Colors.lightText }]}>
          All plans include a 7-day free trial. Cancel anytime.
        </Text>
        <Text style={[styles.footerText, { color: Colors.lightText }]}>
          Payments are processed securely by {Platform.OS === "ios" ? "Apple" : "Paddle"}.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  planErrorText: {
    textAlign: "center",
    marginBottom: 8,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 16,
  },
  currentTierBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  currentTierText: {
    fontSize: 14,
    fontWeight: "600",
  },
  subscriptionPlatformText: {
    fontSize: 12,
    marginTop: 6,
  },
  tiersContainer: {
    gap: 20,
    marginBottom: 24,
  },
  tierCard: {
    padding: 24,
    position: "relative",
    overflow: "visible",
  },
  popularTier: {
    marginTop: 8,
    marginBottom: 8,
  },
  popularBadge: {
    position: "absolute",
    top: -12,
    left: "50%",
    transform: [{ translateX: -60 }],
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 1,
  },
  popularBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  currentBadge: {
    position: "absolute",
    top: -12,
    right: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 1,
  },
  currentBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  tierHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  tierName: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 8,
  },
  price: {
    fontSize: 32,
    fontWeight: "700",
  },
  pricePeriod: {
    fontSize: 16,
    marginLeft: 4,
  },
  featuresList: {
    marginBottom: 24,
    gap: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  subscribeButton: {
    marginTop: 8,
  },
  unavailableText: {
    marginTop: 8,
    fontSize: 12,
    textAlign: "center",
  },
  footer: {
    alignItems: "center",
    marginTop: 16,
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  resourcesContainer: {
    gap: 16,
    marginBottom: 24,
  },
  resourceCard: {
    padding: 20,
  },
  resourceContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  resourceIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  resourceTextContainer: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  comingSoonBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  comingSoonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  availableBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  availableText: {
    fontSize: 12,
    fontWeight: "600",
  },
  proOnlyBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  proOnlyText: {
    fontSize: 12,
    fontWeight: "600",
  },
  infoSection: {
    marginTop: 8,
    padding: 20,
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
