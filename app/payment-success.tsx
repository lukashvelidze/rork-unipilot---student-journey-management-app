import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Crown, Check, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useColors } from '@/hooks/useColors';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { supabase } from '@/lib/supabase';
import { storePaddleCustomerId } from '@/lib/paddle-customer';
import { getAvailablePlans } from '@/lib/billing';
import CelebrationAnimation from '@/components/CelebrationAnimation';

const TIER_NAMES: Record<string, string> = {
  basic: "Basic",
  standard: "Standard",
  pro: "Pro",
  premium: "Premium",
};

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const Colors = useColors();
  const params = useLocalSearchParams();
  
  const [isUpdating, setIsUpdating] = useState(true);
  const [tier, setTier] = useState<string | null>(null);
  const [priceText, setPriceText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPlanPrice = useCallback(async (tierValue: string) => {
    try {
      const plans = await getAvailablePlans();
      const normalizedTier = tierValue === "pro" ? "premium" : tierValue;
      const matchingPlan = plans.find((plan) => {
        const planTier = plan.tier === "pro" ? "premium" : plan.tier;
        return planTier === normalizedTier;
      });
      setPriceText(matchingPlan?.localizedPrice || null);
    } catch (error) {
      console.error("Failed to load plan price:", error);
      setPriceText(null);
    }
  }, []);

  useEffect(() => {
    handlePaymentSuccess();
  }, []);

  const handlePaymentSuccess = async () => {
    try {
      // Get tier and customer_id from URL parameters
      const tierParam = params.tier as string;
      const customerId = params.customer_id as string | undefined;
      
      if (!tierParam) {
        setError("No subscription tier found in payment confirmation.");
        setIsUpdating(false);
        return;
      }

      setTier(tierParam);
      loadPlanPrice(tierParam);

      // Get authenticated user
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        setError("You must be logged in to activate your subscription.");
        setIsUpdating(false);
        return;
      }

      // Update subscription tier in database
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          subscription_tier: tierParam,
          subscription_platform: "paddle",
          updated_at: new Date().toISOString(),
        })
        .eq("id", authUser.id);

      if (updateError) {
        console.error("Error updating subscription:", updateError);
        setError("Failed to activate subscription. Please contact support.");
        setIsUpdating(false);
        return;
      }

      // Store Paddle customer ID if provided in URL parameters
      // This links the Supabase profile to the Paddle customer for webhook processing
      if (customerId) {
        try {
          await storePaddleCustomerId(customerId);
          console.log("Successfully stored Paddle customer ID:", customerId);
        } catch (error) {
          // Log error but don't fail the payment success flow
          // Customer ID can also be set via webhook
          console.error("Failed to store Paddle customer ID (will be set via webhook):", error);
        }
      } else {
        console.log("No customer_id in URL parameters. Will be set via Paddle webhook.");
      }

      setIsUpdating(false);
    } catch (error: any) {
      console.error("Error handling payment success:", error);
      setError("An error occurred while activating your subscription. Please contact support.");
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    if (tier) {
      loadPlanPrice(tier);
    }
  }, [tier, loadPlanPrice]);

  const planName = tier ? (TIER_NAMES[tier] || "Premium") : "Premium";
  const priceLabel = priceText ? `${priceText}/month` : null;
  const priceDisplay = priceLabel ?? "Price confirmed at checkout";

  if (isUpdating) {
    return (
      <View style={[styles.container, { backgroundColor: Colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.loadingText, { color: Colors.lightText }]}>
            Activating your subscription...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: Colors.background }]} contentContainerStyle={styles.scrollContent}>
        <Card style={[styles.errorCard, { backgroundColor: Colors.card }]} variant="elevated">
          <Text style={[styles.errorTitle, { color: Colors.error }]}>Error</Text>
          <Text style={[styles.errorText, { color: Colors.text }]}>{error}</Text>
          <Button
            title="Go to Premium"
            onPress={() => router.push('/premium')}
            fullWidth
            style={styles.errorButton}
          />
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: Colors.background }]} contentContainerStyle={styles.scrollContent}>
      
      <CelebrationAnimation visible={true} onAnimationFinish={() => {}} />
      
      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Crown size={64} color={Colors.white} />
        <Text style={styles.title}>🎉 Payment Successful!</Text>
        <Text style={styles.subtitle}>
          Welcome to UniPilot {planName} Plan{priceLabel ? ` (${priceLabel})` : ""}. 
          You've unlocked all premium features and journey roadmap modules.
        </Text>
      </LinearGradient>

      <Card style={[styles.successCard, { backgroundColor: Colors.card }]} variant="elevated">
        <View style={styles.successHeader}>
          <Check size={32} color={Colors.success} />
          <Text style={[styles.successTitle, { color: Colors.text }]}>Payment Confirmed</Text>
        </View>
        <Text style={[styles.successDescription, { color: Colors.lightText }]}>
          Your subscription is now active. You have access to all premium features and journey roadmap modules.
        </Text>
        
        <View style={[styles.subscriptionDetails, { backgroundColor: Colors.lightBackground }]}>
          <Text style={[styles.detailsTitle, { color: Colors.text }]}>Subscription Details</Text>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: Colors.lightText }]}>Plan:</Text>
            <Text style={[styles.detailValue, { color: Colors.text }]}>
              UniPilot {planName} Plan
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: Colors.lightText }]}>Price:</Text>
            <Text style={[styles.detailValue, { color: Colors.text }]}>
              {priceDisplay}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: Colors.lightText }]}>Status:</Text>
            <Text style={[styles.detailValue, { color: Colors.success }]}>Active</Text>
          </View>
        </View>
      </Card>

      <Card style={[styles.nextStepsCard, { backgroundColor: Colors.premiumBackground, borderColor: Colors.premium }]} variant="outlined">
        <Text style={[styles.nextStepsTitle, { color: Colors.text }]}>🚀 Next Steps</Text>
        <Text style={[styles.nextStepsDescription, { color: Colors.lightText }]}>
          Continue your journey and explore the unlocked roadmap modules:
        </Text>
        
        <View style={styles.actionButtons}>
          <Button
            title="Continue Journey"
            onPress={() => router.push('/(tabs)/journey')}
            icon={<ArrowRight size={20} color={Colors.white} />}
            fullWidth
            style={styles.actionButton}
          />
          <Button
            title="Explore Premium Resources"
            onPress={() => router.push('/premium')}
            variant="outline"
            fullWidth
            style={styles.actionButton}
          />
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  successCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 24,
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 12,
  },
  successDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  subscriptionDetails: {
    padding: 16,
    borderRadius: 12,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  nextStepsCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 24,
    borderWidth: 1,
  },
  nextStepsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  nextStepsDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    marginTop: 0,
  },
  errorCard: {
    margin: 20,
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  errorButton: {
    marginTop: 8,
  },
});
