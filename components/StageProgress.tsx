import React, { useRef, useEffect } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Platform, Animated } from "react-native";
import { ChevronRight, CheckCircle, Lock } from "lucide-react-native";
import Colors from "@/constants/colors";
import ProgressBar from "./ProgressBar";
import { JourneyProgress } from "@/types/user";

interface StageProgressProps {
  stage: JourneyProgress;
  onPress?: () => void;
  isLocked?: boolean;
}

const StageProgress: React.FC<StageProgressProps> = ({ stage, onPress, isLocked = false }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.9)).current;
  
  useEffect(() => {
    // Subtle breathing animation for the card
    const breathingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.9,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    
    if (stage.progress > 0 && stage.progress < 100) {
      breathingAnimation.start();
    }
    
    return () => {
      breathingAnimation.stop();
    };
  }, [stage.progress, opacityAnim]);
  
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };
  
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
  
  // Determine card style based on completion status
  const getCardStyle = () => {
    if (isLocked) {
      return [
        styles.container,
        styles.lockedContainer,
        { borderLeftColor: Colors.lightText }
      ];
    }
    
    if (stage.completed) {
      return [
        styles.container, 
        styles.completedContainer,
        { borderColor: stageColor }
      ];
    }
    
    if (stage.progress > 0) {
      return [
        styles.container, 
        styles.activeContainer,
        { borderLeftColor: stageColor }
      ];
    }
    
    return styles.container;
  };

  return (
    <Animated.View
      style={[
        getCardStyle(),
        {
          transform: [{ scale: scaleAnim }],
          opacity: stage.completed ? 1 : opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.touchable}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <View
              style={[
                styles.indicator,
                { backgroundColor: isLocked ? Colors.lightText : stageColor },
              ]}
            />
            <Text style={[styles.title, isLocked && { color: Colors.lightText }]}>
              {isLocked ? "🔒 " : ""}{stage.title || getStageTitle(stage.stage)}
            </Text>
            
            {isLocked ? (
              <View style={[styles.completedBadge, { backgroundColor: Colors.lightBackground }]}>
                <Lock size={14} color={Colors.lightText} />
                <Text style={[styles.completedText, { color: Colors.lightText }]}>Premium</Text>
              </View>
            ) : stage.completed && (
              <View style={styles.completedBadge}>
                <CheckCircle size={14} color={Colors.success} fill={Colors.success} />
                <Text style={styles.completedText}>Completed</Text>
              </View>
            )}
          </View>
          <ChevronRight size={20} color={Colors.lightText} />
        </View>
        
        <View style={styles.progressContainer}>
          <ProgressBar
            progress={isLocked ? 0 : stage.progress}
            progressColor={isLocked ? Colors.lightText : stageColor}
            height={6}
            backgroundColor={`${isLocked ? Colors.lightText : stageColor}20`}
          />
          <View style={styles.progressTextRow}>
            <Text style={styles.progressText}>
              {isLocked ? "Premium required" : `${completedTasks}/${totalTasks} tasks`}
            </Text>
            <Text style={[styles.progressPercent, { color: isLocked ? Colors.lightText : stageColor }]}>
              {isLocked ? "🔒" : `${stage.progress}%`}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  activeContainer: {
    borderLeftWidth: 4,
  },
  completedContainer: {
    borderWidth: 1,
    borderStyle: "dashed",
  },
  lockedContainer: {
    borderLeftWidth: 4,
    opacity: 0.7,
  },
  touchable: {
    padding: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
    flex: 1,
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  completedText: {
    fontSize: 10,
    color: Colors.success,
    fontWeight: "600",
    marginLeft: 4,
  },
  progressContainer: {
    marginTop: 6,
  },
  progressTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  progressText: {
    fontSize: 13,
    color: Colors.lightText,
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: "700",
  },
});

export default StageProgress;
