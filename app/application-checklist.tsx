import React, { useState } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { CheckSquare, Square, Clock, AlertCircle, Star, Trophy, ChevronDown, ChevronUp, Filter, Target, Crown, X } from "lucide-react-native";
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
  const [showPremiumModal, setShowPremiumModal] = useState(false);

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

  // Filter tasks based on premium status - only show post-acceptance tasks if premium
  const accessibleTasks = filteredTasks.filter(task => {
    // If task requires acceptance and user has acceptance but no premium, hide it (except the acceptance task itself)
    if (task.requiresAcceptance && hasAcceptance && !isPremium && task.id !== "receive-acceptance") {
      return false;
    }
    return true;
  });
  
  const visibleTasks = accessibleTasks.filter(task => 
    !task.requiresAcceptance || hasAcceptance || task.id === "receive-acceptance"
  );

  // Check if user should see premium overlay for post-acceptance tasks
  const shouldShowPremiumOverlay = hasAcceptance && !isPremium && 
    (selectedCategory === "acceptance" || selectedCategory === "all");

  const handlePremiumUpgrade = () => {
    setShowPremiumModal(false);
    router.push('/premium/subscription');
  };

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
              
              // Show premium subscription prompt after acceptance
              setTimeout(() => {
                setShowPremiumModal(true);
              }, 500);
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
            <Target size={24} color="#FFFFFF" />
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
          {visibleTasks.map((task, index) => {
            const isPostAcceptanceTask = task.requiresAcceptance && hasAcceptance;
            const shouldBlurTask = isPostAcceptanceTask && !isPremium;
            
            return (
            <Card key={task.id} style={[styles.taskCard, { backgroundColor: Colors.card }]}>
              <TouchableOpacity
                style={[styles.taskHeader, shouldBlurTask && styles.blurredTask]}
                onPress={() => {
                  // Check if this is a post-acceptance task that requires premium
                  if (task.requiresAcceptance && hasAcceptance && !isPremium && task.id !== "receive-acceptance") {
                    setShowPremiumModal(true);
                  } else if (shouldBlurTask) {
                    setShowPremiumModal(true);
                  } else {
                    handleTaskToggle(task.id);
                  }
                }}
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
              
              {shouldBlurTask && (
                <View style={styles.premiumOverlay}>
                  <Crown size={24} color={Colors.primary} />
                  <Text style={[styles.premiumOverlayText, { color: Colors.primary }]}>Premium Required</Text>
                </View>
              )}
              
              {expandedTasks.has(task.id) && !shouldBlurTask && (
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
            );
          })}
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

      {/* Premium Overlay Modal */}
      <Modal
        visible={showPremiumModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPremiumModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.premiumModal, { backgroundColor: Colors.card }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowPremiumModal(false)}
            >
              <X size={24} color={Colors.lightText} />
            </TouchableOpacity>
            
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              style={styles.premiumModalHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Crown size={48} color={Colors.white} />
              <Text style={styles.premiumModalTitle}>Unlock Post-Acceptance Tasks</Text>
              <Text style={styles.premiumModalSubtitle}>
                Congratulations on your acceptance! Upgrade to Premium to access exclusive post-acceptance guidance.
              </Text>
            </LinearGradient>
            
            <View style={styles.premiumModalContent}>
              <Text style={[styles.premiumModalDescription, { color: Colors.text }]}>
                Premium unlocks essential tasks for your next steps:
              </Text>
              
              <View style={styles.premiumFeaturesList}>
                <View style={styles.premiumFeature}>
                  <Star size={16} color={Colors.primary} />
                  <Text style={[styles.premiumFeatureText, { color: Colors.text }]}>Visa application guidance</Text>
                </View>
                <View style={styles.premiumFeature}>
                  <Star size={16} color={Colors.primary} />
                  <Text style={[styles.premiumFeatureText, { color: Colors.text }]}>Housing and accommodation tips</Text>
                </View>
                <View style={styles.premiumFeature}>
                  <Star size={16} color={Colors.primary} />
                  <Text style={[styles.premiumFeatureText, { color: Colors.text }]}>Financial planning resources</Text>
                </View>
                <View style={styles.premiumFeature}>
                  <Star size={16} color={Colors.primary} />
                  <Text style={[styles.premiumFeatureText, { color: Colors.text }]}>Pre-departure checklists</Text>
                </View>
              </View>
              
              <Button
                title="Upgrade to Premium"
                onPress={handlePremiumUpgrade}
                style={[styles.premiumUpgradeButton, { backgroundColor: Colors.primary }]}
                icon={<Crown size={20} color={Colors.white} />}
                fullWidth
              />
              
              <TouchableOpacity
                onPress={() => setShowPremiumModal(false)}
                style={styles.premiumModalClose}
              >
                <Text style={[styles.premiumModalCloseText, { color: Colors.lightText }]}>Maybe Later</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 12,
  },
  headerGradient: {
    padding: 16,
    paddingTop: 20,
  },
  headerContent: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 6,
    marginBottom: 3,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: 12,
  },
  progressSection: {
    width: "100%",
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
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
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
  },
  progressPercentage: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  completedText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 6,
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
    position: "relative",
  },
  taskHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
  },
  blurredTask: {
    opacity: 0.6,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  premiumModal: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    padding: 8,
  },
  premiumModalHeader: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  premiumModalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  premiumModalSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 22,
  },
  premiumModalContent: {
    padding: 24,
  },
  premiumModalDescription: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 22,
  },
  premiumFeaturesList: {
    marginBottom: 24,
    gap: 12,
  },
  premiumFeature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  premiumFeatureText: {
    fontSize: 14,
    flex: 1,
  },
  premiumUpgradeButton: {
    marginBottom: 16,
  },
  premiumModalClose: {
    alignItems: "center",
    paddingVertical: 8,
  },
  premiumModalCloseText: {
    fontSize: 14,
    fontWeight: "500",
  },
  premiumOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    gap: 8,
  },
  premiumOverlayText: {
    fontSize: 14,
    fontWeight: "600",
  },
});