import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { CheckCircle, Circle, Calendar } from "lucide-react-native";
import Colors from "@/constants/colors";
import { formatDate, getDaysRemaining } from "@/utils/dateUtils";

interface TaskItemProps {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  onToggle: (id: string, completed: boolean) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({
  id,
  title,
  completed,
  dueDate,
  onToggle,
}) => {
  const isOverdue = dueDate ? getDaysRemaining(dueDate) < 0 : false;
  const isDueSoon = dueDate ? getDaysRemaining(dueDate) <= 7 && getDaysRemaining(dueDate) >= 0 : false;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => onToggle(id, !completed)}
        activeOpacity={0.7}
      >
        {completed ? (
          <CheckCircle size={24} color={Colors.primary} />
        ) : (
          <Circle size={24} color={Colors.primary} />
        )}
      </TouchableOpacity>
      
      <View style={styles.contentContainer}>
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
            <Calendar size={14} color={Colors.lightText} style={styles.calendarIcon} />
            <Text
              style={[
                styles.dueDate,
                isOverdue && !completed && styles.overdue,
                isDueSoon && !completed && styles.dueSoon,
              ]}
            >
              {isOverdue && !completed
                ? "Overdue: "
                : isDueSoon && !completed
                ? "Due soon: "
                : "Due: "}
              {formatDate(dueDate)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  checkbox: {
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
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
  calendarIcon: {
    marginRight: 4,
  },
  dueDate: {
    fontSize: 14,
    color: Colors.lightText,
  },
  overdue: {
    color: Colors.error,
  },
  dueSoon: {
    color: Colors.warning,
  },
});

export default TaskItem;