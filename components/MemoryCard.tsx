import React from "react";
import { StyleSheet, View, Text, Image, TouchableOpacity } from "react-native";
import { Calendar, Heart } from "lucide-react-native";
import Colors from "@/constants/colors";
import Card from "./Card";
import { Memory } from "@/types/user";
import { formatDate } from "@/utils/dateUtils";

interface MemoryCardProps {
  memory: Memory;
  onPress?: () => void;
}

const MemoryCard: React.FC<MemoryCardProps> = ({ memory, onPress }) => {
  const getFeelingColor = () => {
    switch (memory.feeling) {
      case "excited":
        return "#FF9500";
      case "happy":
        return "#34C759";
      case "nervous":
        return "#5856D6";
      case "proud":
        return "#FF2D55";
      case "sad":
        return "#007AFF";
      default:
        return Colors.primary;
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.card}>
        {memory.imageUri && (
          <Image
            source={{ uri: memory.imageUri }}
            style={styles.image}
            resizeMode="cover"
          />
        )}
        
        <View style={styles.content}>
          <Text style={styles.title}>{memory.title}</Text>
          
          <View style={styles.metaContainer}>
            <View style={styles.dateContainer}>
              <Calendar size={14} color={Colors.lightText} style={styles.icon} />
              <Text style={styles.date}>{formatDate(memory.date)}</Text>
            </View>
            
            <View style={styles.feelingContainer}>
              <Heart
                size={14}
                color={getFeelingColor()}
                fill={getFeelingColor()}
                style={styles.icon}
              />
              <Text
                style={[
                  styles.feeling,
                  { color: getFeelingColor() },
                ]}
              >
                {memory.feeling.charAt(0).toUpperCase() + memory.feeling.slice(1)}
              </Text>
            </View>
          </View>
          
          {memory.description && (
            <Text style={styles.description} numberOfLines={3}>
              {memory.description}
            </Text>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 160,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: "row",
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  icon: {
    marginRight: 4,
  },
  date: {
    fontSize: 14,
    color: Colors.lightText,
  },
  feelingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  feeling: {
    fontSize: 14,
  },
  description: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
});

export default MemoryCard;