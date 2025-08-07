import React, { useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Award, TrendingUp, BookOpen, Users, Crown, Zap, Target, Calendar, UserCheck, BarChart3, Video, CheckSquare } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import Card from "@/components/Card";
import ProgressBar from "@/components/ProgressBar";
import QuoteCard from "@/components/QuoteCard";
import { useUserStore } from "@/store/userStore";
import { useJourneyStore } from "@/store/journeyStore";
import { calculateOverallProgress } from "@/utils/helpers";
import { getRandomQuote, generalQuotes } from "@/mocks/quotes";
import { initialJourneyProgress } from "@/mocks/journeyTasks";

export default function HomeScreen() {
  const router = useRouter();
  const Colors = useColors();
  const { user, isPremium } = useUserStore();
  const { journeyProgress, setJourneyProgress } = useJourneyStore();
  
  // Initialize journey progress if not already set
  useEffect(() => {
    if (user && journeyProgress.length === 0) {
      console.log("Initializing journey progress for user:", user.name);
      setJourneyProgress(initialJourneyProgress);
    }
  }, [user, journeyProgress.length, setJourneyProgress]);
  
  // Redirect to onboarding if user is not set up
  useEffect(() => {
    if (!user) {
      console.log("No user found, redirecting to onboarding");
      router.replace("/onboarding");
      return;
    }
    
    if (!user.onboardingCompleted) {
      console.log("Onboarding not completed, redirecting");
      router.replace("/onboarding");
      return;
    }
  }, [user, router]);
  
  if (!user) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: Colors.background }]}>
        <Text style={[styles.loadingText, { color: Colors.lightText }]}>Setting up your journey...</Text>
      </SafeAreaView>
    );
  }
  
  const overallProgress = calculateOverallProgress(journeyProgress);
  const dailyQuote = getRandomQuote(generalQuotes);
  
  // Get current active stage (first incomplete stage)
  const currentStage = journeyProgress.find(stage => !stage.completed) || journeyProgress[0];
  const completedStages = journeyProgress.filter(stage => stage.completed).length;
  
  // Get next few tasks from current stage
  const upcomingTasks = currentStage?.tasks.filter(task => !task.completed).slice(0, 3) || [];
  
  const quickActions = [
    {
      title: "Application Checklist",
      description: "Complete guide to applications",
      icon: CheckSquare,
      color: Colors.primary,
      onPress: () => router.push("/application-checklist"),
    },
    {
      title: "Continue Journey",
      description: `${currentStage?.stage.replace('_', ' ').toUpperCase()} stage`,
      icon: TrendingUp,
      color: Colors.secondary,
      onPress: () => router.push("/(tabs)/journey"),
    },
    {
      title: "Premium Features",
      description: "Explore premium tools",
      icon: Crown,
      color: Colors.accent,
      onPress: () => router.push("/(tabs)/community"),
    },
  ];

  const premiumFeatures = [
    {
      title: "Personal Mentor",
      description: "1-on-1 guidance sessions",
      icon: UserCheck,
      color: Colors.primary,
      onPress: () => router.push("/premium/mentor"),
    },
    {
      title: "Advanced Analytics",
      description: "Track your progress",
      icon: BarChart3,
      color: Colors.secondary,
      onPress: () => router.push("/premium/analytics"),
    },
    {
      title: "Premium Resources",
      description: "Exclusive templates & guides",
      icon: BookOpen,
      color: Colors.accent,
      onPress: () => router.push("/premium/resources"),
    },
    {
      title: "Exclusive Webinars",
      description: "Live expert sessions",
      icon: Video,
      color: Colors.success,
      onPress: () => router.push("/premium/webinars"),
    },
  ];

  const premiumQuickActions = [
    {
      title: "AI Assistant",
      description: "Get personalized guidance",
      icon: Zap,
      color: Colors.primary,
      onPress: () => router.push("/unipilot-ai"),
    },
    {
      title: "Premium Resources",
      description: "Access exclusive content",
      icon: BookOpen,
      color: Colors.secondary,
      onPress: () => router.push("/premium/resources"),
    },
    {
      title: "Personal Mentor",
      description: "Book 1-on-1 sessions",
      icon: UserCheck,
      color: Colors.success,
      onPress: () => router.push("/premium/mentor"),
    },
  ];
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]} edges={['top']}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.greeting, { color: Colors.lightText }]}>Welcome back,</Text>
              <Text style={[styles.name, { color: Colors.text }]}>{user.name}!</Text>
            </View>
            {isPremium && (
              <View style={[styles.premiumBadge, { backgroundColor: Colors.premiumBackground, borderColor: Colors.premium }]}>
                <Crown size={16} color={Colors.premium} />
                <Text style={[styles.premiumText, { color: Colors.premium }]}>Premium</Text>
              </View>
            )}
          </View>
        </View>
        
        <QuoteCard 
          quote={dailyQuote.text} 
          author={dailyQuote.author} 
          variant="highlight"
        />
        
        <Card style={[styles.progressCard, { backgroundColor: Colors.card }]}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={[styles.progressTitle, { color: Colors.text }]}>Your Journey Progress</Text>
              <Text style={[styles.progressSubtitle, { color: Colors.lightText }]}>
                {completedStages} of {journeyProgress.length} stages completed
              </Text>
            </View>
            <View style={[styles.progressBadge, { backgroundColor: Colors.lightBackground }]}>
              <Award size={20} color={Colors.primary} />
              <Text style={[styles.progressPercent, { color: Colors.primary }]}>{overallProgress}%</Text>
            </View>
          </View>
          
          <ProgressBar 
            progress={overallProgress} 
            height={8} 
            animated={true}
          />
          
          <TouchableOpacity 
            style={[styles.viewJourneyButton, { backgroundColor: Colors.lightBackground }]}
            onPress={() => router.push("/(tabs)/journey")}
          >
            <Text style={[styles.viewJourneyText, { color: Colors.primary }]}>View Full Journey</Text>
          </TouchableOpacity>
        </Card>
        
        {isPremium && (
          <>
            <Card style={[styles.premiumFeaturesCard, { backgroundColor: Colors.premiumBackground, borderColor: Colors.premium }]}>
              <View style={styles.sectionHeader}>
                <Crown size={20} color={Colors.premium} />
                <Text style={[styles.premiumSectionTitle, { color: Colors.text }]}>Premium Features</Text>
              </View>
              
              <View style={styles.premiumGrid}>
                {premiumFeatures.map((feature, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.premiumFeatureCard, { backgroundColor: Colors.white, borderLeftColor: feature.color }]}
                    onPress={feature.onPress}
                  >
                    <feature.icon size={20} color={feature.color} />
                    <Text style={[styles.premiumFeatureTitle, { color: Colors.text }]}>{feature.title}</Text>
                    <Text style={[styles.premiumFeatureDescription, { color: Colors.lightText }]}>{feature.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>

            <Card style={[styles.premiumActionsCard, { backgroundColor: Colors.premiumBackground, borderColor: Colors.premium }]}>
              <Text style={[styles.sectionTitle, { color: Colors.text }]}>Premium Quick Actions</Text>
              <View style={styles.premiumActionsGrid}>
                {premiumQuickActions.map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.premiumActionCard, { backgroundColor: Colors.white, borderColor: action.color }]}
                    onPress={action.onPress}
                  >
                    <action.icon size={24} color={action.color} />
                    <Text style={[styles.actionTitle, { color: Colors.text }]}>{action.title}</Text>
                    <Text style={[styles.actionDescription, { color: Colors.lightText }]}>{action.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>
          </>
        )}
        
        {upcomingTasks.length > 0 && (
          <Card style={[styles.tasksCard, { backgroundColor: Colors.card }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: Colors.text }]}>Upcoming Tasks</Text>
              <TouchableOpacity onPress={() => router.push(`/journey/${currentStage?.stage}`)}>
                <Text style={[styles.viewAllText, { color: Colors.primary }]}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {upcomingTasks.map((task, index) => (
              <TouchableOpacity 
                key={task.id} 
                style={styles.taskItem}
                onPress={() => router.push(`/journey/${currentStage?.stage}`)}
              >
                <View style={[styles.taskIndicator, { backgroundColor: task.completed ? Colors.success : Colors.primary }]} />
                <Text style={[styles.taskTitle, { color: Colors.text, textDecorationLine: task.completed ? 'line-through' : 'none' }]}>
                  {task.title}
                </Text>
                {task.completed && (
                  <View style={[styles.taskCompleted, { backgroundColor: Colors.success }]}>
                    <Text style={styles.taskCompletedText}>Done</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </Card>
        )}
        
        <View style={styles.quickActions}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.actionCard, { backgroundColor: Colors.white, borderLeftColor: action.color }]}
                onPress={action.onPress}
              >
                <action.icon size={24} color={action.color} />
                <Text style={[styles.actionTitle, { color: Colors.text }]}>{action.title}</Text>
                <Text style={[styles.actionDescription, { color: Colors.lightText }]}>{action.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {!isPremium && (
          <Card style={[styles.upgradeCard, { backgroundColor: Colors.premiumBackground, borderColor: Colors.premium }]}>
            <View style={styles.upgradeContent}>
              <Crown size={32} color={Colors.premium} />
              <View style={styles.upgradeText}>
                <Text style={[styles.upgradeTitle, { color: Colors.text }]}>Unlock Premium Features</Text>
                <Text style={[styles.upgradeDescription, { color: Colors.lightText }]}>
                  Get personal mentoring, advanced analytics, and exclusive resources for just $4.99/month
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.upgradeButton, { backgroundColor: Colors.premium }]}
              onPress={() => router.push("/premium")}
            >
              <Text style={styles.upgradeButtonText}>Upgrade Now - $4.99/month</Text>
            </TouchableOpacity>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 16,
    marginBottom: 4,
  },
  name: {
    fontSize: 28,
    fontWeight: "700",
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  premiumText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  progressCard: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 14,
  },
  progressBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 6,
  },
  viewJourneyButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  viewJourneyText: {
    fontSize: 14,
    fontWeight: "600",
  },
  premiumFeaturesCard: {
    marginBottom: 20,
    borderWidth: 1,
  },
  premiumSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  premiumGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 16,
  },
  premiumFeatureCard: {
    width: "48%",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  premiumFeatureTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 4,
  },
  premiumFeatureDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  premiumActionsCard: {
    marginBottom: 20,
    borderWidth: 1,
  },
  premiumActionsGrid: {
    marginTop: 12,
  },
  premiumActionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tasksCard: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "500",
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  taskIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  taskTitle: {
    fontSize: 14,
    flex: 1,
  },
  taskCompleted: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  taskCompletedText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  quickActions: {
    marginBottom: 20,
  },
  actionsGrid: {
    marginTop: 12,
  },
  actionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
  },
  upgradeCard: {
    borderWidth: 1,
    marginBottom: 20,
  },
  upgradeContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  upgradeText: {
    flex: 1,
    marginLeft: 16,
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  upgradeDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  upgradeButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});