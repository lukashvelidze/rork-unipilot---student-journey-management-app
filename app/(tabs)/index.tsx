import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Platform, Image, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { CheckCircle, ChevronRight, Calendar, Bell, FileText, Users, Map, MessageCircle, Crown, Star, ArrowRight } from "lucide-react-native";
import Colors from "@/constants/colors";
import Theme from "@/constants/theme";
import Card from "@/components/Card";
import Button from "@/components/Button";
import ProgressBar from "@/components/ProgressBar";
import QuoteCard from "@/components/QuoteCard";
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
    <>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.name}>{user.name}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Bell size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>
        
        {/* Journey Progress Section */}
        <Card style={styles.journeyCard} variant="elevated" borderRadius="large">
          <View style={styles.journeyHeader}>
            <View>
              <Text style={styles.journeyTitle}>Your Progress</Text>
              <Text style={styles.journeySubtitle}>{journeyName}</Text>
            </View>
            <View style={styles.progressBadge}>
              <Text style={styles.progressBadgeText}>{overallProgress}%</Text>
            </View>
          </View>
          
          <View style={styles.progressBarContainer}>
            <ProgressBar 
              progress={overallProgress} 
              height={10} 
              backgroundColor={Colors.progressBackground}
              progressColor={Colors.primary}
              showPulse={true}
            />
          </View>
          
          <TouchableOpacity 
            style={styles.viewRoadmapButton}
            onPress={() => router.push("/journey")}
          >
            <Text style={styles.viewRoadmapText}>View Roadmap</Text>
            <ArrowRight size={16} color={Colors.primary} />
          </TouchableOpacity>
        </Card>
        
        {/* Daily Tip Section */}
        <QuoteCard 
          quote={tip}
          author="UniPilot Tip"
          variant="highlight"
        />
        
        {/* To-Do Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <CheckCircle size={18} color={Colors.primary} style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>To-Do List</Text>
            </View>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => router.push("/tasks")}
            >
              <Text style={styles.seeAllText}>See All</Text>
              <ChevronRight size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          
          <Card variant="flat" style={styles.tasksCard} borderRadius="large">
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map((task, index) => (
                <TouchableOpacity
                  key={task.id}
                  style={[
                    styles.taskItem,
                    index < upcomingTasks.length - 1 && styles.taskItemBorder
                  ]}
                  onPress={() => handleTaskToggle(task.id, !task.completed, task.stage)}
                >
                  <View style={[
                    styles.checkCircle,
                    task.completed && styles.checkCircleCompleted
                  ]}>
                    <CheckCircle
                      size={18}
                      color={task.completed ? Colors.white : Colors.border}
                      fill={task.completed ? Colors.white : "transparent"}
                    />
                  </View>
                  <View style={styles.taskContent}>
                    <Text
                      style={[
                        styles.taskText,
                        task.completed && styles.completedTask,
                      ]}
                    >
                      {task.title}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyTasksContainer}>
                <Text style={styles.emptyText}>All caught up! No pending tasks.</Text>
              </View>
            )}
          </Card>
        </View>
        
        {/* Document Alerts Section */}
        {expiringDocuments.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Bell size={18} color={Colors.warning} style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>Document Alerts</Text>
              </View>
              <TouchableOpacity 
                style={styles.seeAllButton}
                onPress={() => router.push("/documents")}
              >
                <Text style={styles.seeAllText}>See All</Text>
                <ChevronRight size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            
            <Card variant="flat" style={styles.alertsCard} borderRadius="large">
              {expiringDocuments.map((doc, index) => (
                <TouchableOpacity
                  key={doc.id}
                  style={[
                    styles.alertItem,
                    index < expiringDocuments.length - 1 && styles.alertItemBorder
                  ]}
                  onPress={() => router.push(`/documents/${doc.id}`)}
                >
                  <View style={styles.alertIconContainer}>
                    <Bell size={18} color={Colors.warning} />
                  </View>
                  <View style={styles.alertContent}>
                    <Text style={styles.alertTitle}>{doc.title} is expiring soon</Text>
                    <Text style={styles.alertText}>
                      Take action before it expires
                    </Text>
                  </View>
                  <ChevronRight size={16} color={Colors.lightText} />
                </TouchableOpacity>
              ))}
            </Card>
          </View>
        )}
        
        {/* Quick Actions Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/documents")}
            >
              <View style={[styles.actionIcon, { backgroundColor: Colors.primaryLight }]}>
                <FileText size={22} color={Colors.primary} />
              </View>
              <Text style={styles.actionText}>Documents</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/community")}
            >
              <View style={[styles.actionIcon, { backgroundColor: Colors.secondaryLight }]}>
                <Users size={22} color={Colors.secondary} />
              </View>
              <Text style={styles.actionText}>Community</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/journey")}
            >
              <View style={[styles.actionIcon, { backgroundColor: "#E8F5E9" }]}>
                <Map size={22} color="#4CAF50" />
              </View>
              <Text style={styles.actionText}>Journey</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/calendar")}
            >
              <View style={[styles.actionIcon, { backgroundColor: "#FFF3E0" }]}>
                <Calendar size={22} color="#FF9800" />
              </View>
              <Text style={styles.actionText}>Calendar</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* UniPilot AI Assistant Button */}
        <TouchableOpacity
          style={styles.aiAssistantButton}
          onPress={() => router.push("/unipilot-ai")}
        >
          <View style={styles.aiAssistantContent}>
            <View style={styles.aiAssistantIconContainer}>
              <Crown size={22} color="#FFD700" />
            </View>
            <View style={styles.aiAssistantTextContainer}>
              <Text style={styles.aiAssistantTitle}>UniPilot AI Assistant</Text>
              <Text style={styles.aiAssistantDescription}>
                Get personalized help with your journey
              </Text>
            </View>
          </View>
          <View style={styles.aiAssistantArrow}>
            <ArrowRight size={20} color={Colors.white} />
          </View>
        </TouchableOpacity>
        
        {/* Premium Section */}
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
        
        {/* Success Stories Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Star size={18} color={Colors.primary} style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>Success Stories</Text>
            </View>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>See All</Text>
              <ChevronRight size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.successStoriesContainer}
          >
            <Card style={styles.successCard} variant="elevated" borderRadius="large">
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
                  "UniPilot helped me navigate the complex application process and secure a full scholarship!"
                </Text>
              </View>
            </Card>
            
            <Card style={styles.successCard} variant="elevated" borderRadius="large">
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
            
            <Card style={styles.successCard} variant="elevated" borderRadius="large">
              <Image 
                source={{ uri: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" }}
                style={styles.successImage}
              />
              <View style={styles.successContent}>
                <View style={styles.successHeader}>
                  <Text style={styles.successName}>Michael Torres</Text>
                  <View style={styles.ratingContainer}>
                    <Star size={14} color="#FFD700" fill="#FFD700" />
                    <Star size={14} color="#FFD700" fill="#FFD700" />
                    <Star size={14} color="#FFD700" fill="#FFD700" />
                    <Star size={14} color="#FFD700" fill="#FFD700" />
                    <Star size={14} color="#FFD700" fill="#FFD700" />
                  </View>
                </View>
                <Text style={styles.successSchool}>ETH Zurich, Switzerland</Text>
                <Text style={styles.successText}>
                  "UniPilot's document management system saved me countless hours during my visa application!"
                </Text>
              </View>
            </Card>
          </ScrollView>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Theme.spacing.l,
    paddingBottom: Theme.spacing.xxl,
  },
  
  // Header Section
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.l,
  },
  greeting: {
    fontSize: Theme.fontSize.m,
    color: Colors.lightText,
    marginBottom: 4,
  },
  name: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: "700",
    color: Colors.text,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.lightBackground,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowMedium,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      }
    }),
  },
  
  // Journey Progress Section
  journeyCard: {
    marginBottom: Theme.spacing.l,
    padding: Theme.spacing.l,
  },
  journeyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.m,
  },
  journeyTitle: {
    fontSize: Theme.fontSize.l,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 2,
  },
  journeySubtitle: {
    fontSize: Theme.fontSize.s,
    color: Colors.lightText,
  },
  progressBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Theme.spacing.m,
    paddingVertical: Theme.spacing.xs,
    borderRadius: 16,
  },
  progressBadgeText: {
    fontSize: Theme.fontSize.m,
    fontWeight: "700",
    color: Colors.primary,
  },
  progressBarContainer: {
    marginBottom: Theme.spacing.m,
  },
  viewRoadmapButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    paddingVertical: Theme.spacing.xs,
  },
  viewRoadmapText: {
    fontSize: Theme.fontSize.s,
    color: Colors.primary,
    fontWeight: "500",
    marginRight: Theme.spacing.xs,
  },
  
  // Section Containers
  sectionContainer: {
    marginBottom: Theme.spacing.l,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.m,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionIcon: {
    marginRight: Theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: Theme.fontSize.l,
    fontWeight: "600",
    color: Colors.text,
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  seeAllText: {
    fontSize: Theme.fontSize.s,
    color: Colors.primary,
    marginRight: 2,
  },
  
  // Tasks Section
  tasksCard: {
    overflow: "hidden",
    padding: 0,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Theme.spacing.m,
  },
  taskItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  checkCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.lightBackground,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Theme.spacing.m,
  },
  checkCircleCompleted: {
    backgroundColor: Colors.primary,
  },
  taskContent: {
    flex: 1,
  },
  taskText: {
    fontSize: Theme.fontSize.m,
    color: Colors.text,
  },
  completedTask: {
    textDecorationLine: "line-through",
    color: Colors.lightText,
  },
  emptyTasksContainer: {
    padding: Theme.spacing.l,
    alignItems: "center",
  },
  emptyText: {
    fontSize: Theme.fontSize.m,
    color: Colors.lightText,
    textAlign: "center",
  },
  
  // Alerts Section
  alertsCard: {
    overflow: "hidden",
    padding: 0,
  },
  alertItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Theme.spacing.m,
  },
  alertItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  alertIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF3E0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Theme.spacing.m,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: Theme.fontSize.m,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 2,
  },
  alertText: {
    fontSize: Theme.fontSize.xs,
    color: Colors.lightText,
  },
  
  // Quick Actions Section
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionButton: {
    width: "48%",
    backgroundColor: Colors.card,
    borderRadius: Theme.borderRadius.l,
    padding: Theme.spacing.m,
    alignItems: "center",
    marginBottom: Theme.spacing.m,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowMedium,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      }
    }),
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Theme.spacing.s,
  },
  actionText: {
    fontSize: Theme.fontSize.s,
    fontWeight: "500",
    color: Colors.text,
  },
  
  // AI Assistant Button
  aiAssistantButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.primary,
    borderRadius: Theme.borderRadius.l,
    padding: Theme.spacing.m,
    marginBottom: Theme.spacing.l,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
      }
    }),
  },
  aiAssistantContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  aiAssistantIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Theme.spacing.m,
  },
  aiAssistantTextContainer: {
    flex: 1,
  },
  aiAssistantTitle: {
    fontSize: Theme.fontSize.m,
    fontWeight: "700",
    color: Colors.white,
    marginBottom: 2,
  },
  aiAssistantDescription: {
    fontSize: Theme.fontSize.xs,
    color: "rgba(255, 255, 255, 0.8)",
  },
  aiAssistantArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  
  // Premium Section
  premiumCard: {
    marginBottom: Theme.spacing.l,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  premiumHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.m,
  },
  premiumTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  crownIcon: {
    marginRight: Theme.spacing.s,
  },
  premiumTitle: {
    fontSize: Theme.fontSize.l,
    fontWeight: "700",
    color: Colors.text,
  },
  priceBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Theme.spacing.m,
    paddingVertical: Theme.spacing.xs,
    borderRadius: 16,
  },
  priceText: {
    color: Colors.white,
    fontWeight: "600",
    fontSize: Theme.fontSize.xs,
  },
  premiumDescription: {
    fontSize: Theme.fontSize.s,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: Theme.spacing.m,
  },
  premiumFeatures: {
    marginBottom: Theme.spacing.m,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Theme.spacing.s,
  },
  featureText: {
    fontSize: Theme.fontSize.s,
    color: Colors.text,
    marginLeft: Theme.spacing.s,
  },
  premiumButton: {
    marginTop: Theme.spacing.s,
  },
  
  // Success Stories Section
  successStoriesContainer: {
    paddingRight: Theme.spacing.m,
    paddingBottom: Theme.spacing.s,
  },
  successCard: {
    width: 280,
    marginRight: Theme.spacing.m,
    padding: 0,
    overflow: "hidden",
  },
  successImage: {
    width: "100%",
    height: 140,
  },
  successContent: {
    padding: Theme.spacing.m,
  },
  successHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  successName: {
    fontSize: Theme.fontSize.m,
    fontWeight: "600",
    color: Colors.text,
  },
  ratingContainer: {
    flexDirection: "row",
  },
  successSchool: {
    fontSize: Theme.fontSize.xs,
    color: Colors.primary,
    marginBottom: Theme.spacing.s,
    fontWeight: "500",
  },
  successText: {
    fontSize: Theme.fontSize.xs,
    color: Colors.text,
    lineHeight: 18,
    fontStyle: "italic",
  },
});