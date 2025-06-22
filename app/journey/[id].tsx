import React from "react";
import { StyleSheet, View, Text, FlatList } from "react-native";
import { useLocalSearchParams } from "expo-router";
import Colors from "@/constants/colors";
import TaskItem from "@/components/TaskItem";
import ProgressBar from "@/components/ProgressBar";
import { useJourneyStore } from "@/store/journeyStore";
import { JourneyStage } from "@/types/user";

export default function JourneyStageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { journeyProgress, updateTask } = useJourneyStore();
  
  const stage = journeyProgress.find((s) => s.stage === id);
  
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
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{getStageTitle(stage.stage)}</Text>
        <Text style={styles.description}>{getStageDescription(stage.stage)}</Text>
        
        <View style={styles.progressContainer}>
          <ProgressBar
            progress={stage.progress}
            progressColor={getStageColor(stage.stage)}
            height={8}
          />
          <Text style={styles.progressText}>
            {stage.progress}% Complete
          </Text>
        </View>
      </View>
      
      <View style={styles.tasksContainer}>
        <Text style={styles.tasksTitle}>Tasks</Text>
        
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
            />
          )}
          contentContainerStyle={styles.tasksList}
        />
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.lightText,
    lineHeight: 20,
    marginBottom: 16,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 14,
    color: Colors.lightText,
    marginTop: 6,
    textAlign: "right",
  },
  tasksContainer: {
    flex: 1,
    padding: 16,
  },
  tasksTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 16,
  },
  tasksList: {
    paddingBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: "center",
    marginTop: 24,
  },
});