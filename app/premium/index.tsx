import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Linking, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, Stack, useFocusEffect } from "expo-router";
import { Crown, Check, Zap, Star, ArrowLeft, Mic, MessageSquare, BookOpen, Lock } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import Button from "@/components/Button";
import Card from "@/components/Card";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase";
import { buildPaddleCheckoutUrl, PADDLE_PRICE_IDS, canMakePayments } from "@/lib/paddle";

interface SubscriptionTier {
  id: "basic" | "standard" | "pro";
  name: string;
  price: string;
  priceId: string;
  features: string[];
  icon: any;
  popular?: boolean;
}

interface PremiumResource {
  id: string;
  title: string;
  description: string;
  icon: any;
  comingSoon: boolean;
  route?: string;
  proOnly?: boolean;
  minTier?: "basic" | "standard" | "premium";
}

const subscriptionTiers: SubscriptionTier[] = [
  {
    id: "basic",
    name: "Basic",
    price: "$4.99",
    priceId: PADDLE_PRICE_IDS.basic,
    features: [
      "Access to basic journey modules",
      "Document management",
      "Basic checklist items",
      "Email support",
    ],
    icon: Zap,
  },
  {
    id: "standard",
    name: "Standard",
    price: "$9.99",
    priceId: PADDLE_PRICE_IDS.standard,
    features: [
      "Everything in Basic",
      "All journey roadmap modules",
      "Advanced checklist items",
      "Priority email support",
      "Resource library access",
    ],
    icon: Star,
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$19.99",
    priceId: PADDLE_PRICE_IDS.pro,
    features: [
      "Everything in Standard",
      "Unlimited AI assistance",
      "1-on-1 consultation sessions",
      "Premium document templates",
      "Priority support",
      "Early access to new features",
    ],
    icon: Crown,
  },
];

export default function PremiumScreen() {
  const Colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useUserStore();
  
  const [currentTier, setCurrentTier] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Check subscription status on mount
  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  // Refresh subscription status when screen comes into focus
  // This ensures the page updates when user returns from payment
  useFocusEffect(
    useCallback(() => {
      checkSubscriptionStatus();
    }, [])
  );

  const checkSubscriptionStatus = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setIsLoading(false);
        return;
      }

      // Check current subscription from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_tier")
        .eq("id", authUser.id)
        .single();

      // Map "premium" to "pro" for consistency (premium is stored in DB, pro is used in UI)
      const tier = profile?.subscription_tier === "premium" ? "pro" : profile?.subscription_tier;
      if (tier && tier !== "free") {
        setCurrentTier(tier);
      } else {
        // Reset to null if subscription is free or doesn't exist
        setCurrentTier(null);
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
      setCurrentTier(null);
    } finally {
      setIsLoading(false);
    }
  };

  const openCheckout = async (tier: SubscriptionTier) => {
    try {
      setIsProcessing(tier.id);
      
      // Check if device can make payments
      if (!canMakePayments()) {
        Alert.alert("Error", "Payments are not available on this device.");
        setIsProcessing(null);
        return;
      }
      
      // Get user information for prefill
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        Alert.alert("Error", "You must be logged in to purchase a subscription.");
        setIsProcessing(null);
        return;
      }

      // Get user profile for prefill
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, country_origin, destination_country")
        .eq("id", authUser.id)
        .single();

      // Build checkout URL using the utility function
      const checkoutUrl = buildPaddleCheckoutUrl({
        priceId: tier.priceId,
        userEmail: profile?.email || authUser.email || undefined,
        userId: authUser.id,
        tier: tier.id,
        countryCode: profile?.destination_country || undefined,
      });

      console.log("Opening Paddle checkout:", checkoutUrl);

      // Open checkout in browser
      const canOpen = await Linking.canOpenURL(checkoutUrl);
      if (canOpen) {
        await Linking.openURL(checkoutUrl);
      } else {
        Alert.alert("Error", "Unable to open checkout. Please try again.");
        setIsProcessing(null);
      }
    } catch (error: any) {
      console.error("Error opening checkout:", error);
      Alert.alert("Error", "Failed to open checkout. Please try again.");
      setIsProcessing(null);
    }
  };

  // Check if user has an active subscription (basic, standard, or pro/premium)
  const hasActiveSubscription = currentTier && ["basic", "standard", "pro", "premium"].includes(currentTier);

  // Check if user has Pro tier access
  const hasProAccess = currentTier === "pro" || currentTier === "premium";
  const normalizedTier = currentTier ? currentTier.toLowerCase() : null;
  const tierOrder: Record<string, number> = { free: 0, basic: 1, standard: 2, premium: 3, pro: 3 };
  const hasStandardAccess = normalizedTier ? (tierOrder[normalizedTier] || 0) >= tierOrder["standard"] : false;

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
      title: "Articles & Webinars",
      description: hasStandardAccess ? "Editorial guides tailored to your filters" : "Standard tier required",
      icon: BookOpen,
      comingSoon: false,
      route: "/premium/articles",
      proOnly: false,
      minTier: "standard" as const,
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
      if (resource.minTier) {
        const required = resource.minTier.toLowerCase();
        const currentRank = normalizedTier ? tierOrder[normalizedTier] || 0 : 0;
        const requiredRank = tierOrder[required] || 0;
        if (currentRank < requiredRank) {
          Alert.alert(
            "Upgrade required",
            `${resource.title} is available on the Standard plan or higher.`,
            [
              { text: "Not now", style: "cancel" },
              { text: "View plans", onPress: () => router.push("/premium") },
            ]
          );
          return;
        }
      }
      router.push(resource.route as any);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: Colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.loadingText, { color: Colors.lightText }]}>Loading subscription status...</Text>
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
        {subscriptionTiers.map((tier) => {
          const IconComponent = tier.icon;
          const isCurrentTier = currentTier === tier.id;
          const isProcessingTier = isProcessing === tier.id;

          return (
            <Card
              key={tier.id}
              style={[
                styles.tierCard,
                { backgroundColor: Colors.card },
                tier.popular && styles.popularTier,
                tier.popular && { borderColor: Colors.primary, borderWidth: 2 },
                isCurrentTier && { borderColor: Colors.success, borderWidth: 2 },
              ]}
              variant={tier.popular ? "elevated" : "default"}
            >
              {tier.popular && (
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
                <IconComponent size={32} color={tier.popular ? Colors.primary : Colors.text} />
                <Text style={[styles.tierName, { color: Colors.text }]}>
                  {tier.name}
                </Text>
                <View style={styles.priceContainer}>
                  <Text style={[styles.price, { color: Colors.text }]}>
                    {tier.price}
                  </Text>
                  <Text style={[styles.pricePeriod, { color: Colors.lightText }]}>
                    /month
                  </Text>
                </View>
              </View>

              <View style={styles.featuresList}>
                {tier.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Check size={18} color={Colors.success} />
                    <Text style={[styles.featureText, { color: Colors.text }]}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>

              <Button
                title={isCurrentTier ? "Current Plan" : `Subscribe to ${tier.name}`}
                onPress={() => openCheckout(tier)}
                disabled={isCurrentTier || isProcessingTier}
                loading={isProcessingTier}
                fullWidth
                variant={tier.popular ? "default" : "outline"}
                style={styles.subscribeButton}
              />
            </Card>
          );
        })}
      </View>

      {/* Footer Info */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: Colors.lightText }]}>
          All plans include a 7-day free trial. Cancel anytime.
        </Text>
        <Text style={[styles.footerText, { color: Colors.lightText }]}>
          Payments are processed securely by Paddle.
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
