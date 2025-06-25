import React, { useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { X, Crown, Shield, Zap } from "lucide-react-native";
import Colors from "@/constants/colors";
import Card from "@/components/Card";
import Button from "@/components/Button";
import PaddleCheckout from "@/components/PaddleCheckout";
import { useUserStore } from "@/store/userStore";

export default function PaymentScreen() {
  const router = useRouter();
  const { user, setPremium } = useUserStore();
  const [showCheckout, setShowCheckout] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = () => {
    setShowCheckout(true);
  };

  const handleCheckoutSuccess = () => {
    setIsProcessing(true);
    
    // Set premium status
    setPremium(true);
    
    setTimeout(() => {
      setIsProcessing(false);
      Alert.alert(
        "Welcome to Premium!",
        "Your subscription is now active. Enjoy all premium features!",
        [
          {
            text: "Explore Features",
            onPress: () => router.push("/premium/resources"),
          },
          {
            text: "Go to Home",
            onPress: () => router.push("/(tabs)"),
            style: "cancel",
          },
        ]
      );
    }, 1000);
  };

  const handleCheckoutCancel = () => {
    Alert.alert("Subscription Canceled", "You can subscribe anytime from the premium page.");
  };

  const features = [
    {
      icon: Zap,
      title: "Unlimited AI Assistant",
      description: "Get unlimited access to UniPilot AI for personalized guidance",
    },
    {
      icon: Crown,
      title: "Premium Resources",
      description: "Access exclusive templates, guides, and application materials",
    },
    {
      icon: Shield,
      title: "Priority Support",
      description: "24/7 premium support with faster response times",
    },
  ];

  if (isProcessing) {
    return (
      <View style={styles.container}>
        <View style={styles.processingContainer}>
          <Crown size={48} color={Colors.premium} />
          <Text style={styles.processingTitle}>Activating Premium...</Text>
          <Text style={styles.processingText}>Please wait while we set up your premium account</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <X size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscribe to Premium</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.heroSection}>
          <Crown size={64} color={Colors.premium} />
          <Text style={styles.heroTitle}>UniPilot Premium</Text>
          <Text style={styles.heroSubtitle}>
            Supercharge your study abroad journey with premium features
          </Text>
        </View>

        <Card style={styles.pricingCard}>
          <View style={styles.pricingHeader}>
            <Text style={styles.price}>$4.99</Text>
            <Text style={styles.pricePeriod}>/month</Text>
          </View>
          <Text style={styles.pricingDescription}>
            Full premium access with all features. Cancel anytime.
          </Text>
          
          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <feature.icon size={20} color={Colors.primary} />
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>

          <Button
            title="Subscribe $4.99/month"
            onPress={handleSubscribe}
            variant="primary"
            fullWidth
            style={styles.subscribeButton}
            icon={<Crown size={20} color={Colors.white} />}
          />

          <Text style={styles.secureText}>
            🔒 Secure payment powered by Paddle
          </Text>
        </Card>

        <View style={styles.guaranteeSection}>
          <Text style={styles.guaranteeTitle}>30-Day Money-Back Guarantee</Text>
          <Text style={styles.guaranteeText}>
            Not satisfied? Get a full refund within 30 days, no questions asked.
          </Text>
        </View>
      </View>

      <PaddleCheckout
        visible={showCheckout}
        onClose={() => setShowCheckout(false)}
        onSuccess={handleCheckoutSuccess}
        onCancel={handleCheckoutCancel}
        customerEmail={user?.email || 'user@example.com'}
        userId={user?.id || 'anonymous'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: Colors.lightText,
    textAlign: "center",
    lineHeight: 24,
  },
  pricingCard: {
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.premium,
  },
  pricingHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    marginBottom: 8,
  },
  price: {
    fontSize: 36,
    fontWeight: "700",
    color: Colors.text,
  },
  pricePeriod: {
    fontSize: 18,
    color: Colors.lightText,
    marginLeft: 4,
  },
  pricingDescription: {
    fontSize: 14,
    color: Colors.lightText,
    textAlign: "center",
    marginBottom: 24,
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  featureText: {
    flex: 1,
    marginLeft: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: Colors.lightText,
    lineHeight: 20,
  },
  subscribeButton: {
    marginBottom: 16,
  },
  secureText: {
    fontSize: 12,
    color: Colors.mutedText,
    textAlign: "center",
  },
  guaranteeSection: {
    alignItems: "center",
    padding: 20,
    backgroundColor: Colors.successBackground,
    borderRadius: 12,
  },
  guaranteeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.success,
    marginBottom: 8,
  },
  guaranteeText: {
    fontSize: 14,
    color: Colors.text,
    textAlign: "center",
    lineHeight: 20,
  },
  processingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  processingTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  processingText: {
    fontSize: 16,
    color: Colors.lightText,
    textAlign: "center",
  },
});