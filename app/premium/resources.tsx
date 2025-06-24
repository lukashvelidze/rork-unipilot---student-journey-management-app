import React, { useState } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Linking, Alert } from "react-native";
import { useRouter } from "expo-router";
import { FileText, Download, ExternalLink, BookOpen, Video, Users, Target, Calendar, CheckCircle, Lock } from "lucide-react-native";
import Colors from "@/constants/colors";
import Theme from "@/constants/theme";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { useUserStore } from "@/store/userStore";

interface Resource {
  id: string;
  title: string;
  description: string;
  type: "template" | "guide" | "video" | "webinar" | "tool";
  category: string;
  downloadUrl?: string;
  externalUrl?: string;
  isPremium: boolean;
  isNew?: boolean;
  estimatedTime?: string;
}

const resources: Resource[] = [
  {
    id: "1",
    title: "Personal Statement Template",
    description: "Professional template for crafting compelling personal statements",
    type: "template",
    category: "Application Materials",
    downloadUrl: "https://example.com/personal-statement-template.pdf",
    isPremium: true,
    isNew: true,
    estimatedTime: "30 min",
  },
  {
    id: "2",
    title: "University Research Guide",
    description: "Complete guide to researching and selecting the right universities",
    type: "guide",
    category: "Research",
    downloadUrl: "https://example.com/university-research-guide.pdf",
    isPremium: true,
    estimatedTime: "45 min",
  },
  {
    id: "3",
    title: "Scholarship Application Masterclass",
    description: "Video series on finding and applying for scholarships",
    type: "video",
    category: "Funding",
    externalUrl: "https://example.com/scholarship-masterclass",
    isPremium: true,
    estimatedTime: "2 hours",
  },
  {
    id: "4",
    title: "Interview Preparation Kit",
    description: "Complete kit with common questions and practice scenarios",
    type: "template",
    category: "Interviews",
    downloadUrl: "https://example.com/interview-prep-kit.pdf",
    isPremium: true,
    estimatedTime: "1 hour",
  },
  {
    id: "5",
    title: "Visa Application Checklist",
    description: "Country-specific visa application checklists and requirements",
    type: "tool",
    category: "Visa & Legal",
    downloadUrl: "https://example.com/visa-checklist.pdf",
    isPremium: true,
    estimatedTime: "20 min",
  },
  {
    id: "6",
    title: "Monthly Success Webinar",
    description: "Live webinar with admission experts and successful students",
    type: "webinar",
    category: "Community",
    externalUrl: "https://example.com/monthly-webinar",
    isPremium: true,
    isNew: true,
    estimatedTime: "1 hour",
  },
  {
    id: "7",
    title: "Budget Planning Spreadsheet",
    description: "Comprehensive spreadsheet for planning your study abroad budget",
    type: "tool",
    category: "Financial Planning",
    downloadUrl: "https://example.com/budget-planner.xlsx",
    isPremium: true,
    estimatedTime: "30 min",
  },
  {
    id: "8",
    title: "Cultural Adaptation Guide",
    description: "Guide to adapting to life in your destination country",
    type: "guide",
    category: "Life Abroad",
    downloadUrl: "https://example.com/cultural-adaptation.pdf",
    isPremium: true,
    estimatedTime: "40 min",
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
  const [downloadedResources, setDownloadedResources] = useState<string[]>([]);
  
  const isPremium = user?.isPremium || false;
  
  const filteredResources = resources.filter(resource => 
    selectedCategory === "All" || resource.category === selectedCategory
  );
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "template":
        return FileText;
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
        return Colors.primary;
      case "guide":
        return Colors.secondary;
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
  
  const handleResourceAction = async (resource: Resource) => {
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
    
    try {
      if (resource.downloadUrl) {
        // Simulate download
        setDownloadedResources(prev => [...prev, resource.id]);
        Alert.alert("Download Started", `${resource.title} is being downloaded.`);
      } else if (resource.externalUrl) {
        await Linking.openURL(resource.externalUrl);
      }
    } catch (error) {
      Alert.alert("Error", "Unable to access this resource. Please try again.");
    }
  };
  
  const renderResource = (resource: Resource) => {
    const TypeIcon = getTypeIcon(resource.type);
    const typeColor = getTypeColor(resource.type);
    const isDownloaded = downloadedResources.includes(resource.id);
    
    return (
      <Card key={resource.id} style={styles.resourceCard} variant="default">
        <View style={styles.resourceHeader}>
          <View style={styles.resourceIcon}>
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
          <Text style={styles.resourceCategory}>{resource.category}</Text>
          {resource.estimatedTime && (
            <Text style={styles.resourceTime}>{resource.estimatedTime}</Text>
          )}
        </View>
        
        <View style={styles.resourceActions}>
          {isDownloaded ? (
            <View style={styles.downloadedIndicator}>
              <CheckCircle size={16} color={Colors.success} />
              <Text style={styles.downloadedText}>Downloaded</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.actionButton,
                !isPremium && styles.actionButtonDisabled,
              ]}
              onPress={() => handleResourceAction(resource)}
              disabled={!isPremium}
            >
              {resource.downloadUrl ? (
                <Download size={16} color={isPremium ? Colors.primary : Colors.mutedText} />
              ) : (
                <ExternalLink size={16} color={isPremium ? Colors.primary : Colors.mutedText} />
              )}
              <Text style={[
                styles.actionButtonText,
                !isPremium && styles.actionButtonTextDisabled,
              ]}>
                {resource.downloadUrl ? "Download" : "Open"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>
    );
  };
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Premium Resources</Text>
        <Text style={styles.subtitle}>
          Exclusive materials to accelerate your journey
        </Text>
      </View>
      
      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
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
                Get access to all premium resources, templates, and exclusive content.
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
  categoryScroll: {
    marginBottom: 20,
  },
  categoryContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
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
    backgroundColor: Colors.surface,
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
    marginBottom: 12,
  },
  resourceMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  resourceCategory: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.primary,
  },
  resourceTime: {
    fontSize: 12,
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
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.primary,
  },
  actionButtonTextDisabled: {
    color: Colors.mutedText,
  },
  downloadedIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  downloadedText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.success,
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