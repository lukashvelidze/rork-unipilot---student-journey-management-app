import React, { useState } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Crown, Check, Zap, Target, FileText, Calendar, MessageSquare, Users, BookOpen, Award, Gift, ArrowRight, Star, Plane, Brain, TrendingUp, Shield, Headphones, Video, Globe, DollarSign } from "lucide-react-native";
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
      description: "Get personalized recommendations and instant answers to complex questions",
      color: Colors.primary,
      available: true,
      benefits: ["24/7 AI assistant", "Personalized advice", "Document analysis", "Application review"]
    },
    {
      icon: Plane,
      title: "Smart Flight Search",
      description: "Find the cheapest flights with our advanced search engine and price alerts",
      color: Colors.flightPrimary,
      available: true,
      benefits: ["Price comparison", "Deal alerts", "Flexible dates", "Direct booking links"]
    },
    {
      icon: Target,
      title: "Personal Mentor Access",
      description: "1-on-1 sessions with university admission experts and successful alumni",
      color: Colors.secondary,
      available: true,
      benefits: ["Expert consultations", "Mock interviews", "Application review", "Career guidance"]
    },
    {
      icon: FileText,
      title: "Premium Resources Library",
      description: "Exclusive templates, guides, and application materials from top universities",
      color: Colors.accent,
      available: true,
      benefits: ["50+ premium guides", "Application templates", "Essay examples", "Scholarship database"]
    },
    {
      icon: Brain,
      title: "AI Document Generator",
      description: "Generate personalized SOPs, cover letters, and essays using advanced AI",
      color: Colors.info,
      available: true,
      benefits: ["SOP generator", "Cover letter builder", "Essay assistant", "Grammar checker"]
    },
    {
      icon: TrendingUp,
      title: "Advanced Analytics",
      description: "Detailed progress tracking, success predictions, and performance insights",
      color: Colors.success,
      available: true,
      benefits: ["Progress analytics", "Success probability", "Benchmark comparison", "Goal tracking"]
    },
    {
      icon: Shield,
      title: "Priority Support",
      description: "24/7 premium support with faster response times and dedicated agents",
      color: Colors.warning,
      available: true,
      benefits: ["24/7 support", "Priority queue", "Dedicated agent", "Phone support"]
    },
    {
      icon: Video,
      title: "Exclusive Webinars",
      description: "Live sessions with admission experts, successful students, and industry leaders",
      color: Colors.memoryPurple,
      available: true,
      benefits: ["Weekly webinars", "Expert Q&A", "Networking events", "Recorded sessions"]
    },
    {
      icon: Users,
      title: "Premium Community",
      description: "Access to exclusive networking groups and study circles with top performers",
      color: Colors.memoryPink,
      available: true,
      benefits: ["Elite community", "Study groups", "Networking events", "Mentorship program"]
    },
    {
      icon: Globe,
      title: "Country-Specific Guidance",
      description: "Detailed guides and requirements for 50+ countries and 1000+ universities",
      color: Colors.career,
      available: true,
      benefits: ["Country guides", "Visa assistance", "Cultural preparation", "Local insights"]
    },
    {
      icon: DollarSign,
      title: "Scholarship Maximizer",
      description: "AI-powered scholarship matching and application optimization tools",
      color: Colors.premium,
      available: true,
      benefits: ["Scholarship matching", "Application optimizer", "Funding calculator", "Success tracker"]
    },
    {
      icon: Headphones,
      title: "Personal Success Coach",
      description: "Dedicated success coach for accountability and motivation throughout your journey",
      color: Colors.academic,
      available: false,
      benefits: ["Personal coach", "Weekly check-ins", "Goal setting", "Motivation support"]
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
      const validPromoCodes = ["STUDENT2024", "WELCOME", "BETA", "EARLYBIRD", "ADMIN", "PREMIUM50", "LAUNCH2024"];
      
      if (validPromoCodes.includes(promoCode.toUpperCase())) {
        // Set premium status
        console.log("Setting premium status to true");
        setPremium(true);
        
        // Clear the promo code input
        setPromoCode("");
        setShowPromoInput(false);
        
        // Show success alert
        Alert.alert(
          "🎉 Premium Activated!",
          `Congratulations! You now have access to all premium features with code: ${promoCode.toUpperCase()}

✨ What's unlocked:
• AI-Powered Guidance
• Smart Flight Search
• Premium Resources Library
• Personal Mentor Access
• And much more!`,
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

💡 Try these codes:
• STUDENT2024 - Student discount
• WELCOME - Welcome bonus
• BETA - Beta tester access
• EARLYBIRD - Early adopter
• LAUNCH2024 - Launch special
• ADMIN - Full access`,
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
      "🚀 Coming Soon!",
      "Premium subscriptions will be available soon. For now, try using a promo code to unlock premium features and experience the full power of UniPilot!",
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
          <View style={styles.premiumStats}>
            <View style={styles.statBubble}>
              <Text style={styles.statNumber}>11</Text>
              <Text style={styles.statLabel}>Features</Text>
            </View>
            <View style={styles.statBubble}>
              <Text style={styles.statNumber}>∞</Text>
              <Text style={styles.statLabel}>AI Queries</Text>
            </View>
            <View style={styles.statBubble}>
              <Text style={styles.statNumber}>24/7</Text>
              <Text style={styles.statLabel}>Support</Text>
            </View>
          </View>
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
                <View style={styles.benefitsList}>
                  {feature.benefits.slice(0, 2).map((benefit, idx) => (
                    <View key={idx} style={styles.benefitItem}>
                      <Check size={12} color={Colors.success} />
                      <Text style={styles.benefitText}>{benefit}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            ))}
          </View>
        </View>
        
        {/* Success Stories */}
        <Card style={styles.successCard} variant="glass">
          <Text style={styles.successTitle}>🎓 Success Stories</Text>
          <Text style={styles.successDescription}>
            "UniPilot Premium helped me get into Harvard with a full scholarship. The AI guidance and mentor sessions were game-changers!"
          </Text>
          <Text style={styles.successAuthor}>- Sarah M., Harvard University</Text>
          
          <View style={styles.successStats}>
            <View style={styles.successStat}>
              <Text style={styles.successStatNumber}>95%</Text>
              <Text style={styles.successStatLabel}>Acceptance Rate</Text>
            </View>
            <View style={styles.successStat}>
              <Text style={styles.successStatNumber}>$2.5M</Text>
              <Text style={styles.successStatLabel}>Scholarships Won</Text>
            </View>
            <View style={styles.successStat}>
              <Text style={styles.successStatNumber}>50K+</Text>
              <Text style={styles.successStatLabel}>Students Helped</Text>
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
          Supercharge your study abroad journey with AI-powered tools
        </Text>
      </LinearGradient>
      
      {/* Value Proposition */}
      <Card style={styles.valueCard} variant="elevated">
        <View style={styles.valueHeader}>
          <Award size={32} color={Colors.success} />
          <Text style={styles.valueTitle}>Why Choose Premium?</Text>
        </View>
        <Text style={styles.valueDescription}>
          Join thousands of successful students who used UniPilot Premium to get accepted 
          into their dream universities with scholarships worth millions.
        </Text>
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>95%</Text>
            <Text style={styles.statLabel}>Success Rate</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>$2.5M</Text>
            <Text style={styles.statLabel}>Scholarships Won</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>50K+</Text>
            <Text style={styles.statLabel}>Students Helped</Text>
          </View>
        </View>
      </Card>
      
      {/* Promo Code Section */}
      <Card style={styles.promoCard} variant="elevated">
        <View style={styles.promoHeader}>
          <Gift size={24} color={Colors.primary} />
          <Text style={styles.promoTitle}>Have a Promo Code?</Text>
        </View>
        <Text style={styles.promoDescription}>
          Enter your promo code to unlock premium features instantly and start your success journey
        </Text>
        
        {showPromoInput ? (
          <View style={styles.promoInputContainer}>
            <View style={styles.promoInputWrapper}>
              <Input
                placeholder="Enter promo code"
                value={promoCode}
                onChangeText={setPromoCode}
                autoCapitalize="characters"
                style={styles.promoInput}
                autoCorrect={false}
                autoComplete="off"
              />
            </View>
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
            💡 Try: STUDENT2024, WELCOME, BETA, EARLYBIRD, LAUNCH2024, or ADMIN
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
          <Text style={styles.price}>$9.99</Text>
          <Text style={styles.pricePeriod}>/month</Text>
          <View style={styles.originalPrice}>
            <Text style={styles.originalPriceText}>$19.99</Text>
            <Text style={styles.discountText}>50% OFF</Text>
          </View>
        </View>
        
        <Text style={styles.subscriptionDescription}>
          Full premium access with all features, priority support, personal mentor, and exclusive content.
        </Text>
        
        <View style={styles.subscriptionFeatures}>
          <View style={styles.subscriptionFeature}>
            <Check size={16} color={Colors.success} />
            <Text style={styles.subscriptionFeatureText}>All premium features</Text>
          </View>
          <View style={styles.subscriptionFeature}>
            <Check size={16} color={Colors.success} />
            <Text style={styles.subscriptionFeatureText}>Personal success coach</Text>
          </View>
          <View style={styles.subscriptionFeature}>
            <Check size={16} color={Colors.success} />
            <Text style={styles.subscriptionFeatureText}>Priority support</Text>
          </View>
        </View>
        
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
              <View style={styles.benefitsList}>
                {feature.benefits.slice(0, 2).map((benefit, idx) => (
                  <View key={idx} style={styles.benefitItem}>
                    <Check size={12} color={Colors.lightText} />
                    <Text style={styles.benefitText}>{benefit}</Text>
                  </View>
                ))}
              </View>
            </Card>
          ))}
        </View>
      </View>
      
      {/* Testimonials */}
      <Card style={styles.testimonialsCard} variant="glass">
        <Text style={styles.testimonialsTitle}>What Students Say</Text>
        <View style={styles.testimonialsList}>
          <View style={styles.testimonial}>
            <Text style={styles.testimonialText}>
              "The AI guidance helped me write the perfect SOP. Got into MIT!"
            </Text>
            <Text style={styles.testimonialAuthor}>- Alex K., MIT</Text>
          </View>
          <View style={styles.testimonial}>
            <Text style={styles.testimonialText}>
              "Flight search saved me $800 on my tickets to Germany!"
            </Text>
            <Text style={styles.testimonialAuthor}>- Maria S., TU Munich</Text>
          </View>
          <View style={styles.testimonial}>
            <Text style={styles.testimonialText}>
              "Premium resources are worth every penny. Comprehensive and helpful!"
            </Text>
            <Text style={styles.testimonialAuthor}>- David L., Oxford</Text>
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
    marginBottom: 24,
  },
  premiumStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingHorizontal: 20,
  },
  statBubble: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: "center",
    minWidth: 70,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.white,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
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
  valueCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 24,
  },
  valueHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  valueTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text,
    marginLeft: 12,
  },
  valueDescription: {
    fontSize: 14,
    color: Colors.lightText,
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
  promoInputWrapper: {
    width: "100%",
  },
  promoInput: {
    marginBottom: 0,
    width: "100%",
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
  originalPrice: {
    marginLeft: 12,
    alignItems: "center",
  },
  originalPriceText: {
    fontSize: 14,
    color: Colors.lightText,
    textDecorationLine: "line-through",
  },
  discountText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: "600",
  },
  subscriptionDescription: {
    fontSize: 14,
    color: Colors.lightText,
    marginBottom: 16,
    lineHeight: 20,
  },
  subscriptionFeatures: {
    marginBottom: 20,
  },
  subscriptionFeature: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  subscriptionFeatureText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 8,
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
    marginBottom: 8,
  },
  benefitsList: {
    gap: 4,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  benefitText: {
    fontSize: 10,
    color: Colors.lightText,
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
  successCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 24,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 12,
  },
  successDescription: {
    fontSize: 14,
    color: Colors.lightText,
    lineHeight: 20,
    marginBottom: 8,
    fontStyle: "italic",
  },
  successAuthor: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "600",
    marginBottom: 20,
  },
  successStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  successStat: {
    alignItems: "center",
  },
  successStatNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.success,
    marginBottom: 4,
  },
  successStatLabel: {
    fontSize: 11,
    color: Colors.lightText,
  },
  testimonialsCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
  },
  testimonialsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  testimonialsList: {
    gap: 16,
  },
  testimonial: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  testimonialText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 8,
    fontStyle: "italic",
  },
  testimonialAuthor: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "600",
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