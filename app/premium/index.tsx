import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Linking, ActivityIndicator, Platform, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, Stack, useFocusEffect } from "expo-router";
import { Crown, Check, Star, Mic, MessageSquare, BookOpen, Lock } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import Button from "@/components/Button";
import Card from "@/components/Card";
import BackButton from "@/components/BackButton";
import { supabase } from "@/lib/supabase";
import {
  DEFAULT_OFFERING_ID,
  addCustomerInfoUpdateListener,
  configureRevenueCat,
  getCustomerInfo,
  getOfferings,
  getActiveSubscriptionTier,
  openCustomerCenter,
  purchasePackage,
  type CustomerInfo,
  type PurchasesOfferings,
  type PurchasesPackage,
  type SubscriptionTier,
} from "@/lib/iap";

interface PlanTier {
  id: Exclude<SubscriptionTier, "free">;
  name: string;
  price: string;
  period: string;
  features: string[];
  icon: any;
  popular?: boolean;
  rcPackage?: PurchasesPackage | null;
}

interface PremiumResource {
  id: string;
  title: string;
  description: string;
  icon: any;
  comingSoon: boolean;
  route?: string;
  proOnly?: boolean;
}

const PRIVACY_POLICY_URL = "https://unipilot.app/privacy/";
const TERMS_OF_USE_URL = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";
const BASIC_FEATURES = [
  "Access to basic journey modules",
  "Document management",
  "Basic checklist items",
  "Email support",
];

const STANDARD_FEATURES = [
  "Everything in Basic",
  "All journey roadmap modules",
  "Advanced checklist items",
  "Priority email support",
  "Resource library access",
];

const PREMIUM_FEATURES = [
  "Everything in Standard",
  "Unlimited AI assistance",
  "1-on-1 consultation sessions",
  "Premium document templates",
  "Priority support",
  "Early access to new features",
];

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
  iapStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  iapStatusText: {
    fontSize: 14,
  },
  iapErrorText: {
    fontSize: 14,
    textAlign: "center",
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
    flexDirection: "row",
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
  disclosureSection: {
    width: "100%",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  disclosureTitle: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  disclosurePlan: {
    alignItems: "center",
    gap: 4,
  },
  disclosurePlanTitle: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  disclosurePlanPrice: {
    fontSize: 14,
    textAlign: "center",
  },
  disclosureText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  legalLinks: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  legalLink: {
    fontSize: 13,
    fontWeight: "600",
  },
  legalSeparator: {
    fontSize: 13,
    marginHorizontal: 4,
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


export default function PremiumScreen() {
  const Colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isWeb = Platform.OS === "web";
  const lastSyncedTier = useRef<SubscriptionTier | null>(null);
  const viewModeLocked = useRef(false);
  const { width: windowWidth } = useWindowDimensions();
  const planCardWidth = Math.min(windowWidth - 64, 360);
  const planCardSpacing = 16;
  
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>("free");
  const [viewMode, setViewMode] = useState<"resources" | "plans">("plans");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<Exclude<SubscriptionTier, "free"> | null>(null);
  const [rcError, setRcError] = useState<string | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const currentOffering =
    (offerings?.all && offerings.all[DEFAULT_OFFERING_ID]) || offerings?.current || null;
  const availablePackages = currentOffering?.availablePackages ?? [];
  const hasOfferingsPackages = availablePackages.length > 0;

  const getPackageForTier = useCallback(
    (tierId: Exclude<SubscriptionTier, "free">): PurchasesPackage | null => {
      const byPackageId = availablePackages.find((pkg) => pkg.identifier === tierId);
      if (byPackageId) {
        return byPackageId;
      }
      const byProductId = availablePackages.find((pkg) =>
        pkg.product.identifier.toLowerCase().includes(tierId)
      );
      return byProductId ?? null;
    },
    [availablePackages]
  );

  const subscriptionTiers: PlanTier[] = useMemo(() => {
    const basicPackage = getPackageForTier("basic");
    const standardPackage = getPackageForTier("standard");
    const premiumPackage = getPackageForTier("premium");
    const monthlyLabel = "/ monthly";

    return [
      {
        id: "basic",
        name: "Basic",
        price: basicPackage?.product.priceString || "--",
        period: monthlyLabel,
        features: BASIC_FEATURES,
        icon: Star,
        rcPackage: basicPackage,
      },
      {
        id: "standard",
        name: "Standard",
        price: standardPackage?.product.priceString || "--",
        period: monthlyLabel,
        features: STANDARD_FEATURES,
        icon: Star,
        popular: true,
        rcPackage: standardPackage,
      },
      {
        id: "premium",
        name: "Premium",
        price: premiumPackage?.product.priceString || "--",
        period: monthlyLabel,
        features: PREMIUM_FEATURES,
        icon: Crown,
        rcPackage: premiumPackage,
      },
    ];
  }, [getPackageForTier]);

  const disclosurePlans = subscriptionTiers.map((tier) => ({
    id: tier.id,
    title: `UniPilot ${tier.name}`,
    price: `${tier.price} ${tier.period} (auto-renewable)`,
  }));

  const handleOpenLink = useCallback(async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert("Unable to Open", "We couldn't open this link.");
        return;
      }
      await Linking.openURL(url);
    } catch (error) {
      console.error("Open link failed:", error);
      Alert.alert("Unable to Open", "We couldn't open this link.");
    }
  }, []);

  const handleViewPlans = useCallback(() => {
    viewModeLocked.current = true;
    setViewMode("plans");
  }, []);

  const handleViewResources = useCallback(() => {
    viewModeLocked.current = true;
    setViewMode("resources");
  }, []);

  const syncProfileTier = useCallback(async (info: CustomerInfo | null) => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return;
    }

    const nextTier = getActiveSubscriptionTier(info);
    if (lastSyncedTier.current === nextTier) {
      return;
    }

    lastSyncedTier.current = nextTier;
    const { error } = await supabase
      .from("profiles")
      .update({ subscription_tier: nextTier, updated_at: new Date().toISOString() })
      .eq("id", authUser.id);

    if (error) {
      console.warn("Failed to sync subscription tier:", error);
    }
  }, []);

  const resolveCurrentTier = useCallback((info: CustomerInfo | null) => {
    return getActiveSubscriptionTier(info);
  }, []);

  const refreshRevenueCatState = useCallback(async () => {
    if (isWeb) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setRcError(null);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      await configureRevenueCat(authUser?.id);

      const [freshOfferings, info] = await Promise.all([
        getOfferings(),
        getCustomerInfo(),
      ]);

      setOfferings(freshOfferings);
      const nextOffering =
        (freshOfferings.all && freshOfferings.all[DEFAULT_OFFERING_ID]) ||
        freshOfferings.current ||
        null;
      if (!nextOffering || nextOffering.availablePackages.length === 0) {
        setRcError(
          "No subscription packages found. Please finish configuring your RevenueCat offerings."
        );
      }
      setCustomerInfo(info);
      setCurrentTier(resolveCurrentTier(info));
      await syncProfileTier(info);
    } catch (error: any) {
      console.error("RevenueCat init failed:", error);
      setRcError(error?.message || "Unable to connect to RevenueCat.");
    } finally {
      setIsLoading(false);
    }
  }, [isWeb, resolveCurrentTier, syncProfileTier]);

  // Check subscription status on mount
  useEffect(() => {
    refreshRevenueCatState();
  }, [refreshRevenueCatState]);

  // Refresh subscription status when screen comes into focus
  // This ensures the page updates when user returns from payment
  useFocusEffect(
    useCallback(() => {
      refreshRevenueCatState();
    }, [refreshRevenueCatState])
  );
  useEffect(() => {
    if (isWeb) {
      return;
    }
    const removeListener = addCustomerInfoUpdateListener(async (info) => {
      setCustomerInfo(info);
      setCurrentTier(resolveCurrentTier(info));
      await syncProfileTier(info);
    });

    return () => {
      removeListener();
    };
  }, [isWeb, resolveCurrentTier, syncProfileTier]);

  const handleSubscribe = useCallback(async (tier: PlanTier) => {
    if (isWeb) {
      Alert.alert("Not Supported", "Subscriptions are available on iOS and Android.");
      return;
    }

    if (!tier.rcPackage) {
      Alert.alert(
        "Unavailable",
        "This subscription is not available right now. Please try again later."
      );
      return;
    }

    setIsProcessing(tier.id);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      await configureRevenueCat(authUser?.id);

      const info = await purchasePackage(tier.rcPackage);
      if (!info) {
        return;
      }
      setCustomerInfo(info);
      setCurrentTier(resolveCurrentTier(info));
      await syncProfileTier(info);
      Alert.alert("Success", "Your UniPilot Pro subscription is active.");
    } catch (error: any) {
      if (error?.userCancelled || error?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        return;
      }
      console.error("Purchase failed:", error);
      Alert.alert("Error", error?.message || "Unable to complete purchase.");
    } finally {
      setIsProcessing(null);
    }
  }, [configureRevenueCat, isWeb, purchasePackage, resolveCurrentTier, syncProfileTier]);

  const handleOpenCustomerCenter = useCallback(async () => {
    try {
      await openCustomerCenter();
    } catch (error: any) {
      console.error("Customer center failed:", error);
      Alert.alert("Unable to Open", error?.message || "Unable to open subscription settings.");
    }
  }, []);

  const hasActiveSubscription = currentTier !== "free";
  const hasPremiumAccess = currentTier === "premium";
  const currentTierLabel =
    currentTier === "basic"
      ? "Basic"
      : currentTier === "standard"
        ? "Standard"
        : currentTier === "premium"
          ? "Premium"
          : "Free";

  // Keep view in sync with subscription status so subscribed users can still switch to plans
  useEffect(() => {
    if (viewModeLocked.current) {
      if (!hasActiveSubscription && viewMode !== "plans") {
        setViewMode("plans");
      }
      return;
    }
    setViewMode(hasActiveSubscription ? "resources" : "plans");
  }, [hasActiveSubscription, viewMode]);


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
  if (hasActiveSubscription && viewMode === "resources") {
    return (
      <ScrollView 
        style={[styles.container, { backgroundColor: Colors.background, paddingBottom: insets.bottom }]} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Stack.Screen
          options={{
            title: "Premium Resources",
            headerLeft: () => <BackButton onPress={() => router.replace("/(tabs)")} />,
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
          <Button
            title="Change plan"
            variant="outline"
            onPress={handleViewPlans}
            fullWidth
            style={{ marginTop: 12 }}
          />
          <Button
            title="Manage subscription"
            variant="outline"
            onPress={handleOpenCustomerCenter}
            fullWidth
            style={{ marginTop: 8 }}
          />
          {hasActiveSubscription && (
            <View style={[styles.currentTierBadge, { backgroundColor: Colors.success + "20" }]}>
              <Text style={[styles.currentTierText, { color: Colors.success }]}>
                {currentTierLabel} Plan
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
                    {!resource.comingSoon && resource.proOnly && !hasPremiumAccess && (
                      <View style={[styles.proOnlyBadge, { backgroundColor: Colors.warning + "20" }]}>
                        <Lock size={12} color={Colors.warning} />
                        <Text style={[styles.proOnlyText, { color: Colors.warning }]}>
                          Pro
                        </Text>
                      </View>
                    )}
                    {!resource.comingSoon && (!resource.proOnly || hasPremiumAccess) && (
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
          headerLeft: () => <BackButton onPress={() => router.replace("/(tabs)")} />,
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
        {!isWeb && !hasOfferingsPackages && !rcError && (
          <View style={styles.iapStatusRow}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={[styles.iapStatusText, { color: Colors.lightText }]}>
              Loading subscription options...
            </Text>
          </View>
        )}
        {rcError && (
          <View style={styles.iapStatusRow}>
            <Text style={[styles.iapErrorText, { color: Colors.error }]}>
              {rcError}
            </Text>
          </View>
        )}
        {isWeb && (
          <View style={styles.iapStatusRow}>
            <Text style={[styles.iapStatusText, { color: Colors.lightText }]}>
              Subscriptions are available on iOS and Android.
            </Text>
          </View>
        )}
        {hasActiveSubscription && (
          <View style={[styles.iapStatusRow, { marginTop: 8 }]}>
            <Text style={[styles.iapStatusText, { color: Colors.lightText }]}>
              Current plan: {currentTierLabel}
            </Text>
            <Button
              title="Back to resources"
              variant="outline"
              onPress={handleViewResources}
              style={{ marginLeft: 8, height: 36, paddingHorizontal: 12 }}
            />
          </View>
        )}
      </View>

      {/* Subscription Tiers */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tiersContainer}
        snapToInterval={planCardWidth + planCardSpacing}
        decelerationRate="fast"
        snapToAlignment="start"
      >
        {subscriptionTiers.map((tier, index) => {
          const IconComponent = tier.icon;
          const isCurrentTier = currentTier === tier.id;
          const isProcessingTier = isProcessing === tier.id;
          const hasPackage = Boolean(tier.rcPackage);
          const priceLabel = hasPackage ? tier.price : "Loading...";
          const pricePeriod = tier.period;
          const isButtonDisabled =
            isCurrentTier || isProcessingTier || isWeb || Boolean(rcError) || !hasPackage;
          const isLastTier = index === subscriptionTiers.length - 1;

          return (
            <Card
              key={tier.id}
              style={[
                styles.tierCard,
                {
                  backgroundColor: Colors.card,
                  width: planCardWidth,
                  marginRight: isLastTier ? 0 : planCardSpacing,
                },
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
                    {priceLabel}
                  </Text>
                  <Text style={[styles.pricePeriod, { color: Colors.lightText }]}>
                    {pricePeriod}
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
                onPress={() => handleSubscribe(tier)}
                disabled={isButtonDisabled}
                loading={isProcessingTier}
                fullWidth
                variant={tier.popular ? "default" : "outline"}
                style={styles.subscribeButton}
              />
            </Card>
          );
        })}
      </ScrollView>

      {/* Footer Info */}
      <View style={styles.footer}>
        <View style={[styles.disclosureSection, { borderColor: Colors.border }]}>
          <Text style={[styles.disclosureTitle, { color: Colors.text }]}>
            Subscription Terms
          </Text>
          {disclosurePlans.map((plan) => (
            <View key={plan.id} style={styles.disclosurePlan}>
              <Text style={[styles.disclosurePlanTitle, { color: Colors.text }]}>
                {plan.title}
              </Text>
              <Text style={[styles.disclosurePlanPrice, { color: Colors.text }]}>
                {plan.price}
              </Text>
            </View>
          ))}
          <Text style={[styles.disclosureText, { color: Colors.lightText }]}>
            Payment will be charged to your store account at confirmation of purchase.
          </Text>
          <Text style={[styles.disclosureText, { color: Colors.lightText }]}>
            Subscription automatically renews unless canceled at least 24 hours before the end of the current period.
          </Text>
          <View style={styles.legalLinks}>
            <Text
              style={[styles.legalLink, { color: Colors.primary }]}
              accessibilityRole="link"
              onPress={() => handleOpenLink(PRIVACY_POLICY_URL)}
            >
              Privacy Policy
            </Text>
            <Text style={[styles.legalSeparator, { color: Colors.lightText }]}>
              |
            </Text>
            <Text
              style={[styles.legalLink, { color: Colors.primary }]}
              accessibilityRole="link"
              onPress={() => handleOpenLink(TERMS_OF_USE_URL)}
            >
              Terms of Use (Apple Standard EULA)
            </Text>
          </View>
        </View>
        <Text style={[styles.footerText, { color: Colors.lightText }]}>
          Pricing is provided directly by the App Store or Play Store.
        </Text>
        <Text style={[styles.footerText, { color: Colors.lightText }]}>
          Manage or cancel anytime from your store subscriptions.
        </Text>
      </View>
    </ScrollView>
  );
}
