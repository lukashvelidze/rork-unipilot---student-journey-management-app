import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Platform, Animated, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Map as MapIcon, ChevronRight, Quote, CheckSquare, Calendar, Clock, Star, Heart, Camera, Plus } from "lucide-react-native";
import Colors from "@/constants/colors";
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
  const { user } = useUserStore();
  const { journeyProgress, recentMilestone, clearRecentMilestone, setJourneyProgress } = useJourneyStore();
  const [activeTab, setActiveTab] = useState<"roadmap" | "map" | "timeline" | "memories">("roadmap");
  const [showCelebration, setShowCelebration] = useState(false);
  const [dailyQuote, setDailyQuote] = useState(() => getRandomQuote(generalQuotes));
  const [fadeAnim] = useState(new Animated.Value(0));
  
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

  // Mock memories data
  const memories = [
    {
      id: 1,
      title: "First University Visit",
      description: "Visited my dream university campus for the first time. The architecture was breathtaking!",
      date: "2024-02-14",
      feeling: "excited",
      imageUri: "https://images.unsplash.com/photo-1562774053-701939374585?w=400&h=300&fit=crop",
    },
    {
      id: 2,
      title: "IELTS Results",
      description: "Got my IELTS results - scored 8.0! All that preparation paid off.",
      date: "2024-01-28",
      feeling: "proud",
      imageUri: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop",
    },
    {
      id: 3,
      title: "Scholarship Application",
      description: "Submitted my scholarship application. Fingers crossed!",
      date: "2024-03-05",
      feeling: "nervous",
      imageUri: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop",
    },
  ];
  
  const renderTabContent = () => {
    switch (activeTab) {
      case "roadmap":
        return (
          <View style={styles.roadmapContainer}>
            <Animated.View style={{ opacity: fadeAnim }}>
              <QuoteCard 
                quote={dailyQuote.text} 
                author={dailyQuote.author} 
                variant="highlight"
              />
            </Animated.View>
            
            <Card style={styles.instructionCard}>
              <View style={styles.instructionContent}>
                <CheckSquare size={24} color={Colors.primary} />
                <View style={styles.instructionText}>
                  <Text style={styles.instructionTitle}>How to Use Your Roadmap</Text>
                  <Text style={styles.instructionDescription}>
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
            <Card style={styles.mapCard}>
              <View style={styles.mapPlaceholder}>
                <MapIcon size={48} color={Colors.primary} />
                <Text style={styles.mapPlaceholderText}>
                  Interactive world map coming soon
                </Text>
                <Text style={styles.mapDescription}>
                  Visualize your journey from {user?.homeCountry.name} to {user?.destinationCountry.name} with an interactive globe and flight path.
                </Text>
              </View>
            </Card>
            
            <View style={styles.countryInfo}>
              <View style={styles.countryCard}>
                <Text style={styles.countryFlag}>{user?.homeCountry.flag}</Text>
                <Text style={styles.countryName}>{user?.homeCountry.name}</Text>
                <Text style={styles.countryLabel}>Home Country</Text>
              </View>
              
              <View style={styles.arrow}>
                <ChevronRight size={24} color={Colors.lightText} />
              </View>
              
              <View style={styles.countryCard}>
                <Text style={styles.countryFlag}>{user?.destinationCountry.flag}</Text>
                <Text style={styles.countryName}>{user?.destinationCountry.name}</Text>
                <Text style={styles.countryLabel}>Destination</Text>
              </View>
            </View>
          </View>
        );
      case "timeline":
        return (
          <View style={styles.timelineContainer}>
            <View style={styles.timelineHeader}>
              <LinearGradient
                colors={[Colors.gradientStart, Colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.timelineHeaderGradient}
              >
                <Text style={styles.timelineTitle}>Your Journey Timeline</Text>
                <Text style={styles.timelineSubtitle}>Track your progress through key milestones</Text>
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
                      event.completed && styles.timelineCardCompleted
                    ]}>
                      <View style={styles.timelineCardHeader}>
                        <Text style={[
                          styles.timelineEventTitle,
                          event.completed && styles.timelineEventTitleCompleted
                        ]}>
                          {event.title}
                        </Text>
                        <Text style={styles.timelineDate}>
                          {new Date(event.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </Text>
                      </View>
                      <Text style={styles.timelineEventDescription}>
                        {event.description}
                      </Text>
                      {event.completed && (
                        <View style={styles.completedBadge}>
                          <CheckSquare size={12} color={Colors.success} />
                          <Text style={styles.completedText}>Completed</Text>
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
                colors={[Colors.memoryPink, Colors.memoryPurple]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.memoriesHeaderGradient}
              >
                <View style={styles.memoriesHeaderContent}>
                  <Text style={styles.memoriesTitle}>Your Journey Memories</Text>
                  <Text style={styles.memoriesSubtitle}>Capture & share your special moments</Text>
                  <TouchableOpacity
                    style={styles.addMemoryButton}
                    onPress={() => router.push("/memories/new")}
                  >
                    <Plus size={20} color={Colors.white} />
                    <Text style={styles.addMemoryText}>Add Memory</Text>
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
                    colors={[Colors.memoryOrange, Colors.memoryBlue]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.addMemoryGradient}
                  >
                    <Camera size={32} color={Colors.white} />
                    <Text style={styles.addMemoryCardText}>Add New Memory</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={styles.memoriesFooter}>
                <Text style={styles.memoriesFooterText}>
                  ✨ Share your beautiful memories on social media
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
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your journey...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {showCelebration && (
        <CelebrationAnimation 
          visible={showCelebration} 
          type={recentMilestone?.type || "confetti"}
          onAnimationFinish={() => setShowCelebration(false)}
        />
      )}
      
      <View style={styles.header}>
        <Text style={styles.title}>Your Journey</Text>
        <View style={styles.progressContainer}>
          <ProgressBar 
            progress={overallProgress} 
            height={6} 
            animated={true}
          />
          <View style={styles.progressTextContainer}>
            <Text style={styles.progressLabel}>Overall Progress</Text>
            <Text style={styles.progressText}>{overallProgress}%</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "roadmap" && styles.activeTab]}
          onPress={() => setActiveTab("roadmap")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "roadmap" && styles.activeTabText,
            ]}
          >
            Roadmap
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === "map" && styles.activeTab]}
          onPress={() => setActiveTab("map")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "map" && styles.activeTabText,
            ]}
          >
            Map
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === "timeline" && styles.activeTab]}
          onPress={() => setActiveTab("timeline")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "timeline" && styles.activeTabText,
            ]}
          >
            Timeline
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === "memories" && styles.activeTab]}
          onPress={() => setActiveTab("memories")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "memories" && styles.activeTabText,
            ]}
          >
            Memories
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        {renderTabContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.lightText,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
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
    color: Colors.text,
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
    color: Colors.lightText,
  },
  progressText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.lightText,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
  },
  
  // Roadmap styles
  roadmapContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  instructionCard: {
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: Colors.lightBackground,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
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
    color: Colors.text,
    marginBottom: 4,
  },
  instructionDescription: {
    fontSize: 14,
    color: Colors.lightText,
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
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  mapPlaceholder: {
    alignItems: "center",
    padding: 16,
  },
  mapPlaceholderText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  mapDescription: {
    fontSize: 14,
    color: Colors.lightText,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: "80%",
  },
  countryInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  countryCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  countryFlag: {
    fontSize: 36,
    marginBottom: 12,
  },
  countryName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
    textAlign: "center",
  },
  countryLabel: {
    fontSize: 12,
    color: Colors.lightText,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  arrow: {
    marginHorizontal: 12,
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
  timelineTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.white,
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
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: Colors.border,
  },
  timelineCardCompleted: {
    borderLeftColor: Colors.success,
    backgroundColor: "rgba(107, 207, 127, 0.05)",
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
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  timelineEventTitleCompleted: {
    color: Colors.success,
  },
  timelineDate: {
    fontSize: 12,
    color: Colors.lightText,
    fontWeight: "500",
  },
  timelineEventDescription: {
    fontSize: 14,
    color: Colors.lightText,
    lineHeight: 20,
    marginBottom: 8,
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(107, 207, 127, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedText: {
    fontSize: 12,
    color: Colors.success,
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
  },
  memoriesHeaderContent: {
    alignItems: "center",
  },
  memoriesTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.white,
    marginBottom: 4,
    textAlign: "center",
  },
  memoriesSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: 20,
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
    color: Colors.white,
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
    color: Colors.white,
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
  },
  memoriesFooter: {
    alignItems: "center",
    paddingVertical: 24,
  },
  memoriesFooterText: {
    fontSize: 16,
    color: Colors.lightText,
    textAlign: "center",
    fontStyle: "italic",
  },
});