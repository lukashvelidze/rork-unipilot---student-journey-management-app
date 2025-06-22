import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Animated } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Award, CheckCircle2 } from "lucide-react-native";
import Colors from "@/constants/colors";
import TaskItem from "@/components/TaskItem";
import ProgressBar from "@/components/ProgressBar";
import QuoteCard from "@/components/QuoteCard";
import CelebrationAnimation from "@/components/CelebrationAnimation";
import { useJourneyStore } from "@/store/journeyStore";
import { JourneyStage } from "@/types/user";
import { getStageQuote } from "@/mocks/quotes";

export default function JourneyStageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { journeyProgress, updateTask, recentMilestone, clearRecentMilestone } = useJourneyStore();
  const [showCelebration, setShowCelebration] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.95));
  
  const stage = journeyProgress.find((s) => s.stage === id);
  
  // Get a quote specific to this stage
  const stageQuote = getStageQuote(id as JourneyStage);
  
  // Fade in animation for the content
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  }, [fadeAnim, scaleAnim]);
  
  // Show celebration animation when a milestone is reached
  useEffect(() => {
    if (recentMilestone && recentMilestone.stageId === id) {
      setShowCelebration(true);
      
      // Clear the milestone after showing celebration
      const timer = setTimeout(() => {
        clearRecentMilestone();
      }, 3500);
      
      return () => clearTimeout(timer);
    }
  }, [recentMilestone, clearRecentMilestone, id]);
  
  if (!stage) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Stage not found</Text>
      </View>
    );
  }
  
  const getStageTitle = (stageId: string): string => {
    const titles: Record<string, string> = {
      research: "University Research",
      application: "Application Process",
      visa: "Visa Application",
      pre_departure: "Pre-Departure",
      arrival: "Arrival & Orientation",
      academic: "Academic Program",
      career: "Career Development",
    };
    
    return titles[stageId] || stageId.replace("_", " ");
  };
  
  const getStageDescription = (stageId: string): string => {
    const descriptions: Record<string, string> = {
      research: "Research potential universities, compare programs, and create a shortlist based on your preferences and requirements.",
      application: "Prepare and submit applications to your chosen universities, including all required documents and fees.",
      visa: "Apply for your student visa, prepare for the interview, and gather all necessary documentation.",
      pre_departure: "Book flights, arrange accommodation, get health insurance, and prepare for your journey abroad.",
      arrival: "Navigate immigration, settle into your accommodation, attend orientation, and explore your new campus.",
      academic: "Register for classes, purchase materials, attend lectures, and engage with academic resources.",
      career: "Prepare for post-graduation opportunities, apply for internships, and explore visa options for work.",
    };
    
    return descriptions[stageId] || "";
  };
  
  const getStageColor = (stageId: string): string => {
    const colors: Record<string, string> = {
      research: "#4A90E2", // Blue
      application: "#9C27B0", // Purple
      visa: "#4CAF50", // Green
      pre_departure: "#FF9800", // Orange
      arrival: "#E91E63", // Pink
      academic: "#3F51B5", // Indigo
      career: "#009688", // Teal
    };
    
    return colors[stageId] || Colors.primary;
  };
  
  const handleTaskToggle = (taskId: string, completed: boolean) => {
    updateTask(id as JourneyStage, taskId, completed);
  };
  
  const completedTasks = stage.tasks.filter(task => task.completed).length;
  const totalTasks = stage.tasks.length;
  const stageColor = getStageColor(stage.stage);
  
  return (
    <View style={styles.container}>
      {showCelebration && (
        <CelebrationAnimation 
          visible={showCelebration} 
          type={recentMilestone?.type || "confetti"}
          onAnimationFinish={() => setShowCelebration(false)}
        />
      )}
      
      <Animated.View 
        style={[
          styles.header,
          { 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            backgroundColor: `${stageColor}10` // 10% opacity of the stage color
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{getStageTitle(stage.stage)}</Text>
            <View style={[styles.stageBadge, { backgroundColor: stageColor }]}>
              <Text style={styles.stageNumber}>Stage {journeyProgress.findIndex(s => s.stage === stage.stage) + 1}</Text>
            </View>
          </View>
          
          <Text style={styles.description}>{getStageDescription(stage.stage)}</Text>
          
          <View style={styles.progressContainer}>
            <ProgressBar
              progress={stage.progress}
              progressColor={stageColor}
              height={8}
              backgroundColor={`${stageColor}30`}
            />
            <View style={styles.progressTextContainer}>
              <Text style={styles.progressLabel}>
                {completedTasks}/{totalTasks} tasks completed
              </Text>
              <Text style={[styles.progressText, { color: stageColor }]}>
                {stage.progress}% Complete
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
      
      <View style={styles.content}>
        <QuoteCard 
          quote={stageQuote.text} 
          author={stageQuote.author} 
          variant="minimal"
        />
        
        <View style={styles.tasksContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.tasksTitle}>Tasks</Text>
            {completedTasks > 0 && (
              <View style={styles.completedBadge}>
                <CheckCircle2 size={14} color={Colors.success} />
                <Text style={styles.completedText}>{completedTasks} completed</Text>
              </View>
            )}
          </View>
          
          <FlatList
            data={stage.tasks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TaskItem
                id={item.id}
                title={item.title}
                completed={item.completed}
                dueDate={item.dueDate}
                onToggle={handleTaskToggle}
                accentColor={stageColor}
              />
            )}
            contentContainerStyle={styles.tasksList}
            showsVerticalScrollIndicator={false}
          />
        </View>
        
        {stage.progress === 100 && (
          <View style={styles.completionContainer}>
            <View style={[styles.completionBadge, { backgroundColor: `${stageColor}20` }]}>
              <Award size={24} color={stageColor} />
              <Text style={[styles.completionText, { color: stageColor }]}>
                Stage Completed!
              </Text>
            </View>
            <Text style={styles.nextStageText}>
              Great job! You've completed all tasks in this stage.
            </Text>
          </View>
        )}
      </View>
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
    paddingTop: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    paddingHorizontal: 4,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    flex: 1,
  },
  stageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  stageNumber: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  description: {
    fontSize: 14,
    color: Colors.lightText,
    lineHeight: 22,
    marginBottom: 20,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressTextContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: Colors.lightText,
  },
  progressText: {
    fontSize: 16,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  tasksContainer: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  tasksTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.lightBackground,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  completedText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: "500",
    marginLeft: 4,
  },
  tasksList: {
    paddingBottom: 24,
  },
  completionContainer: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 24,
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  completionBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  completionText: {
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  nextStageText: {
    fontSize: 14,
    color: Colors.lightText,
    textAlign: "center",
    lineHeight: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: "center",
    marginTop: 24,
  },
});