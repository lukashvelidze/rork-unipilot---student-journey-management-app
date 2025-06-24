import React from "react";
import { StyleSheet, View, Text, TouchableOpacity, Image } from "react-native";
import { Clock, Star, Users, Lock, BookOpen, Video, Target, FileText, Calendar, Zap } from "lucide-react-native";
import Colors from "@/constants/colors";
import Card from "./Card";
import { ResourcePreview, ResourceType } from "@/types/premiumResources";

interface PremiumResourceCardProps {
  resource: ResourcePreview;
  onPress?: () => void;
  isPremium?: boolean;
}

const PremiumResourceCard: React.FC<PremiumResourceCardProps> = ({
  resource,
  onPress,
  isPremium = false,
}) => {
  const getTypeIcon = (type: ResourceType) => {
    switch (type) {
      case "guide":
        return BookOpen;
      case "video":
        return Video;
      case "webinar":
        return Calendar;
      case "tool":
        return Target;
      case "template":
        return FileText;
      case "course":
        return Zap;
      default:
        return FileText;
    }
  };
  
  const getTypeColor = (type: ResourceType) => {
    switch (type) {
      case "guide":
        return Colors.primary;
      case "video":
        return Colors.accent;
      case "webinar":
        return Colors.success;
      case "tool":
        return Colors.info;
      case "template":
        return Colors.secondary;
      case "course":
        return Colors.warning;
      default:
        return Colors.primary;
    }
  };
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return Colors.success;
      case "Intermediate":
        return Colors.warning;
      case "Advanced":
        return Colors.error;
      default:
        return Colors.lightText;
    }
  };
  
  const TypeIcon = getTypeIcon(resource.type);
  const typeColor = getTypeColor(resource.type);
  
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={[styles.card, !isPremium && styles.lockedCard]}>
        {/* Hero Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: resource.heroImage }} style={styles.heroImage} />
          {!isPremium && (
            <View style={styles.lockOverlay}>
              <Lock size={32} color={Colors.white} />
            </View>
          )}
          <View style={styles.imageOverlay}>
            <View style={styles.badges}>
              {resource.isNew && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              )}
              {resource.isFeatured && (
                <View style={styles.featuredBadge}>
                  <Star size={12} color={Colors.white} />
                  <Text style={styles.featuredBadgeText}>Featured</Text>
                </View>
              )}
            </View>
            <View style={[styles.typeIcon, { backgroundColor: typeColor + "20" }]}>
              <TypeIcon size={20} color={typeColor} />
            </View>
          </View>
        </View>
        
        {/* Content */}
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.category}>{resource.category}</Text>
            <View style={styles.difficultyBadge}>
              <Text style={[styles.difficultyText, { color: getDifficultyColor(resource.difficulty) }]}>
                {resource.difficulty}
              </Text>
            </View>
          </View>
          
          <Text style={styles.title} numberOfLines={2}>
            {resource.title}
          </Text>
          
          <Text style={styles.description} numberOfLines={2}>
            {resource.description}
          </Text>
          
          {/* Preview Text */}
          <View style={[styles.previewContainer, !isPremium && styles.previewBlurred]}>
            <Text style={[styles.previewText, !isPremium && styles.blurredText]} numberOfLines={3}>
              {resource.previewText}
            </Text>
            {!isPremium && (
              <View style={styles.previewOverlay}>
                <Lock size={16} color={Colors.primary} />
                <Text style={styles.unlockText}>Unlock with Premium</Text>
              </View>
            )}
          </View>
          
          {/* Meta Information */}
          <View style={styles.meta}>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Clock size={14} color={Colors.lightText} />
                <Text style={styles.metaText}>{resource.estimatedTime}</Text>
              </View>
              
              <View style={styles.metaItem}>
                <Star size={14} color={Colors.warning} />
                <Text style={styles.metaText}>{resource.rating}</Text>
              </View>
              
              <View style={styles.metaItem}>
                <Users size={14} color={Colors.lightText} />
                <Text style={styles.metaText}>{resource.completions.toLocaleString()}</Text>
              </View>
            </View>
            
            <Text style={styles.author}>By {resource.author}</Text>
          </View>
          
          {/* Action Button */}
          <View style={styles.actionContainer}>
            <View style={[
              styles.actionButton,
              isPremium ? styles.actionButtonEnabled : styles.actionButtonDisabled
            ]}>
              <Text style={[
                styles.actionButtonText,
                isPremium ? styles.actionButtonTextEnabled : styles.actionButtonTextDisabled
              ]}>
                {isPremium ? "Start Learning" : "Premium Required"}
              </Text>
              {!isPremium && <Lock size={16} color={Colors.mutedText} />}
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 20,
    overflow: "hidden",
    padding: 0,
  },
  lockedCard: {
    opacity: 0.9,
  },
  imageContainer: {
    position: "relative",
    height: 180,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  lockOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "space-between",
    padding: 12,
  },
  badges: {
    flexDirection: "row",
    alignSelf: "flex-end",
    gap: 6,
  },
  newBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "700",
  },
  featuredBadge: {
    backgroundColor: Colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  featuredBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "700",
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  category: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: Colors.lightBackground,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: "600",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 6,
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    color: Colors.lightText,
    marginBottom: 12,
    lineHeight: 20,
  },
  previewContainer: {
    position: "relative",
    backgroundColor: Colors.lightBackground,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  previewBlurred: {
    overflow: "hidden",
  },
  previewText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  blurredText: {
    color: Colors.mutedText,
  },
  previewOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  unlockText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary,
  },
  meta: {
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.lightText,
  },
  author: {
    fontSize: 12,
    color: Colors.mutedText,
    fontStyle: "italic",
  },
  actionContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonEnabled: {
    backgroundColor: Colors.primary,
  },
  actionButtonDisabled: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  actionButtonTextEnabled: {
    color: Colors.white,
  },
  actionButtonTextDisabled: {
    color: Colors.mutedText,
  },
});

export default PremiumResourceCard;