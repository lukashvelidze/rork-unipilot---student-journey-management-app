import React from "react";
import { StyleSheet, ScrollView, TouchableOpacity, Text, View } from "react-native";
import Colors from "@/constants/colors";
import { Topic } from "@/types/community";
import { getTopicColor } from "@/utils/helpers";

interface TopicSelectorProps {
  topics: { id: Topic; label: string }[];
  selectedTopic: Topic | null;
  onSelectTopic: (topic: Topic | null) => void;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({
  topics,
  selectedTopic,
  onSelectTopic,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity
          style={[
            styles.topicItem,
            !selectedTopic && styles.selectedItem,
          ]}
          onPress={() => onSelectTopic(null)}
        >
          <Text
            style={[
              styles.topicText,
              !selectedTopic && styles.selectedText,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        {topics.map((topic) => {
          const isSelected = selectedTopic === topic.id;
          const topicColor = getTopicColor(topic.id);

          return (
            <TouchableOpacity
              key={topic.id}
              style={[
                styles.topicItem,
                isSelected && styles.selectedItem,
                isSelected && { backgroundColor: `${topicColor}20` }, // 20% opacity
              ]}
              onPress={() => onSelectTopic(topic.id)}
            >
              <Text
                style={[
                  styles.topicText,
                  isSelected && styles.selectedText,
                  isSelected && { color: topicColor },
                ]}
              >
                {topic.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  topicItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: Colors.lightBackground,
  },
  selectedItem: {
    backgroundColor: `${Colors.primary}20`, // 20% opacity
  },
  topicText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.lightText,
  },
  selectedText: {
    color: Colors.primary,
    fontWeight: "600",
  },
});

export default TopicSelector;