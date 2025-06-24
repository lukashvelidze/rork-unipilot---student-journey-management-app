import React, { useState } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Crown, Check, Zap, Target, FileText, Calendar, MessageSquare, Users, BookOpen, Award, Gift, ArrowRight, Star } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import Theme from "@/constants/theme";
import Card from "@/components/Card";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { useUserStore } from "@/store/userStore";

export default function PremiumScreen() {
  const router = useRouter();
  const { user, isPremium, setPremium } = useUserStore();
  const [promoCode, setPromoCode] = useState("");
  const [isProcessingPromo, setIsProcessingPromo] = useState(false);
  const [showPromoInput, setShowPromoInput] = useState(false);
  
  // Use the isPremium from store, not just from user object
  const isUserPremium = isPremium || user?.isPremium || false;
  
  const premiumFeatures = [
    {
      icon: Zap,
      title: "AI-Powered Guidance",
      description: "Get personalized recommendations and instant answers",
      color: Colors.primary,
      available: true,
    },
    {
      icon: Target,
      title: "Personal Mentor Access",
      description: "1-on-1 sessions with university admission experts",
      color: Colors.secondary,
      available: false,
    },
    {
      icon: FileText,
      title: "Premium Resources",
      description: "Exclusive templates, guides, and application materials",
      color: Colors.accent,
      available: true,
    },
    {
      icon: Calendar,
      title: "Priority Support",
      description: "24/7 premium support with faster response times",
      color: Colors.success,
      available: false,
    },
    {
      icon: MessageSquare,
      title: "Expert Consultations",
      description: "Direct access to university admission consultants",
      color: Colors.info,
      available: false,
    },
    {
      icon: Users,
      title: "Premium Community",
      description: "Access to exclusive networking and study groups",
      color: Colors.secondary,
      available: true,
    },
    {
      icon: BookOpen,
      title: "Advanced Analytics",
      description: "Detailed progress tracking and success predictions",
      color: Colors.accent,
      available: true,
    },
    {
      icon: Award,
      title: "Success Guarantee",
      description: "Money-back guarantee program (coming soon)",
      color: Colors.success,
      available: false,
    },
  ];
  
  const handlePromoCode = async () => {
    if (!promoCode.trim()) {
      Alert.alert("Error", "Please enter a promo code");
      return;
    }
    
    setIsProcessingPromo(true);
    
    try {
      // Simulate promo code validation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check for valid promo codes (including admin code)
      const validPromoCodes = ["STUDENT2024", "WELCOME", "BETA", "EARLYBIRD", "ADMIN"];
      
      if (validPromoCodes.includes(promoCode.toUpperCase())) {
        // Set premium status
        console.log("Setting premium status to true");
        setPremium(true);
        
        // Clear the promo code input
        setPromoCode("");
        setShowPromoInput(false);
        
        // Show success alert
        Alert.alert(
          "Promo Code Applied!",
          `Congratulations! You now have access to premium features with code: ${promoCode.toUpperCase()}`,
          [
            {
              text: "Explore Features",
              onPress: () => {
                // Small delay to ensure state is updated
                setTimeout(() => {
                  router.push("/premium/resources");
                }, 100);
              },
            },
            {
              text: "Stay Here",
              style: "cancel",
            },
          ]
        );
      } else {
        Alert.alert(
          "Invalid Promo Code",
          `The promo code "${promoCode}" is not valid. Please check and try again.

Valid codes: STUDENT2024, WELCOME, BETA, EARLYBIRD, ADMIN`,
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Promo code error:", error);
      Alert.alert(
        "Error",
        "There was an issue validating your promo code. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsProcessingPromo(false);
    }
  };
  
  const handleComingSoon = () => {
    Alert.alert(
      "Coming Soon!",
      "Premium subscriptions will be available soon. For now, try using a promo code to unlock premium features.",
      [{ text: "Got it" }]
    );
  };
  
  // Debug logging
  React.useEffect(() => {
    console.log("Premium Screen - isPremium:", isPremium);
    console.log("Premium Screen - user?.isPremium:", user?.isPremium);
    console.log("Premium Screen - isUserPremium:", isUserPremium);
  }, [isPremium, user?.isPremium, isUserPremium]);
  
  if (isUserPremium) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          style={styles.premiumHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Crown size={48} color={Colors.white} />
          <Text style={styles.premiumTitle}>Premium Active</Text>
          <Text style={styles.premiumSubtitle}>
            You have access to all premium features
          </Text>
        </LinearGradient>
        
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/premium/resources")}
          >
            <FileText size={24} color={Colors.primary} />
            <Text style={styles.actionTitle}>Premium Resources</Text>
            <ArrowRight size={16} color={Colors.lightText} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/unipilot-ai")}
          >
            <Zap size={24} color={Colors.secondary} />
            <Text style={styles.actionTitle}>AI Assistant</Text>
            <ArrowRight size={16} color={Colors.lightText} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Your Premium Features</Text>
          <View style={styles.featuresGrid}>
            {premiumFeatures.map((feature, index) => (
              <Card key={index} style={styles.featureCard} variant="elevated">
                <View style={styles.featureHeader}>
                  <feature.icon size={24} color={feature.color} />
                  {feature.available ? (
                    <View style={styles.activeIndicator}>
                      <Check size={14} color={Colors.success} />
                    </View>
                  ) : (
                    <View style={styles.comingSoonBadge}>
                      <Text style={styles.comingSoonText}>Soon</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </Card>
            ))}
          </View>
        </View>
        
        {/* Debug info for testing */}
        {__DEV__ && (
          <Card style={styles.debugCard}>
            <Text style={styles.debugTitle}>Debug Info</Text>
            <Text style={styles.debugText}>Store isPremium: {isPremium ? "true" : "false"}</Text>
            <Text style={styles.debugText}>User isPremium: {user?.isPremium ? "true" : "false"}</Text>
            <Text style={styles.debugText}>Final isPremium: {isUserPremium ? "true" : "false"}</Text>
            <Button
              title="Reset Premium (Debug)"
              onPress={() => setPremium(false)}
              variant="outline"
              style={styles.debugButton}
            />
          </Card>
        )}
      </ScrollView>
    );
  }
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Crown size={48} color={Colors.white} />
        <Text style={styles.title}>Unlock Premium</Text>
        <Text style={styles.subtitle}>
          Supercharge your study abroad journey
        </Text>
      </LinearGradient>
      
      {/* Promo Code Section */}
      <Card style={styles.promoCard} variant="elevated">
        <View style={styles.promoHeader}>
          <Gift size={24} color={Colors.primary} />
          <Text style={styles.promoTitle}>Have a Promo Code?</Text>
        </View>
        <Text style={styles.promoDescription}>
          Enter your promo code to unlock premium features instantly
        </Text>
        
        {showPromoInput ? (
          <View style={styles.promoInputContainer}>
            <Input
              placeholder="Enter promo code"
              value={promoCode}
              onChangeText={setPromoCode}
              autoCapitalize="characters"
              style={styles.promoInput}
              autoCorrect={false}
              autoComplete="off"
            />
            <View style={styles.promoButtons}>
              <Button
                title="Apply Code"
                onPress={handlePromoCode}
                loading={isProcessingPromo}
                style={styles.applyButton}
                disabled={!promoCode.trim() || isProcessingPromo}
              />
              <Button
                title="Cancel"
                onPress={() => {
                  setShowPromoInput(false);
                  setPromoCode("");
                }}
                variant="outline"
                style={styles.cancelButton}
                disabled={isProcessingPromo}
              />
            </View>
          </View>
        ) : (
          <Button
            title="Enter Promo Code"
            onPress={() => setShowPromoInput(true)}
            variant="outline"
            icon={<Gift size={20} color={Colors.primary} />}
            fullWidth
          />
        )}
        
        <View style={styles.promoHint}>
          <Text style={styles.hintText}>
            Try: STUDENT2024, WELCOME, BETA, EARLYBIRD, or ADMIN
          </Text>
        </View>
      </Card>
      
      {/* Coming Soon Subscription */}
      <Card style={styles.subscriptionCard} variant="outlined">
        <View style={styles.subscriptionHeader}>
          <Text style={styles.subscriptionTitle}>Premium Subscription</Text>
          <View style={styles.comingSoonBadge}>
            <Star size={12} color={Colors.warning} />
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </View>
        </View>
        
        <View style={styles.priceContainer}>
          <Text style={styles.price}>$4.99</Text>
          <Text style={styles.pricePeriod}>/month</Text>
        </View>
        
        <Text style={styles.subscriptionDescription}>
          Full premium access with all features, priority support, and exclusive content.
        </Text>
        
        <Button
          title="Notify Me When Available"
          onPress={handleComingSoon}
          variant="secondary"
          fullWidth
          style={styles.notifyButton}
        />
      </Card>
      
      {/* Features Grid */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Premium Features</Text>
        <View style={styles.featuresGrid}>
          {premiumFeatures.map((feature, index) => (
            <Card key={index} style={styles.featureCard} variant="default">
              <View style={styles.featureHeader}>
                <feature.icon size={24} color={feature.color} />
                {!feature.available && (
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>Soon</Text>
                  </View>
                )}
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </Card>
          ))}
        </View>
      </View>
      
      {/* Value Proposition */}
      <Card style={styles.valueCard} variant="glass">
        <Award size={32} color={Colors.success} />
        <Text style={styles.valueTitle}>Why Choose Premium?</Text>
        <Text style={styles.valueDescription}>
          Join thousands of successful students who used UniPilot Premium to get accepted 
          into their dream universities. Our premium features are designed to give you 
          the competitive edge you need.
        </Text>
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>95%</Text>
            <Text style={styles.statLabel}>Success Rate</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>50K+</Text>
            <Text style={styles.statLabel}>Students Helped</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>200+</Text>
            <Text style={styles.statLabel}>Universities</Text>
          </View>
        </View>
      </Card>
      
      {/* Debug info for testing */}
      {__DEV__ && (
        <Card style={styles.debugCard}>
          <Text style={styles.debugTitle}>Debug Info</Text>
          <Text style={styles.debugText}>Store isPremium: {isPremium ? "true" : "false"}</Text>
          <Text style={styles.debugText}>User isPremium: {user?.isPremium ? "true" : "false"}</Text>
          <Text style={styles.debugText}>Final isPremium: {isUserPremium ? "true" : "false"}</Text>
          <Text style={styles.debugText}>Current promo code: "{promoCode}"</Text>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  premiumHeader: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.white,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 24,
  },
  premiumTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.white,
    marginTop: 16,
    marginBottom: 8,
  },
  premiumSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
  },
  quickActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    ...Theme.shadow.medium,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginLeft: 12,
    flex: 1,
  },
  promoCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: Colors.premiumBackground,
    borderWidth: 1,
    borderColor: Colors.premium,
  },
  promoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginLeft: 8,
  },
  promoDescription: {
    fontSize: 14,
    color: Colors.lightText,
    marginBottom: 16,
    lineHeight: 20,
  },
  promoInputContainer: {
    gap: 12,
  },
  promoInput: {
    marginBottom: 0,
  },
  promoButtons: {
    flexDirection: "row",
    gap: 12,
  },
  applyButton: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
  },
  promoHint: {
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.surface,
    borderRadius: 8,
  },
  hintText: {
    fontSize: 12,
    color: Colors.mutedText,
    textAlign: "center",
    fontStyle: "italic",
  },
  subscriptionCard: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  subscriptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  price: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.text,
  },
  pricePeriod: {
    fontSize: 16,
    color: Colors.lightText,
    marginLeft: 4,
  },
  subscriptionDescription: {
    fontSize: 14,
    color: Colors.lightText,
    marginBottom: 20,
    lineHeight: 20,
  },
  notifyButton: {
    marginBottom: 0,
  },
  featuresSection: {
    paddingHorizontal: 20,
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
  featureHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: Colors.lightText,
    lineHeight: 16,
  },
  activeIndicator: {
    backgroundColor: Colors.success,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  comingSoonBadge: {
    backgroundColor: Colors.warning,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.white,
  },
  valueCard: {
    marginHorizontal: 20,
    alignItems: "center",
    padding: 24,
  },
  valueTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  valueDescription: {
    fontSize: 14,
    color: Colors.lightText,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.lightText,
  },
  debugCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: Colors.lightText,
    marginBottom: 4,
  },
  debugButton: {
    marginTop: 8,
  },
});