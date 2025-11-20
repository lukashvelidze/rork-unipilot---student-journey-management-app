import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Crown, Check, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useColors } from '@/hooks/useColors';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useUserStore } from '@/store/userStore';
import { supabase } from '@/lib/supabase';
import CelebrationAnimation from '@/components/CelebrationAnimation';

const TIER_NAMES: Record<string, string> = {
  basic: "Basic",
  standard: "Standard",
  pro: "Pro",
};

const TIER_PRICES: Record<string, string> = {
  basic: "$4.99",
  standard: "$9.99",
  pro: "$19.99",
};

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const Colors = useColors();
  const params = useLocalSearchParams();
  const { setPremium } = useUserStore();
  
  const [isUpdating, setIsUpdating] = useState(true);
  const [tier, setTier] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handlePaymentSuccess();
  }, []);

  const handlePaymentSuccess = async () => {
    try {
      // Get tier from URL parameters
      const tierParam = params.tier as string;
      if (!tierParam) {
        setError("No subscription tier found in payment confirmation.");
        setIsUpdating(false);
        return;
      }

      setTier(tierParam);

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
          updated_at: new Date().toISOString(),
        })
        .eq("id", authUser.id);

      if (updateError) {
        console.error("Error updating subscription:", updateError);
        setError("Failed to activate subscription. Please contact support.");
        setIsUpdating(false);
        return;
      }

      // Update local store
      // Map tier to isPremium (pro and standard are premium, basic might be considered premium too)
      const isPremiumTier = tierParam === "pro" || tierParam === "standard" || tierParam === "basic";
      if (isPremiumTier) {
        setPremium(true);
      }

      setIsUpdating(false);
    } catch (error: any) {
      console.error("Error handling payment success:", error);
      setError("An error occurred while activating your subscription. Please contact support.");
      setIsUpdating(false);
    }
  };

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
          Welcome to UniPilot {tier ? TIER_NAMES[tier] : "Premium"} Plan ({tier ? TIER_PRICES[tier] : "$4.99"}/month). 
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
              UniPilot {tier ? TIER_NAMES[tier] : "Premium"} Plan
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: Colors.lightText }]}>Price:</Text>
            <Text style={[styles.detailValue, { color: Colors.text }]}>
              {tier ? TIER_PRICES[tier] : "$4.99"}/month
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
