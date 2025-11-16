import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Platform, Animated, Dimensions, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronRight, Quote, CheckSquare, Calendar, Clock, Star, Heart, Camera, Plus, Globe, Timer, MapPin, Sparkles, Filter, Grid, List, MessageCircle } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import Card from "@/components/Card";
import ProgressBar from "@/components/ProgressBar";
import StageProgress from "@/components/StageProgress";
import QuoteCard from "@/components/QuoteCard";
import CelebrationAnimation from "@/components/CelebrationAnimation";
import MemoryCard from "@/components/MemoryCard";
import Button from "@/components/Button";
import { useJourneyStore } from "@/store/journeyStore";
import { useUserStore } from "@/store/userStore";
import { calculateOverallProgress } from "@/utils/helpers";
import { getRandomQuote, generalQuotes } from "@/mocks/quotes";
import { TimelineEvent } from "@/types/user";
import { JourneyStage, MemoryMood, JourneyProgress, Task } from "@/types/user";
import { supabase } from "@/lib/supabase";

const { width, height } = Dimensions.get("window");

export default function JourneyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const Colors = useColors();
  const { user } = useUserStore();
  const { 
    journeyProgress, 
    recentMilestone, 
    clearRecentMilestone, 
    setJourneyProgress,
    memories,
    getMemoriesByStage,
    getMemoriesByMood,
  } = useJourneyStore();
  const [activeTab, setActiveTab] = useState<"roadmap" | "map" | "timeline" | "memories">(params.tab === "memories" ? "memories" : "roadmap");
  const [showCelebration, setShowCelebration] = useState(false);
  const [dailyQuote, setDailyQuote] = useState(() => getRandomQuote(generalQuotes));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [planeAnim] = useState(new Animated.Value(0));
  const [sparkleAnim] = useState(new Animated.Value(0));
  const [memoryFloatAnim] = useState(new Animated.Value(0));
  
  // Memory filters - simplified
  const [selectedStageFilter, setSelectedStageFilter] = useState<JourneyStage | "all">("all");
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<MemoryMood | "all">("all");
  const [showFilters, setShowFilters] = useState(false);
  
  // Fetch journey progress from Supabase checklists
  useEffect(() => {
    fetchJourneyProgress();
  }, [user?.destinationCountry?.code, user?.id]);

  const fetchJourneyProgress = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      // Get visa type, destination country, and subscription tier from profile (source of truth)
      const { data: profile } = await supabase
        .from("profiles")
        .select("visa_type, destination_country, subscription_tier")
        .eq("id", authUser.id)
        .single();

      if (!profile?.visa_type || !profile?.destination_country) {
        console.log("Profile missing visa_type or destination_country");
        return;
      }

      // Fetch checklists for this country and visa type
      // Use .or() with and() inside to group: (visa_type = X AND country_code = Y) OR (visa_type = X AND country_code IS NULL)
      // This ensures correct visa type AND correct country-specific OR generic checklists
      
      // Define subscription tier hierarchy
      const allowedTiers: Record<string, string[]> = {
        free: ["free"],
        basic: ["free", "basic"],
        standard: ["free", "basic", "standard"],
        premium: ["free", "basic", "standard", "premium"]
      };
      
      const userTier = profile.subscription_tier || "free";
      const tiersToShow = allowedTiers[userTier] || allowedTiers.free;
      
      let query = supabase
        .from("checklists")
        .select("*")
        .or(
          `and(visa_type.eq.${profile.visa_type},country_code.eq.${profile.destination_country}),` +
          `and(visa_type.eq.${profile.visa_type},country_code.is.null)`
        )
        .in("subscription_tier", tiersToShow)
        .order("sort_order", { ascending: true });

      const { data: checklistsData, error: checklistsError } = await query;

      if (checklistsError) {
        console.error("Error fetching checklists:", checklistsError);
        return;
      }

      if (!checklistsData || checklistsData.length === 0) {
        console.log("No checklists found for this country/visa combination");
        return;
      }

      // Fetch checklist items
      const checklistIds = checklistsData.map((c: any) => c.id);
      const { data: itemsData } = await supabase
        .from("checklist_items")
        .select("*")
        .in("checklist_id", checklistIds)
        .order("sort_order", { ascending: true });

      if (!itemsData) return;

      // Fetch user progress
      const itemIds = itemsData.map(item => item.id);
      const { data: progressData } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", authUser.id)
        .in("checklist_item_id", itemIds);

      // Create a map of completed items
      const completedItems = new Set(
        (progressData || []).filter(p => p.is_completed).map(p => p.checklist_item_id)
      );

      // Map checklists to journey stages
      // We'll use a simple mapping: each checklist becomes a "stage" or we group them
      // For now, let's create stages based on checklist titles
      const stageMapping: Record<string, JourneyStage> = {
        "pre-arrival": "pre_departure",
        "pre-arrival documents": "pre_departure",
        "arrival": "arrival",
        "arrival & orientation": "arrival",
        "academic": "academic",
        "academic requirements": "academic",
        "accommodation": "arrival",
        "accommodation & housing": "arrival",
        "financial": "pre_departure",
        "financial & insurance": "pre_departure",
      };

      // Group checklists by stage
      const stagesMap = new Map<JourneyStage, { checklist: any; items: any[] }[]>();

      checklistsData.forEach((checklist: any) => {
        const titleLower = checklist.title.toLowerCase();
        let stage: JourneyStage = "pre_departure"; // default

        // Find matching stage
        for (const [key, mappedStage] of Object.entries(stageMapping)) {
          if (titleLower.includes(key)) {
            stage = mappedStage;
            break;
          }
        }

        // If no match, try to infer from title
        if (titleLower.includes("research") || titleLower.includes("university")) {
          stage = "research";
        } else if (titleLower.includes("application") || titleLower.includes("apply")) {
          stage = "application";
        } else if (titleLower.includes("visa")) {
          stage = "visa";
        } else if (titleLower.includes("career") || titleLower.includes("professional")) {
          stage = "career";
        }

        const items = itemsData.filter(item => item.checklist_id === checklist.id);
        
        if (!stagesMap.has(stage)) {
          stagesMap.set(stage, []);
        }
        stagesMap.get(stage)!.push({ checklist, items });
      });

      // Convert to JourneyProgress format
      const progress: JourneyProgress[] = [];
      const stageOrder: JourneyStage[] = ["research", "application", "visa", "pre_departure", "arrival", "academic", "career"];

      stageOrder.forEach(stage => {
        const stageData = stagesMap.get(stage);
        if (!stageData || stageData.length === 0) return;

        // Combine all items from all checklists in this stage
        const allTasks: Task[] = [];
        stageData.forEach(({ items }) => {
          items.forEach(item => {
            allTasks.push({
              id: item.id,
              title: item.label,
              completed: completedItems.has(item.id),
              completedDate: completedItems.has(item.id) ? new Date().toISOString() : undefined,
            });
          });
        });

        if (allTasks.length === 0) return;

        const completedCount = allTasks.filter(t => t.completed).length;
        const progressPercent = Math.round((completedCount / allTasks.length) * 100);

        progress.push({
          stage,
          progress: progressPercent,
          completed: progressPercent === 100,
          completedDate: progressPercent === 100 ? new Date().toISOString() : undefined,
          tasks: allTasks,
        });
      });

      if (progress.length > 0) {
        setJourneyProgress(progress);
      }
    } catch (error) {
      console.error("Error fetching journey progress:", error);
    }
  };
  
  // Handle tab parameter from navigation
  useEffect(() => {
    if (params.tab === "memories") {
      setActiveTab("memories");
    }
  }, [params.tab]);
  
  const overallProgress = calculateOverallProgress(journeyProgress);
  
  // Show celebration animation when a milestone is reached
  useEffect(() => {
    if (recentMilestone) {
      setShowCelebration(true);
      
      // Clear the milestone after showing celebration
      const timer = setTimeout(() => {
        clearRecentMilestone();
      }, 3500);
      
      return () => clearTimeout(timer);
    }
  }, [recentMilestone, clearRecentMilestone]);
  
  // Fade in animation for the quote
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Continuous animations for memories page
  useEffect(() => {
    if (activeTab === "memories") {
      // Sparkle animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(sparkleAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Memory float animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(memoryFloatAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(memoryFloatAnim, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [activeTab, sparkleAnim, memoryFloatAnim]);

  // Generate timeline events based on actual journey progress
  const generateTimelineEvents = (): TimelineEvent[] => {
    const events: TimelineEvent[] = [
      {
        id: 1,
        title: "Started Your Journey",
        description: "Welcome to your study abroad adventure!",
        date: "2024-01-15",
        type: "milestone",
        completed: true,
        icon: Star,
        progress: 100,
      }
    ];

    // Add events based on journey progress
    journeyProgress.forEach((stage, index) => {
      const stageNames = {
        research: "Research Phase",
        application: "Application Phase", 
        visa: "Visa Process",
        pre_departure: "Pre-Departure",
        arrival: "Arrival",
        academic: "Academic Journey",
        career: "Career Development"
      };

      const stageDescriptions = {
        research: "Explored universities and programs",
        application: "Submitted applications to universities",
        visa: "Completed visa application process",
        pre_departure: "Prepared for departure",
        arrival: "Arrived at destination",
        academic: "Started academic journey",
        career: "Building career opportunities"
      };

      const baseDate = new Date("2024-01-15");
      baseDate.setMonth(baseDate.getMonth() + index + 1);

      events.push({
        id: index + 2,
        title: `${stageNames[stage.stage]} ${stage.completed ? "Complete" : "In Progress"}`,
        description: stageDescriptions[stage.stage],
        date: baseDate.toISOString().split('T')[0],
        type: stage.completed ? "achievement" : (stage.progress > 0 ? "upcoming" : "future"),
        completed: stage.completed,
        icon: stage.completed ? CheckSquare : (stage.progress > 0 ? Clock : Calendar),
        progress: stage.progress
      });
    });

    // Add future milestone
    const futureDate = new Date("2024-08-25");
    events.push({
      id: events.length + 1,
      title: "Graduation Day",
      description: "Celebrate your achievement!",
      date: futureDate.toISOString().split('T')[0],
      type: "future",
      completed: false,
      icon: Heart,
      progress: 0,
    });

    return events;
  };

  const timelineEvents = generateTimelineEvents();

  // Flight information for map
  const flightInfo = {
    duration: "14h 30m",
    distance: "8,847 km",
    timeDifference: "+8 hours",
    stops: 1,
    airlines: ["Emirates", "Qatar Airways", "Turkish Airlines"],
    averageCost: "$1,200 - $2,500",
    bestTimeToBook: "2-3 months in advance",
    tips: [
      "Book flights 2-3 months in advance for better prices",
      "Consider layovers to save money",
      "Pack essentials in carry-on for long flights",
      "Arrive at destination 2-3 days before important events",
      "Check visa requirements for transit countries"
    ]
  };

  // Filter memories based on selected filters
  const getFilteredMemories = () => {
    let filtered = memories;
    
    if (selectedStageFilter !== "all") {
      filtered = getMemoriesByStage(selectedStageFilter);
    }
    
    if (selectedMoodFilter !== "all") {
      filtered = filtered.filter(memory => memory.mood === selectedMoodFilter);
    }
    
    return filtered;
  };

  const filteredMemories = getFilteredMemories();
  
  // Debug logging
  useEffect(() => {
    console.log("Memories count:", memories.length);
    console.log("Filtered memories count:", filteredMemories.length);
    console.log("Active tab:", activeTab);
  }, [memories.length, filteredMemories.length, activeTab]);

  // Get stage options for filter
  const stageOptions: { value: JourneyStage | "all"; label: string; emoji: string }[] = [
    { value: "all", label: "All", emoji: "🌟" },
    { value: "research", label: "Research", emoji: "🔍" },
    { value: "application", label: "Application", emoji: "📝" },
    { value: "visa", label: "Visa", emoji: "📋" },
    { value: "pre_departure", label: "Pre-Departure", emoji: "🎒" },
    { value: "arrival", label: "Arrival", emoji: "✈️" },
    { value: "academic", label: "Academic", emoji: "🎓" },
    { value: "career", label: "Career", emoji: "💼" },
  ];

  // Get mood options for filter
  const moodOptions: { value: MemoryMood | "all"; label: string; emoji: string }[] = [
    { value: "all", label: "All", emoji: "😊" },
    { value: "excited", label: "Excited", emoji: "🤩" },
    { value: "happy", label: "Happy", emoji: "😊" },
    { value: "proud", label: "Proud", emoji: "😤" },
    { value: "nervous", label: "Nervous", emoji: "😰" },
    { value: "grateful", label: "Grateful", emoji: "🙏" },
    { value: "accomplished", label: "Accomplished", emoji: "🏆" },
    { value: "hopeful", label: "Hopeful", emoji: "🌟" },
    { value: "determined", label: "Determined", emoji: "💪" },
  ];
  
  const renderTabContent = () => {
    switch (activeTab) {
      case "roadmap":
        return (
          <ScrollView style={styles.roadmapContainer} showsVerticalScrollIndicator={false}>
            <Animated.View style={{ opacity: fadeAnim }}>
              <QuoteCard 
                quote={dailyQuote.text} 
                author={dailyQuote.author} 
                variant="gradient"
              />
            </Animated.View>
            
            <Card style={[styles.instructionCard, { backgroundColor: Colors.card }]}>
              <View style={styles.instructionContent}>
                <CheckSquare size={24} color={Colors.primary} />
                <View style={styles.instructionText}>
                  <Text style={[styles.instructionTitle, { color: Colors.text }]}>How to Use Your Roadmap</Text>
                  <Text style={[styles.instructionDescription, { color: Colors.lightText }]}>
                    Tap on any stage below to view and complete tasks. Each completed task contributes to your overall progress!
                  </Text>
                </View>
              </View>
            </Card>
            
            <View style={styles.stagesContainer}>
              {journeyProgress.map((stage) => {
                return (
                  <StageProgress
                    key={stage.stage}
                    stage={stage}
                    onPress={() => {
                      router.push(`/journey/${stage.stage}`);
                    }}
                    isLocked={false}
                  />
                );
              })}
            </View>
          </ScrollView>
        );
      case "map":
        return (
          <ScrollView style={styles.mapContainer} showsVerticalScrollIndicator={false}>
            <Card style={[styles.mapCard, { backgroundColor: Colors.card }]}>
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.mapGradient}
              >
                <View style={styles.mapContent}>
                  <View style={styles.mapHeader}>
                    <Globe size={32} color={Colors.white} />
                    <Text style={styles.mapTitle}>Your Journey Route</Text>
                  </View>
                  
                  <View style={styles.routeInfo}>
                    <View style={styles.countryPoint}>
                      <Text style={styles.countryFlag}>{user?.homeCountry.flag}</Text>
                      <Text style={styles.countryName}>{user?.homeCountry.name}</Text>
                    </View>
                    
                    <View style={styles.flightPath}>
                      <Text style={styles.flightLine}>✈️ -------- ✈️</Text>
                    </View>
                    
                    <View style={styles.countryPoint}>
                      <Text style={styles.countryFlag}>{user?.destinationCountry.flag}</Text>
                      <Text style={styles.countryName}>{user?.destinationCountry.name}</Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </Card>
            
            {/* Flight Statistics */}
            <Card style={[styles.flightStatsCard, { backgroundColor: Colors.card }]}>
              <Text style={[styles.sectionTitle, { color: Colors.text }]}>Flight Information</Text>
              
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Timer size={20} color={Colors.primary} />
                  <Text style={[styles.statLabel, { color: Colors.lightText }]}>Duration</Text>
                  <Text style={[styles.statValue, { color: Colors.text }]}>{flightInfo.duration}</Text>
                </View>
                
                <View style={styles.statItem}>
                  <MapPin size={20} color={Colors.secondary} />
                  <Text style={[styles.statLabel, { color: Colors.lightText }]}>Distance</Text>
                  <Text style={[styles.statValue, { color: Colors.text }]}>{flightInfo.distance}</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Clock size={20} color={Colors.accent} />
                  <Text style={[styles.statLabel, { color: Colors.lightText }]}>Time Diff</Text>
                  <Text style={[styles.statValue, { color: Colors.text }]}>{flightInfo.timeDifference}</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Star size={20} color={Colors.warning} />
                  <Text style={[styles.statLabel, { color: Colors.lightText }]}>Avg Cost</Text>
                  <Text style={[styles.statValue, { color: Colors.text }]}>{flightInfo.averageCost}</Text>
                </View>
              </View>
            </Card>
            
            {/* Travel Tips */}
            <Card style={[styles.tipsCard, { backgroundColor: Colors.card }]}>
              <Text style={[styles.sectionTitle, { color: Colors.text }]}>✈️ Travel Tips</Text>
              {flightInfo.tips.map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <View style={[styles.tipBullet, { backgroundColor: Colors.primary }]} />
                  <Text style={[styles.tipText, { color: Colors.lightText }]}>{tip}</Text>
                </View>
              ))}
            </Card>
          </ScrollView>
        );
      case "timeline":
        return (
          <View style={styles.timelineContainer}>
            <View style={styles.timelineHeader}>
              <LinearGradient
                colors={[Colors.memoryPink, Colors.memoryPurple]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.timelineHeaderGradient}
              >
                <View style={styles.timelineHeaderContent}>
                  <Text style={styles.timelineTitle}>Your Journey Timeline</Text>
                  <Text style={styles.timelineSubtitle}>Track your progress through key milestones</Text>
                  <View style={styles.timelineStats}>
                    <Text style={styles.timelineStatsText}>
                      {timelineEvents.filter(e => e.completed).length} of {timelineEvents.length} milestones completed
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            <ScrollView style={styles.timelineScroll} showsVerticalScrollIndicator={false}>
              {timelineEvents.map((event, index) => (
                <View key={event.id} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={[
                      styles.timelineIcon,
                      { backgroundColor: event.completed ? Colors.success : Colors.lightText }
                    ]}>
                      <event.icon 
                        size={16} 
                        color={Colors.white} 
                      />
                    </View>
                    {index < timelineEvents.length - 1 && (
                      <View style={[
                        styles.timelineLine,
                        { backgroundColor: event.completed ? Colors.success : Colors.border }
                      ]} />
                    )}
                  </View>
                  
                  <View style={styles.timelineRight}>
                    <Card style={[
                      styles.timelineCard,
                      { backgroundColor: Colors.card },
                      event.completed && { backgroundColor: Colors.lightBackground }
                    ]}>
                      <View style={styles.timelineCardHeader}>
                        <Text style={[
                          styles.timelineEventTitle,
                          { color: Colors.text },
                          event.completed && { color: Colors.success }
                        ]}>
                          {event.title}
                        </Text>
                        <Text style={[styles.timelineDate, { color: Colors.lightText }]}>
                          {new Date(event.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </Text>
                      </View>
                      <Text style={[styles.timelineEventDescription, { color: Colors.lightText }]}>
                        {event.description}
                      </Text>
                      
                      {/* Show progress for in-progress items */}
                      {event.progress !== undefined && event.progress > 0 && !event.completed && (
                        <View style={styles.timelineProgress}>
                          <ProgressBar progress={event.progress} height={4} animated={true} />
                          <Text style={[styles.timelineProgressText, { color: Colors.primary }]}>
                            {event.progress}% complete
                          </Text>
                        </View>
                      )}
                      
                      {event.completed && (
                        <View style={[styles.completedBadge, { backgroundColor: Colors.lightBackground }]}>
                          <CheckSquare size={12} color={Colors.success} />
                          <Text style={[styles.completedText, { color: Colors.success }]}>Completed</Text>
                        </View>
                      )}
                    </Card>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        );
      case "memories":
        return (
          <View style={styles.memoriesContainer}>
            {/* Simplified Filter Header - Instagram Style */}
            <View style={[styles.memoriesHeader, { backgroundColor: Colors.card, borderBottomColor: Colors.border }]}>
              <View style={styles.memoriesHeaderTop}>
                <Text style={[styles.memoriesTitle, { color: Colors.text }]}>Memories</Text>
                <TouchableOpacity
                  style={[styles.filterButton, { backgroundColor: showFilters ? Colors.primary : Colors.lightBackground }]}
                  onPress={() => setShowFilters(!showFilters)}
                >
                  <Filter size={16} color={showFilters ? Colors.white : Colors.text} />
                </TouchableOpacity>
              </View>
              
              {showFilters && (
                <View style={styles.filtersContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                    {stageOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.filterChip,
                          { 
                            backgroundColor: selectedStageFilter === option.value ? Colors.primary : Colors.lightBackground,
                            borderColor: selectedStageFilter === option.value ? Colors.primary : Colors.border 
                          }
                        ]}
                        onPress={() => setSelectedStageFilter(option.value)}
                      >
                        <Text style={styles.filterEmoji}>{option.emoji}</Text>
                        <Text style={[
                          styles.filterChipText,
                          { color: selectedStageFilter === option.value ? Colors.white : Colors.text }
                        ]}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                    {moodOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.filterChip,
                          { 
                            backgroundColor: selectedMoodFilter === option.value ? Colors.primary : Colors.lightBackground,
                            borderColor: selectedMoodFilter === option.value ? Colors.primary : Colors.border 
                          }
                        ]}
                        onPress={() => setSelectedMoodFilter(option.value)}
                      >
                        <Text style={styles.filterEmoji}>{option.emoji}</Text>
                        <Text style={[
                          styles.filterChipText,
                          { color: selectedMoodFilter === option.value ? Colors.white : Colors.text }
                        ]}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Memories Content */}
            <ScrollView style={styles.memoriesScroll} showsVerticalScrollIndicator={false}>
              {memories.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={[styles.emptyStateIcon, { backgroundColor: Colors.lightBackground }]}>
                    <Camera size={48} color={Colors.lightText} />
                  </View>
                  <Text style={[styles.emptyStateTitle, { color: Colors.text }]}>No Memories Yet</Text>
                  <Text style={[styles.emptyStateDescription, { color: Colors.lightText }]}>
                    Start capturing your study abroad journey! Add your first memory to begin building your story.
                  </Text>
                  <TouchableOpacity
                    style={[styles.addFirstMemoryButton, { backgroundColor: Colors.primary }]}
                    onPress={() => router.push("/memories/new")}
                  >
                    <Plus size={20} color={Colors.white} />
                    <Text style={styles.addFirstMemoryText}>Add Your First Memory</Text>
                  </TouchableOpacity>
                </View>
              ) : filteredMemories.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={[styles.emptyStateIcon, { backgroundColor: Colors.lightBackground }]}>
                    <Filter size={48} color={Colors.lightText} />
                  </View>
                  <Text style={[styles.emptyStateTitle, { color: Colors.text }]}>No Memories Match Your Filters</Text>
                  <Text style={[styles.emptyStateDescription, { color: Colors.lightText }]}>
                    Try adjusting your filters or add a new memory for this stage and mood.
                  </Text>
                  <TouchableOpacity
                    style={[styles.addFirstMemoryButton, { backgroundColor: Colors.primary }]}
                    onPress={() => {
                      setSelectedStageFilter("all");
                      setSelectedMoodFilter("all");
                    }}
                  >
                    <Text style={styles.addFirstMemoryText}>Clear Filters</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.memoriesGrid}>
                  {filteredMemories.map((memory, index) => (
                    <Animated.View 
                      key={memory.id} 
                      style={[
                        styles.memoryWrapper,
                        {
                          transform: [{
                            translateY: memoryFloatAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, index % 2 === 0 ? -3 : 3],
                            })
                          }]
                        }
                      ]}
                    >
                      <MemoryCard
                        memory={memory}
                        onPress={() => {
                          Alert.alert(
                            memory.title,
                            memory.description,
                            [
                              { text: "Share", onPress: () => Alert.alert("Share", "Sharing functionality coming soon!") },
                              { text: "Close", style: "cancel" }
                            ]
                          );
                        }}
                      />
                    </Animated.View>
                  ))}
                  
                  {/* Add Memory Card */}
                  <TouchableOpacity
                    style={styles.addMemoryCard}
                    onPress={() => router.push("/memories/new")}
                  >
                    <LinearGradient
                      colors={["#833AB4", "#FD1D1D", "#FCB045"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.addMemoryGradient}
                    >
                      <View style={styles.addMemoryContent}>
                        <View style={styles.addMemoryIconContainer}>
                          <Camera size={24} color={Colors.white} />
                        </View>
                        <Text style={styles.addMemoryCardText}>Create Memory</Text>
                        <Text style={styles.addMemoryCardSubtext}>Share your moment</Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>

            {/* Floating Add Button */}
            <TouchableOpacity
              style={[styles.floatingAddButton, { backgroundColor: Colors.primary }]}
              onPress={() => router.push("/memories/new")}
            >
              <Plus size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };
  
  if (!user) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: Colors.background }]} edges={['top']}>
        <Text style={[styles.loadingText, { color: Colors.lightText }]}>Loading your journey...</Text>
      </SafeAreaView>
    );
  }
  
  // Map celebration animation types to valid types
  const getCelebrationType = (type: string | undefined) => {
    switch (type) {
      case "stage_complete":
        return "milestone";
      case "progress_milestone":
        return "achievement";
      default:
        return type as "confetti" | "achievement" | "milestone" | undefined;
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]} edges={['top']}>
      {showCelebration && (
        <CelebrationAnimation 
          visible={showCelebration} 
          type={getCelebrationType(recentMilestone?.type) || "confetti"}
          onAnimationFinish={() => setShowCelebration(false)}
        />
      )}
      
      <View style={[styles.header, { backgroundColor: Colors.card, borderBottomColor: Colors.border }]}>
        <Text style={[styles.title, { color: Colors.text }]}>Your Journey</Text>
        <View style={styles.progressContainer}>
          <ProgressBar 
            progress={overallProgress} 
            height={6} 
            animated={true}
          />
          <View style={styles.progressTextContainer}>
            <Text style={[styles.progressLabel, { color: Colors.lightText }]}>Overall Progress</Text>
            <Text style={[styles.progressText, { color: Colors.primary }]}>{overallProgress}%</Text>
          </View>
        </View>
      </View>
      
      <View style={[styles.tabs, { backgroundColor: Colors.card, borderBottomColor: Colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "roadmap" && { borderBottomColor: Colors.primary }]}
          onPress={() => setActiveTab("roadmap")}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "roadmap" ? Colors.primary : Colors.lightText },
            ]}
          >
            Roadmap
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === "map" && { borderBottomColor: Colors.primary }]}
          onPress={() => setActiveTab("map")}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "map" ? Colors.primary : Colors.lightText },
            ]}
          >
            Map
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === "timeline" && { borderBottomColor: Colors.primary }]}
          onPress={() => setActiveTab("timeline")}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "timeline" ? Colors.primary : Colors.lightText },
            ]}
          >
            Timeline
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === "memories" && { borderBottomColor: Colors.primary }]}
          onPress={() => setActiveTab("memories")}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "memories" ? Colors.primary : Colors.lightText },
            ]}
          >
            Memories
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={[styles.content, { backgroundColor: Colors.lightBackground }]}>
        {renderTabContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    padding: 12,
    borderBottomWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  progressContainer: {
    marginTop: 6,
  },
  progressTextContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  progressLabel: {
    fontSize: 13,
  },
  progressText: {
    fontSize: 15,
    fontWeight: "700",
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
  },
  content: {
    flex: 1,
  },
  
  // Roadmap styles
  roadmapContainer: {
    flex: 1,
    padding: 16,
  },
  instructionCard: {
    marginTop: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#FF6B6B",
  },
  instructionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  instructionText: {
    flex: 1,
    marginLeft: 12,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  instructionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  stagesContainer: {
    marginTop: 16,
    paddingBottom: 32,
  },
  
  // Map styles
  mapContainer: {
    flex: 1,
    padding: 16,
  },
  mapCard: {
    marginBottom: 16,
    padding: 0,
    overflow: "hidden",
  },
  mapGradient: {
    padding: 24,
    minHeight: 200,
  },
  mapContent: {
    flex: 1,
  },
  mapHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  mapTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 8,
  },
  routeInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  countryPoint: {
    alignItems: "center",
    flex: 1,
  },
  countryFlag: {
    fontSize: 32,
    marginBottom: 8,
  },
  countryName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
  },
  flightPath: {
    alignItems: "center",
    marginHorizontal: 16,
  },
  flightLine: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  
  flightStatsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statItem: {
    width: "48%",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255, 107, 107, 0.05)",
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  tipsCard: {
    marginBottom: 32,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  
  // Timeline styles
  timelineContainer: {
    flex: 1,
  },
  timelineHeader: {
    marginBottom: 16,
  },
  timelineHeaderGradient: {
    padding: 24,
    paddingTop: 32,
  },
  timelineHeaderContent: {
    alignItems: "center",
  },
  timelineTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  timelineSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 16,
  },
  timelineStats: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timelineStatsText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  timelineScroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  timelineLeft: {
    alignItems: "center",
    marginRight: 16,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 8,
  },
  timelineRight: {
    flex: 1,
  },
  timelineCard: {
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#ECF0F1",
  },
  timelineCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  timelineEventTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  timelineDate: {
    fontSize: 12,
    fontWeight: "500",
  },
  timelineEventDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  timelineProgress: {
    marginVertical: 8,
  },
  timelineProgressText: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  
  // Memories styles - Simplified and Instagram-like
  memoriesContainer: {
    flex: 1,
  },
  memoriesHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  memoriesHeaderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  memoriesTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  filtersContainer: {
    marginTop: 8,
  },
  filterScroll: {
    flexDirection: "row",
    marginBottom: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  filterEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "500",
  },
  memoriesScroll: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyStateIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateDescription: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 32,
  },
  addFirstMemoryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  addFirstMemoryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  memoriesGrid: {
    padding: 16,
    paddingBottom: 100,
  },
  memoryWrapper: {
    marginBottom: 16,
  },
  addMemoryCard: {
    height: 200,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  addMemoryGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  addMemoryContent: {
    alignItems: "center",
  },
  addMemoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  addMemoryCardText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  addMemoryCardSubtext: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 12,
  },
  floatingAddButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});