import React, { useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Award, TrendingUp, BookOpen, Users, Crown, Zap, Target, Calendar, FileText, MessageSquare } from "lucide-react-native";
import Colors from "@/constants/colors";
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
  const { user } = useUserStore();
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
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Setting up your journey...</Text>
      </View>
    );
  }
  
  const overallProgress = calculateOverallProgress(journeyProgress);
  const dailyQuote = getRandomQuote(generalQuotes);
  const isPremium = user?.isPremium || false;
  
  // Get current active stage (first incomplete stage)
  const currentStage = journeyProgress.find(stage => !stage.completed) || journeyProgress[0];
  const completedStages = journeyProgress.filter(stage => stage.completed).length;
  
  // Get next few tasks from current stage
  const upcomingTasks = currentStage?.tasks.filter(task => !task.completed).slice(0, 3) || [];
  
  const quickActions = [
    {
      title: "Continue Journey",
      description: `${currentStage?.stage.replace('_', ' ').toUpperCase()} stage`,
      icon: TrendingUp,
      color: Colors.primary,
      onPress: () => router.push("/(tabs)/journey"),
    },
    {
      title: "View Documents",
      description: "Manage your documents",
      icon: BookOpen,
      color: Colors.secondary,
      onPress: () => router.push("/(tabs)/documents"),
    },
    {
      title: "Join Community",
      description: "Connect with others",
      icon: Users,
      color: Colors.accent,
      onPress: () => router.push("/(tabs)/community"),
    },
  ];

  const premiumFeatures = [
    {
      title: "AI Assistant",
      description: "Unlimited access to UniPilot AI",
      icon: Zap,
      color: "#FFD700",
      onPress: () => router.push("/unipilot-ai"),
    },
    {
      title: "Personal Mentor",
      description: "1-on-1 guidance sessions",
      icon: Target,
      color: "#9C27B0",
      onPress: () => router.push("/mentor"),
    },
    {
      title: "Premium Resources",
      description: "Exclusive templates & guides",
      icon: Crown,
      color: "#FF6B35",
      onPress: () => router.push("/resources"),
    },
    {
      title: "Priority Support",
      description: "24/7 premium support",
      icon: Calendar,
      color: "#4CAF50",
      onPress: () => router.push("/support"),
    },
  ];

  const premiumQuickActions = [
    {
      title: "AI Assistant",
      description: "Get personalized guidance",
      icon: Zap,
      color: "#FFD700",
      onPress: () => router.push("/unipilot-ai"),
    },
    {
      title: "Premium Resources",
      description: "Access exclusive content",
      icon: FileText,
      color: "#9C27B0",
      onPress: () => router.push("/resources"),
    },
    {
      title: "Expert Consultation",
      description: "Book 1-on-1 sessions",
      icon: MessageSquare,
      color: "#4CAF50",
      onPress: () => router.push("/consultation"),
    },
  ];
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.name}>{user.name}!</Text>
          </View>
          {isPremium && (
            <View style={styles.premiumBadge}>
              <Crown size={16} color="#FFD700" />
              <Text style={styles.premiumText}>Premium</Text>
            </View>
          )}
        </View>
      </View>
      
      <QuoteCard 
        quote={dailyQuote.text} 
        author={dailyQuote.author} 
        variant="highlight"
      />
      
      <Card style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <View>
            <Text style={styles.progressTitle}>Your Journey Progress</Text>
            <Text style={styles.progressSubtitle}>
              {completedStages} of {journeyProgress.length} stages completed
            </Text>
          </View>
          <View style={styles.progressBadge}>
            <Award size={20} color={Colors.primary} />
            <Text style={styles.progressPercent}>{overallProgress}%</Text>
          </View>
        </View>
        
        <ProgressBar 
          progress={overallProgress} 
          height={8} 
          animated={true}
        />
        
        <TouchableOpacity 
          style={styles.viewJourneyButton}
          onPress={() => router.push("/(tabs)/journey")}
        >
          <Text style={styles.viewJourneyText}>View Full Journey</Text>
        </TouchableOpacity>
      </Card>
      
      {isPremium && (
        <>
          <Card style={styles.premiumFeaturesCard}>
            <View style={styles.sectionHeader}>
              <Crown size={20} color="#FFD700" />
              <Text style={styles.premiumSectionTitle}>Premium Features</Text>
            </View>
            
            <View style={styles.premiumGrid}>
              {premiumFeatures.map((feature, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.premiumFeatureCard, { borderLeftColor: feature.color }]}
                  onPress={feature.onPress}
                >
                  <feature.icon size={20} color={feature.color} />
                  <Text style={styles.premiumFeatureTitle}>{feature.title}</Text>
                  <Text style={styles.premiumFeatureDescription}>{feature.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          <Card style={styles.premiumActionsCard}>
            <Text style={styles.sectionTitle}>Premium Quick Actions</Text>
            <View style={styles.premiumActionsGrid}>
              {premiumQuickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.premiumActionCard, { borderColor: action.color }]}
                  onPress={action.onPress}
                >
                  <action.icon size={24} color={action.color} />
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionDescription}>{action.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        </>
      )}
      
      {upcomingTasks.length > 0 && (
        <Card style={styles.tasksCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Tasks</Text>
            <TouchableOpacity onPress={() => router.push(`/journey/${currentStage?.stage}`)}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {upcomingTasks.map((task, index) => (
            <TouchableOpacity 
              key={task.id} 
              style={styles.taskItem}
              onPress={() => router.push(`/journey/${currentStage?.stage}`)}
            >
              <View style={[styles.taskIndicator, { backgroundColor: task.completed ? Colors.success : Colors.primary }]} />
              <Text style={[styles.taskTitle, { textDecorationLine: task.completed ? 'line-through' : 'none' }]}>
                {task.title}
              </Text>
              {task.completed && (
                <View style={styles.taskCompleted}>
                  <Text style={styles.taskCompletedText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </Card>
      )}
      
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.actionCard, { borderLeftColor: action.color }]}
              onPress={action.onPress}
            >
              <action.icon size={24} color={action.color} />
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionDescription}>{action.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {!isPremium && (
        <Card style={styles.upgradeCard}>
          <View style={styles.upgradeContent}>
            <Crown size={32} color="#FFD700" />
            <View style={styles.upgradeText}>
              <Text style={styles.upgradeTitle}>Unlock Premium Features</Text>
              <Text style={styles.upgradeDescription}>
                Get unlimited AI assistance, personal mentoring, and exclusive resources
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => router.push("/premium")}
          >
            <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
          </TouchableOpacity>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
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
    color: Colors.lightText,
    marginBottom: 4,
  },
  name: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.text,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  premiumText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#DAA520",
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
    color: Colors.text,
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 14,
    color: Colors.lightText,
  },
  progressBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.lightBackground,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
    marginLeft: 6,
  },
  viewJourneyButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: Colors.lightBackground,
    borderRadius: 8,
  },
  viewJourneyText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
  premiumFeaturesCard: {
    marginBottom: 20,
    backgroundColor: "rgba(255, 215, 0, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.2)",
  },
  premiumSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
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
    backgroundColor: Colors.white,
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
    color: Colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  premiumFeatureDescription: {
    fontSize: 12,
    color: Colors.lightText,
    lineHeight: 16,
  },
  premiumActionsCard: {
    marginBottom: 20,
    backgroundColor: "rgba(255, 215, 0, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.15)",
  },
  premiumActionsGrid: {
    marginTop: 12,
  },
  premiumActionCard: {
    backgroundColor: Colors.white,
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
    color: Colors.text,
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.primary,
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
    color: Colors.text,
    flex: 1,
  },
  taskCompleted: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.success,
    justifyContent: "center",
    alignItems: "center",
  },
  taskCompletedText: {
    color: Colors.white,
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
    backgroundColor: Colors.white,
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
    color: Colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: Colors.lightText,
  },
  upgradeCard: {
    backgroundColor: "rgba(255, 215, 0, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.2)",
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
    color: Colors.text,
    marginBottom: 4,
  },
  upgradeDescription: {
    fontSize: 14,
    color: Colors.lightText,
    lineHeight: 20,
  },
  upgradeButton: {
    backgroundColor: "#FFD700",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
});