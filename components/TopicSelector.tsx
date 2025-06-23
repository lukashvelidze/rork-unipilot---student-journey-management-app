import React, { useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform } from "react-native";
import Colors from "@/constants/colors";
import { Topic } from "@/types/community";
import { getTopicColor } from "@/utils/helpers";

interface TopicSelectorProps {
  selectedTopic: Topic | null;
  onSelectTopic: (topic: Topic) => void;
  topics: { value: Topic; label: string }[];
  error?: string;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({
  selectedTopic,
  onSelectTopic,
  topics,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSelector = () => {
    setIsOpen(!isOpen);
  };

  const handleSelectTopic = (topic: Topic) => {
    onSelectTopic(topic);
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Topic</Text>
      
      <TouchableOpacity
        style={[
          styles.selectedTopic,
          error ? styles.errorBorder : null,
          selectedTopic ? { borderColor: getTopicColor(selectedTopic) } : null,
        ]}
        onPress={toggleSelector}
      >
        {selectedTopic ? (
          <View style={styles.selectedTopicContent}>
            <View
              style={[
                styles.topicIndicator,
                { backgroundColor: getTopicColor(selectedTopic) },
              ]}
            />
            <Text style={styles.selectedTopicText}>
              {topics.find((t) => t.value === selectedTopic)?.label || "Select a topic"}
            </Text>
          </View>
        ) : (
          <Text style={styles.placeholderText}>Select a topic</Text>
        )}
      </TouchableOpacity>
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      
      {isOpen && (
        <View style={styles.dropdown}>
          <ScrollView style={styles.dropdownScroll}>
            {topics.map((topic) => (
              <TouchableOpacity
                key={topic.value}
                style={[
                  styles.topicItem,
                  selectedTopic === topic.value ? styles.selectedItem : null,
                ]}
                onPress={() => handleSelectTopic(topic.value)}
              >
                <View
                  style={[
                    styles.topicIndicator,
                    { backgroundColor: getTopicColor(topic.value) },
                  ]}
                />
                <Text
                  style={[
                    styles.topicText,
                    selectedTopic === topic.value ? styles.selectedItemText : null,
                  ]}
                >
                  {topic.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    position: "relative",
    zIndex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text,
    marginBottom: 8,
  },
  selectedTopic: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: Colors.background,
  },
  selectedTopicContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  topicIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  selectedTopicText: {
    fontSize: 16,
    color: Colors.text,
  },
  placeholderText: {
    fontSize: 16,
    color: Colors.lightText,
  },
  errorBorder: {
    borderColor: Colors.error,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    marginTop: 4,
  },
  dropdown: {
    position: "absolute",
    top: 80,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 2,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowDark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  topicItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  topicText: {
    fontSize: 16,
    color: Colors.text,
  },
  selectedItem: {
    backgroundColor: Colors.lightBackground,
  },
  selectedItemText: {
    fontWeight: "500",
  },
});

export default TopicSelector;