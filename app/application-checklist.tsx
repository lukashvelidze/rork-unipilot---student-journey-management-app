import React, { useState } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { CheckSquare, Square, Clock, AlertCircle, Star, Trophy, ChevronDown, ChevronUp, Filter, Target } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { useUserStore } from "@/store/userStore";
import { universityApplicationChecklist, getTasksByCategory, ApplicationTask } from "@/mocks/applicationChecklist";

export default function ApplicationChecklistScreen() {
  const router = useRouter();
  const Colors = useColors();
  const { isPremium } = useUserStore();
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [hasAcceptance, setHasAcceptance] = useState(false);

  const categories = [
    { key: "all", title: "All Tasks", count: universityApplicationChecklist.length },
    { key: "pre_application", title: "Pre-Application", count: getTasksByCategory("pre_application").length },
    { key: "application", title: "Application", count: getTasksByCategory("application").length },
    { key: "post_application", title: "Post-Application", count: getTasksByCategory("post_application").length },
    { key: "acceptance", title: "After Acceptance", count: getTasksByCategory("acceptance").length },
  ];

  const filteredTasks = selectedCategory === "all" 
    ? universityApplicationChecklist 
    : getTasksByCategory(selectedCategory as ApplicationTask['category']);

  const visibleTasks = filteredTasks.filter(task => 
    !task.requiresAcceptance || hasAcceptance || task.id === "receive-acceptance"
  );

  const handleTaskToggle = (taskId: string) => {
    const task = universityApplicationChecklist.find(t => t.id === taskId);
    if (!task) return;

    if (task.id === "receive-acceptance") {
      Alert.alert(
        "🎉 Congratulations!",
        "Mark this as complete when you receive your first acceptance letter. This will unlock additional tasks to help you prepare for enrollment.",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Mark Complete", 
            onPress: () => {
              const newCompleted = new Set(completedTasks);
              newCompleted.add(taskId);
              setCompletedTasks(newCompleted);
              setHasAcceptance(true);
              Alert.alert("Success!", "Acceptance tasks have been unlocked!");
            }
          }
        ]
      );
      return;
    }

    const newCompleted = new Set(completedTasks);
    if (completedTasks.has(taskId)) {
      newCompleted.delete(taskId);
    } else {
      newCompleted.add(taskId);
    }
    setCompletedTasks(newCompleted);
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

  const getPriorityColor = (priority: ApplicationTask['priority']) => {
    switch (priority) {
      case "high": return Colors.error;
      case "medium": return Colors.warning;
      case "low": return Colors.success;
      default: return Colors.lightText;
    }
  };

  const completedCount = visibleTasks.filter(task => completedTasks.has(task.id)).length;
  const progressPercentage = visibleTasks.length > 0 ? Math.round((completedCount / visibleTasks.length) * 100) : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]} edges={['top']}>
      <Stack.Screen 
        options={{ 
          title: "Application Checklist",
          headerStyle: { backgroundColor: Colors.card },
          headerTintColor: Colors.text,
          headerTitleStyle: { fontWeight: '600' },
        }} 
      />

      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={["#667eea", "#764ba2"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <Target size={32} color="#FFFFFF" />
            <Text style={styles.headerTitle}>University Application Checklist</Text>
            <Text style={styles.headerSubtitle}>
              Complete guide to university applications
            </Text>
            
            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${progressPercentage}%`, backgroundColor: "#FFFFFF" }
                  ]} 
                />
              </View>
              <View style={styles.progressStats}>
                <Text style={styles.progressText}>
                  {completedCount} of {visibleTasks.length} tasks completed
                </Text>
                <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
              </View>
            </View>
            
            {progressPercentage === 100 && (
              <View style={styles.completedBadge}>
                <Trophy size={16} color="#FFFFFF" />
                <Text style={styles.completedText}>All Tasks Complete!</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </View>

      {/* Category Filter */}
      <View style={[styles.categoryFilter, { backgroundColor: Colors.card }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.categoryButton,
                selectedCategory === category.key && { backgroundColor: Colors.primary },
                { borderColor: Colors.border }
              ]}
              onPress={() => setSelectedCategory(category.key)}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  { color: selectedCategory === category.key ? Colors.white : Colors.text }
                ]}
              >
                {category.title}
              </Text>
              <View style={[
                styles.categoryCount,
                selectedCategory === category.key 
                  ? { backgroundColor: "rgba(255, 255, 255, 0.2)" }
                  : { backgroundColor: Colors.lightBackground }
              ]}>
                <Text style={[
                  styles.categoryCountText,
                  { color: selectedCategory === category.key ? Colors.white : Colors.text }
                ]}>
                  {category.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Acceptance Notice */}
      {!hasAcceptance && selectedCategory === "acceptance" && (
        <Card style={[styles.noticeCard, { backgroundColor: Colors.lightBackground, borderColor: Colors.warning }]}>
          <View style={styles.noticeContent}>
            <AlertCircle size={20} color={Colors.warning} />
            <Text style={[styles.noticeText, { color: Colors.text }]}>
              These tasks will be unlocked after you mark "Receive Acceptance Letter" as complete.
            </Text>
          </View>
        </Card>
      )}

      {/* Tasks List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.tasksContainer}>
          {visibleTasks.map((task, index) => (
            <Card key={task.id} style={[styles.taskCard, { backgroundColor: Colors.card }]}>
              <TouchableOpacity
                style={styles.taskHeader}
                onPress={() => handleTaskToggle(task.id)}
                activeOpacity={0.7}
              >
                <View style={styles.taskLeft}>
                  <View style={[styles.taskCheckbox, { borderColor: completedTasks.has(task.id) ? Colors.success : Colors.border }]}>
                    {completedTasks.has(task.id) ? (
                      <CheckSquare size={20} color={Colors.success} />
                    ) : (
                      <Square size={20} color={Colors.lightText} />
                    )}
                  </View>
                  <View style={styles.taskContent}>
                    <View style={styles.taskTitleRow}>
                      <Text style={[
                        styles.taskTitle, 
                        { color: completedTasks.has(task.id) ? Colors.lightText : Colors.text },
                        completedTasks.has(task.id) && styles.taskTitleCompleted
                      ]}>
                        {task.title}
                      </Text>
                      <View style={styles.taskMeta}>
                        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) + "20" }]}>
                          <Text style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}>
                            {task.priority.toUpperCase()}
                          </Text>
                        </View>
                        <View style={[styles.timeBadge, { backgroundColor: Colors.lightBackground }]}>
                          <Clock size={12} color={Colors.lightText} />
                          <Text style={[styles.timeText, { color: Colors.lightText }]}>
                            {task.estimatedTime}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Text style={[styles.taskDescription, { color: Colors.lightText }]}>
                      {task.description}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => toggleTaskExpansion(task.id)}
                  style={styles.expandButton}
                >
                  {expandedTasks.has(task.id) ? (
                    <ChevronUp size={20} color={Colors.primary} />
                  ) : (
                    <ChevronDown size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              </TouchableOpacity>
              
              {expandedTasks.has(task.id) && (
                <View style={[styles.taskDetails, { backgroundColor: Colors.lightBackground }]}>
                  {/* Tips */}
                  <View style={styles.tipsSection}>
                    <Text style={[styles.sectionTitle, { color: Colors.text }]}>💡 Tips</Text>
                    {task.tips.map((tip, tipIndex) => (
                      <View key={tipIndex} style={styles.tipItem}>
                        <Text style={[styles.tipBullet, { color: Colors.primary }]}>•</Text>
                        <Text style={[styles.tipText, { color: Colors.text }]}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                  
                  {/* Resources */}
                  {task.resources && task.resources.length > 0 && (
                    <View style={styles.resourcesSection}>
                      <Text style={[styles.sectionTitle, { color: Colors.text }]}>📚 Resources</Text>
                      {task.resources.map((resource, resourceIndex) => (
                        <View key={resourceIndex} style={styles.resourceItem}>
                          <Text style={[styles.resourceBullet, { color: Colors.secondary }]}>•</Text>
                          <Text style={[styles.resourceText, { color: Colors.text }]}>{resource}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  
                  {!isPremium && (
                    <TouchableOpacity
                      style={[styles.premiumButton, { backgroundColor: Colors.primary }]}
                      onPress={() => router.push("/(tabs)/community")}
                    >
                      <Star size={16} color={Colors.white} />
                      <Text style={styles.premiumButtonText}>Get Premium Templates & Guides</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </Card>
          ))}
        </View>

        {/* Bottom CTA */}
        <Card style={[styles.ctaCard, { backgroundColor: Colors.card }]}>
          <Text style={[styles.ctaTitle, { color: Colors.text }]}>Need More Help?</Text>
          <Text style={[styles.ctaDescription, { color: Colors.lightText }]}>
            Get access to premium templates, expert guidance, and personalized support to maximize your application success.
          </Text>
          <Button
            title="Upgrade to Premium"
            onPress={() => router.push("/(tabs)/community")}
            style={[styles.ctaButton, { backgroundColor: Colors.primary }]}
            icon={<Star size={20} color={Colors.white} />}
          />
        </Card>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 16,
  },
  headerGradient: {
    padding: 24,
    paddingTop: 32,
  },
  headerContent: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 12,
    marginBottom: 8,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: 24,
  },
  progressSection: {
    width: "100%",
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  categoryFilter: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ECF0F1",
  },
  categoryScroll: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 6,
  },
  categoryCount: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  categoryCountText: {
    fontSize: 12,
    fontWeight: "600",
  },
  noticeCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  noticeContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 12,
    lineHeight: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
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
    alignItems: "flex-start",
    padding: 16,
  },
  taskLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  taskCheckbox: {
    marginRight: 12,
    marginTop: 2,
    borderWidth: 2,
    borderRadius: 4,
  },
  taskContent: {
    flex: 1,
  },
  taskTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
    flex: 1,
    marginRight: 8,
  },
  taskTitleCompleted: {
    textDecorationLine: "line-through",
  },
  taskMeta: {
    alignItems: "flex-end",
    gap: 4,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: "600",
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  timeText: {
    fontSize: 10,
    fontWeight: "500",
  },
  taskDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  expandButton: {
    padding: 4,
    marginLeft: 8,
  },
  taskDetails: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
  },
  tipsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  tipBullet: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  resourcesSection: {
    marginBottom: 16,
  },
  resourceItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  resourceBullet: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  resourceText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  premiumButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  premiumButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  ctaCard: {
    marginBottom: 24,
    alignItems: "center",
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  ctaDescription: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  ctaButton: {
    minWidth: 200,
  },
  bottomPadding: {
    height: 32,
  },
});