import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { CheckCircle, Circle, Calendar, Award, RefreshCw } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import Card from "@/components/Card";
import ProgressBar from "@/components/ProgressBar";
import TaskItem from "@/components/TaskItem";
import { useJourneyStore } from "@/store/journeyStore";
import { useUserStore } from "@/store/userStore";
import { JourneyStage } from "@/types/user";

export default function StageDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const Colors = useColors();
  const { journeyProgress, updateTaskCompletion, addRecentMilestone, lastUpdated, refreshJourney } = useJourneyStore();
  const { user } = useUserStore();
  
  const stageId = id as JourneyStage;
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Get the current stage data
  const stage = journeyProgress.find(s => s.stage === stageId);
  
  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log("Stage detail screen focused, refreshing data");
      refreshJourney();
    }, [refreshJourney])
  );
  
  // Listen for changes in journey progress
  useEffect(() => {
    console.log("Journey progress updated, lastUpdated:", lastUpdated);
  }, [lastUpdated, journeyProgress]);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Force refresh the journey data
      refreshJourney();
      console.log("Manual refresh completed");
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  if (!stage) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: Colors.background }]}>
        <Text style={[styles.errorText, { color: Colors.lightText }]}>Stage not found</Text>
        <TouchableOpacity 
          style={[styles.refreshButton, { backgroundColor: Colors.primary }]}
          onPress={handleRefresh}
        >
          <RefreshCw size={16} color={Colors.white} />
          <Text style={[styles.refreshButtonText, { color: Colors.white }]}>Refresh</Text>
        </TouchableOpacity>
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

  const getStageColor = (stageId: string): string => {
    const colors: Record<string, string> = {
      research: "#4A90E2",
      application: "#9C27B0", 
      visa: "#4CAF50",
      pre_departure: "#FF9800",
      arrival: "#E91E63",
      academic: "#3F51B5",
      career: "#009688",
    };
    
    return colors[stageId] || Colors.primary;
  };

  const handleTaskToggle = (taskId: string, completed: boolean) => {
    updateTaskCompletion(stageId, taskId, completed);
    
    // Check if this completion triggers a milestone
    const updatedStage = journeyProgress.find(s => s.stage === stageId);
    if (updatedStage) {
      const completedTasks = updatedStage.tasks.filter(task => task.completed).length;
      const totalTasks = updatedStage.tasks.length;
      const newProgress = Math.round((completedTasks / totalTasks) * 100);
      
      // Trigger celebration for significant milestones
      if (completed && (newProgress === 100 || newProgress % 25 === 0)) {
        addRecentMilestone({
          type: newProgress === 100 ? "stage_complete" : "progress_milestone",
          stage: stageId,
          progress: newProgress,
          timestamp: Date.now(),
        });
        
        if (newProgress === 100) {
          Alert.alert(
            "🎉 Stage Complete!",
            `Congratulations! You have completed the ${getStageTitle(stageId)} stage.`,
            [{ text: "Continue", onPress: () => router.back() }]
          );
        }
      }
    }
  };

  const completedTasks = stage.tasks.filter(task => task.completed).length;
  const totalTasks = stage.tasks.length;
  const stageColor = getStageColor(stageId);
  
  return (
    <ScrollView style={[styles.container, { backgroundColor: Colors.background }]} contentContainerStyle={styles.content}>
      <Card style={[styles.headerCard, { backgroundColor: Colors.card }]}>
        <View style={styles.stageHeader}>
          <View style={[styles.stageIndicator, { backgroundColor: stageColor }]} />
          <View style={styles.stageInfo}>
            <Text style={[styles.stageTitle, { color: Colors.text }]}>{getStageTitle(stageId)}</Text>
            <Text style={[styles.stageSubtitle, { color: Colors.lightText }]}>
              {completedTasks} of {totalTasks} tasks completed
            </Text>
            {user?.destinationCountry && (
              <Text style={[styles.countryInfo, { color: Colors.lightText }]}>
                Customized for {user.destinationCountry.flag} {user.destinationCountry.name}
              </Text>
            )}
          </View>
          {stage.completed && (
            <View style={[styles.completedBadge, { backgroundColor: Colors.successBackground }]}>
              <CheckCircle size={20} color={Colors.success} />
              <Text style={[styles.completedText, { color: Colors.success }]}>Completed</Text>
            </View>
          )}
        </View>
        
        <View style={styles.progressSection}>
          <ProgressBar
            progress={stage.progress}
            progressColor={stageColor}
            height={8}
            backgroundColor={`${stageColor}20`}
            animated={true}
          />
          <View style={styles.progressTextRow}>
            <Text style={[styles.progressLabel, { color: Colors.lightText }]}>Progress</Text>
            <Text style={[styles.progressPercent, { color: stageColor }]}>
              {stage.progress}%
            </Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={[styles.refreshButton, { backgroundColor: Colors.lightBackground }]}
          onPress={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw size={16} color={Colors.primary} />
          <Text style={[styles.refreshButtonText, { color: Colors.primary }]}>
            {isRefreshing ? "Refreshing..." : "Refresh Tasks"}
          </Text>
        </TouchableOpacity>
      </Card>
      
      <Card style={[styles.tasksCard, { backgroundColor: Colors.card }]}>
        <View style={styles.tasksHeader}>
          <Text style={[styles.tasksTitle, { color: Colors.text }]}>Tasks</Text>
          <View style={[styles.tasksStats, { backgroundColor: Colors.lightBackground }]}>
            <Text style={[styles.tasksStatsText, { color: Colors.primary }]}>
              {completedTasks}/{totalTasks}
            </Text>
          </View>
        </View>
        
        <View style={styles.tasksList}>
          {stage.tasks.map((task) => (
            <TaskItem
              key={task.id}
              id={task.id}
              title={task.title}
              completed={task.completed}
              dueDate={task.dueDate}
              onToggle={handleTaskToggle}
              accentColor={stageColor}
            />
          ))}
        </View>
      </Card>
      
      {stage.completed && (
        <Card style={[styles.congratsCard, { backgroundColor: Colors.successBackground, borderColor: Colors.success }]}>
          <View style={styles.congratsContent}>
            <Award size={32} color={Colors.success} />
            <Text style={[styles.congratsTitle, { color: Colors.success }]}>Stage Completed!</Text>
            <Text style={[styles.congratsText, { color: Colors.text }]}>
              Great job completing the {getStageTitle(stageId)} stage. You are one step closer to your study abroad goals!
            </Text>
          </View>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  headerCard: {
    marginBottom: 16,
  },
  stageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  stageIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  stageInfo: {
    flex: 1,
  },
  stageTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  stageSubtitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  countryInfo: {
    fontSize: 12,
    fontStyle: "italic",
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  completedText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  progressSection: {
    marginTop: 8,
  },
  progressTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 14,
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: "700",
  },
  tasksCard: {
    marginBottom: 16,
  },
  tasksHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  tasksTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  tasksStats: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tasksStatsText: {
    fontSize: 14,
    fontWeight: "600",
  },
  tasksList: {
    gap: 8,
  },
  congratsCard: {
    borderWidth: 1,
  },
  congratsContent: {
    alignItems: "center",
    padding: 8,
  },
  congratsTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 8,
  },
  congratsText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});