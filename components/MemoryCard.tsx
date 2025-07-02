import React from "react";
import { StyleSheet, View, Text, Image, TouchableOpacity, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Calendar, Heart, Share2, MapPin, MessageCircle, Award } from "lucide-react-native";
import Colors from "@/constants/colors";
import { Memory } from "@/types/user";
import { formatDate } from "@/utils/dateUtils";

interface MemoryCardProps {
  memory: Memory & {
    badge?: string;
    badgeTitle?: string;
    badgeColor?: string;
    milestone?: boolean;
    likes?: number;
    comments?: number;
  };
  onPress?: () => void;
}

const { width } = Dimensions.get("window");
const cardWidth = width - 32; // Account for padding

const MemoryCard: React.FC<MemoryCardProps> = ({ memory, onPress }) => {
  const getMoodColor = () => {
    if (memory.badgeColor) return memory.badgeColor;
    
    switch (memory.mood) {
      case "excited":
        return Colors.memoryOrange;
      case "happy":
        return Colors.memoryGreen;
      case "nervous":
        return Colors.memoryBlue;
      case "proud":
        return Colors.memoryPink;
      case "overwhelmed":
        return Colors.memoryPurple;
      case "confident":
        return Colors.primary;
      default:
        return Colors.primary;
    }
  };

  const getMoodGradient = (): [string, string] => {
    if (memory.badgeColor) {
      return [memory.badgeColor, memory.badgeColor + "80"];
    }
    
    switch (memory.mood) {
      case "excited":
        return [Colors.memoryOrange, "#FF6B35"];
      case "happy":
        return [Colors.memoryGreen, "#2ECC71"];
      case "nervous":
        return [Colors.memoryBlue, "#3498DB"];
      case "proud":
        return [Colors.memoryPink, "#E74C3C"];
      case "overwhelmed":
        return [Colors.memoryPurple, "#8E44AD"];
      case "confident":
        return [Colors.primary, Colors.secondary];
      default:
        return [Colors.primary, Colors.secondary];
    }
  };

  const getMoodEmoji = () => {
    if (memory.badge) return memory.badge;
    
    switch (memory.mood) {
      case "excited":
        return "🤩";
      case "happy":
        return "😊";
      case "nervous":
        return "😰";
      case "proud":
        return "🥳";
      case "overwhelmed":
        return "😵";
      case "confident":
        return "😎";
      default:
        return "😊";
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.95}>
      <View style={styles.cardContainer}>
        {/* Main Image */}
        <View style={styles.imageContainer}>
          {memory.imageUrl ? (
            <Image
              source={{ uri: memory.imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={getMoodGradient()}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.placeholderGradient}
            >
              <Heart size={48} color={Colors.white} fill={Colors.white} />
            </LinearGradient>
          )}
          
          {/* Instagram-style gradient overlay */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)"]}
            style={styles.imageOverlay}
          />
          
          {/* Enhanced badge with milestone indicator */}
          <View style={[styles.moodBadge, { backgroundColor: getMoodColor() }]}>
            <Text style={styles.moodEmoji}>{getMoodEmoji()}</Text>
            <Text style={styles.moodText}>
              {memory.badgeTitle || (memory.mood.charAt(0).toUpperCase() + memory.mood.slice(1))}
            </Text>
            {memory.milestone && (
              <View style={styles.milestoneIndicator}>
                <Award size={8} color={Colors.white} />
              </View>
            )}
          </View>
          
          {/* Enhanced stats */}
          <View style={styles.statsContainer}>
            {memory.likes !== undefined && (
              <View style={styles.statItem}>
                <Heart size={14} color={Colors.white} />
                <Text style={styles.statText}>{memory.likes}</Text>
              </View>
            )}
            {memory.comments !== undefined && (
              <View style={styles.statItem}>
                <MessageCircle size={14} color={Colors.white} />
                <Text style={styles.statText}>{memory.comments}</Text>
              </View>
            )}
          </View>
          
          {/* Share button */}
          <TouchableOpacity style={styles.shareButton}>
            <Share2 size={16} color={Colors.white} />
          </TouchableOpacity>
        </View>
        
        {/* Content overlay */}
        <View style={styles.contentOverlay}>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {memory.title}
            </Text>
            <View style={styles.stageTag}>
              <Text style={styles.stageText}>{memory.stage}</Text>
            </View>
          </View>
          
          <View style={styles.metaContainer}>
            <View style={styles.dateContainer}>
              <Calendar size={14} color="rgba(255, 255, 255, 0.8)" />
              <Text style={styles.date}>{formatDate(memory.date)}</Text>
            </View>
            
            {memory.tags && memory.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {memory.tags.slice(0, 2).map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          
          {memory.description && (
            <Text style={styles.description} numberOfLines={2}>
              {memory.description}
            </Text>
          )}
        </View>
        
        {/* Instagram-style story border for milestones */}
        {memory.milestone && (
          <LinearGradient
            colors={["#833AB4", "#FD1D1D", "#FCB045"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.storyBorder}
          >
            <View style={styles.innerBorder} />
          </LinearGradient>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: Colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
    position: "relative",
  },
  imageContainer: {
    height: 280,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "70%",
  },
  moodBadge: {
    position: "absolute",
    top: 20,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  moodEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  moodText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
  shareButton: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  contentOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.white,
    flex: 1,
    marginRight: 12,
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  stageTag: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  stageText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  metaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  date: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginLeft: 6,
    fontWeight: "600",
  },
  tagsContainer: {
    flexDirection: "row",
  },
  tag: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 4,
  },
  tagText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 10,
    fontWeight: "500",
  },
  description: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.95)",
    lineHeight: 20,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  storyBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 3,
    borderRadius: 24,
  },
  innerBorder: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 21,
  },
  milestoneIndicator: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: Colors.warning,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  statsContainer: {
    position: "absolute",
    top: 20,
    right: 20,
    flexDirection: "row",
    gap: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.white,
  },
});

export default MemoryCard;