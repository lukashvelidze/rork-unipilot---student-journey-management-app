import React, { useEffect, useState } from "react";
import { Style colouringSheet, View, Text, ScrollView, TouchableOpacity, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { Crown, CheckCircle, FileText, School, MessageCircle } from "lucide-react-native";
import Colors from "@/constants/colors";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { useUserStore } from "@/store/userStore";
import { useJourneyStore } from "@/store/journeyStore";
import { useDocumentStore } from "@/store/documentStore";
import { calculateOverallProgress } from "@/utils/helpers";

export default function HomeScreen() {
  const router = useRouter();
  const { user, isPremium } = useUserStore();
  const { journeyProgress, setJourneyProgress, updateTask } = useJourneyStore();
  const { documents } = useDocumentStore();
  
  // State for progress animation
  const [displayedProgress, setDisplayedProgress] = useState(0);
  
  // Calculate overall progress from journey stages
  const overallProgress = calculateOverallProgress(journeyProgress);
  
  // Animate progress on load
  useEffect(() => {
    if (overallProgress) {
      let start = 0;
      const increment = overallProgress / 20;
      const timer = setInterval(() => {
        start += increment;
        setDisplayedProgress(Math.min(start, overallProgress));
        if (start >= overallProgress) {
          clearInterval(timer);
        }
      }, 50);
      return () => clearInterval(timer);
    }
  }, [overallProgress]);
  
  // If user data is not loaded, show loading state
  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <Text style={styles.loadingText}>Loading your journey...</Text>
      </View>
    );
  }
  
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome, {user.name.split(" ")[0]}!</Text>
          <Text style={styles.subtitle}>Your international student journey awaits</Text>
        </View>
        
        {/* Progress Section */}
        <Card style={styles.progressCard} variant="elevated" borderRadius="large">
          <Text style={styles.progressTitle}>Journey Progress</Text>
          <Text style={styles.progressSubtitle}>
            {overallProgress ? `${Math.round(displayedProgress)}% complete` : "Not started"}
          </Text>
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${displayedProgress}%`, backgroundColor: Colors.primary }
              ]} 
            />
          </View>
          <Button
            title="View Journey"
            onPress={() => router.push("/journey")}
            variant="secondary"
            size="medium"
            fullWidth
            style={styles.journeyButton}
          />
        </Card>
        
        {/* Quick Actions Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: Colors.primaryLight }]}
              onPress={() => router.push("/journey")}
            >
              <View style={styles.actionIconContainer}>
                <School size={24} color={Colors.primary} />
              </View>
              <Text style={styles.actionText}>Journey Tracker</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: Colors.secondaryLight }]}
              onPress={() => router.push("/documents")}
            >
              <View style={styles.actionIconContainer}>
                <FileText size={24} color={Colors.secondary} />
              </View>
              <Text style={styles.actionText}>Documents</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: Colors.infoLight }]}
              onPress={() => router.push("/unipilot-ai")}
            >
              <View style={styles.actionIconContainer}>
                <MessageCircle size={24} color={Colors.info} />
              </View>
              <Text style={styles.actionText}>UniPilot AI</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Only show Premium Section if not premium */}
        {!isPremium && (
          <Card style={styles.premiumCard} variant="elevated" borderRadius="large">
            <View style={styles.premiumHeader}>
              <View style={styles.premiumTitleContainer}>
                <Crown size={22} color="#FFD700" style={styles.crownIcon} />
                <Text style={styles.premiumTitle}>UniPilot Premium</Text>
              </View>
              <View style={styles.priceBadge}>
                <Text style={styles.priceText}>$4.99/mo</Text>
              </View>
            </View>
            
            <Text style={styles.premiumDescription}>
              Get personalized guidance from education experts and unlock premium resources for your international student journey.
            </Text>
            
            <View style={styles.premiumFeatures}>
              <View style={styles.featureItem}>
                <CheckCircle size={16} color={Colors.primary} />
                <Text style={styles.featureText}>1-on-1 expert consultations</Text>
              </View>
              <View style={styles.featureItem}>
                <CheckCircle size={16} color={Colors.primary} />
                <Text style={styles.featureText}>Visa application guides</Text>
              </View>
              <View style={styles.featureItem}>
                <CheckCircle size={16} color={Colors.primary} />
                <Text style={styles.featureText}>University application templates</Text>
              </View>
            </View>
            
            <Button
              title="Upgrade to Premium"
              onPress={() => router.push("/premium")}
              variant="primary"
              size="medium"
              fullWidth
              icon={<Crown size={18} color={Colors.white} />}
              iconPosition="left"
              style={styles.premiumButton}
            />
          </Card>
        )}
        
        {/* Show Premium Resources Section if premium */}
        {isPremium && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Crown size={18} color="#FFD700" style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>Premium Resources</Text>
              </View>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.resourcesContainer}
            >
              <Card style={styles.resourceCard} variant="elevated" borderRadius="large">
                <View style={styles.resourceIconContainer}>
                  <FileText size={24} color={Colors.primary} />
                </View>
                <Text style={styles.resourceTitle}>Visa Guide</Text>
                <Text style={styles.resourceDescription}>
                  Step-by-step guide for student visa application
                </Text>
                <Button
                  title="View Guide"
                  onPress={() => router.push("/resources/visa-guide")}
                  variant="secondary"
                  size="small"
                  fullWidth
                />
              </Card>
              
              <Card style={styles.resourceCard} variant="elevated" borderRadius="large">
                <View style={styles.resourceIconContainer}>
                  <School size={24} color={Colors.secondary} />
                </View>
                <Text style={styles.resourceTitle}>Application Templates</Text>
                <Text style={styles.resourceDescription}>
                  University application templates and examples
                </Text>
                <Button
                  title="View Templates"
                  onPress={() => router.push("/resources/templates")}
                  variant="secondary"
                  size="small"
                  fullWidth
                />
              </Card>
              
              <Card style={styles.resourceCard} variant="elevated" borderRadius="large">
                <View style={styles.resourceIconContainer}>
                  <MessageCircle size={24} color="#4CAF50" />
                </View>
                <Text style={styles.resourceTitle}>Expert Chat</Text>
                <Text style={styles.resourceDescription}>
                  Chat with education experts
                </Text>
                <Button
                  title="Start Chat"
                  onPress={() => router.push("/resources/expert-chat")}
                  variant="secondary"
                  size="small"
                  fullWidth
                />
              </Card>
            </ScrollView>
          </View>
        )}
        
        {/* Rest of the sections remain the same */}
      </ScrollView>
    </>
  );
}

// Add new styles for premium resources
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.lightText,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 100, // Extra padding for bottom tab bar
  },
  header: {
    marginBottom: 24,
    paddingTop: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.lightText,
  },
  progressCard: {
    marginBottom: 24,
    padding: 20,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 14,
    color: Colors.lightText,
    marginBottom: 16,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.progressBackground,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 20,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  journeyButton: {
    marginTop: 8,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
  },
  actionGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 16,
  },
  actionButton: {
    width: "30%",
    aspectRatio: 0.8,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
    textAlign: "center",
  },
  premiumCard: {
    marginBottom: 24,
    padding: 20,
    backgroundColor: Colors.card,
    borderColor: "#FFD700",
    borderWidth: 1,
  },
  premiumHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  premiumTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  crownIcon: {
    marginRight: 8,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
  },
  priceBadge: {
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  priceText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#DAA520",
  },
  premiumDescription: {
    fontSize: 14,
    color: Colors.lightText,
    marginBottom: 16,
    lineHeight: 20,
  },
  premiumFeatures: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 8,
  },
  premiumButton: {
    marginTop: 8,
  },
  resourcesContainer: {
    paddingRight: 16,
    paddingBottom: 8,
  },
  resourceCard: {
    width: 200,
    marginRight: 16,
    padding: 16,
  },
  resourceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 12,
    color: Colors.lightText,
    marginBottom: 12,
  },
});