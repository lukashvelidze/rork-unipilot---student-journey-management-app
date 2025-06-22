import React from "react";
import { StyleSheet, View, Text, TouchableOpacity, Platform } from "react-native";
import { ChevronRight } from "lucide-react-native";
import Colors from "@/constants/colors";
import ProgressBar from "./ProgressBar";
import { JourneyProgress } from "@/types/user";

interface StageProgressProps {
  stage: JourneyProgress;
  onPress?: () => void;
}

const StageProgress: React.FC<StageProgressProps> = ({ stage, onPress }) => {
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

  const completedTasks = stage.tasks.filter((task) => task.completed).length;
  const totalTasks = stage.tasks.length;
  const stageColor = getStageColor(stage.stage);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View
            style={[
              styles.indicator,
              { backgroundColor: stageColor },
            ]}
          />
          <Text style={styles.title}>{getStageTitle(stage.stage)}</Text>
        </View>
        <ChevronRight size={20} color={Colors.lightText} />
      </View>
      
      <View style={styles.progressContainer}>
        <ProgressBar
          progress={stage.progress}
          progressColor={stageColor}
          height={6}
        />
        <Text style={styles.progressText}>
          {completedTasks}/{totalTasks} tasks completed
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  progressContainer: {
    marginTop: 4,
  },
  progressText: {
    fontSize: 14,
    color: Colors.lightText,
    marginTop: 6,
  },
});

export default StageProgress;