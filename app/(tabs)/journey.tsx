import React, { useState } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Map as MapIcon, ChevronRight } from "lucide-react-native";
import Colors from "@/constants/colors";
import Card from "@/components/Card";
import ProgressBar from "@/components/ProgressBar";
import StageProgress from "@/components/StageProgress";
import { useJourneyStore } from "@/store/journeyStore";
import { useUserStore } from "@/store/userStore";
import { calculateOverallProgress } from "@/utils/helpers";

export default function JourneyScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const { journeyProgress } = useJourneyStore();
  const [activeTab, setActiveTab] = useState<"roadmap" | "map" | "timeline" | "memories">("roadmap");
  
  const overallProgress = calculateOverallProgress(journeyProgress);
  
  const renderTabContent = () => {
    switch (activeTab) {
      case "roadmap":
        return (
          <View style={styles.roadmapContainer}>
            {journeyProgress.map((stage) => (
              <StageProgress
                key={stage.stage}
                stage={stage}
                onPress={() => router.push(`/journey/${stage.stage}`)}
              />
            ))}
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
            <Text style={styles.comingSoonText}>
              Timeline view coming soon
            </Text>
          </View>
        );
      case "memories":
        return (
          <View style={styles.memoriesContainer}>
            <TouchableOpacity
              style={styles.addMemoryButton}
              onPress={() => router.push("/memories/new")}
            >
              <Text style={styles.addMemoryText}>Add New Memory</Text>
            </TouchableOpacity>
            
            <Text style={styles.memoriesPlaceholder}>
              Capture your journey milestones with photos and feelings
            </Text>
          </View>
        );
      default:
        return null;
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Journey</Text>
        <View style={styles.progressContainer}>
          <ProgressBar progress={overallProgress} height={6} />
          <Text style={styles.progressText}>{overallProgress}% Complete</Text>
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
      
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {renderTabContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 14,
    color: Colors.lightText,
    marginTop: 6,
    textAlign: "right",
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
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
  },
  scrollContent: {
    padding: 16,
  },
  roadmapContainer: {
    marginBottom: 16,
  },
  mapContainer: {
    marginBottom: 16,
  },
  mapCard: {
    marginBottom: 16,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  mapPlaceholder: {
    alignItems: "center",
    padding: 16,
  },
  mapPlaceholderText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  mapDescription: {
    fontSize: 14,
    color: Colors.lightText,
    textAlign: "center",
    lineHeight: 20,
  },
  countryInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  countryCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
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
        elevation: 2,
      },
    }),
  },
  countryFlag: {
    fontSize: 32,
    marginBottom: 8,
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
  },
  arrow: {
    marginHorizontal: 8,
  },
  timelineContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  comingSoonText: {
    fontSize: 16,
    color: Colors.lightText,
    textAlign: "center",
  },
  memoriesContainer: {
    padding: 16,
  },
  addMemoryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  addMemoryText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  memoriesPlaceholder: {
    fontSize: 14,
    color: Colors.lightText,
    textAlign: "center",
    marginTop: 32,
  },
});