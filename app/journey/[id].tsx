import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { CheckSquare, Square, ChevronLeft, Award, Clock, Calendar, Star, Trophy, Sparkles, Target, BookOpen, Plane, GraduationCap, Briefcase, Crown } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import Card from "@/components/Card";
import ProgressBar from "@/components/ProgressBar";
import Button from "@/components/Button";
import { useJourneyStore } from "@/store/journeyStore";
import { useUserStore } from "@/store/userStore";
import { JourneyStage, Task } from "@/types/user";

const stageInfo = {
  research: {
    title: "Research Phase",
    description: "Discover your perfect university and program",
    icon: BookOpen,
    color: "#FF6B6B",
    gradient: ["#FF6B6B", "#FF8E8E"] as const,
  },
  application: {
    title: "Application Phase", 
    description: "Submit compelling applications to your chosen universities",
    icon: Target,
    color: "#4ECDC4",
    gradient: ["#4ECDC4", "#6ED5D0"] as const,
  },
  visa: {
    title: "Visa Process",
    description: "Secure your student visa for studying abroad",
    icon: Plane,
    color: "#45B7D1",
    gradient: ["#45B7D1", "#6BC5D8"] as const,
  },
  pre_departure: {
    title: "Pre-Departure",
    description: "Prepare for your journey to a new country",
    icon: Calendar,
    color: "#96CEB4",
    gradient: ["#96CEB4", "#A8D5C1"] as const,
  },
  arrival: {
    title: "Arrival",
    description: "Settle into your new home and university",
    icon: Star,
    color: "#FFEAA7",
    gradient: ["#FFEAA7", "#FFECB3"] as const,
  },
  academic: {
    title: "Academic Journey",
    description: "Excel in your studies and university life",
    icon: GraduationCap,
    color: "#DDA0DD",
    gradient: ["#DDA0DD", "#E6B3E6"] as const,
  },
  career: {
    title: "Career Development",
    description: "Build your professional future",
    icon: Briefcase,
    color: "#98D8C8",
    gradient: ["#98D8C8", "#A8DDD1"] as const,
  },
};

export default function StageDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const Colors = useColors();
  const { isPremium } = useUserStore();
  const { 
    journeyProgress, 
    updateTaskCompletion, 
    markAcceptance,
    addRecentMilestone 
  } = useJourneyStore();

  const stageId = id as JourneyStage;
  const stage = journeyProgress.find(s => s.stage === stageId);
  const info = stageInfo[stageId];

  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  if (!stage || !info) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]} edges={['top']}>
        <Text style={[styles.errorText, { color: Colors.text }]}>Stage not found</Text>
      </SafeAreaView>
    );
  }

  const handleTaskToggle = (taskId: string, currentCompleted: boolean) => {
    const task = stage.tasks.find(t => t.id === taskId);
    if (!task) return;

    // Check if this is an acceptance task
    if (task.title.includes("🎉 Receive acceptance letter")) {
      Alert.alert(
        "🎉 Congratulations!",
        "You've been accepted! This will unlock additional premium tasks in your journey. Upgrade to Premium to access post-acceptance guidance.",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Mark as Complete", 
            onPress: () => {
              updateTaskCompletion(stageId, taskId, !currentCompleted);
              markAcceptance(stageId);
              
              // Add celebration milestone
              addRecentMilestone({
                type: "stage_complete",
                stage: stageId,
                timestamp: Date.now()
              });
              
              // Show premium upgrade prompt after a short delay
              setTimeout(() => {
                if (!isPremium) {
                  Alert.alert(
                    "🎓 Unlock Your Next Steps",
                    "Congratulations on your acceptance! Upgrade to Premium to access exclusive post-acceptance guidance including visa applications, housing, and pre-departure checklists.",
                    [
                      { text: "Maybe Later", style: "cancel" },
                      { 
                        text: "Upgrade to Premium", 
                        onPress: () => router.push('/premium')
                      }
                    ]
                  );
                }
              }, 1000);
            }
          }
        ]
      );
      return;
    }

    updateTaskCompletion(stageId, taskId, !currentCompleted);
  };

  const toggleTaskExpansion = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const getTaskAdvice = (task: Task): string => {
    const title = task.title.toLowerCase();
    
    if (title.includes("research universities")) {
      return "Use university ranking websites, read student reviews, and check program curricula. Consider factors like location, cost, and career outcomes.";
    }
    if (title.includes("personal statement")) {
      return "Tell your unique story. Explain your motivations, experiences, and goals. Be authentic and specific about why you chose this program.";
    }
    if (title.includes("recommendation letters")) {
      return "Ask professors, employers, or mentors who know you well. Give them at least 4-6 weeks notice and provide your resume and draft personal statement.";
    }
    if (title.includes("standardized tests")) {
      return "Book your test 2-3 months in advance. Use official prep materials and consider taking practice tests. You can retake if needed.";
    }
    if (title.includes("transcripts")) {
      return "Request official transcripts from all institutions you've attended. This can take 2-4 weeks, so plan ahead.";
    }
    if (title.includes("visa")) {
      return "Start the visa process immediately after receiving your acceptance letter. Gather all required documents and book your appointment early.";
    }
    if (title.includes("accommodation")) {
      return "Apply for university housing early as it fills up quickly. Consider location, cost, and amenities. Off-campus options may be cheaper.";
    }
    if (title.includes("flight")) {
      return "Book flights 2-3 months in advance for better prices. Consider arriving a few days before orientation to settle in.";
    }
    
    return "Complete this task to move forward in your journey. Check the requirements carefully and don't hesitate to contact the university if you have questions.";
  };

  const completedTasks = stage.tasks.filter(task => task.completed).length;
  const totalTasks = stage.tasks.length;
  const hasAcceptance = stage.hasAcceptance || stage.tasks.some(t => t.title.includes("🎉 Receive acceptance letter") && t.completed);

  // Filter tasks based on acceptance status and premium status
  const visibleTasks = stage.tasks.filter(task => {
    // For application stage, check acceptance-related tasks
    if (stageId === "application") {
      const isPostAcceptanceTask = task.title.includes("Compare offers") || 
          task.title.includes("Accept offer") || 
          task.title.includes("Decline other offers") ||
          task.title.includes("Request official enrollment") ||
          task.title.includes("Register for orientation") ||
          task.title.includes("Apply for on-campus housing") ||
          task.title.includes("Submit final transcripts");
      
      if (isPostAcceptanceTask) {
        // Only show if user has acceptance AND premium (except for the acceptance task itself)
        return hasAcceptance && (isPremium || task.title.includes("🎉 Receive acceptance letter"));
      }
    }
    
    // For other stages, check if they require premium after acceptance
    if (stageId === "visa" || stageId === "pre_departure" || stageId === "arrival" || stageId === "academic" || stageId === "career") {
      // These stages require premium if user has marked acceptance
      if (hasAcceptance && !isPremium) {
        return false;
      }
    }
    
    return true;
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]} edges={['top']}>
      <Stack.Screen 
        options={{ 
          title: info.title,
          headerStyle: { backgroundColor: Colors.card },
          headerTintColor: Colors.text,
          headerTitleStyle: { fontWeight: '600' },
        }} 
      />
      
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={info.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <info.icon size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.headerTitle}>{info.title}</Text>
            <Text style={styles.headerDescription}>{info.description}</Text>
            
            <View style={styles.progressSection}>
              <ProgressBar progress={stage.progress} height={8} animated={true} />
              <View style={styles.progressStats}>
                <Text style={styles.progressText}>
                  {completedTasks} of {totalTasks} tasks completed
                </Text>
                <Text style={styles.progressPercentage}>{stage.progress}%</Text>
              </View>
            </View>
            
            {stage.completed && (
              <View style={styles.completedBadge}>
                <Trophy size={16} color="#FFFFFF" />
                <Text style={styles.completedText}>Stage Complete!</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </View>

      {/* Tasks List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {hasAcceptance && stageId === "application" && (
          <Card style={[styles.acceptanceCard, { backgroundColor: Colors.lightBackground, borderColor: Colors.success }]}>
            <View style={styles.acceptanceContent}>
              <Sparkles size={24} color={Colors.success} />
              <View style={styles.acceptanceText}>
                <Text style={[styles.acceptanceTitle, { color: Colors.success }]}>
                  🎉 Congratulations on your acceptance!
                </Text>
                <Text style={[styles.acceptanceDescription, { color: Colors.text }]}>
                  New tasks have been unlocked to help you prepare for enrollment.
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Premium Notice for Locked Stages */}
        {(stageId === "visa" || stageId === "pre_departure" || stageId === "arrival" || stageId === "academic" || stageId === "career") && hasAcceptance && !isPremium && (
          <Card style={[styles.premiumNoticeCard, { backgroundColor: Colors.lightBackground, borderColor: Colors.primary }]}>
            <View style={styles.premiumNoticeContent}>
              <Crown size={24} color={Colors.primary} />
              <View style={styles.premiumNoticeText}>
                <Text style={[styles.premiumNoticeTitle, { color: Colors.primary }]}>
                  🎓 Premium Stage Unlocked!
                </Text>
                <Text style={[styles.premiumNoticeDescription, { color: Colors.text }]}>
                  This stage is now available with Premium. Upgrade to access detailed guidance for your next steps.
                </Text>
                <TouchableOpacity
                  style={[styles.upgradeButton, { backgroundColor: Colors.primary }]}
                  onPress={() => router.push('/premium')}
                >
                  <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        )}

        <View style={styles.tasksContainer}>
          {visibleTasks.length === 0 && (stageId === "visa" || stageId === "pre_departure" || stageId === "arrival" || stageId === "academic" || stageId === "career") && hasAcceptance && !isPremium ? (
            <Card style={[styles.emptyStateCard, { backgroundColor: Colors.card }]}>
              <View style={styles.emptyStateContent}>
                <Crown size={48} color={Colors.lightText} />
                <Text style={[styles.emptyStateTitle, { color: Colors.text }]}>Premium Required</Text>
                <Text style={[styles.emptyStateDescription, { color: Colors.lightText }]}>
                  This stage contains premium content. Upgrade to access detailed tasks and guidance.
                </Text>
              </View>
            </Card>
          ) : (
            visibleTasks.map((task, index) => (
              <Card key={task.id} style={[styles.taskCard, { backgroundColor: Colors.card }]}>
                <TouchableOpacity
                  style={styles.taskHeader}
                  onPress={() => handleTaskToggle(task.id, task.completed)}
                  activeOpacity={0.7}
                >
                <View style={styles.taskLeft}>
                  <View style={[styles.taskCheckbox, { borderColor: task.completed ? Colors.success : Colors.border }]}>
                    {task.completed ? (
                      <CheckSquare size={20} color={Colors.success} />
                    ) : (
                      <Square size={20} color={Colors.lightText} />
                    )}
                  </View>
                  <View style={styles.taskContent}>
                    <Text style={[
                      styles.taskTitle, 
                      { color: task.completed ? Colors.lightText : Colors.text },
                      task.completed && styles.taskTitleCompleted
                    ]}>
                      {task.title}
                    </Text>
                    {task.completed && task.completedDate && (
                      <Text style={[styles.taskCompletedDate, { color: Colors.success }]}>
                        Completed on {new Date(task.completedDate).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => toggleTaskExpansion(task.id)}
                  style={styles.expandButton}
                >
                  <Text style={[styles.expandButtonText, { color: Colors.primary }]}>
                    {expandedTasks.has(task.id) ? "Less" : "Help"}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
              
              {expandedTasks.has(task.id) && (
                <View style={[styles.taskAdvice, { backgroundColor: Colors.lightBackground }]}>
                  <Text style={[styles.taskAdviceText, { color: Colors.text }]}>
                    💡 {getTaskAdvice(task)}
                  </Text>
                  {!isPremium && (
                    <TouchableOpacity
                      style={[styles.premiumButton, { backgroundColor: Colors.primary }]}
                      onPress={() => router.push("/premium")}
                    >
                      <Text style={styles.premiumButtonText}>Get Premium Tips</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              </Card>
            ))
          )}
        </View>

        {/* Stage Tips */}
        <Card style={[styles.tipsCard, { backgroundColor: Colors.card }]}>
          <Text style={[styles.tipsTitle, { color: Colors.text }]}>💡 Stage Tips</Text>
          <Text style={[styles.tipsText, { color: Colors.lightText }]}>
            {getStageSpecificTips(stageId)}
          </Text>
          
          {!isPremium && (
            <Button
              title="Unlock Premium Resources"
              onPress={() => router.push("/premium")}
              style={[styles.premiumCTA, { backgroundColor: Colors.primary }]}
            />
          )}
        </Card>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

function getStageSpecificTips(stage: JourneyStage): string {
  switch (stage) {
    case "research":
      return "Start early and cast a wide net. Research at least 8-12 universities to have good options. Consider factors beyond rankings like location, culture, and career services.";
    case "application":
      return "Quality over quantity - focus on creating strong applications for universities that truly fit your goals. Start applications 3-4 months before deadlines.";
    case "visa":
      return "Begin visa process immediately after acceptance. Gather all documents in advance and practice for your interview. Show strong ties to your home country.";
    case "pre_departure":
      return "Create a comprehensive checklist and start preparations 2-3 months early. Research your destination's culture, weather, and local customs.";
    case "arrival":
      return "Attend all orientation sessions and be open to making new friends. Join clubs and activities early to build your social network.";
    case "academic":
      return "Develop good study habits early and don't hesitate to use university resources like tutoring centers and office hours with professors.";
    case "career":
      return "Start career planning early in your studies. Build relationships with professors, join professional organizations, and gain relevant experience through internships.";
    default:
      return "Stay organized and don't hesitate to ask for help when needed. Every step brings you closer to your goals!";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 50,
  },
  header: {
    marginBottom: 8,
  },
  headerGradient: {
    padding: 12,
    paddingTop: 16,
  },
  headerContent: {
    alignItems: "center",
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
    textAlign: "center",
  },
  headerDescription: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: 12,
  },
  progressSection: {
    width: "100%",
    marginBottom: 8,
  },
  progressStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  progressText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  completedText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  acceptanceCard: {
    marginBottom: 16,
    borderWidth: 2,
    borderLeftWidth: 6,
  },
  acceptanceContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  acceptanceText: {
    flex: 1,
    marginLeft: 12,
  },
  acceptanceTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  acceptanceDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  tasksContainer: {
    marginBottom: 24,
  },
  taskCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  taskHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  taskLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  taskCheckbox: {
    marginRight: 12,
    borderWidth: 2,
    borderRadius: 4,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 22,
  },
  taskTitleCompleted: {
    textDecorationLine: "line-through",
  },
  taskCompletedDate: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  expandButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255, 107, 107, 0.1)",
  },
  expandButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  taskAdvice: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
  },
  taskAdviceText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  premiumButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  premiumButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  tipsCard: {
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  tipsText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  premiumCTA: {
    marginTop: 8,
  },
  bottomPadding: {
    height: 32,
  },
  premiumNoticeCard: {
    marginBottom: 16,
    borderWidth: 2,
    borderLeftWidth: 6,
  },
  premiumNoticeContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  premiumNoticeText: {
    flex: 1,
    marginLeft: 12,
  },
  premiumNoticeTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  premiumNoticeDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  upgradeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  upgradeButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyStateCard: {
    padding: 32,
    alignItems: "center",
  },
  emptyStateContent: {
    alignItems: "center",
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateDescription: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});