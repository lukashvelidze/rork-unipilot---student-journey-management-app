import React, { useState } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { BookOpen, Video, Users, Target, Calendar, CheckCircle, Lock, ArrowRight, Clock, Star, BarChart3, TrendingUp, UserCheck, Zap, Award } from "lucide-react-native";
import Colors from "@/constants/colors";
import Theme from "@/constants/theme";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { useUserStore } from "@/store/userStore";

interface Resource {
  id: string;
  title: string;
  description: string;
  type: "guide" | "video" | "webinar" | "tool" | "template" | "course" | "calculator";
  category: string;
  isPremium: boolean;
  isNew?: boolean;
  isPopular?: boolean;
  estimatedTime?: string;
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
  rating?: number;
  completions?: number;
  features?: string[];
}

const resources: Resource[] = [
  {
    id: "1",
    title: "Personal Statement Masterclass",
    description: "Complete guide to writing compelling personal statements that get you accepted into top universities",
    type: "guide",
    category: "Application Materials",
    isPremium: true,
    isNew: true,
    isPopular: true,
    estimatedTime: "45 min",
    difficulty: "Intermediate",
    rating: 4.9,
    completions: 2847,
    features: ["Step-by-step guide", "Real examples", "Expert feedback", "Templates included"]
  },
  {
    id: "2",
    title: "University Selection Strategy",
    description: "Data-driven approach to selecting universities that match your profile and goals",
    type: "guide",
    category: "University Selection",
    isPremium: true,
    isPopular: true,
    estimatedTime: "60 min",
    difficulty: "Intermediate",
    rating: 4.8,
    completions: 3156,
    features: ["University ranking analysis", "Admission probability calculator", "Cost comparison tool", "Program matching"]
  },
  {
    id: "mentor",
    title: "Personal Mentor Access",
    description: "Get 1-on-1 guidance from university admission experts and successful alumni",
    type: "tool",
    category: "Mentoring",
    isPremium: true,
    isPopular: true,
    estimatedTime: "Ongoing",
    difficulty: "Beginner",
    rating: 4.9,
    completions: 1567,
    features: ["1-on-1 sessions", "Expert guidance", "Mock interviews", "Application review"]
  },
  {
    id: "analytics",
    title: "Advanced Analytics",
    description: "Detailed progress tracking, success predictions, and performance insights",
    type: "tool",
    category: "Analytics",
    isPremium: true,
    isNew: true,
    estimatedTime: "Ongoing",
    difficulty: "Intermediate",
    rating: 4.8,
    completions: 2156,
    features: ["Progress tracking", "Success predictions", "Performance insights", "Goal setting"]
  },
  {
    id: "3",
    title: "Scholarship Hunting Masterclass",
    description: "Find and win scholarships with proven strategies and insider tips from successful applicants",
    type: "video",
    category: "Funding",
    isPremium: true,
    isPopular: true,
    estimatedTime: "2.5 hours",
    difficulty: "Intermediate",
    rating: 4.9,
    completions: 1892,
    features: ["Video tutorials", "Scholarship database", "Application tracker", "Success stories"]
  },
  {
    id: "4",
    title: "Interview Preparation Bootcamp",
    description: "Master university interviews with practice questions, expert feedback, and confidence-building techniques",
    type: "course",
    category: "Interviews",
    isPremium: true,
    estimatedTime: "3 hours",
    difficulty: "Advanced",
    rating: 4.8,
    completions: 1234,
    features: ["Mock interviews", "Question bank", "Expert feedback", "Confidence building"]
  },
  {
    id: "5",
    title: "Visa Application Toolkit",
    description: "Country-specific visa requirements, step-by-step guides, and document checklists",
    type: "tool",
    category: "Visa & Legal",
    isPremium: true,
    isNew: true,
    estimatedTime: "30 min",
    difficulty: "Beginner",
    rating: 4.7,
    completions: 2823,
    features: ["Country-specific guides", "Document checklists", "Timeline planner", "Requirements tracker"]
  },
  {
    id: "6",
    title: "SOP Writing Workshop",
    description: "Craft compelling Statements of Purpose with field-specific templates and expert guidance",
    type: "course",
    category: "Application Materials",
    isPremium: true,
    estimatedTime: "2 hours",
    difficulty: "Advanced",
    rating: 4.9,
    completions: 2145,
    features: ["Field-specific templates", "Expert review", "Writing techniques", "Sample SOPs"]
  },
  {
    id: "7",
    title: "Budget Planning Calculator",
    description: "Comprehensive financial planning tools for studying abroad with cost breakdowns",
    type: "calculator",
    category: "Financial Planning",
    isPremium: true,
    estimatedTime: "20 min",
    difficulty: "Intermediate",
    rating: 4.6,
    completions: 2098,
    features: ["Cost calculator", "Budget planner", "Currency converter", "Savings tracker"]
  },
  {
    id: "8",
    title: "Cultural Adaptation Guide",
    description: "Navigate cultural differences and thrive in your new environment with insider tips",
    type: "guide",
    category: "Life Abroad",
    isPremium: true,
    estimatedTime: "40 min",
    difficulty: "Beginner",
    rating: 4.7,
    completions: 1743,
    features: ["Cultural insights", "Adaptation strategies", "Local customs", "Social integration"]
  },
  {
    id: "9",
    title: "Resume & CV Builder",
    description: "Create professional resumes and CVs tailored for international applications",
    type: "tool",
    category: "Application Materials",
    isPremium: true,
    estimatedTime: "45 min",
    difficulty: "Beginner",
    rating: 4.8,
    completions: 3421,
    features: ["International templates", "ATS optimization", "Industry-specific formats", "Expert tips"]
  },
  {
    id: "10",
    title: "Exclusive Webinar Series",
    description: "Monthly live sessions with admission experts, successful students, and industry leaders",
    type: "webinar",
    category: "Community",
    isPremium: true,
    isPopular: true,
    estimatedTime: "1 hour",
    difficulty: "Beginner",
    rating: 4.9,
    completions: 856,
    features: ["Live sessions", "Expert Q&A", "Networking", "Recorded access"]
  },
  {
    id: "11",
    title: "IELTS/TOEFL Prep Course",
    description: "Comprehensive test preparation with practice tests, strategies, and score improvement tips",
    type: "course",
    category: "Test Preparation",
    isPremium: true,
    estimatedTime: "8 hours",
    difficulty: "Intermediate",
    rating: 4.8,
    completions: 3421,
    features: ["Practice tests", "Score analysis", "Improvement strategies", "Expert tips"]
  },
  {
    id: "12",
    title: "Career Planning Toolkit",
    description: "Plan your career path with industry insights, job market analysis, and networking strategies",
    type: "tool",
    category: "Career Development",
    isPremium: true,
    estimatedTime: "50 min",
    difficulty: "Advanced",
    rating: 4.7,
    completions: 1876,
    features: ["Career mapping", "Industry insights", "Networking guide", "Job search strategies"]
  },
  {
    id: "13",
    title: "LOR Request Templates",
    description: "Professional templates and strategies for requesting Letters of Recommendation",
    type: "template",
    category: "Application Materials",
    isPremium: true,
    estimatedTime: "25 min",
    difficulty: "Beginner",
    rating: 4.7,
    completions: 2567,
    features: ["Email templates", "Follow-up strategies", "Professor outreach", "Timeline planning"]
  },
  {
    id: "14",
    title: "Application Timeline Planner",
    description: "Comprehensive timeline management for multiple university applications",
    type: "tool",
    category: "Organization",
    isPremium: true,
    estimatedTime: "30 min",
    difficulty: "Intermediate",
    rating: 4.8,
    completions: 1987,
    features: ["Deadline tracking", "Task automation", "Progress monitoring", "Reminder system"]
  },
  {
    id: "15",
    title: "Networking Masterclass",
    description: "Build professional networks in your field before and after arrival",
    type: "course",
    category: "Career Development",
    isPremium: true,
    estimatedTime: "90 min",
    difficulty: "Advanced",
    rating: 4.6,
    completions: 1234,
    features: ["LinkedIn optimization", "Industry events", "Alumni connections", "Professional etiquette"]
  },
];

const categories = [
  "All",
  "Application Materials",
  "Mentoring",
  "Analytics",
  "University Selection",
  "Funding",
  "Interviews",
  "Visa & Legal",
  "Financial Planning",
  "Life Abroad",
  "Community",
  "Test Preparation",
  "Career Development",
  "Organization",
];

export default function PremiumResourcesScreen() {
  const router = useRouter();
  const { user, isPremium } = useUserStore();
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  const filteredResources = resources.filter(resource => 
    selectedCategory === "All" || resource.category === selectedCategory
  );
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "template":
      case "guide":
        return BookOpen;
      case "video":
        return Video;
      case "webinar":
        return Users;
      case "tool":
        return Target;
      case "course":
        return Award;
      case "calculator":
        return TrendingUp;
      default:
        return BookOpen;
    }
  };
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case "template":
      case "guide":
        return Colors.primary;
      case "video":
        return Colors.accent;
      case "webinar":
        return Colors.success;
      case "tool":
        return Colors.info;
      case "course":
        return Colors.academic;
      case "calculator":
        return Colors.career;
      default:
        return Colors.primary;
    }
  };
  
  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case "Beginner":
        return Colors.success;
      case "Intermediate":
        return Colors.warning;
      case "Advanced":
        return Colors.error;
      default:
        return Colors.lightText;
    }
  };
  
  const handleResourcePress = (resource: Resource) => {
    if (!isPremium) {
      Alert.alert(
        "🔒 Premium Required",
        `"${resource.title}" is a premium resource. Upgrade to access all premium content and accelerate your study abroad journey!`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Upgrade Now", onPress: () => router.push("/premium") },
        ]
      );
      return;
    }
    
    // Navigate to the blog post style page
    router.push(`/premium/${resource.id}`);
  };
  
  const renderResource = (resource: Resource) => {
    const TypeIcon = getTypeIcon(resource.type);
    const typeColor = getTypeColor(resource.type);
    
    return (
      <TouchableOpacity
        key={resource.id}
        onPress={() => handleResourcePress(resource)}
        activeOpacity={0.7}
      >
        <Card style={styles.resourceCard} variant="default">
          <View style={styles.resourceHeader}>
            <View style={[styles.resourceIcon, { backgroundColor: typeColor + "20" }]}>
              <TypeIcon size={20} color={typeColor} />
            </View>
            <View style={styles.resourceBadges}>
              {resource.isNew && (
                <View style={[styles.newBadge, { backgroundColor: Colors.success }]}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              )}
              {resource.isPopular && (
                <View style={[styles.popularBadge, { backgroundColor: Colors.warning }]}>
                  <Star size={10} color={Colors.white} />
                  <Text style={styles.popularBadgeText}>Popular</Text>
                </View>
              )}
              {!isPremium && (
                <View style={styles.premiumBadge}>
                  <Lock size={10} color={Colors.white} />
                </View>
              )}
            </View>
          </View>
          
          <Text style={styles.resourceTitle}>{resource.title}</Text>
          <Text style={styles.resourceDescription}>{resource.description}</Text>
          
          {resource.features && (
            <View style={styles.featuresList}>
              {resource.features.slice(0, 2).map((feature, idx) => (
                <View key={idx} style={styles.featureItem}>
                  <CheckCircle size={12} color={Colors.success} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
              {resource.features.length > 2 && (
                <Text style={styles.moreFeatures}>+{resource.features.length - 2} more features</Text>
              )}
            </View>
          )}
          
          <View style={styles.resourceMeta}>
            <View style={styles.metaRow}>
              <Text style={styles.resourceCategory}>{resource.category}</Text>
              {resource.difficulty && (
                <View style={styles.difficultyBadge}>
                  <Text style={[styles.difficultyText, { color: getDifficultyColor(resource.difficulty) }]}>
                    {resource.difficulty}
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.metaRow}>
              {resource.estimatedTime && (
                <View style={styles.metaItem}>
                  <Clock size={12} color={Colors.lightText} />
                  <Text style={styles.metaText}>{resource.estimatedTime}</Text>
                </View>
              )}
              
              {resource.rating && (
                <View style={styles.metaItem}>
                  <Star size={12} color={Colors.warning} />
                  <Text style={styles.metaText}>{resource.rating}</Text>
                </View>
              )}
              
              {resource.completions && (
                <Text style={styles.completionsText}>
                  {resource.completions.toLocaleString()} completed
                </Text>
              )}
            </View>
          </View>
          
          <View style={styles.resourceActions}>
            <View style={styles.actionButton}>
              <Text style={[
                styles.actionButtonText,
                !isPremium && styles.actionButtonTextDisabled,
              ]}>
                {isPremium ? "Access Resource" : "Premium Only"}
              </Text>
              <ArrowRight size={16} color={isPremium ? Colors.primary : Colors.mutedText} />
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Premium Resources</Text>
        <Text style={styles.subtitle}>
          Expert guides, tools, and exclusive content to accelerate your journey
        </Text>
        
        {isPremium && (
          <View style={styles.premiumStatus}>
            <Zap size={16} color={Colors.premium} />
            <Text style={styles.premiumStatusText}>Premium Active - Full Access</Text>
          </View>
        )}
      </View>
      
      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{resources.length}</Text>
          <Text style={styles.statLabel}>Resources</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>75K+</Text>
          <Text style={styles.statLabel}>Students Helped</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>4.8★</Text>
          <Text style={styles.statLabel}>Avg Rating</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>98%</Text>
          <Text style={styles.statLabel}>Success Rate</Text>
        </View>
      </View>
      
      {/* Category Filter */}
      <View style={styles.categorySection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === category && styles.categoryButtonTextActive,
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Resources Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.resourcesGrid}>
          {filteredResources.map(renderResource)}
        </View>
        
        {/* Upgrade Prompt for Non-Premium Users */}
        {!isPremium && (
          <Card style={styles.upgradeCard} variant="elevated">
            <View style={styles.upgradeContent}>
              <Lock size={32} color={Colors.primary} />
              <Text style={styles.upgradeTitle}>Unlock All Premium Resources</Text>
              <Text style={styles.upgradeDescription}>
                Get instant access to all {resources.length} premium resources, personal mentoring, advanced analytics, and exclusive content. Join 75,000+ successful students who achieved their dreams with UniPilot Premium.
              </Text>
              
              <View style={styles.upgradeFeatures}>
                <View style={styles.upgradeFeature}>
                  <CheckCircle size={16} color={Colors.success} />
                  <Text style={styles.upgradeFeatureText}>All premium resources</Text>
                </View>
                <View style={styles.upgradeFeature}>
                  <CheckCircle size={16} color={Colors.success} />
                  <Text style={styles.upgradeFeatureText}>Personal mentor access</Text>
                </View>
                <View style={styles.upgradeFeature}>
                  <CheckCircle size={16} color={Colors.success} />
                  <Text style={styles.upgradeFeatureText}>Advanced analytics</Text>
                </View>
                <View style={styles.upgradeFeature}>
                  <CheckCircle size={16} color={Colors.success} />
                  <Text style={styles.upgradeFeatureText}>Exclusive webinars</Text>
                </View>
              </View>
              
              <Button
                title="Upgrade to Premium"
                onPress={() => router.push("/premium")}
                style={styles.upgradeButton}
                icon={<Zap size={20} color={Colors.white} />}
              />
            </View>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    ...Theme.typography.h2,
    marginBottom: 4,
  },
  subtitle: {
    ...Theme.typography.caption,
    marginBottom: 12,
  },
  premiumStatus: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.premiumBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
    gap: 6,
  },
  premiumStatusText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.premium,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    ...Theme.shadow.small,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.lightText,
    textAlign: "center",
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryContainer: {
    paddingHorizontal: 20,
    paddingRight: 40,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    flexShrink: 0,
    minWidth: "auto",
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
    textAlign: "center",
    flexShrink: 0,
  },
  categoryButtonTextActive: {
    color: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  resourcesGrid: {
    gap: 16,
  },
  resourceCard: {
    padding: 16,
  },
  resourceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  resourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  resourceBadges: {
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
    color: Colors.white,
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
    color: Colors.white,
  },
  premiumBadge: {
    backgroundColor: Colors.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 14,
    color: Colors.lightText,
    lineHeight: 20,
    marginBottom: 12,
  },
  featuresList: {
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 6,
  },
  featureText: {
    fontSize: 12,
    color: Colors.text,
  },
  moreFeatures: {
    fontSize: 11,
    color: Colors.lightText,
    fontStyle: "italic",
    marginTop: 2,
  },
  resourceMeta: {
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  resourceCategory: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.primary,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: Colors.lightBackground,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: "600",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.lightText,
  },
  completionsText: {
    fontSize: 11,
    color: Colors.mutedText,
  },
  resourceActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.primary,
  },
  actionButtonTextDisabled: {
    color: Colors.mutedText,
  },
  upgradeCard: {
    marginTop: 24,
    padding: 24,
  },
  upgradeContent: {
    alignItems: "center",
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginTop: 12,
    marginBottom: 8,
    textAlign: "center",
  },
  upgradeDescription: {
    fontSize: 14,
    color: Colors.lightText,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  upgradeFeatures: {
    alignSelf: "stretch",
    marginBottom: 24,
  },
  upgradeFeature: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  upgradeFeatureText: {
    fontSize: 14,
    color: Colors.text,
  },
  upgradeButton: {
    minWidth: 200,
  },
});