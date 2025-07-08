import React, { useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { Crown, Check, Sparkles, ArrowRight, Gift } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useColors } from '@/hooks/useColors';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useUserStore } from '@/store/userStore';
import CelebrationAnimation from '@/components/CelebrationAnimation';

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const Colors = useColors();
  const { setPremium } = useUserStore();

  useEffect(() => {
    // Activate premium when this screen loads
    setPremium(true);
  }, [setPremium]);

  const premiumFeatures = [
    {
      icon: Crown,
      title: 'Personal Mentor Access',
      description: 'Get 1-on-1 sessions with university admission experts',
      color: Colors.primary,
    },
    {
      icon: Gift,
      title: 'Premium Resources Library',
      description: 'Exclusive templates, guides, and application materials',
      color: Colors.accent,
    },
    {
      icon: Sparkles,
      title: 'Advanced Analytics',
      description: 'Detailed progress tracking and success predictions',
      color: Colors.info,
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: Colors.background }]} contentContainerStyle={styles.scrollContent}>
      <Stack.Screen
        options={{
          title: 'Welcome to Premium',
          headerShown: false,
        }}
      />
      
      <CelebrationAnimation visible={true} />
      
      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Crown size={64} color={Colors.white} />
        <Text style={styles.title}>🎉 Welcome to Premium!</Text>
        <Text style={styles.subtitle}>
          Your payment was successful. You now have access to all premium features!
        </Text>
      </LinearGradient>

      <Card style={[styles.successCard, { backgroundColor: Colors.card }]} variant="elevated">
        <View style={styles.successHeader}>
          <Check size={32} color={Colors.success} />
          <Text style={[styles.successTitle, { color: Colors.text }]}>Payment Confirmed</Text>
        </View>
        <Text style={[styles.successDescription, { color: Colors.lightText }]}>
          Thank you for subscribing to UniPilot Premium! Your subscription is now active and you have unlimited access to all premium features.
        </Text>
        
        <View style={[styles.subscriptionDetails, { backgroundColor: Colors.surface }]}>
          <Text style={[styles.detailsTitle, { color: Colors.text }]}>Subscription Details</Text>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: Colors.lightText }]}>Plan:</Text>
            <Text style={[styles.detailValue, { color: Colors.text }]}>UniPilot Premium</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: Colors.lightText }]}>Price:</Text>
            <Text style={[styles.detailValue, { color: Colors.text }]}>$4.99/month</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: Colors.lightText }]}>Status:</Text>
            <Text style={[styles.detailValue, { color: Colors.success }]}>Active</Text>
          </View>
        </View>
      </Card>

      <View style={styles.featuresSection}>
        <Text style={[styles.sectionTitle, { color: Colors.text }]}>What's Unlocked</Text>
        <View style={styles.featuresList}>
          {premiumFeatures.map((feature, index) => (
            <View key={index} style={[styles.featureItem, { backgroundColor: Colors.card }]}>
              <feature.icon size={24} color={feature.color} />
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: Colors.text }]}>{feature.title}</Text>
                <Text style={[styles.featureDescription, { color: Colors.lightText }]}>{feature.description}</Text>
              </View>
              <Check size={20} color={Colors.success} />
            </View>
          ))}
        </View>
      </View>

      <Card style={[styles.nextStepsCard, { backgroundColor: Colors.premiumBackground, borderColor: Colors.premium }]} variant="outlined">
        <Text style={[styles.nextStepsTitle, { color: Colors.text }]}>🚀 Next Steps</Text>
        <Text style={[styles.nextStepsDescription, { color: Colors.lightText }]}>
          Ready to supercharge your study abroad journey? Here's what you can do next:
        </Text>
        
        <View style={styles.actionButtons}>
          <Button
            title="Explore Premium Resources"
            onPress={() => router.push('/premium/resources')}
            icon={<Gift size={20} color={Colors.white} />}
            style={[styles.actionButton, { backgroundColor: Colors.primary }]}
            fullWidth
          />
          
          <Button
            title="Start AI Assistant"
            onPress={() => router.push('/unipilot-ai')}
            icon={<Sparkles size={20} color={Colors.white} />}
            style={[styles.actionButton, { backgroundColor: Colors.secondary }]}
            fullWidth
          />
          
          <Button
            title="Continue Journey"
            onPress={() => router.push('/(tabs)')}
            icon={<ArrowRight size={20} color={Colors.primary} />}
            variant="outline"
            fullWidth
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
  featuresSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 12,
    lineHeight: 16,
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
    marginBottom: 0,
  },
});