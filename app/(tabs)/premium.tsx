import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Crown, Mic, MessageSquare, BookOpen, ArrowRight, Lock } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase";

export default function PremiumResourcesScreen() {
  const Colors = useColors();
  const router = useRouter();
  const { user } = useUserStore();
  
  const [currentTier, setCurrentTier] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check subscription status on mount
  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  // Refresh subscription status when screen comes into focus
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

  // Check if user has an active subscription (basic, standard, or pro/premium)
  const hasActiveSubscription = currentTier && ["basic", "standard", "pro", "premium"].includes(currentTier);

  // Check if user has Pro tier access
  const hasProAccess = currentTier === "pro" || currentTier === "premium";

  // Premium resources that will be linked to checklist items later
  const premiumResources = [
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
      id: "webinars-articles",
      title: "Webinars & Articles",
      description: "Access detailed guides, webinars, and articles for each checklist item",
      icon: BookOpen,
      comingSoon: true,
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
      // Navigate to the resource route
      router.push(resource.route as any);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.loadingText, { color: Colors.lightText }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show premium resources home page if user has active subscription
  if (hasActiveSubscription) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]} edges={['top']}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: Colors.primary + "20" }]}>
              <Crown size={32} color={Colors.primary} />
            </View>
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
      </SafeAreaView>
    );
  }

  // Show upgrade prompt for free users
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.upgradeContainer}>
          <View style={[styles.upgradeIconContainer, { backgroundColor: Colors.primary + "20" }]}>
            <Crown size={48} color={Colors.primary} />
          </View>
          <Text style={[styles.upgradeTitle, { color: Colors.text }]}>
            Unlock Premium Resources
          </Text>
          <Text style={[styles.upgradeDescription, { color: Colors.lightText }]}>
            Get access to exclusive resources including interview simulator, AI chats, and detailed guides to enhance your journey.
          </Text>
          <Button
            title="View Plans"
            onPress={() => router.push("/premium")}
            icon={<ArrowRight size={20} color="#FFFFFF" />}
            fullWidth
            style={styles.upgradeButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
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
  upgradeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    minHeight: 400,
  },
  upgradeIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  upgradeTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  upgradeDescription: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 300,
  },
  upgradeButton: {
    marginTop: 8,
  },
});
