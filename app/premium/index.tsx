import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Linking, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { Crown, Check, Zap, Star, ArrowLeft } from "lucide-react-native";
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

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

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

      if (profile?.subscription_tier && profile.subscription_tier !== "free") {
        setCurrentTier(profile.subscription_tier);
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
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
        {currentTier && (
          <View style={[styles.currentTierBadge, { backgroundColor: Colors.success + "20" }]}>
            <Text style={[styles.currentTierText, { color: Colors.success }]}>
              Current Plan: {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}
            </Text>
          </View>
        )}
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
});
