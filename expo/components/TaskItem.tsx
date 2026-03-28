import React, { useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Platform } from "react-native";
import { CheckCircle2, Circle, Calendar } from "lucide-react-native";
import Colors from "@/constants/colors";

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

  const handleToggle = () => {
    onToggle(id, !completed);
  };

  const formatDueDate = (dateString?: string) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    if (diffDays > 0) return `Due in ${diffDays} days`;
    if (diffDays === -1) return "Due yesterday";
    return `Overdue by ${Math.abs(diffDays)} days`;
  };

  const getDueDateColor = (dateString?: string) => {
    if (!dateString) return Colors.lightText;
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return Colors.error; // Overdue
    if (diffDays <= 1) return Colors.warning; // Due today or tomorrow
    return Colors.lightText; // Future dates
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        completed && styles.completedContainer,
        isPressed && styles.pressedContainer,
      ]}
      onPress={handleToggle}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.checkboxContainer}>
          {completed ? (
            <CheckCircle2 
              size={24} 
              color={accentColor} 
              fill={accentColor}
            />
          ) : (
            <Circle 
              size={24} 
              color={Colors.lightText}
            />
          )}
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
              <Calendar size={12} color={getDueDateColor(dueDate)} />
              <Text 
                style={[
                  styles.dueDate,
                  { color: getDueDateColor(dueDate) }
                ]}
              >
                {formatDueDate(dueDate)}
              </Text>
            </View>
          )}
        </View>
      </View>
      
      {completed && (
        <View style={[styles.completedIndicator, { backgroundColor: accentColor }]} />
      )}
    </TouchableOpacity>
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
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  completedContainer: {
    backgroundColor: Colors.lightBackground,
    opacity: 0.8,
  },
  pressedContainer: {
    transform: [{ scale: 0.98 }],
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text,
    lineHeight: 22,
  },
  completedTitle: {
    textDecorationLine: "line-through",
    color: Colors.lightText,
  },
  dueDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  dueDate: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "500",
  },
  completedIndicator: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
});

export default TaskItem;