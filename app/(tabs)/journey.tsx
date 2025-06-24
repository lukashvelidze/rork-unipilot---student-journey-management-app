import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Platform, Animated, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Map as MapIcon, ChevronRight, Quote, CheckSquare, Calendar, Clock, Star, Heart, Camera, Plus, Plane, Globe, Timer, MapPin } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import Card from "@/components/Card";
import ProgressBar from "@/components/ProgressBar";
import StageProgress from "@/components/StageProgress";
import QuoteCard from "@/components/QuoteCard";
import CelebrationAnimation from "@/components/CelebrationAnimation";
import MemoryCard from "@/components/MemoryCard";
import { useJourneyStore } from "@/store/journeyStore";
import { useUserStore } from "@/store/userStore";
import { calculateOverallProgress } from "@/utils/helpers";
import { getRandomQuote, generalQuotes } from "@/mocks/quotes";
import { initialJourneyProgress } from "@/mocks/journeyTasks";

const { width } = Dimensions.get("window");

export default function JourneyScreen() {
  const router = useRouter();
  const Colors = useColors();
  const { user } = useUserStore();
  const { journeyProgress, recentMilestone, clearRecentMilestone, setJourneyProgress } = useJourneyStore();
  const [activeTab, setActiveTab] = useState<"roadmap" | "map" | "timeline" | "memories">("roadmap");
  const [showCelebration, setShowCelebration] = useState(false);
  const [dailyQuote, setDailyQuote] = useState(() => getRandomQuote(generalQuotes));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [planeAnim] = useState(new Animated.Value(0));
  const [treeGrowthAnim] = useState(new Animated.Value(0));
  
  // Initialize journey progress if not already set
  useEffect(() => {
    if (user && journeyProgress.length === 0) {
      console.log("Setting initial journey progress");
      setJourneyProgress(initialJourneyProgress);
    }
  }, [user, journeyProgress.length, setJourneyProgress]);
  
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

  // Plane animation for memories
  useEffect(() => {
    if (activeTab === "memories") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(planeAnim, {
            toValue: 1,
            duration: 8000,
            useNativeDriver: true,
          }),
          Animated.timing(planeAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [activeTab, planeAnim]);

  // Tree growth animation
  useEffect(() => {
    Animated.timing(treeGrowthAnim, {
      toValue: memories.length / 10, // Grow based on number of memories
      duration: 1500,
      useNativeDriver: true,
    }).start();
  }, [treeGrowthAnim]);

  // Mock timeline data
  const timelineEvents = [
    {
      id: 1,
      title: "Started Your Journey",
      description: "Welcome to your study abroad adventure!",
      date: "2024-01-15",
      type: "milestone",
      completed: true,
      icon: Star,
    },
    {
      id: 2,
      title: "Research Phase Complete",
      description: "Explored universities and programs",
      date: "2024-02-20",
      type: "achievement",
      completed: true,
      icon: CheckSquare,
    },
    {
      id: 3,
      title: "Application Submitted",
      description: "Submitted applications to 5 universities",
      date: "2024-03-15",
      type: "milestone",
      completed: false,
      icon: Calendar,
    },
    {
      id: 4,
      title: "Visa Interview",
      description: "Scheduled visa appointment",
      date: "2024-04-10",
      type: "upcoming",
      completed: false,
      icon: Clock,
    },
    {
      id: 5,
      title: "Departure Day",
      description: "Begin your new adventure!",
      date: "2024-08-25",
      type: "future",
      completed: false,
      icon: Heart,
    },
  ];

  // Mock memories data - updated to match Memory interface
  const memories = [
    {
      id: "1",
      title: "First University Visit",
      description: "Visited my dream university campus for the first time. The architecture was breathtaking!",
      date: "2024-02-14",
      stage: "research" as const,
      imageUrl: "https://images.unsplash.com/photo-1562774053-701939374585?w=400&h=300&fit=crop",
      tags: ["university", "campus", "visit"],
      mood: "excited" as const,
    },
    {
      id: "2",
      title: "IELTS Results",
      description: "Got my IELTS results - scored 8.0! All that preparation paid off.",
      date: "2024-01-28",
      stage: "research" as const,
      imageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop",
      tags: ["ielts", "test", "results"],
      mood: "proud" as const,
    },
    {
      id: "3",
      title: "Scholarship Application",
      description: "Submitted my scholarship application. Fingers crossed!",
      date: "2024-03-05",
      stage: "application" as const,
      imageUrl: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop",
      tags: ["scholarship", "application"],
      mood: "nervous" as const,
    },
  ];

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
  
  const renderTabContent = () => {
    switch (activeTab) {
      case "roadmap":
        return (
          <View style={styles.roadmapContainer}>
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
              {journeyProgress.map((stage) => (
                <StageProgress
                  key={stage.stage}
                  stage={stage}
                  onPress={() => router.push(`/journey/${stage.stage}`)}
                />
              ))}
            </View>
          </View>
        );
      case "map":
        return (
          <View style={styles.mapContainer}>
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
                      <Plane size={24} color={Colors.white} />
                      <View style={styles.flightLine} />
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
          </View>
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
                      event.completed && { backgroundColor: Colors.success + "10" }
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
                      {event.completed && (
                        <View style={[styles.completedBadge, { backgroundColor: Colors.success + "20" }]}>
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
            <View style={styles.memoriesHeader}>
              <LinearGradient
                colors={[Colors.memoryOrange, Colors.memoryBlue]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.memoriesHeaderGradient}
              >
                <View style={styles.memoriesHeaderContent}>
                  {/* Animated plane moving across clouds */}
                  <Animated.View style={[
                    styles.animatedPlane,
                    {
                      transform: [{
                        translateX: planeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-50, width + 50],
                        })
                      }]
                    }
                  ]}>
                    <Plane size={24} color={Colors.white} />
                  </Animated.View>
                  
                  <Text style={styles.memoriesTitle}>Journey Memories</Text>
                  <Text style={styles.memoriesSubtitle}>Capture moments that matter ✨</Text>
                  
                  {/* Growing tree visualization */}
                  <Animated.View style={[
                    styles.memoryTree,
                    {
                      transform: [{
                        scaleY: treeGrowthAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.3, 1],
                        })
                      }]
                    }
                  ]}>
                    <Text style={styles.treeEmoji}>🌳</Text>
                    <Text style={styles.treeText}>{memories.length} memories collected</Text>
                  </Animated.View>
                  
                  <TouchableOpacity
                    style={styles.addMemoryButton}
                    onPress={() => router.push("/memories/new")}
                  >
                    <Plus size={20} color={Colors.white} />
                    <Text style={styles.addMemoryText}>Capture Memory</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>

            <ScrollView style={styles.memoriesScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.memoriesGrid}>
                {memories.map((memory) => (
                  <View key={memory.id} style={styles.memoryWrapper}>
                    <MemoryCard
                      memory={memory}
                      onPress={() => router.push(`/memories/${memory.id}`)}
                    />
                  </View>
                ))}
                
                {/* Add Memory Card */}
                <TouchableOpacity
                  style={styles.addMemoryCard}
                  onPress={() => router.push("/memories/new")}
                >
                  <LinearGradient
                    colors={[Colors.memoryGreen, Colors.memoryPink]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.addMemoryGradient}
                  >
                    <Camera size={32} color={Colors.white} />
                    <Text style={styles.addMemoryCardText}>Add New Memory</Text>
                    <Text style={styles.addMemoryCardSubtext}>Share your journey</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={styles.memoriesFooter}>
                <Text style={[styles.memoriesFooterText, { color: Colors.lightText }]}>
                  📸 Perfect for Instagram stories & social sharing
                </Text>
              </View>
            </ScrollView>
          </View>
        );
      default:
        return null;
    }
  };
  
  if (!user) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: Colors.background }]}>
        <Text style={[styles.loadingText, { color: Colors.lightText }]}>Loading your journey...</Text>
      </View>
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
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
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
    </View>
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
    padding: 20,
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
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressTextContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 14,
  },
  progressText: {
    fontSize: 16,
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
    padding: 16,
    paddingBottom: 32,
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
  },
  
  // Map styles
  mapContainer: {
    padding: 16,
    paddingBottom: 32,
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
    width: 60,
    height: 2,
    backgroundColor: "#FFFFFF",
    marginTop: 8,
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
    marginBottom: 16,
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
  
  // Memories styles
  memoriesContainer: {
    flex: 1,
  },
  memoriesHeader: {
    marginBottom: 16,
  },
  memoriesHeaderGradient: {
    padding: 24,
    paddingTop: 32,
    minHeight: 200,
    position: "relative",
    overflow: "hidden",
  },
  memoriesHeaderContent: {
    alignItems: "center",
    position: "relative",
    zIndex: 2,
  },
  animatedPlane: {
    position: "absolute",
    top: 20,
    zIndex: 1,
  },
  memoriesTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
    textAlign: "center",
  },
  memoriesSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: 20,
  },
  memoryTree: {
    alignItems: "center",
    marginBottom: 20,
  },
  treeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  treeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  addMemoryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  addMemoryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  memoriesScroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  memoriesGrid: {
    paddingBottom: 16,
  },
  memoryWrapper: {
    marginBottom: 16,
  },
  addMemoryCard: {
    height: 200,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  addMemoryGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  addMemoryCardText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
  },
  addMemoryCardSubtext: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    marginTop: 4,
  },
  memoriesFooter: {
    alignItems: "center",
    paddingVertical: 24,
  },
  memoriesFooterText: {
    fontSize: 16,
    textAlign: "center",
    fontStyle: "italic",
  },
});