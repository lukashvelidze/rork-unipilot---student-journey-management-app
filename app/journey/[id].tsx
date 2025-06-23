import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CheckCircle, Circle, Calendar, Award } from "lucide-react-native";
import Colors from "@/constants/colors";
import Card from "@/components/Card";
import ProgressBar from "@/components/ProgressBar";
import TaskItem from "@/components/TaskItem";
import { useJourneyStore } from "@/store/journeyStore";
import { JourneyStage } from "@/types/user";

export default function StageDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { journeyProgress, updateTaskCompletion, addRecentMilestone } = useJourneyStore();
  
  const stageId = id as JourneyStage;
  const stage = journeyProgress.find(s => s.stage === stageId);
  
  if (!stage) {
    return (
      <View style={styles.errorContainer}>
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.headerCard}>
        <View style={styles.stageHeader}>
          <View style={[styles.stageIndicator, { backgroundColor: stageColor }]} />
          <View style={styles.stageInfo}>
            <Text style={styles.stageTitle}>{getStageTitle(stageId)}</Text>
            <Text style={styles.stageSubtitle}>
              {completedTasks} of {totalTasks} tasks completed
            </Text>
          </View>
          {stage.completed && (
            <View style={styles.completedBadge}>
              <CheckCircle size={20} color={Colors.success} />
              <Text style={styles.completedText}>Completed</Text>
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
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={[styles.progressPercent, { color: stageColor }]}>
              {stage.progress}%
            </Text>
          </View>
        </View>
      </Card>
      
      <Card style={styles.tasksCard}>
        <View style={styles.tasksHeader}>
          <Text style={styles.tasksTitle}>Tasks</Text>
          <View style={styles.tasksStats}>
            <Text style={styles.tasksStatsText}>
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
        <Card style={styles.congratsCard}>
          <View style={styles.congratsContent}>
            <Award size={32} color={Colors.success} />
            <Text style={styles.congratsTitle}>Stage Completed!</Text>
            <Text style={styles.congratsText}>
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
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  errorText: {
    fontSize: 16,
    color: Colors.lightText,
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
    color: Colors.text,
    marginBottom: 4,
  },
  stageSubtitle: {
    fontSize: 14,
    color: Colors.lightText,
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  completedText: {
    fontSize: 12,
    color: Colors.success,
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
    color: Colors.lightText,
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
    color: Colors.text,
  },
  tasksStats: {
    backgroundColor: Colors.lightBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tasksStatsText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
  tasksList: {
    gap: 8,
  },
  congratsCard: {
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  congratsContent: {
    alignItems: "center",
    padding: 8,
  },
  congratsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.success,
    marginTop: 12,
    marginBottom: 8,
  },
  congratsText: {
    fontSize: 14,
    color: Colors.text,
    textAlign: "center",
    lineHeight: 20,
  },
});