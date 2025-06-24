import React from "react";
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from "react-native";
import Colors from "@/constants/colors";
import { Topic } from "@/types/community";
import { getTopicColor } from "@/utils/helpers";

interface TopicSelectorProps {
  selectedTopic: Topic | null;
  onSelectTopic: (topic: Topic | null) => void;
  topics: { value: Topic; label: string }[];
  style?: any;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({
  selectedTopic,
  onSelectTopic,
  topics,
  style,
}) => {
  const handleSelectTopic = (topic: Topic | null) => {
    onSelectTopic(topic);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Horizontal Topic Pills */}
      <View style={styles.horizontalContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.topicPillsContainer}
        >
          {/* All Topics Pill */}
          <TouchableOpacity
            style={[
              styles.topicPill,
              !selectedTopic && styles.topicPillActive,
            ]}
            onPress={() => handleSelectTopic(null)}
          >
            <Text style={[
              styles.topicPillText,
              !selectedTopic && styles.topicPillTextActive,
            ]}>
              All Topics
            </Text>
          </TouchableOpacity>
          
          {/* Individual Topic Pills */}
          {topics.map((topic) => (
            <TouchableOpacity
              key={topic.value}
              style={[
                styles.topicPill,
                selectedTopic === topic.value && styles.topicPillActive,
                selectedTopic === topic.value && { 
                  backgroundColor: getTopicColor(topic.value),
                  borderColor: getTopicColor(topic.value),
                },
              ]}
              onPress={() => handleSelectTopic(topic.value)}
            >
              <View
                style={[
                  styles.topicPillIndicator,
                  { backgroundColor: getTopicColor(topic.value) },
                  selectedTopic === topic.value && { backgroundColor: Colors.white },
                ]}
              />
              <Text style={[
                styles.topicPillText,
                selectedTopic === topic.value && styles.topicPillTextActive,
              ]}>
                {topic.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  
  // Horizontal Pills Styles
  horizontalContainer: {
    marginBottom: 16,
  },
  topicPillsContainer: {
    paddingHorizontal: 16,
    paddingRight: 32,
  },
  topicPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 36,
  },
  topicPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  topicPillIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  topicPillText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
  },
  topicPillTextActive: {
    color: Colors.white,
  },
});

export default TopicSelector;