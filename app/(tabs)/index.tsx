import React, { useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Award, TrendingUp, BookOpen, Users } from "lucide-react-native";
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
      setJourneyProgress(initialJourneyProgress);
    }
  }, [user, journeyProgress.length, setJourneyProgress]);
  
  if (!user) {
    router.replace("/onboarding");
    return null;
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
      title: "Continue Journey",
      description: `${currentStage?.stage.replace('_', ' ').toUpperCase()} stage`,
      icon: TrendingUp,
      color: Colors.primary,
      onPress: () => router.push("/journey"),
    },
    {
      title: "View Documents",
      description: "Manage your documents",
      icon: BookOpen,
      color: Colors.secondary,
      onPress: () => router.push("/documents"),
    },
    {
      title: "Join Community",
      description: "Connect with others",
      icon: Users,
      color: Colors.accent,
      onPress: () => router.push("/community"),
    },
  ];
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.name}>{user.name}!</Text>
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
          onPress={() => router.push("/journey")}
        >
          <Text style={styles.viewJourneyText}>View Full Journey</Text>
        </TouchableOpacity>
      </Card>
      
      {upcomingTasks.length > 0 && (
        <Card style={styles.tasksCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Tasks</Text>
            <TouchableOpacity onPress={() => router.push(`/journey/${currentStage?.stage}`)}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {upcomingTasks.map((task, index) => (
            <View key={task.id} style={styles.taskItem}>
              <View style={styles.taskIndicator} />
              <Text style={styles.taskTitle}>{task.title}</Text>
            </View>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
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
    paddingVertical: 8,
  },
  taskIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginRight: 12,
  },
  taskTitle: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
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
});