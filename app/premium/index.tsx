import React, { useState } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Crown, Check, Zap, Target, FileText, Calendar, MessageSquare, Users, BookOpen, Award } from "lucide-react-native";
import Colors from "@/constants/colors";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { useUserStore } from "@/store/userStore";

export default function PremiumScreen() {
  const router = useRouter();
  const { user, setPremium } = useUserStore();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const isPremium = user?.isPremium || false;
  
  const premiumFeatures = [
    {
      icon: Zap,
      title: "Unlimited AI Assistant",
      description: "Get unlimited access to UniPilot AI for personalized guidance",
      color: "#FFD700",
    },
    {
      icon: Target,
      title: "Personal Mentor",
      description: "1-on-1 guidance sessions with experienced mentors",
      color: "#9C27B0",
    },
    {
      icon: FileText,
      title: "Premium Resources",
      description: "Exclusive templates, guides, and application materials",
      color: "#FF6B35",
    },
    {
      icon: Calendar,
      title: "Priority Support",
      description: "24/7 premium support with faster response times",
      color: "#4CAF50",
    },
    {
      icon: MessageSquare,
      title: "Expert Consultations",
      description: "Direct access to university admission experts",
      color: "#2196F3",
    },
    {
      icon: Users,
      title: "Premium Community",
      description: "Access to exclusive premium community features",
      color: "#E91E63",
    },
    {
      icon: BookOpen,
      title: "Advanced Analytics",
      description: "Detailed progress tracking and success predictions",
      color: "#00BCD4",
    },
    {
      icon: Award,
      title: "Success Guarantee",
      description: "Money-back guarantee if you don't get accepted",
      color: "#8BC34A",
    },
  ];
  
  const handleUpgrade = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update user to premium
      setPremium(true);
      
      Alert.alert(
        "Welcome to Premium!",
        "You now have access to all premium features. Enjoy your enhanced UniPilot experience!",
        [
          {
            text: "Get Started",
            onPress: () => router.replace("/(tabs)"),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        "Payment Failed",
        "There was an issue processing your payment. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleManageSubscription = () => {
    Alert.alert(
      "Manage Subscription",
      "You can manage your subscription through your app store account.",
      [{ text: "OK" }]
    );
  };
  
  if (isPremium) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.premiumHeader}>
          <Crown size={48} color="#FFD700" />
          <Text style={styles.premiumTitle}>You're Premium!</Text>
          <Text style={styles.premiumSubtitle}>
            Enjoy all the exclusive features and benefits
          </Text>
        </View>
        
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Crown size={24} color="#FFD700" />
            <Text style={styles.statusTitle}>Premium Active</Text>
          </View>
          <Text style={styles.statusDescription}>
            Your premium subscription is active and you have access to all features.
          </Text>
          <TouchableOpacity
            style={styles.manageButton}
            onPress={handleManageSubscription}
          >
            <Text style={styles.manageButtonText}>Manage Subscription</Text>
          </TouchableOpacity>
        </Card>
        
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Your Premium Features</Text>
          <View style={styles.featuresGrid}>
            {premiumFeatures.map((feature, index) => (
              <Card key={index} style={styles.featureCard}>
                <feature.icon size={24} color={feature.color} />
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
                <View style={styles.activeIndicator}>
                  <Check size={16} color={Colors.success} />
                  <Text style={styles.activeText}>Active</Text>
                </View>
              </Card>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  }
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Crown size={48} color="#FFD700" />
        <Text style={styles.title}>Upgrade to Premium</Text>
        <Text style={styles.subtitle}>
          Unlock the full potential of your study abroad journey
        </Text>
      </View>
      
      <Card style={styles.pricingCard}>
        <View style={styles.pricingHeader}>
          <Text style={styles.pricingTitle}>UniPilot Premium</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>$4.99</Text>
            <Text style={styles.pricePeriod}>/month</Text>
          </View>
        </View>
        
        <View style={styles.benefitsList}>
          <Text style={styles.benefitsTitle}>What you get:</Text>
          {premiumFeatures.map((feature, index) => (
            <View key={index} style={styles.benefitItem}>
              <Check size={20} color={Colors.success} />
              <Text style={styles.benefitText}>{feature.title}</Text>
            </View>
          ))}
        </View>
        
        <Button
          title="Start Premium - $4.99/month"
          onPress={handleUpgrade}
          loading={isProcessing}
          fullWidth
          style={styles.upgradeButton}
        />
        
        <Text style={styles.disclaimer}>
          Cancel anytime. No commitments. 7-day free trial included.
        </Text>
      </Card>
      
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Premium Features</Text>
        <View style={styles.featuresGrid}>
          {premiumFeatures.map((feature, index) => (
            <Card key={index} style={styles.featureCard}>
              <feature.icon size={24} color={feature.color} />
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </Card>
          ))}
        </View>
      </View>
      
      <Card style={styles.guaranteeCard}>
        <Award size={32} color={Colors.success} />
        <Text style={styles.guaranteeTitle}>Success Guarantee</Text>
        <Text style={styles.guaranteeDescription}>
          We're so confident in our premium features that we offer a money-back guarantee. 
          If you don't get accepted to at least one university within 12 months, we'll refund your subscription.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: Colors.lightText,
    textAlign: "center",
    lineHeight: 24,
  },
  premiumHeader: {
    alignItems: "center",
    marginBottom: 32,
  },
  premiumTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  premiumSubtitle: {
    fontSize: 16,
    color: Colors.lightText,
    textAlign: "center",
  },
  pricingCard: {
    marginBottom: 24,
    backgroundColor: "rgba(255, 215, 0, 0.05)",
    borderWidth: 2,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  pricingHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  pricingTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  price: {
    fontSize: 36,
    fontWeight: "700",
    color: Colors.primary,
  },
  pricePeriod: {
    fontSize: 18,
    color: Colors.lightText,
    marginLeft: 4,
  },
  benefitsList: {
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 12,
    flex: 1,
  },
  upgradeButton: {
    marginBottom: 16,
  },
  disclaimer: {
    fontSize: 12,
    color: Colors.lightText,
    textAlign: "center",
    lineHeight: 16,
  },
  statusCard: {
    marginBottom: 24,
    backgroundColor: "rgba(255, 215, 0, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginLeft: 8,
  },
  statusDescription: {
    fontSize: 14,
    color: Colors.lightText,
    marginBottom: 16,
    lineHeight: 20,
  },
  manageButton: {
    backgroundColor: Colors.lightBackground,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
  featuresSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  featureCard: {
    width: "48%",
    marginBottom: 16,
    padding: 16,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: Colors.lightText,
    lineHeight: 16,
  },
  activeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  activeText: {
    fontSize: 12,
    color: Colors.success,
    marginLeft: 4,
    fontWeight: "500",
  },
  guaranteeCard: {
    alignItems: "center",
    backgroundColor: "rgba(76, 175, 80, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.2)",
  },
  guaranteeTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  guaranteeDescription: {
    fontSize: 14,
    color: Colors.lightText,
    textAlign: "center",
    lineHeight: 20,
  },
});