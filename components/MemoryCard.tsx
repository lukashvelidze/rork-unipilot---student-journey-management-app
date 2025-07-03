import React from "react";
import { StyleSheet, View, Text, TouchableOpacity, ImageBackground } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Heart, MessageCircle, Share, Calendar, MapPin } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import { Memory, MemoryMood } from "@/types/user";

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

const getMoodColor = (mood: MemoryMood | undefined): string => {
  switch (mood) {
    case "excited":
      return "#FF6B6B";
    case "nervous":
      return "#9C27B0";
    case "happy":
      return "#4ECDC4";
    case "proud":
      return "#42A5F5";
    case "grateful":
      return "#66BB6A";
    case "accomplished":
      return "#FFA726";
    case "hopeful":
      return "#AB47BC";
    case "determined":
      return "#EF5350";
    default:
      return "#FF6B6B";
  }
};

const getMoodEmoji = (mood: MemoryMood | undefined): string => {
  switch (mood) {
    case "excited":
      return "🤩";
    case "nervous":
      return "😰";
    case "happy":
      return "😊";
    case "proud":
      return "😤";
    case "grateful":
      return "🙏";
    case "accomplished":
      return "🏆";
    case "hopeful":
      return "🌟";
    case "determined":
      return "💪";
    default:
      return "😊";
  }
};

export default function MemoryCard({ memory, onPress }: MemoryCardProps) {
  const Colors = useColors();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "research":
        return "#FF6B6B";
      case "application":
        return "#4ECDC4";
      case "visa":
        return "#42A5F5";
      case "pre_departure":
        return "#9C27B0";
      case "arrival":
        return "#FF9800";
      case "academic":
        return "#66BB6A";
      case "career":
        return "#EF5350";
      default:
        return Colors.primary;
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      <View style={[styles.card, { backgroundColor: Colors.card }]}>
        {/* Image Header */}
        <View style={styles.imageContainer}>
          <ImageBackground
            source={{ uri: memory.imageUrl }}
            style={styles.image}
            imageStyle={styles.imageStyle}
          >
            <LinearGradient
              colors={["transparent", "rgba(0, 0, 0, 0.7)"]}
              style={styles.imageOverlay}
            >
              {/* Milestone Badge */}
              {memory.milestone && memory.badge && (
                <View style={[styles.milestoneBadge, { backgroundColor: memory.badgeColor }]}>
                  <Text style={styles.badgeEmoji}>{memory.badge}</Text>
                </View>
              )}
              
              {/* Stage Badge */}
              <View style={[styles.stageBadge, { backgroundColor: getStageColor(memory.stage) }]}>
                <Text style={styles.stageBadgeText}>{memory.stage.replace('_', ' ').toUpperCase()}</Text>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Header with mood and date */}
          <View style={styles.contentHeader}>
            <View style={styles.moodContainer}>
              <Text style={styles.moodEmoji}>{getMoodEmoji(memory.mood)}</Text>
              <View style={[styles.moodDot, { backgroundColor: getMoodColor(memory.mood) }]} />
            </View>
            <View style={styles.dateContainer}>
              <Calendar size={12} color={Colors.lightText} />
              <Text style={[styles.dateText, { color: Colors.lightText }]}>
                {formatDate(memory.date)}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: Colors.text }]} numberOfLines={2}>
            {memory.title}
          </Text>

          {/* Description */}
          <Text style={[styles.description, { color: Colors.lightText }]} numberOfLines={3}>
            {memory.description}
          </Text>

          {/* Tags */}
          {memory.tags && memory.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {memory.tags.slice(0, 3).map((tag, index) => (
                <View key={index} style={[styles.tag, { backgroundColor: Colors.lightBackground }]}>
                  <Text style={[styles.tagText, { color: Colors.primary }]}>#{tag}</Text>
                </View>
              ))}
              {memory.tags.length > 3 && (
                <Text style={[styles.moreTagsText, { color: Colors.lightText }]}>
                  +{memory.tags.length - 3} more
                </Text>
              )}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <View style={styles.leftActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Heart size={16} color={Colors.lightText} />
                <Text style={[styles.actionText, { color: Colors.lightText }]}>
                  {memory.likes || 0}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <MessageCircle size={16} color={Colors.lightText} />
                <Text style={[styles.actionText, { color: Colors.lightText }]}>
                  {memory.comments || 0}
                </Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.shareButton}>
              <Share size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  card: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  imageContainer: {
    height: 200,
    position: "relative",
  },
  image: {
    flex: 1,
  },
  imageStyle: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  imageOverlay: {
    flex: 1,
    justifyContent: "space-between",
    padding: 16,
  },
  milestoneBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeEmoji: {
    fontSize: 20,
  },
  stageBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stageBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  content: {
    padding: 16,
  },
  contentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  moodContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  moodEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  moodDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "500",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: 16,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "500",
  },
  moreTagsText: {
    fontSize: 12,
    fontStyle: "italic",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftActions: {
    flexDirection: "row",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  actionText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "500",
  },
  shareButton: {
    padding: 8,
  },
});