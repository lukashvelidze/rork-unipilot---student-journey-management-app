import React, { useState } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Linking, Alert } from "react-native";
import { useRouter } from "expo-router";
import { FileText, ExternalLink, BookOpen, Video, Users, Target, Calendar, CheckCircle, Lock, ArrowRight, Clock, Star } from "lucide-react-native";
import Colors from "@/constants/colors";
import Theme from "@/constants/theme";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { useUserStore } from "@/store/userStore";

interface Resource {
  id: string;
  title: string;
  description: string;
  type: "guide" | "video" | "webinar" | "tool" | "template";
  category: string;
  isPremium: boolean;
  isNew?: boolean;
  estimatedTime?: string;
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
  rating?: number;
  completions?: number;
}

const resources: Resource[] = [
  {
    id: "1",
    title: "Personal Statement Masterclass",
    description: "Complete guide to writing compelling personal statements that get you accepted",
    type: "guide",
    category: "Application Materials",
    isPremium: true,
    isNew: true,
    estimatedTime: "30 min",
    difficulty: "Intermediate",
    rating: 4.8,
    completions: 1247,
  },
  {
    id: "2",
    title: "University Research Strategy",
    description: "Systematic approach to researching and selecting the perfect universities",
    type: "guide",
    category: "Research",
    isPremium: true,
    estimatedTime: "45 min",
    difficulty: "Beginner",
    rating: 4.9,
    completions: 2156,
  },
  {
    id: "3",
    title: "Scholarship Hunting Masterclass",
    description: "Find and win scholarships with proven strategies and insider tips",
    type: "video",
    category: "Funding",
    isPremium: true,
    estimatedTime: "2 hours",
    difficulty: "Intermediate",
    rating: 4.7,
    completions: 892,
  },
  {
    id: "4",
    title: "Interview Preparation Bootcamp",
    description: "Master university interviews with practice questions and expert feedback",
    type: "guide",
    category: "Interviews",
    isPremium: true,
    estimatedTime: "1 hour",
    difficulty: "Advanced",
    rating: 4.8,
    completions: 634,
  },
  {
    id: "5",
    title: "Visa Application Checklist",
    description: "Country-specific visa requirements and step-by-step application guides",
    type: "tool",
    category: "Visa & Legal",
    isPremium: true,
    estimatedTime: "20 min",
    difficulty: "Beginner",
    rating: 4.6,
    completions: 1823,
  },
  {
    id: "6",
    title: "Monthly Success Webinar",
    description: "Live sessions with admission experts and successful international students",
    type: "webinar",
    category: "Community",
    isPremium: true,
    isNew: true,
    estimatedTime: "1 hour",
    difficulty: "Beginner",
    rating: 4.9,
    completions: 456,
  },
  {
    id: "7",
    title: "Budget Planning Toolkit",
    description: "Comprehensive financial planning tools for studying abroad",
    type: "tool",
    category: "Financial Planning",
    isPremium: true,
    estimatedTime: "30 min",
    difficulty: "Intermediate",
    rating: 4.5,
    completions: 1098,
  },
  {
    id: "8",
    title: "Cultural Adaptation Guide",
    description: "Navigate cultural differences and thrive in your new environment",
    type: "guide",
    category: "Life Abroad",
    isPremium: true,
    estimatedTime: "40 min",
    difficulty: "Beginner",
    rating: 4.7,
    completions: 743,
  },
];

const categories = [
  "All",
  "Application Materials",
  "Research",
  "Funding",
  "Interviews",
  "Visa & Legal",
  "Community",
  "Financial Planning",
  "Life Abroad",
];

export default function PremiumResourcesScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  const isPremium = user?.isPremium || false;
  
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
      default:
        return FileText;
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
        "Premium Required",
        "This resource is only available to premium members. Upgrade to access all premium resources.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Upgrade", onPress: () => router.push("/premium") },
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
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
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
                {isPremium ? "Read Guide" : "Premium Only"}
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
          Expert guides and tools to accelerate your journey
        </Text>
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
              <Text style={styles.upgradeTitle}>Unlock All Resources</Text>
              <Text style={styles.upgradeDescription}>
                Get access to all premium resources, expert guides, and exclusive content to accelerate your study abroad journey.
              </Text>
              <Button
                title="Upgrade to Premium"
                onPress={() => router.push("/premium")}
                style={styles.upgradeButton}
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
    backgroundColor: Colors.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  newBadgeText: {
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
    marginBottom: 16,
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
  },
  upgradeDescription: {
    fontSize: 14,
    color: Colors.lightText,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  upgradeButton: {
    minWidth: 200,
  },
});