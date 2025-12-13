import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Modal, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { CheckSquare, Square, Clock, AlertCircle, Star, Trophy, ChevronDown, ChevronUp, Filter, Target, Crown, X, ChevronLeft } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase";

interface Checklist {
  id: string;
  country_code: string;
  visa_type: string;
  title: string;
  sort_order: number;
}

interface ChecklistItem {
  id: string;
  checklist_id: string;
  label: string;
  field_type: "checkbox" | "file" | "text";
  metadata: any;
  sort_order: number;
}

interface ChecklistWithItems extends Checklist {
  items: ChecklistItem[];
}

interface UserProgress {
  checklist_item_id: string;
  is_completed: boolean;
  value: any;
}

export default function ApplicationChecklistScreen() {
  const router = useRouter();
  const Colors = useColors();
  const { user } = useUserStore();
  
  const [checklists, setChecklists] = useState<ChecklistWithItems[]>([]);
  const [userProgress, setUserProgress] = useState<Record<string, UserProgress>>({});
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch checklists and items from Supabase
  useEffect(() => {
    loadChecklistsForUser();
  }, [user?.destinationCountry?.code, user?.id]);

  /**
   * Load checklists for the current user based on their subscription tier, country, and visa type
   * Applies premium filtering and merges user progress
   */
  async function loadChecklistsForUser() {
    try {
      setIsLoading(true);
      
      // Step 1: Fetch user profile
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setIsLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_tier, destination_country, visa_type")
        .eq("id", authUser.id)
        .single();

      if (!profile || !profile.destination_country || !profile.visa_type) {
        console.log("Profile missing required fields", {
          destination_country: profile?.destination_country,
          visa_type: profile?.visa_type
        });
        setIsLoading(false);
        return;
      }

      // Step 2: Query checklists based on user visa and country
      // Use .or() with and() inside to group: (visa_type = X AND country_code = Y) OR (visa_type = X AND country_code IS NULL)
      // This ensures correct visa type AND correct country-specific OR generic checklists
      
      // Define subscription tier hierarchy
      // Map "pro" to "premium" for consistency (pro is used in UI, premium in DB)
      const allowedTiers: Record<string, string[]> = {
        free: ["free"],
        basic: ["free", "basic"],
        standard: ["free", "basic", "standard"],
        premium: ["free", "basic", "standard", "premium"],
        pro: ["free", "basic", "standard", "premium"] // Map pro to premium tier access
      };
      
      // Normalize tier: map "pro" to "premium" for lookup
      const normalizedTier = profile.subscription_tier === "pro" ? "premium" : (profile.subscription_tier || "free");
      const userTier = normalizedTier;
      const tiersToShow = allowedTiers[userTier] || allowedTiers.free;
      
      // Normalize country code and visa type
      const countryCode = profile.destination_country.trim().toUpperCase();
      const visaType = profile.visa_type.trim();
      
      console.log("Loading checklists with:", {
        country_code: countryCode,
        visa_type: visaType,
        subscription_tiers: tiersToShow
      });
      
      // Build the OR filter string
      const orFilter = `and(visa_type.eq.${visaType},country_code.eq.${countryCode}),and(visa_type.eq.${visaType},country_code.is.null)`;
      
      // Query checklists with nested checklist_items
      // Supabase automatically joins via FK: checklist_items.checklist_id → checklists.id
      let query = supabase
        .from("checklists")
        .select(`
          id,
          title,
          sort_order,
          subscription_tier,
          country_code,
          visa_type,
          checklist_items (
            id,
            label,
            field_type,
            metadata,
            sort_order
          )
        `)
        .or(orFilter)
        .in("subscription_tier", tiersToShow)
        .order("sort_order", { ascending: true })
        .order("sort_order", { foreignTable: "checklist_items", ascending: true });

      const { data: checklists, error } = await query;
      
      if (error) {
        console.error("Error fetching checklists:", error);
        console.error("Query details:", {
          visa_type: visaType,
          country_code: countryCode,
          subscription_tiers: tiersToShow,
          error: error
        });
      } else {
        console.log(`Found ${checklists?.length || 0} checklists for ${countryCode} with visa ${visaType}`);
      }

      if (error) throw error;

      if (!checklists || checklists.length === 0) {
        setIsLoading(false);
        return;
      }

      // Fetch user progress
      const { data: progress } = await supabase
        .from("user_progress")
        .select("checklist_item_id, is_completed, value")
        .eq("user_id", authUser.id);

      // Merge progress into checklist items
      const checklistsWithProgress = checklists.map((cl: any) => {
        const itemsWithProgress = (cl.checklist_items || []).map((item: any) => {
          const p = progress?.find((x) => x.checklist_item_id === item.id);
          return {
            ...item,
            is_completed: p?.is_completed ?? false,
            value: p?.value ?? null,
          };
        });

        return {
          id: cl.id,
          title: cl.title,
          sort_order: cl.sort_order,
          subscription_tier: cl.subscription_tier,
          items: itemsWithProgress,
        };
      });

      // Transform to match ChecklistWithItems interface
      const transformedChecklists: ChecklistWithItems[] = checklistsWithProgress.map((cl: any) => ({
        id: cl.id,
        country_code: cl.country_code || profile.destination_country, // Use actual country_code from DB or fallback
        visa_type: cl.visa_type || profile.visa_type, // Use actual visa_type from DB or fallback
        title: cl.title,
        sort_order: cl.sort_order,
        items: cl.items.map((item: any) => ({
          id: item.id,
          checklist_id: cl.id,
          label: item.label,
          field_type: item.field_type,
          metadata: item.metadata,
          sort_order: item.sort_order,
        })),
      }));

      setChecklists(transformedChecklists);

      // Update user progress map (using plain object instead of Map to avoid Hermes crash)
      const progressMap: Record<string, UserProgress> = {};
      if (progress) {
        progress.forEach((p) => {
          progressMap[p.checklist_item_id] = {
            checklist_item_id: p.checklist_item_id,
            is_completed: p.is_completed,
            value: p.value,
          };
        });
      }
      setUserProgress(progressMap);
    } catch (error) {
      console.error("Error loading checklists:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // Get all items from all checklists
  const allItems = checklists.flatMap(checklist => 
    checklist.items.map(item => ({
      ...item,
      checklistTitle: checklist.title,
      checklistId: checklist.id,
    }))
  );

  // Categories based on checklist titles
  const categories = [
    { key: "all", title: "All Tasks", count: allItems.length },
    ...checklists.map(checklist => ({
      key: checklist.id,
      title: checklist.title,
      count: checklist.items.length,
    })),
  ];

  const filteredItems = selectedCategory === "all"
    ? allItems
    : allItems.filter(item => item.checklistId === selectedCategory);

  const handleTaskToggle = async (itemId: string) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const currentProgress = userProgress[itemId];
      const newCompleted = !currentProgress?.is_completed;

      // Update user_progress in Supabase
      if (currentProgress) {
        // Update existing progress
        const { error } = await supabase
          .from("user_progress")
          .update({
            is_completed: newCompleted,
            value: newCompleted ? {} : null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", authUser.id)
          .eq("checklist_item_id", itemId);

        if (error) {
          console.error("Error updating progress:", error);
          Alert.alert("Error", "Failed to update task. Please try again.");
          return;
        }
      } else {
        // Insert new progress
        const { error } = await supabase
          .from("user_progress")
          .insert([{
            user_id: authUser.id,
            checklist_item_id: itemId,
            is_completed: newCompleted,
            value: newCompleted ? {} : null,
          }]);

        if (error) {
          console.error("Error creating progress:", error);
          Alert.alert("Error", "Failed to update task. Please try again.");
          return;
        }
      }

      // Update local state
      const newProgress = { ...userProgress };
      newProgress[itemId] = {
        checklist_item_id: itemId,
        is_completed: newCompleted,
        value: newCompleted ? {} : null,
      };
      setUserProgress(newProgress);
    } catch (error) {
      console.error("Error toggling task:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };

  const toggleTaskExpansion = (itemId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedTasks(newExpanded);
  };

  const completedCount = filteredItems.filter(item => userProgress[item.id]?.is_completed).length;
  const progressPercentage = filteredItems.length > 0 ? Math.round((completedCount / filteredItems.length) * 100) : 0;

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
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.8}
          >
            <ChevronLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>
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
                  {completedCount} of {filteredItems.length} tasks completed
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

      {/* Tasks List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.loadingText, { color: Colors.lightText }]}>Loading checklists...</Text>
        </View>
      ) : filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: Colors.text }]}>
            No checklists found for your destination and visa type.
          </Text>
          <Text style={[styles.emptySubtext, { color: Colors.lightText }]}>
            Please complete your onboarding to see personalized checklists.
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.tasksContainer}>
            {filteredItems.map((item) => {
              const isCompleted = userProgress[item.id]?.is_completed || false;
              return (
                <Card key={item.id} style={[styles.taskCard, { backgroundColor: Colors.card }]}>
                  <TouchableOpacity
                    style={styles.taskHeader}
                    onPress={() => {
                      handleTaskToggle(item.id);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.taskLeft}>
                      <View style={[styles.taskCheckbox, { borderColor: isCompleted ? Colors.success : Colors.border }]}>
                        {isCompleted ? (
                          <CheckSquare size={20} color={Colors.success} />
                        ) : (
                          <Square size={20} color={Colors.lightText} />
                        )}
                      </View>
                      <View style={styles.taskContent}>
                        <View style={styles.taskTitleRow}>
                          <Text style={[
                            styles.taskTitle, 
                            { color: isCompleted ? Colors.lightText : Colors.text },
                            isCompleted && styles.taskTitleCompleted
                          ]}>
                            {item.label}
                          </Text>
                          <View style={styles.taskMeta}>
                            <View style={[styles.typeBadge, { backgroundColor: Colors.lightBackground }]}>
                              <Text style={[styles.typeText, { color: Colors.text }]}>
                                {item.field_type.toUpperCase()}
                              </Text>
                            </View>
                          </View>
                        </View>
                        {item.checklistTitle && (
                          <Text style={[styles.taskDescription, { color: Colors.lightText }]}>
                            {item.checklistTitle}
                          </Text>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => toggleTaskExpansion(item.id)}
                      style={styles.expandButton}
                    >
                      {expandedTasks.has(item.id) ? (
                        <ChevronUp size={20} color={Colors.primary} />
                      ) : (
                        <ChevronDown size={20} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  </TouchableOpacity>
                
                  {expandedTasks.has(item.id) && (
                    <View style={[styles.taskDetails, { backgroundColor: Colors.lightBackground }]}>
                      {item.metadata && typeof item.metadata === 'object' && (
                        <>
                          {item.metadata.description && (
                            <View style={styles.tipsSection}>
                              <Text style={[styles.sectionTitle, { color: Colors.text }]}>Description</Text>
                              <Text style={[styles.tipText, { color: Colors.text }]}>{item.metadata.description}</Text>
                            </View>
                          )}
                          {item.metadata.tips && Array.isArray(item.metadata.tips) && (
                            <View style={styles.tipsSection}>
                              <Text style={[styles.sectionTitle, { color: Colors.text }]}>💡 Tips</Text>
                              {item.metadata.tips.map((tip: string, tipIndex: number) => (
                                <View key={tipIndex} style={styles.tipItem}>
                                  <Text style={[styles.tipBullet, { color: Colors.primary }]}>•</Text>
                                  <Text style={[styles.tipText, { color: Colors.text }]}>{tip}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                          {item.metadata.resources && Array.isArray(item.metadata.resources) && (
                            <View style={styles.resourcesSection}>
                              <Text style={[styles.sectionTitle, { color: Colors.text }]}>📚 Resources</Text>
                              {item.metadata.resources.map((resource: string, resourceIndex: number) => (
                                <View key={resourceIndex} style={styles.resourceItem}>
                                  <Text style={[styles.resourceBullet, { color: Colors.secondary }]}>•</Text>
                                  <Text style={[styles.resourceText, { color: Colors.text }]}>{resource}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </>
                      )}
                    </View>
                  )}
                </Card>
              );
            })}
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      )}
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
    position: "relative",
  },
  backButton: {
    position: "absolute",
    top: 16,
    left: 16,
    padding: 6,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
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
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
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
