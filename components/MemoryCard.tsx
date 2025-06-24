import React from "react";
import { StyleSheet, View, Text, Image, TouchableOpacity, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Calendar, Heart, Share2 } from "lucide-react-native";
import Colors from "@/constants/colors";
import Card from "./Card";
import { Memory } from "@/types/user";
import { formatDate } from "@/utils/dateUtils";

interface MemoryCardProps {
  memory: Memory;
  onPress?: () => void;
}

const { width } = Dimensions.get("window");
const cardWidth = width - 32; // Account for padding

const MemoryCard: React.FC<MemoryCardProps> = ({ memory, onPress }) => {
  const getFeelingColor = () => {
    switch (memory.feeling) {
      case "excited":
        return Colors.memoryOrange;
      case "happy":
        return Colors.memoryGreen;
      case "nervous":
        return Colors.memoryBlue;
      case "proud":
        return Colors.memoryPink;
      case "sad":
        return Colors.memoryPurple;
      default:
        return Colors.primary;
    }
  };

  const getFeelingGradient = () => {
    switch (memory.feeling) {
      case "excited":
        return [Colors.memoryOrange, "#FF6B35"];
      case "happy":
        return [Colors.memoryGreen, "#2ECC71"];
      case "nervous":
        return [Colors.memoryBlue, "#3498DB"];
      case "proud":
        return [Colors.memoryPink, "#E74C3C"];
      case "sad":
        return [Colors.memoryPurple, "#8E44AD"];
      default:
        return [Colors.primary, Colors.secondary];
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <View style={styles.cardContainer}>
        {/* Image with gradient overlay */}
        <View style={styles.imageContainer}>
          {memory.imageUri ? (
            <Image
              source={{ uri: memory.imageUri }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={getFeelingGradient()}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.placeholderGradient}
            >
              <Heart size={40} color={Colors.white} fill={Colors.white} />
            </LinearGradient>
          )}
          
          {/* Gradient overlay for better text readability */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            style={styles.imageOverlay}
          />
          
          {/* Floating feeling badge */}
          <View style={[styles.feelingBadge, { backgroundColor: getFeelingColor() }]}>
            <Heart size={12} color={Colors.white} fill={Colors.white} />
            <Text style={styles.feelingText}>
              {memory.feeling.charAt(0).toUpperCase() + memory.feeling.slice(1)}
            </Text>
          </View>
          
          {/* Share button */}
          <TouchableOpacity style={styles.shareButton}>
            <Share2 size={16} color={Colors.white} />
          </TouchableOpacity>
        </View>
        
        {/* Content overlay */}
        <View style={styles.contentOverlay}>
          <Text style={styles.title} numberOfLines={2}>
            {memory.title}
          </Text>
          
          <View style={styles.dateContainer}>
            <Calendar size={14} color="rgba(255, 255, 255, 0.8)" />
            <Text style={styles.date}>{formatDate(memory.date)}</Text>
          </View>
          
          {memory.description && (
            <Text style={styles.description} numberOfLines={2}>
              {memory.description}
            </Text>
          )}
        </View>
        
        {/* Instagram-style border */}
        <LinearGradient
          colors={getFeelingGradient()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.borderGradient}
        >
          <View style={styles.innerBorder} />
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: Colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    position: "relative",
  },
  imageContainer: {
    height: 240,
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
    height: "60%",
  },
  feelingBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  feelingText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  shareButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  contentOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.white,
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginLeft: 6,
    fontWeight: "500",
  },
  description: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 20,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  borderGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 2,
    borderRadius: 20,
  },
  innerBorder: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 18,
  },
});

export default MemoryCard;