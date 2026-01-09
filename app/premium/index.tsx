import React, { useState, useEffect, useCallback, useRef } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Linking, ActivityIndicator, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, Stack, useFocusEffect } from "expo-router";
import { Crown, Check, Zap, Star, ArrowLeft, Mic, MessageSquare, BookOpen, Lock } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import Button from "@/components/Button";
import Card from "@/components/Card";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase";
import { buildPaddleCheckoutUrl, PADDLE_PRICE_IDS, canMakePayments } from "@/lib/paddle";
import {
  APPLE_SUBSCRIPTION_PRODUCTS,
  addPurchaseErrorListener,
  addPurchaseUpdatedListener,
  closeIapConnection,
  ensureIapConnection,
  fetchAppleSubscriptions,
  finishTransactionSafe,
  formatAppleSubscriptionPeriod,
  getActiveAppleSubscription,
  getIapLoadError,
  mapProductIdToTier,
  openAppleSubscriptionManager,
  requestAppleSubscription,
  restoreApplePurchases,
  validateAppleReceipt,
  type AppleSubscriptionTier,
  type Purchase,
  type ProductSubscription,
  type SubscriptionEntitlement,
} from "@/lib/iap";

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
  const { updateUser } = useUserStore();
  const isIosDevice = Platform.OS === "ios";
  const processedTransactions = useRef<Set<string>>(new Set());
  
  const [currentTier, setCurrentTier] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"resources" | "plans">("plans");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [iapReady, setIapReady] = useState(false);
  const [iapError, setIapError] = useState<string | null>(null);
  const [appleProducts, setAppleProducts] = useState<Record<string, ProductSubscription | undefined>>({});
  const [isRestoring, setIsRestoring] = useState(false);

  const applyEntitlementState = useCallback(
    (entitlement: SubscriptionEntitlement) => {
      const nextTier = entitlement === "none" ? null : entitlement;
      setCurrentTier(nextTier);
      if (nextTier) {
        updateUser({ subscriptionTier: nextTier, isPremium: true });
      } else {
        updateUser({ subscriptionTier: "free", isPremium: false });
      }
    },
    [updateUser]
  );

  const syncEntitlementToProfile = useCallback(
    async (entitlement: SubscriptionEntitlement) => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        return;
      }

      const nextTier = entitlement === "none" ? "free" : entitlement;
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_tier")
        .eq("id", authUser.id)
        .single();

      if (profile?.subscription_tier !== nextTier) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            subscription_tier: nextTier,
            updated_at: new Date().toISOString(),
          })
          .eq("id", authUser.id);

        if (updateError) {
          throw updateError;
        }
      }

      applyEntitlementState(entitlement);
    },
    [applyEntitlementState]
  );

  const syncAppleSubscriptionState = useCallback(
    async (fallbackTier?: AppleSubscriptionTier) => {
      const entitlement = await getActiveAppleSubscription();
      const resolved =
        entitlement !== "none" ? entitlement : fallbackTier || "none";
      await syncEntitlementToProfile(resolved);
      return resolved;
    },
    [syncEntitlementToProfile]
  );

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

  const handleApplePurchaseUpdate = useCallback(
    async (purchase: Purchase) => {
      const transactionId =
        purchase?.transactionId || (purchase as any)?.originalTransactionIdentifierIOS;
      if (transactionId && processedTransactions.current.has(transactionId)) {
        return;
      }
      if (transactionId) {
        processedTransactions.current.add(transactionId);
      }

      try {
        const tierFromProduct = mapProductIdToTier(purchase.productId);
        if (!tierFromProduct) {
          setIsProcessing(null);
          await finishTransactionSafe(purchase);
          return;
        }

        const receiptData = purchase.transactionReceipt || purchase.purchaseToken;
        const validation = await validateAppleReceipt(receiptData, purchase.productId);

        if (
          validation &&
          validation.valid === false &&
          validation.reason !== "missing_shared_secret" &&
          validation.reason !== "missing_receipt"
        ) {
          throw new Error("Receipt validation failed");
        }

        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          Alert.alert("Error", "You must be logged in to complete the purchase.");
          setIsProcessing(null);
          return;
        }

        await syncAppleSubscriptionState(tierFromProduct);
        setIsProcessing(null);
        Alert.alert("Success", "Your App Store subscription is active.");
      } catch (error) {
        console.error("Error handling iOS purchase:", error);
        setIsProcessing(null);
        Alert.alert(
          "Error",
          "We couldn't confirm your purchase. Please contact support if you were charged."
        );
      } finally {
        await finishTransactionSafe(purchase);
      }
    },
    [syncAppleSubscriptionState]
  );

  useEffect(() => {
    if (!isIosDevice) {
      return;
    }

    let isMounted = true;
    let purchaseUpdateSub: ReturnType<typeof addPurchaseUpdatedListener> | undefined;
    let purchaseErrorSub: ReturnType<typeof addPurchaseErrorListener> | undefined;

    const initializeIap = async () => {
      setIapError(null);

      try {
        const connected = await ensureIapConnection();
        if (!connected) {
          const loadError = getIapLoadError();
          setIapError(loadError || "App Store billing is not available on this device.");
          setIapReady(false);
          return;
        }
        const subscriptions = await fetchAppleSubscriptions();

        if (!isMounted) return;

        const mapped = subscriptions.reduce((acc, sub) => {
          const tierId = mapProductIdToTier(sub.productId ?? sub.id);
          if (tierId) {
            acc[tierId] = sub;
          }
          return acc;
        }, {} as Record<string, ProductSubscription>);

        setAppleProducts(mapped);
        setIapReady(true);

        purchaseUpdateSub = addPurchaseUpdatedListener(async (purchase) => {
          if (!isMounted) return;
          await handleApplePurchaseUpdate(purchase);
        });

        purchaseErrorSub = addPurchaseErrorListener((error) => {
          if (!isMounted) return;
          console.error("IAP purchase error:", error);
          setIsProcessing(null);
          Alert.alert("Purchase failed", error?.message || "Unable to complete the transaction.");
        });
      } catch (error) {
        if (!isMounted) return;
        console.error("Failed to initialize Apple IAP:", error);
        const loadError = getIapLoadError();
        setIapError(loadError || "Unable to connect to the App Store right now. Please try again.");
        setIapReady(false);
      }
    };

    initializeIap();

    return () => {
      isMounted = false;
      purchaseUpdateSub?.remove();
      purchaseErrorSub?.remove();
      processedTransactions.current.clear();
      closeIapConnection();
    };
  }, [handleApplePurchaseUpdate, isIosDevice]);

  const openApplePurchase = async (tier: SubscriptionTier) => {
    if (!iapReady) {
      Alert.alert("App Store Unavailable", iapError || "Still connecting to the App Store. Please try again.");
      return;
    }

    const appleProduct = APPLE_SUBSCRIPTION_PRODUCTS[tier.id];
    if (!appleProduct) {
      Alert.alert("Error", "Subscription is not available in the App Store.");
      return;
    }

    if (!appleProducts[tier.id]) {
      Alert.alert("App Store Unavailable", "Pricing is still loading from Apple. Please try again.");
      return;
    }

    try {
      setIsProcessing(tier.id);

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        Alert.alert("Error", "You must be logged in to purchase a subscription.");
        setIsProcessing(null);
        return;
      }

      await requestAppleSubscription(appleProduct.productId, authUser.id);
    } catch (error: any) {
      console.error("Error starting Apple IAP checkout:", error);
      Alert.alert("Error", "Failed to start your App Store purchase. Please try again.");
      setIsProcessing(null);
    }
  };

  const openCheckout = async (tier: SubscriptionTier) => {
    if (isIosDevice) {
      await openApplePurchase(tier);
      return;
    }

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

  const handleRestorePurchases = async () => {
    if (!isIosDevice || isRestoring) {
      return;
    }

    setIsRestoring(true);
    try {
      const entitlement = await restoreApplePurchases();
      await syncEntitlementToProfile(entitlement);

      if (entitlement === "none") {
        Alert.alert("No Purchases Found", "No active App Store subscriptions were found.");
      } else {
        Alert.alert("Restored", "Your App Store subscription has been restored.");
      }
    } catch (error) {
      console.error("Restore purchases failed", error);
      Alert.alert("Restore Failed", "Unable to restore purchases. Please try again.");
    } finally {
      setIsRestoring(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!isIosDevice) {
      return;
    }

    try {
      await openAppleSubscriptionManager();
    } catch (error) {
      console.error("Open subscription manager failed", error);
      Alert.alert("Unable to Open", "We couldn't open Apple subscription settings.");
    }
  };

  const renderSubscriptionActions = () => {
    if (!isIosDevice) {
      return null;
    }

    return (
      <View style={styles.subscriptionActions}>
        <Button
          title="Restore Purchases"
          variant="outline"
          onPress={handleRestorePurchases}
          loading={isRestoring}
          fullWidth
        />
        <Button
          title="Manage Subscription"
          onPress={handleManageSubscription}
          fullWidth
          variant="default"
        />
      </View>
    );
  };

  // Check if user has an active subscription (basic, standard, or pro/premium)
  const hasActiveSubscription = currentTier && ["basic", "standard", "pro", "premium"].includes(currentTier);

  // Keep view in sync with subscription status so subscribed users can still switch to plans
  useEffect(() => {
    if (hasActiveSubscription && viewMode === "plans") {
      setViewMode("resources");
    }
    if (!hasActiveSubscription && viewMode === "resources") {
      setViewMode("plans");
    }
  }, [hasActiveSubscription, viewMode]);

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
          <Button
            title="Change plan"
            variant="outline"
            onPress={() => setViewMode("plans")}
            fullWidth
            style={{ marginTop: 12 }}
          />
          {currentTier && (
            <View style={[styles.currentTierBadge, { backgroundColor: Colors.success + "20" }]}>
              <Text style={[styles.currentTierText, { color: Colors.success }]}>
                {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)} Plan
              </Text>
            </View>
          )}
          {renderSubscriptionActions()}
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
        {isIosDevice && !iapReady && !iapError && (
          <View style={styles.iapStatusRow}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={[styles.iapStatusText, { color: Colors.lightText }]}>
              Connecting to the App Store for pricing...
            </Text>
          </View>
        )}
        {isIosDevice && iapError && (
          <View style={styles.iapStatusRow}>
            <Text style={[styles.iapErrorText, { color: Colors.error }]}>
              {iapError}
            </Text>
          </View>
        )}
        {hasActiveSubscription && (
          <View style={[styles.iapStatusRow, { marginTop: 8 }]}>
            <Text style={[styles.iapStatusText, { color: Colors.lightText }]}>
              Current plan: {currentTier?.charAt(0).toUpperCase() + (currentTier?.slice(1) || "")}
            </Text>
            <Button
              title="Back to resources"
              variant="outline"
              onPress={() => setViewMode("resources")}
              style={{ marginLeft: 8, height: 36, paddingHorizontal: 12 }}
            />
          </View>
        )}
      </View>

      {/* Subscription Tiers */}
      <View style={styles.tiersContainer}>
        {subscriptionTiers.map((tier) => {
          const IconComponent = tier.icon;
          const isCurrentTier = currentTier === tier.id;
          const isProcessingTier = isProcessing === tier.id;
          const appleProduct = appleProducts[tier.id];
          const priceLabel = isIosDevice
            ? appleProduct?.displayPrice || "Fetching price..."
            : tier.price;
          const pricePeriod = isIosDevice
            ? formatAppleSubscriptionPeriod(appleProduct)
            : "/month";
          const isButtonDisabled =
            isCurrentTier ||
            isProcessingTier ||
            (isIosDevice && (!iapReady || !appleProduct));

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
                onPress={() => openCheckout(tier)}
                disabled={isButtonDisabled}
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
          Pricing is provided directly by the {isIosDevice ? "App Store" : "Paddle checkout"}.
        </Text>
        <Text style={[styles.footerText, { color: Colors.lightText }]}>
          Manage or cancel anytime from your {isIosDevice ? "Apple subscriptions" : "UniPilot account settings"}.
        </Text>
        {renderSubscriptionActions()}
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
  subscriptionActions: {
    marginTop: 16,
    gap: 12,
    width: "100%",
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
