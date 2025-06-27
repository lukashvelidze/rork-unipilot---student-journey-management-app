import React from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Crown, Zap, Target, Users, BookOpen, Award, TrendingUp, Video, Calendar, CheckCircle, Star, ArrowRight, BarChart3, MessageCircle, UserCheck } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { useUserStore } from "@/store/userStore";

const { width } = Dimensions.get("window");

interface PremiumFeature {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  benefits: string[];
  isPopular?: boolean;
  isNew?: boolean;
}

const premiumFeatures: PremiumFeature[] = [
  {
    id: "mentor",
    title: "Personal Mentor Access",
    description: "Get 1-on-1 guidance from university admission experts and successful alumni",
    icon: UserCheck,
    color: "#FF6B6B",
    benefits: ["Weekly 1-on-1 sessions", "Expert consultations", "Mock interviews", "Application review", "Career guidance"],
    isPopular: true,
  },
  {
    id: "resources",
    title: "Premium Resource Library",
    description: "Access exclusive templates, guides, and application materials from top universities",
    icon: BookOpen,
    color: "#4ECDC4",
    benefits: ["50+ premium guides", "Application templates", "Essay examples", "Scholarship database", "Country-specific guides"],
  },
  {
    id: "analytics",
    title: "Advanced Analytics",
    description: "Detailed progress tracking, success predictions, and performance insights",
    icon: BarChart3,
    color: "#9C27B0",
    benefits: ["Progress analytics", "Success probability", "Benchmark comparison", "Goal tracking", "Performance insights"],
    isNew: true,
  },
  {
    id: "webinars",
    title: "Exclusive Webinars",
    description: "Live sessions with admission experts, successful students, and industry leaders",
    icon: Video,
    color: "#FF9800",
    benefits: ["Weekly live sessions", "Expert Q&A", "Networking events", "Recorded access", "Industry insights"],
  },
  {
    id: "ai",
    title: "AI-Powered Guidance",
    description: "Get personalized recommendations and instant answers to complex questions",
    icon: Zap,
    color: "#2196F3",
    benefits: ["24/7 AI assistant", "Personalized advice", "Document analysis", "Application review", "Instant answers"],
  },
  {
    id: "memories",
    title: "Instagram-Style Memories",
    description: "Create and share your study abroad journey with beautiful milestone badges",
    icon: Award,
    color: "#E91E63",
    benefits: ["Milestone badges", "Shareable stories", "Progress celebration", "Social features", "Achievement tracking"],
    isNew: true,
  },
];

export default function PremiumFeaturesScreen() {
  const router = useRouter();
  const Colors = useColors();
  const { user, isPremium } = useUserStore();
  
  const handleFeaturePress = (feature: PremiumFeature) => {
    if (!isPremium) {
      router.push("/premium");
      return;
    }
    
    // Navigate to specific feature
    switch (feature.id) {
      case "mentor":
        router.push("/mentor");
        break;
      case "resources":
        router.push("/premium/resources");
        break;
      case "analytics":
        router.push("/analytics");
        break;
      case "webinars":
        router.push("/webinars");
        break;
      case "ai":
        router.push("/unipilot-ai");
        break;
      case "memories":
        router.push("/(tabs)/journey?tab=memories");
        break;
      default:
        router.push("/premium");
    }
  };
  
  if (isPremium) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]} edges={['top']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Premium Header */}
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
          
          {/* Features Grid */}
          <View style={styles.featuresSection}>
            <Text style={[styles.sectionTitle, { color: Colors.text }]}>Your Premium Features</Text>
            <View style={styles.featuresGrid}>
              {premiumFeatures.map((feature) => (
                <TouchableOpacity
                  key={feature.id}
                  style={[styles.featureCard, { backgroundColor: Colors.card }]}
                  onPress={() => handleFeaturePress(feature)}
                  activeOpacity={0.7}
                >
                  <View style={styles.featureHeader}>
                    <View style={[styles.featureIcon, { backgroundColor: feature.color + "20" }]}>
                      <feature.icon size={24} color={feature.color} />
                    </View>
                    <View style={styles.featureBadges}>
                      {feature.isNew && (
                        <View style={[styles.newBadge, { backgroundColor: Colors.success }]}>
                          <Text style={styles.newBadgeText}>NEW</Text>
                        </View>
                      )}
                      {feature.isPopular && (
                        <View style={[styles.popularBadge, { backgroundColor: Colors.warning }]}>
                          <Star size={10} color={Colors.white} />
                          <Text style={styles.popularBadgeText}>Popular</Text>
                        </View>
                      )}
                      <View style={[styles.activeBadge, { backgroundColor: Colors.success }]}>
                        <CheckCircle size={12} color={Colors.white} />
                      </View>
                    </View>
                  </View>
                  
                  <Text style={[styles.featureTitle, { color: Colors.text }]}>{feature.title}</Text>
                  <Text style={[styles.featureDescription, { color: Colors.lightText }]}>{feature.description}</Text>
                  
                  <View style={styles.benefitsList}>
                    {feature.benefits.slice(0, 3).map((benefit, idx) => (
                      <View key={idx} style={styles.benefitItem}>
                        <CheckCircle size={12} color={Colors.success} />
                        <Text style={[styles.benefitText, { color: Colors.text }]}>{benefit}</Text>
                      </View>
                    ))}
                    {feature.benefits.length > 3 && (
                      <Text style={[styles.moreBenefits, { color: Colors.lightText }]}>
                        +{feature.benefits.length - 3} more benefits
                      </Text>
                    )}
                  </View>
                  
                  <View style={styles.featureAction}>
                    <Text style={[styles.actionText, { color: feature.color }]}>Access Now</Text>
                    <ArrowRight size={16} color={feature.color} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Success Stories */}
          <Card style={[styles.successCard, { backgroundColor: Colors.card }]}>
            <Text style={[styles.successTitle, { color: Colors.text }]}>🎓 Premium Success Stories</Text>
            <Text style={[styles.successDescription, { color: Colors.lightText }]}>
              "UniPilot Premium helped me get into Harvard with a full scholarship. The personal mentor and AI guidance were game-changers!"
            </Text>
            <Text style={[styles.successAuthor, { color: Colors.primary }]}>- Sarah M., Harvard University</Text>
            
            <View style={styles.successStats}>
              <View style={styles.successStat}>
                <Text style={[styles.successStatNumber, { color: Colors.success }]}>98%</Text>
                <Text style={[styles.successStatLabel, { color: Colors.lightText }]}>Success Rate</Text>
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
        </ScrollView>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          style={styles.heroSection}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Crown size={64} color={Colors.white} />
          <Text style={styles.heroTitle}>Unlock Premium Features</Text>
          <Text style={styles.heroSubtitle}>
            Get personalized mentoring, exclusive resources, and AI-powered guidance to accelerate your study abroad journey
          </Text>
          
          <View style={styles.pricingContainer}>
            <View style={styles.priceRow}>
              <Text style={styles.originalPrice}>$10.99</Text>
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>55% OFF</Text>
              </View>
            </View>
            <Text style={styles.currentPrice}>$4.99</Text>
            <Text style={styles.pricePeriod}>per month</Text>
            <View style={styles.limitedOffer}>
              <Text style={styles.limitedOfferText}>⏰ Limited Time Offer</Text>
            </View>
          </View>
          
          <Button
            title="Start Premium Trial"
            onPress={() => router.push("/premium")}
            style={styles.ctaButton}
            icon={<Crown size={20} color={Colors.primary} />}
          />
        </LinearGradient>
        
        {/* Value Proposition */}
        <Card style={[styles.valueCard, { backgroundColor: Colors.card }]}>
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
        
        {/* Features Preview */}
        <View style={styles.featuresSection}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Premium Features</Text>
          <View style={styles.featuresGrid}>
            {premiumFeatures.map((feature) => (
              <TouchableOpacity
                key={feature.id}
                style={[styles.featureCard, { backgroundColor: Colors.card }]}
                onPress={() => handleFeaturePress(feature)}
                activeOpacity={0.7}
              >
                <View style={styles.featureHeader}>
                  <View style={[styles.featureIcon, { backgroundColor: feature.color + "20" }]}>
                    <feature.icon size={24} color={feature.color} />
                  </View>
                  <View style={styles.featureBadges}>
                    {feature.isNew && (
                      <View style={[styles.newBadge, { backgroundColor: Colors.success }]}>
                        <Text style={styles.newBadgeText}>NEW</Text>
                      </View>
                    )}
                    {feature.isPopular && (
                      <View style={[styles.popularBadge, { backgroundColor: Colors.warning }]}>
                        <Star size={10} color={Colors.white} />
                        <Text style={styles.popularBadgeText}>Popular</Text>
                      </View>
                    )}
                    <View style={[styles.lockBadge, { backgroundColor: Colors.mutedText }]}>
                      <Crown size={10} color={Colors.white} />
                    </View>
                  </View>
                </View>
                
                <Text style={[styles.featureTitle, { color: Colors.text }]}>{feature.title}</Text>
                <Text style={[styles.featureDescription, { color: Colors.lightText }]}>{feature.description}</Text>
                
                <View style={styles.benefitsList}>
                  {feature.benefits.slice(0, 3).map((benefit, idx) => (
                    <View key={idx} style={styles.benefitItem}>
                      <CheckCircle size={12} color={Colors.lightText} />
                      <Text style={[styles.benefitText, { color: Colors.lightText }]}>{benefit}</Text>
                    </View>
                  ))}
                  {feature.benefits.length > 3 && (
                    <Text style={[styles.moreBenefits, { color: Colors.mutedText }]}>
                      +{feature.benefits.length - 3} more benefits
                    </Text>
                  )}
                </View>
                
                <View style={styles.featureAction}>
                  <Text style={[styles.actionText, { color: Colors.mutedText }]}>Premium Only</Text>
                  <Crown size={16} color={Colors.mutedText} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Testimonials */}
        <Card style={[styles.testimonialsCard, { backgroundColor: Colors.card }]}>
          <Text style={[styles.testimonialsTitle, { color: Colors.text }]}>What Students Say</Text>
          <View style={styles.testimonialsList}>
            <View style={[styles.testimonial, { backgroundColor: Colors.surface, borderLeftColor: Colors.primary }]}>
              <Text style={[styles.testimonialText, { color: Colors.text }]}>
                "The personal mentor helped me perfect my application. Got into Stanford!"
              </Text>
              <Text style={[styles.testimonialAuthor, { color: Colors.primary }]}>- Alex K., Stanford</Text>
            </View>
            <View style={[styles.testimonial, { backgroundColor: Colors.surface, borderLeftColor: Colors.primary }]}>
              <Text style={[styles.testimonialText, { color: Colors.text }]}>
                "Premium resources saved me months of research. Highly recommended!"
              </Text>
              <Text style={[styles.testimonialAuthor, { color: Colors.primary }]}>- Maria S., Oxford</Text>
            </View>
            <View style={[styles.testimonial, { backgroundColor: Colors.surface, borderLeftColor: Colors.primary }]}>
              <Text style={[styles.testimonialText, { color: Colors.text }]}>
                "The analytics feature helped me track my progress perfectly!"
              </Text>
              <Text style={[styles.testimonialAuthor, { color: Colors.primary }]}>- David L., MIT</Text>
            </View>
          </View>
        </Card>
        
        {/* Final CTA */}
        <Card style={[styles.finalCtaCard, { backgroundColor: Colors.premiumBackground, borderColor: Colors.premium }]}>
          <View style={styles.finalCtaContent}>
            <Crown size={32} color={Colors.premium} />
            <Text style={[styles.finalCtaTitle, { color: Colors.text }]}>Ready to Start Your Success Story?</Text>
            <Text style={[styles.finalCtaDescription, { color: Colors.lightText }]}>
              Join 75,000+ students who achieved their dreams with UniPilot Premium
            </Text>
            <Button
              title="Upgrade to Premium - $4.99/month"
              onPress={() => router.push("/premium")}
              style={styles.finalCtaButton}
              icon={<Crown size={20} color={Colors.white} />}
            />
          </View>
        </Card>
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
    paddingBottom: 32,
  },
  
  // Premium Header (for premium users)
  premiumHeader: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    marginBottom: 24,
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
  
  // Hero Section (for non-premium users)
  heroSection: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  pricingContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  originalPrice: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.7)",
    textDecorationLine: "line-through",
    marginRight: 12,
  },
  discountBadge: {
    backgroundColor: "#FF4757",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  currentPrice: {
    fontSize: 36,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  pricePeriod: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 8,
  },
  limitedOffer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  limitedOfferText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  ctaButton: {
    minWidth: 200,
    backgroundColor: "#FFFFFF",
  },
  
  // Value Card
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
  
  // Features Section
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
    gap: 16,
  },
  featureCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  featureBadges: {
    flexDirection: "row",
    gap: 4,
  },
  newBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  popularBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  activeBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  lockBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  benefitsList: {
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  benefitText: {
    fontSize: 13,
    flex: 1,
  },
  moreBenefits: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 4,
  },
  featureAction: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  
  // Success Card
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
  
  // Testimonials
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
  
  // Final CTA
  finalCtaCard: {
    marginHorizontal: 20,
    borderWidth: 1,
  },
  finalCtaContent: {
    alignItems: "center",
    padding: 24,
  },
  finalCtaTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 8,
    textAlign: "center",
  },
  finalCtaDescription: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  finalCtaButton: {
    minWidth: 250,
  },
});