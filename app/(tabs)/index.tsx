import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Platform, Image } from "react-native";
import { useRouter } from "expo-router";
import { CheckCircle, ChevronRight, Calendar, Bell, FileText, Users, Map, MessageCircle, Crown, Star } from "lucide-react-native";
import Colors from "@/constants/colors";
import Card from "@/components/Card";
import Button from "@/components/Button";
import ProgressBar from "@/components/ProgressBar";
import { useUserStore } from "@/store/userStore";
import { useJourneyStore } from "@/store/journeyStore";
import { useDocumentStore } from "@/store/documentStore";
import { getGreeting } from "@/utils/dateUtils";
import { calculateOverallProgress, getRandomTip } from "@/utils/helpers";
import { studentTips } from "@/mocks/tips";
import { initialJourneyProgress } from "@/mocks/journeyTasks";
import { JourneyStage } from "@/types/user";

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const { journeyProgress, setJourneyProgress, updateTask } = useJourneyStore();
  const { documents } = useDocumentStore();
  
  // Initialize state with functions to avoid state updates during render
  const [greeting, setGreeting] = useState(() => getGreeting());
  const [tip, setTip] = useState(() => getRandomTip(studentTips));
  
  // Use useCallback for functions that update state and are used in useEffect
  const updateGreeting = useCallback(() => {
    setGreeting(getGreeting());
  }, []);
  
  const updateTip = useCallback(() => {
    setTip(getRandomTip(studentTips));
  }, []);
  
  // Initialize journey progress if empty
  useEffect(() => {
    if (journeyProgress.length === 0) {
      setJourneyProgress(initialJourneyProgress);
    }
  }, [journeyProgress.length, setJourneyProgress]);
  
  // Update greeting based on time of day
  useEffect(() => {
    const interval = setInterval(updateGreeting, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [updateGreeting]);
  
  // Get a new tip every day
  useEffect(() => {
    const interval = setInterval(updateTip, 86400000); // 24 hours
    return () => clearInterval(interval);
  }, [updateTip]);
  
  const overallProgress = calculateOverallProgress(journeyProgress);
  
  // Get upcoming tasks (first 3 incomplete tasks)
  const upcomingTasks = journeyProgress
    .flatMap(stage => 
      stage.tasks
        .filter(task => !task.completed)
        .map(task => ({ ...task, stage: stage.stage }))
    )
    .slice(0, 3);
  
  // Get expiring documents
  const expiringDocuments = documents
    .filter(doc => doc.status === "expiring_soon")
    .slice(0, 2);
  
  const handleTaskToggle = (taskId: string, completed: boolean, stageId: string) => {
    updateTask(stageId as JourneyStage, taskId, completed);
  };
  
  // Personalized journey name based on user
  const journeyName = user ? `${user.name.split(' ')[0]}'s Journey to ${user.destinationCountry.name}` : "Your Journey";
  
  // Redirect to onboarding if no user - using useEffect to avoid state updates during render
  useEffect(() => {
    if (!user) {
      router.replace("/onboarding");
    }
  }, [user, router]);
  
  if (!user) {
    // Return a loading state or null instead of redirecting directly during render
    return null;
  }
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.name}>{user.name}</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Bell size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>
      
      <Card style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>{journeyName}</Text>
          <Text style={styles.progressPercent}>{overallProgress}%</Text>
        </View>
        <ProgressBar progress={overallProgress} height={8} />
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => router.push("/journey")}
        >
          <Text style={styles.viewAllText}>View Roadmap</Text>
          <ChevronRight size={16} color={Colors.primary} />
        </TouchableOpacity>
      </Card>
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>To-Do List</Text>
          <TouchableOpacity onPress={() => router.push("/tasks")}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {upcomingTasks.length > 0 ? (
          upcomingTasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={styles.taskItem}
              onPress={() => handleTaskToggle(task.id, !task.completed, task.stage)}
            >
              <CheckCircle
                size={20}
                color={task.completed ? Colors.primary : Colors.border}
                fill={task.completed ? Colors.primary : "transparent"}
              />
              <Text
                style={[
                  styles.taskText,
                  task.completed && styles.completedTask,
                ]}
              >
                {task.title}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>No pending tasks</Text>
        )}
      </View>
      
      <Card style={styles.tipCard}>
        <Text style={styles.tipTitle}>Tip of the Day</Text>
        <Text style={styles.tipText}>{tip}</Text>
      </Card>
      
      {expiringDocuments.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Document Alerts</Text>
            <TouchableOpacity onPress={() => router.push("/documents")}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {expiringDocuments.map((doc) => (
            <TouchableOpacity
              key={doc.id}
              style={styles.alertItem}
              onPress={() => router.push(`/documents/${doc.id}`)}
            >
              <View style={styles.alertIconContainer}>
                <Bell size={20} color={Colors.warning} />
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{doc.name} is expiring soon</Text>
                <Text style={styles.alertText}>
                  Take action before it expires
                </Text>
              </View>
              <ChevronRight size={16} color={Colors.lightText} />
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      <View style={styles.quickActions}>
        <Text style={styles.quickActionsTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/documents")}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.primaryLight }]}>
              <FileText size={24} color={Colors.primary} />
            </View>
            <Text style={styles.actionText}>Documents</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/community")}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.secondaryLight }]}>
              <Users size={24} color={Colors.secondary} />
            </View>
            <Text style={styles.actionText}>Community</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/journey")}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#E8F5E9" }]}>
              <Map size={24} color="#4CAF50" />
            </View>
            <Text style={styles.actionText}>Journey</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/calendar")}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#FFF3E0" }]}>
              <Calendar size={24} color="#FF9800" />
            </View>
            <Text style={styles.actionText}>Calendar</Text>
          </TouchableOpacity>
        </View>
        
        {/* UniPilot AI Assistant Button - Prominent */}
        <TouchableOpacity
          style={styles.uniPilotButton}
          onPress={() => router.push("/unipilot-ai")}
        >
          <View style={styles.uniPilotContent}>
            <View style={styles.uniPilotIconContainer}>
              <Crown size={24} color="#FFD700" />
            </View>
            <View style={styles.uniPilotTextContainer}>
              <Text style={styles.uniPilotTitle}>UniPilot AI Assistant</Text>
              <Text style={styles.uniPilotDescription}>
                Get personalized help from our AI education expert
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
      
      {/* UniPilot Premium Section */}
      <Card style={styles.premiumCard}>
        <View style={styles.premiumHeader}>
          <View style={styles.premiumTitleContainer}>
            <Crown size={24} color="#FFD700" style={styles.crownIcon} />
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
          <View style={styles.featureItem}>
            <CheckCircle size={16} color={Colors.primary} />
            <Text style={styles.featureText}>AI-powered application assistant</Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.premiumButton}
          onPress={() => router.push("/premium")}
        >
          <MessageCircle size={20} color={Colors.white} style={styles.buttonIcon} />
          <Text style={styles.premiumButtonText}>Talk to an Expert</Text>
        </TouchableOpacity>
      </Card>
      
      {/* Success Stories Section */}
      <View style={styles.successSection}>
        <Text style={styles.successTitle}>Success Stories</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.successStoriesContainer}
        >
          <Card style={styles.successCard}>
            <Image 
              source={{ uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" }}
              style={styles.successImage}
            />
            <View style={styles.successContent}>
              <View style={styles.successHeader}>
                <Text style={styles.successName}>David Kim</Text>
                <View style={styles.ratingContainer}>
                  <Star size={14} color="#FFD700" fill="#FFD700" />
                  <Star size={14} color="#FFD700" fill="#FFD700" />
                  <Star size={14} color="#FFD700" fill="#FFD700" />
                  <Star size={14} color="#FFD700" fill="#FFD700" />
                  <Star size={14} color="#FFD700" fill="#FFD700" />
                </View>
              </View>
              <Text style={styles.successSchool}>Harvard University, USA</Text>
              <Text style={styles.successText}>
                "UniPilot Premium helped me navigate the complex application process and secure a full scholarship!"
              </Text>
            </View>
          </Card>
          
          <Card style={styles.successCard}>
            <Image 
              source={{ uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" }}
              style={styles.successImage}
            />
            <View style={styles.successContent}>
              <View style={styles.successHeader}>
                <Text style={styles.successName}>Sarah Chen</Text>
                <View style={styles.ratingContainer}>
                  <Star size={14} color="#FFD700" fill="#FFD700" />
                  <Star size={14} color="#FFD700" fill="#FFD700" />
                  <Star size={14} color="#FFD700" fill="#FFD700" />
                  <Star size={14} color="#FFD700" fill="#FFD700" />
                  <Star size={14} color="#FFD700" fill="#FFD700" />
                </View>
              </View>
              <Text style={styles.successSchool}>Oxford University, UK</Text>
              <Text style={styles.successText}>
                "The AI assistant helped me perfect my personal statement and ace my interview!"
              </Text>
            </View>
          </Card>
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: Colors.lightText,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.lightBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  progressCard: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    marginTop: 12,
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "500",
    marginRight: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.primary,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  taskText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
    flex: 1,
  },
  completedTask: {
    textDecorationLine: "line-through",
    color: Colors.lightText,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.lightText,
    textAlign: "center",
    paddingVertical: 16,
  },
  tipCard: {
    marginBottom: 24,
    backgroundColor: Colors.primaryLight,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  alertItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: Colors.card,
    borderRadius: 8,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  alertIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF3E0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 2,
  },
  alertText: {
    fontSize: 12,
    color: Colors.lightText,
  },
  quickActions: {
    marginBottom: 24,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  actionButton: {
    width: "48%",
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
  },
  uniPilotButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  uniPilotContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  uniPilotIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  uniPilotTextContainer: {
    flex: 1,
  },
  uniPilotTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.white,
    marginBottom: 4,
  },
  uniPilotDescription: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
  },
  premiumCard: {
    marginBottom: 24,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#EAEAEA",
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
    fontWeight: "700",
    color: Colors.text,
  },
  priceBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priceText: {
    color: Colors.white,
    fontWeight: "600",
    fontSize: 12,
  },
  premiumDescription: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 16,
  },
  premiumFeatures: {
    marginBottom: 16,
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
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  premiumButtonText: {
    color: Colors.white,
    fontWeight: "600",
    fontSize: 16,
  },
  successSection: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 16,
  },
  successStoriesContainer: {
    paddingRight: 16,
  },
  successCard: {
    width: 280,
    marginRight: 16,
    padding: 0,
    overflow: "hidden",
  },
  successImage: {
    width: "100%",
    height: 120,
  },
  successContent: {
    padding: 12,
  },
  successHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  successName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  ratingContainer: {
    flexDirection: "row",
  },
  successSchool: {
    fontSize: 12,
    color: Colors.primary,
    marginBottom: 8,
    fontWeight: "500",
  },
  successText: {
    fontSize: 12,
    color: Colors.text,
    lineHeight: 18,
    fontStyle: "italic",
  },
});