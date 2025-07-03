import React, { useState } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Crown, Check, Zap, Target, BookOpen, Calendar, Video, Users, Award, Gift, ChevronRight, Star, BarChart3, UserCheck, MessageCircle } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";
import { useColors } from "@/hooks/useColors";
import Card from "@/components/Card";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { useUserStore } from "@/store/userStore";

export default function PremiumScreen() {
  const router = useRouter();
  const Colors = useColors();
  const { user, isPremium, setPremium } = useUserStore();
  const [promoCode, setPromoCode] = useState("");
  const [isProcessingPromo, setIsProcessingPromo] = useState(false);
  const [showPromoInput, setShowPromoInput] = useState(false);
  
  // Use the isPremium from store, not just from user object
  const isUserPremium = isPremium || user?.isPremium || false;
  
  const premiumFeatures = [
    {
      icon: UserCheck,
      title: "Personal Mentor Access",
      description: "Get 1-on-1 sessions with university admission experts and successful alumni",
      color: Colors.primary,
      available: true,
      benefits: ["Weekly 1-on-1 sessions", "Expert consultations", "Mock interviews", "Application review"]
    },
    {
      icon: BookOpen,
      title: "Premium Resources Library",
      description: "Exclusive templates, guides, and application materials from top universities",
      color: Colors.accent,
      available: true,
      benefits: ["50+ premium guides", "Application templates", "Essay examples", "Scholarship database"]
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Detailed progress tracking, success predictions, and performance insights",
      color: Colors.info,
      available: true,
      benefits: ["Progress analytics", "Success probability", "Benchmark comparison", "Goal tracking"]
    },
    {
      icon: Video,
      title: "Exclusive Webinars",
      description: "Live sessions with admission experts, successful students, and industry leaders",
      color: Colors.memoryPurple,
      available: true,
      benefits: ["Weekly webinars", "Expert Q&A", "Networking events", "Recorded sessions"]
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
• Personal Mentor Access
• Premium Resources Library
• Advanced Analytics
• Exclusive Webinars`,
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
  
  const handleSubscribe = async () => {
    try {
      await WebBrowser.openBrowserAsync("https://lukashvelidze.github.io/unipilot/");
    } catch (error) {
      console.error("Error opening subscription page:", error);
      Alert.alert(
        "Error",
        "Unable to open subscription page. Please try again later.",
        [{ text: "OK" }]
      );
    }
  };
  
  // Debug logging
  React.useEffect(() => {
    console.log("Premium Screen - isPremium:", isPremium);
    console.log("Premium Screen - user?.isPremium:", user?.isPremium);
    console.log("Premium Screen - isUserPremium:", isUserPremium);
  }, [isPremium, user?.isPremium, isUserPremium]);
  
  if (isUserPremium) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: Colors.background }]} contentContainerStyle={styles.scrollContent}>
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
              <Text style={styles.statNumber}>{premiumFeatures.length}</Text>
              <Text style={styles.statLabel}>Features</Text>
            </View>
            <View style={styles.statBubble}>
              <Text style={styles.statNumber}>∞</Text>
              <Text style={styles.statLabel}>Access</Text>
            </View>
            <View style={styles.statBubble}>
              <Text style={styles.statNumber}>24/7</Text>
              <Text style={styles.statLabel}>Support</Text>
            </View>
          </View>
        </LinearGradient>
        
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: Colors.card }]}
            onPress={() => router.push("/premium/resources")}
          >
            <BookOpen size={24} color={Colors.primary} />
            <Text style={[styles.actionTitle, { color: Colors.text }]}>Premium Resources</Text>
            <ChevronRight size={16} color={Colors.lightText} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: Colors.card }]}
            onPress={() => router.push("/unipilot-ai")}
          >
            <Zap size={24} color={Colors.secondary} />
            <Text style={[styles.actionTitle, { color: Colors.text }]}>AI Assistant</Text>
            <ChevronRight size={16} color={Colors.lightText} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: Colors.card }]}
            onPress={() => Alert.alert("Personal Mentor", "Connect with your dedicated mentor for personalized guidance!")}
          >
            <UserCheck size={24} color={Colors.accent} />
            <Text style={[styles.actionTitle, { color: Colors.text }]}>Personal Mentor</Text>
            <ChevronRight size={16} color={Colors.lightText} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.featuresSection}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Your Premium Features</Text>
          <View style={styles.featuresGrid}>
            {premiumFeatures.map((feature, index) => (
              <Card key={index} style={styles.featureCard} variant="elevated">
                <View style={styles.featureHeader}>
                  <feature.icon size={24} color={feature.color} />
                  {feature.available ? (
                    <View style={[styles.activeIndicator, { backgroundColor: Colors.success }]}>
                      <Check size={14} color={Colors.white} />
                    </View>
                  ) : (
                    <View style={[styles.comingSoonBadge, { backgroundColor: Colors.warning }]}>
                      <Text style={styles.comingSoonText}>Soon</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.featureTitle, { color: Colors.text }]}>{feature.title}</Text>
                <Text style={[styles.featureDescription, { color: Colors.lightText }]}>{feature.description}</Text>
                <View style={styles.benefitsList}>
                  {feature.benefits.slice(0, 2).map((benefit, idx) => (
                    <View key={idx} style={styles.benefitItem}>
                      <Check size={12} color={Colors.success} />
                      <Text style={[styles.benefitText, { color: Colors.text }]}>{benefit}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            ))}
          </View>
        </View>
        
        {/* Success Stories */}
        <Card style={[styles.successCard, { backgroundColor: Colors.card }]} variant="glass">
          <Text style={[styles.successTitle, { color: Colors.text }]}>🎓 Success Stories</Text>
          <Text style={[styles.successDescription, { color: Colors.lightText }]}>
            "UniPilot Premium helped me get into Harvard with a full scholarship. The personal mentor and AI guidance were game-changers!"
          </Text>
          <Text style={[styles.successAuthor, { color: Colors.primary }]}>- Sarah M., Harvard University</Text>
          
          <View style={styles.successStats}>
            <View style={styles.successStat}>
              <Text style={[styles.successStatNumber, { color: Colors.success }]}>98%</Text>
              <Text style={[styles.successStatLabel, { color: Colors.lightText }]}>Acceptance Rate</Text>
            </View>
            <View style={styles.successStat}>
              <Text style={[styles.successStatNumber, { color: Colors.success }]}>$3.2M</Text>
              <Text style={[styles.successStatLabel, { color: Colors.lightText }]}>Scholarships Won</Text>
            </View>
            <View style={styles.successStat}>
              <Text style={[styles.successStatNumber, { color: Colors.success }]}>75K+</Text>
              <Text style={[styles.successStatLabel, { color: Colors.lightText }]}>Students Helped</Text>
            </View>
          </View>
        </Card>
        
        {/* Debug info for testing */}
        {__DEV__ && (
          <Card style={[styles.debugCard, { backgroundColor: Colors.surface, borderColor: Colors.border }]}>
            <Text style={[styles.debugTitle, { color: Colors.text }]}>Debug Info</Text>
            <Text style={[styles.debugText, { color: Colors.lightText }]}>Store isPremium: {isPremium ? "true" : "false"}</Text>
            <Text style={[styles.debugText, { color: Colors.lightText }]}>User isPremium: {user?.isPremium ? "true" : "false"}</Text>
            <Text style={[styles.debugText, { color: Colors.lightText }]}>Final isPremium: {isUserPremium ? "true" : "false"}</Text>
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
    <ScrollView style={[styles.container, { backgroundColor: Colors.background }]} contentContainerStyle={styles.scrollContent}>
      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Crown size={48} color={Colors.white} />
        <Text style={styles.title}>Unlock Premium</Text>
        <Text style={styles.subtitle}>
          Supercharge your study abroad journey with AI-powered tools and personal mentoring
        </Text>
      </LinearGradient>
      
      {/* Value Proposition */}
      <Card style={[styles.valueCard, { backgroundColor: Colors.card }]} variant="elevated">
        <View style={styles.valueHeader}>
          <Award size={32} color={Colors.success} />
          <Text style={[styles.valueTitle, { color: Colors.text }]}>Why Choose Premium?</Text>
        </View>
        <Text style={[styles.valueDescription, { color: Colors.lightText }]}>
          Join thousands of successful students who used UniPilot Premium to get accepted 
          into their dream universities with scholarships worth millions.
        </Text>
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: Colors.primary }]}>98%</Text>
            <Text style={[styles.statLabel, { color: Colors.lightText }]}>Success Rate</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: Colors.primary }]}>$3.2M</Text>
            <Text style={[styles.statLabel, { color: Colors.lightText }]}>Scholarships Won</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: Colors.primary }]}>75K+</Text>
            <Text style={[styles.statLabel, { color: Colors.lightText }]}>Students Helped</Text>
          </View>
        </View>
      </Card>
      
      {/* Promo Code Section */}
      <Card style={[styles.promoCard, { backgroundColor: Colors.premiumBackground, borderColor: Colors.premium }]} variant="elevated">
        <View style={styles.promoHeader}>
          <Gift size={24} color={Colors.primary} />
          <Text style={[styles.promoTitle, { color: Colors.text }]}>Have a Promo Code?</Text>
        </View>
        <Text style={[styles.promoDescription, { color: Colors.lightText }]}>
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
                style={[styles.applyButton, { backgroundColor: Colors.primary }]}
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
        
        <View style={[styles.promoHint, { backgroundColor: Colors.surface }]}>
          <Text style={[styles.hintText, { color: Colors.mutedText }]}>
            💡 Try: STUDENT2024, WELCOME, BETA, EARLYBIRD, LAUNCH2024, or ADMIN
          </Text>
        </View>
      </Card>
      
      {/* Premium Subscription */}
      <Card style={[styles.subscriptionCard, { backgroundColor: Colors.card, borderColor: Colors.border }]} variant="outlined">
        <View style={styles.subscriptionHeader}>
          <Text style={[styles.subscriptionTitle, { color: Colors.text }]}>Premium Subscription</Text>
          <View style={[styles.limitedOfferBadge, { backgroundColor: Colors.warning }]}>
            <Star size={12} color={Colors.white} />
            <Text style={styles.limitedOfferBadgeText}>Limited Offer</Text>
          </View>
        </View>
        
        <View style={styles.priceContainer}>
          <View style={styles.priceRow}>
            <Text style={[styles.originalPrice, { color: Colors.lightText }]}>$10.99</Text>
            <View style={[styles.discountBadge, { backgroundColor: Colors.error }]}>
              <Text style={styles.discountText}>55% OFF</Text>
            </View>
          </View>
          <Text style={[styles.price, { color: Colors.text }]}>$4.99</Text>
          <Text style={[styles.pricePeriod, { color: Colors.lightText }]}>/month</Text>
          <View style={[styles.limitedOffer, { backgroundColor: Colors.warning + "20", borderColor: Colors.warning + "40" }]}>
            <Text style={[styles.limitedOfferText, { color: Colors.warning }]}>⏰ Limited Time Offer</Text>
          </View>
        </View>
        
        <Text style={[styles.subscriptionDescription, { color: Colors.lightText }]}>
          Full premium access with personal mentoring, exclusive resources, and advanced analytics.
        </Text>
        
        <View style={styles.subscriptionFeatures}>
          <View style={styles.subscriptionFeature}>
            <Check size={16} color={Colors.success} />
            <Text style={[styles.subscriptionFeatureText, { color: Colors.text }]}>Personal mentor access</Text>
          </View>
          <View style={styles.subscriptionFeature}>
            <Check size={16} color={Colors.success} />
            <Text style={[styles.subscriptionFeatureText, { color: Colors.text }]}>Premium resources library</Text>
          </View>
          <View style={styles.subscriptionFeature}>
            <Check size={16} color={Colors.success} />
            <Text style={[styles.subscriptionFeatureText, { color: Colors.text }]}>Advanced analytics</Text>
          </View>
          <View style={styles.subscriptionFeature}>
            <Check size={16} color={Colors.success} />
            <Text style={[styles.subscriptionFeatureText, { color: Colors.text }]}>Exclusive webinars</Text>
          </View>
        </View>
        
        <Button
          title="Subscribe Now - $4.99/month"
          onPress={handleSubscribe}
          fullWidth
          style={[styles.subscribeButton, { backgroundColor: Colors.primary }]}
          icon={<Crown size={20} color={Colors.white} />}
        />
      </Card>
      
      {/* Features Grid */}
      <View style={styles.featuresSection}>
        <Text style={[styles.sectionTitle, { color: Colors.text }]}>Premium Features</Text>
        <View style={styles.featuresGrid}>
          {premiumFeatures.map((feature, index) => (
            <Card key={index} style={[styles.featureCard, { backgroundColor: Colors.card }]} variant="default">
              <View style={styles.featureHeader}>
                <feature.icon size={24} color={feature.color} />
                {!feature.available && (
                  <View style={[styles.comingSoonBadge, { backgroundColor: Colors.warning }]}>
                    <Text style={styles.comingSoonText}>Soon</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.featureTitle, { color: Colors.text }]}>{feature.title}</Text>
              <Text style={[styles.featureDescription, { color: Colors.lightText }]}>{feature.description}</Text>
              <View style={styles.benefitsList}>
                {feature.benefits.slice(0, 2).map((benefit, idx) => (
                  <View key={idx} style={styles.benefitItem}>
                    <Check size={12} color={Colors.lightText} />
                    <Text style={[styles.benefitText, { color: Colors.lightText }]}>{benefit}</Text>
                  </View>
                ))}
              </View>
            </Card>
          ))}
        </View>
      </View>
      
      {/* Testimonials */}
      <Card style={[styles.testimonialsCard, { backgroundColor: Colors.card }]} variant="glass">
        <Text style={[styles.testimonialsTitle, { color: Colors.text }]}>What Students Say</Text>
        <View style={styles.testimonialsList}>
          <View style={[styles.testimonial, { backgroundColor: Colors.surface, borderLeftColor: Colors.primary }]}>
            <Text style={[styles.testimonialText, { color: Colors.text }]}>
              "The personal mentor helped me perfect my application. Got into MIT!"
            </Text>
            <Text style={[styles.testimonialAuthor, { color: Colors.primary }]}>- Alex K., MIT</Text>
          </View>
          <View style={[styles.testimonial, { backgroundColor: Colors.surface, borderLeftColor: Colors.primary }]}>
            <Text style={[styles.testimonialText, { color: Colors.text }]}>
              "Premium resources saved me months of research. Highly recommended!"
            </Text>
            <Text style={[styles.testimonialAuthor, { color: Colors.primary }]}>- Maria S., TU Munich</Text>
          </View>
          <View style={[styles.testimonial, { backgroundColor: Colors.surface, borderLeftColor: Colors.primary }]}>
            <Text style={[styles.testimonialText, { color: Colors.text }]}>
              "The analytics feature helped me track my progress perfectly!"
            </Text>
            <Text style={[styles.testimonialAuthor, { color: Colors.primary }]}>- David L., Oxford</Text>
          </View>
        </View>
      </Card>
      
      {/* Debug info for testing */}
      {__DEV__ && (
        <Card style={[styles.debugCard, { backgroundColor: Colors.surface, borderColor: Colors.border }]}>
          <Text style={[styles.debugTitle, { color: Colors.text }]}>Debug Info</Text>
          <Text style={[styles.debugText, { color: Colors.lightText }]}>Store isPremium: {isPremium ? "true" : "false"}</Text>
          <Text style={[styles.debugText, { color: Colors.lightText }]}>User isPremium: {user?.isPremium ? "true" : "false"}</Text>
          <Text style={[styles.debugText, { color: Colors.lightText }]}>Final isPremium: {isUserPremium ? "true" : "false"}</Text>
          <Text style={[styles.debugText, { color: Colors.lightText }]}>Current promo code: "{promoCode}"</Text>
        </Card>
      )}
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
    color: "#FFFFFF",
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
    color: "#FFFFFF",
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
    color: "#FFFFFF",
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
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "600",
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
    marginLeft: 12,
  },
  valueDescription: {
    fontSize: 14,
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
  promoCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  promoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  promoDescription: {
    fontSize: 14,
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
    borderRadius: 8,
  },
  hintText: {
    fontSize: 12,
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
  },
  limitedOfferBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  limitedOfferBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  priceContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  originalPrice: {
    fontSize: 18,
    textDecorationLine: "line-through",
    marginRight: 12,
  },
  discountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  price: {
    fontSize: 32,
    fontWeight: "700",
  },
  pricePeriod: {
    fontSize: 16,
    marginBottom: 8,
  },
  limitedOffer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  limitedOfferText: {
    fontSize: 12,
    fontWeight: "600",
  },
  subscriptionDescription: {
    fontSize: 14,
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
    marginLeft: 8,
  },
  subscribeButton: {
    marginBottom: 0,
  },
  featuresSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
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
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
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
  },
  activeIndicator: {
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  comingSoonBadge: {
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
    color: "#FFFFFF",
  },
  successCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 24,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
  successDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    fontStyle: "italic",
  },
  successAuthor: {
    fontSize: 12,
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
    marginBottom: 4,
  },
  successStatLabel: {
    fontSize: 11,
  },
  testimonialsCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
  },
  testimonialsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  testimonialsList: {
    gap: 16,
  },
  testimonial: {
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 3,
  },
  testimonialText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    fontStyle: "italic",
  },
  testimonialAuthor: {
    fontSize: 12,
    fontWeight: "600",
  },
  debugCard: {
    marginHorizontal: 20,
    marginTop: 16,
    borderWidth: 1,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    marginBottom: 4,
  },
  debugButton: {
    marginTop: 8,
  },
});