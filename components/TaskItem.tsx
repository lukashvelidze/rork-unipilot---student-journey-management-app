import React, { useState, useRef } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Animated, Platform } from "react-native";
import { CheckCircle, Calendar } from "lucide-react-native";
import Colors from "@/constants/colors";
import Theme from "@/constants/theme";

interface TaskItemProps {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  onToggle: (id: string, completed: boolean) => void;
  accentColor?: string;
}

const TaskItem: React.FC<TaskItemProps> = ({
  id,
  title,
  completed,
  dueDate,
  onToggle,
  accentColor = Colors.primary,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const checkAnim = useRef(new Animated.Value(completed ? 1 : 0)).current;
  
  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      friction: 5,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };
  
  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };
  
  const handleToggle = () => {
    // Animate the check
    Animated.timing(checkAnim, {
      toValue: completed ? 0 : 1,
      duration: 300,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
    
    onToggle(id, !completed);
  };
  
  const checkScale = checkAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 1.2, 1],
  });
  
  const checkOpacity = checkAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.5, 1],
  });
  
  // Use conditional rendering for web platform
  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: completed ? `${accentColor}10` : Colors.white,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.touchable}
          onPress={handleToggle}
          activeOpacity={0.8}
        >
          <View style={styles.content}>
            <View
              style={[
                styles.checkContainer,
                {
                  backgroundColor: completed ? accentColor : "transparent",
                  borderColor: completed ? accentColor : Colors.border,
                },
              ]}
            >
              <CheckCircle
                size={20}
                color={completed ? Colors.white : "transparent"}
                fill={completed ? Colors.white : "transparent"}
              />
            </View>
            
            <View style={styles.textContainer}>
              <Text
                style={[
                  styles.title,
                  completed && styles.completedTitle,
                ]}
              >
                {title}
              </Text>
              
              {dueDate && (
                <View style={styles.dueDateContainer}>
                  <Calendar size={12} color={Colors.lightText} />
                  <Text style={styles.dueDate}>{dueDate}</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Native platforms with animations
  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
          backgroundColor: completed ? `${accentColor}10` : Colors.white,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.touchable}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handleToggle}
        activeOpacity={0.8}
      >
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.checkContainer,
              {
                transform: [{ scale: checkScale }],
                backgroundColor: completed ? accentColor : "transparent",
                borderColor: completed ? accentColor : Colors.border,
              },
            ]}
          >
            <Animated.View style={{ opacity: checkOpacity }}>
              <CheckCircle
                size={20}
                color={completed ? Colors.white : "transparent"}
                fill={completed ? Colors.white : "transparent"}
              />
            </Animated.View>
          </Animated.View>
          
          <View style={styles.textContainer}>
            <Text
              style={[
                styles.title,
                completed && styles.completedTitle,
              ]}
            >
              {title}
            </Text>
            
            {dueDate && (
              <View style={styles.dueDateContainer}>
                <Calendar size={12} color={Colors.lightText} />
                <Text style={styles.dueDate}>{dueDate}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: Theme.borderRadius.m,
    marginBottom: Theme.spacing.m,
    ...Theme.shadow.small,
  },
  touchable: {
    padding: Theme.spacing.m,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Theme.spacing.m,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: Theme.fontSize.m,
    color: Colors.text,
    marginBottom: 4,
  },
  completedTitle: {
    textDecorationLine: "line-through",
    color: Colors.lightText,
  },
  dueDateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dueDate: {
    fontSize: Theme.fontSize.xs,
    color: Colors.lightText,
    marginLeft: 4,
  },
});

export default TaskItem;