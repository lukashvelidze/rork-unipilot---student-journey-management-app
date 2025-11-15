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
import { supabase } from "@/lib/supabase";

export default function HomeScreen() {
  const router = useRouter();
  const Colors = useColors();
  const { user, setUser } = useUserStore();
  const { journeyProgress, setJourneyProgress } = useJourneyStore();
  
  // Fetch user data from database on mount
  useEffect(() => {
    async function fetchUserData() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;

        // Fetch profile from database
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (profile) {
          // Fetch countries
          const { getCountries } = require("@/lib/supabase");
          const countries = await getCountries();
          
          const homeCountry = profile.country_origin 
            ? (countries.origin.find((c: any) => c.code === profile.country_origin) || {
                code: profile.country_origin,
                name: profile.country_origin,
                flag: "",
              })
            : null;
            
          const destinationCountry = profile.destination_country
            ? (countries.destination.find((c: any) => c.code === profile.destination_country) || {
                code: profile.destination_country,
                name: profile.destination_country,
                flag: "",
              })
            : null;

          // Update user store with database data
          setUser({
            ...user!,
            id: authUser.id,
            name: profile.full_name || "",
            email: profile.email || authUser.email || "",
            homeCountry: homeCountry || user?.homeCountry,
            destinationCountry: destinationCountry || user?.destinationCountry,
            educationBackground: {
              level: (profile.level_of_study as any) || user?.educationBackground?.level || "bachelors",
            },
            onboardingCompleted: !!profile.visa_type,
          });

          // Journey progress is now fetched from Supabase in the journey page
          // No need to initialize here with mock data
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    }

    if (user) {
      fetchUserData();
    }
  }, []);

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
      title: "AI Assistant",
      description: "Get personalized guidance",
      icon: Zap,
      color: Colors.accent,
      onPress: () => router.push("/unipilot-ai"),
    },
  ];
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]} edges={['top']}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.greeting, { color: Colors.lightText }]}>
                Welcome back,
              </Text>
              <Text style={[styles.name, { color: Colors.text }]}>
                {user.name?.split(' ')[0] || user.name}!
              </Text>
            </View>
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
                    <Text style={styles.taskCompletedText}>✓</Text>
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