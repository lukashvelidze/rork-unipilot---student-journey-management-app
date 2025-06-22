import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Platform, Image, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { CheckCircle, ChevronRight, Calendar, Bell, FileText, Users, Map, MessageCircle, Crown, Star, ArrowRight, BookOpen, Award, Briefcase, GraduationCap, FileCheck } from "lucide-react-native";
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
  const { user, isPremium } = useUserStore();
  const { journeyProgress, setJourneyProgress, updateTask } = useJourneyStore();
  const { documents } = useDocumentStore();
  
  // Initialize state with functions to avoid state updates during render
  const [greeting, setGreeting] = useState(() => getGreeting());
  const [tip, setTip] = useState(() => getRandomTip(studentTips));
  const [showPremiumWelcome, setShowPremiumWelcome] = useState(false);
  
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

  // Show premium welcome message when user subscribes
  useEffect(() => {
    if (isPremium) {
      setShowPremiumWelcome(true);
      const timer = setTimeout(() => {
        setShowPremiumWelcome(false);
      }, 7000); // Hide after 7 seconds
      return () => clearTimeout(timer);
    }
  }, [isPremium]);
  
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
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => router.push("/notifications")}
          >
            <Bell size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Premium Welcome Banner - Only shows temporarily after subscribing */}
        {showPremiumWelcome && (
          <Card style={styles.premiumWelcomeCard} variant="elevated" borderRadius="large">
            <View style={styles.premiumWelcomeContent}>
              <View style={styles.premiumWelcomeIconContainer}>
                <Crown size={24} color="#FFD700" />
              </View>
              <View style={styles.premiumWelcomeTextContainer}>
                <Text style={styles.premiumWelcomeTitle}>Welcome to Premium!</Text>
                <Text style={styles.premiumWelcomeText}>
                  You now have access to all premium features and resources
                </Text>
              </View>
            </View>
          </Card>
        )}
        
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
                    <Text style={styles.alertTitle}>{doc.name} is expiring soon</Text>
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

        {/* Premium Resources Section - Only visible for premium users */}
        {isPremium && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Crown size={18} color="#FFD700" style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>Premium Resources</Text>
              </View>
              <TouchableOpacity 
                style={styles.seeAllButton}
                onPress={() => router.push("/premium")}
              >
                <Text style={styles.seeAllText}>See All</Text>
                <ChevronRight size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.premiumResourcesContainer}
            >
              <TouchableOpacity 
                style={styles.premiumResourceCard}
                onPress={() => router.push("/premium/visa-guide")}
              >
                <View style={[styles.resourceIconContainer, { backgroundColor: "#E3F2FD" }]}>
                  <FileCheck size={24} color={Colors.primary} />
                </View>
                <Text style={styles.resourceTitle}>Visa Application Guide</Text>
                <Text style={styles.resourceDescription}>
                  Step-by-step guide for student visa success
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.premiumResourceCard}
                onPress={() => router.push("/premium/scholarship")}
              >
                <View style={[styles.resourceIconContainer, { backgroundColor: "#FFF8E1" }]}>
                  <Award size={24} color="#FFA000" />
                </View>
                <Text style={styles.resourceTitle}>Scholarship Templates</Text>
                <Text style={styles.resourceDescription}>
                  Winning scholarship application examples
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.premiumResourceCard}
                onPress={() => router.push("/premium/interview")}
              >
                <View style={[styles.resourceIconContainer, { backgroundColor: "#E8F5E9" }]}>
                  <MessageCircle size={24} color={Colors.secondary} />
                </View>
                <Text style={styles.resourceTitle}>Interview Prep</Text>
                <Text style={styles.resourceDescription}>
                  Practice for university admission interviews
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.premiumResourceCard}
                onPress={() => router.push("/premium/accommodation")}
              >
                <View style={[styles.resourceIconContainer, { backgroundColor: "#F3E5F5" }]}>
                  <BookOpen size={24} color="#9C27B0" />
                </View>
                <Text style={styles.resourceTitle}>Housing Guide</Text>
                <Text style={styles.resourceDescription}>
                  Find the perfect student accommodation
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Expert Consultation Section - Only visible for premium users */}
        {isPremium && (
          <View style={styles.sectionContainer}>
            <TouchableOpacity 
              style={styles.expertConsultCard}
              onPress={() => router.push("/premium#expert")}
            >
              <View style={styles.expertConsultContent}>
                <Image 
                  source={{ uri: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" }}
                  style={styles.expertAvatar}
                />
                <View style={styles.expertTextContainer}>
                  <Text style={styles.expertTitle}>Dr. Emma Wilson is available</Text>
                  <Text style={styles.expertDescription}>
                    Your personal education advisor is ready to chat
                  </Text>
                </View>
              </View>
              <View style={styles.expertArrow}>
                <ArrowRight size={20} color={Colors.white} />
              </View>
            </TouchableOpacity>
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
        
        {/* Premium Section - Only visible for non-premium users */}
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
        
        {/* Success Stories Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Star size={18} color={Colors.primary} style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>Success Stories</Text>
            </View>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => router.push("/success-stories")}
            >
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

        {/* Premium Study Guides - Only visible for premium users */}
        {isPremium && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <GraduationCap size={18} color={Colors.academic} style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>Study Guides</Text>
              </View>
              <TouchableOpacity 
                style={styles.seeAllButton}
                onPress={() => router.push("/premium/study-guides")}
              >
                <Text style={styles.seeAllText}>See All</Text>
                <ChevronRight size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            
            <Card variant="flat" style={styles.studyGuidesCard} borderRadius="large">
              <TouchableOpacity 
                style={styles.studyGuideItem}
                onPress={() => router.push("/premium/study-guides/time-management")}
              >
                <View style={[styles.studyGuideIcon, { backgroundColor: Colors.primaryLight }]}>
                  <Calendar size={20} color={Colors.primary} />
                </View>
                <View style={styles.studyGuideContent}>
                  <Text style={styles.studyGuideTitle}>Time Management for Students</Text>
                  <Text style={styles.studyGuideDescription}>
                    Master your schedule and boost productivity
                  </Text>
                </View>
                <ChevronRight size={16} color={Colors.lightText} />
              </TouchableOpacity>
              
              <View style={styles.divider} />
              
              <TouchableOpacity 
                style={styles.studyGuideItem}
                onPress={() => router.push("/premium/study-guides/exam-prep")}
              >
                <View style={[styles.studyGuideIcon, { backgroundColor: "#E8F5E9" }]}>
                  <BookOpen size={20} color={Colors.secondary} />
                </View>
                <View style={styles.studyGuideContent}>
                  <Text style={styles.studyGuideTitle}>Exam Preparation Strategies</Text>
                  <Text style={styles.studyGuideDescription}>
                    Effective techniques for academic success
                  </Text>
                </View>
                <ChevronRight size={16} color={Colors.lightText} />
              </TouchableOpacity>
              
              <View style={styles.divider} />
              
              <TouchableOpacity 
                style={styles.studyGuideItem}
                onPress={() => router.push("/premium/study-guides/research")}
              >
                <View style={[styles.studyGuideIcon, { backgroundColor: "#FFF3E0" }]}>
                  <Briefcase size={20} color="#FF9800" />
                </View>
                <View style={styles.studyGuideContent}>
                  <Text style={styles.studyGuideTitle}>Research Paper Writing</Text>
                  <Text style={styles.studyGuideDescription}>
                    From outline to final submission
                  </Text>
                </View>
                <ChevronRight size={16} color={Colors.lightText} />
              </TouchableOpacity>
            </Card>
          </View>
        )}
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
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.lightBackground,
    justifyContent: "center",
    alignItems: "center",
    ...Theme.shadow.small,
  },
  
  // Premium Welcome Banner
  premiumWelcomeCard: {
    marginBottom: Theme.spacing.l,
    backgroundColor: Colors.primary,
  },
  premiumWelcomeContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  premiumWelcomeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Theme.spacing.m,
  },
  premiumWelcomeTextContainer: {
    flex: 1,
  },
  premiumWelcomeTitle: {
    fontSize: Theme.fontSize.l,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.white,
    marginBottom: 4,
  },
  premiumWelcomeText: {
    fontSize: Theme.fontSize.s,
    color: "rgba(255, 255, 255, 0.9)",
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
    fontWeight: Theme.fontWeight.bold,
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
    fontWeight: Theme.fontWeight.bold,
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
    fontWeight: Theme.fontWeight.medium,
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
    fontWeight: Theme.fontWeight.semibold,
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
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.text,
    marginBottom: 2,
  },
  alertText: {
    fontSize: Theme.fontSize.xs,
    color: Colors.lightText,
  },
  
  // Premium Resources Section
  premiumResourcesContainer: {
    paddingBottom: Theme.spacing.s,
  },
  premiumResourceCard: {
    width: 160,
    backgroundColor: Colors.card,
    borderRadius: Theme.borderRadius.l,
    padding: Theme.spacing.m,
    marginRight: Theme.spacing.m,
    ...Theme.shadow.small,
  },
  resourceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Theme.spacing.s,
  },
  resourceTitle: {
    fontSize: Theme.fontSize.s,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.text,
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: Theme.fontSize.xs,
    color: Colors.lightText,
    lineHeight: 16,
  },
  
  // Expert Consultation Section
  expertConsultCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.secondary,
    borderRadius: Theme.borderRadius.l,
    padding: Theme.spacing.m,
    ...Theme.shadow.medium,
  },
  expertConsultContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  expertAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: Theme.spacing.m,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  expertTextContainer: {
    flex: 1,
  },
  expertTitle: {
    fontSize: Theme.fontSize.m,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.white,
    marginBottom: 2,
  },
  expertDescription: {
    fontSize: Theme.fontSize.xs,
    color: "rgba(255, 255, 255, 0.9)",
  },
  expertArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
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
    ...Theme.shadow.small,
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
    fontWeight: Theme.fontWeight.medium,
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
    ...Theme.shadow.medium,
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
    fontWeight: Theme.fontWeight.bold,
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
    padding: Theme.spacing.l,
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
    fontWeight: Theme.fontWeight.bold,
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
    fontWeight: Theme.fontWeight.semibold,
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
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.text,
  },
  ratingContainer: {
    flexDirection: "row",
  },
  successSchool: {
    fontSize: Theme.fontSize.xs,
    color: Colors.primary,
    marginBottom: Theme.spacing.s,
    fontWeight: Theme.fontWeight.medium,
  },
  successText: {
    fontSize: Theme.fontSize.xs,
    color: Colors.text,
    lineHeight: 18,
    fontStyle: "italic",
  },
  
  // Study Guides Section
  studyGuidesCard: {
    overflow: "hidden",
    padding: 0,
  },
  studyGuideItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Theme.spacing.m,
  },
  studyGuideIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Theme.spacing.m,
  },
  studyGuideContent: {
    flex: 1,
  },
  studyGuideTitle: {
    fontSize: Theme.fontSize.m,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.text,
    marginBottom: 2,
  },
  studyGuideDescription: {
    fontSize: Theme.fontSize.xs,
    color: Colors.lightText,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Theme.spacing.m,
  },
});