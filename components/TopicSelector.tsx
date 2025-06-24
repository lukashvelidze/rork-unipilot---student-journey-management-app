import React, { useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform } from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import Colors from "@/constants/colors";
import { Topic } from "@/types/community";
import { getTopicColor } from "@/utils/helpers";

interface TopicSelectorProps {
  selectedTopic: Topic | null;
  onSelectTopic: (topic: Topic | null) => void;
  topics: { value: Topic; label: string }[];
  error?: string;
  style?: any;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({
  selectedTopic,
  onSelectTopic,
  topics,
  error,
  style,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSelector = () => {
    setIsOpen(!isOpen);
  };

  const handleSelectTopic = (topic: Topic | null) => {
    onSelectTopic(topic);
    setIsOpen(false);
  };

  const selectedTopicData = topics.find((t) => t.value === selectedTopic);

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

      {/* Dropdown Alternative (for forms) */}
      <View style={styles.dropdownContainer}>
        <Text style={styles.label}>Filter by Topic</Text>
        
        <TouchableOpacity
          style={[
            styles.selectedTopic,
            error ? styles.errorBorder : null,
            selectedTopic ? { borderColor: getTopicColor(selectedTopic) } : null,
            isOpen && styles.selectedTopicOpen,
          ]}
          onPress={toggleSelector}
        >
          {selectedTopicData ? (
            <View style={styles.selectedTopicContent}>
              <View
                style={[
                  styles.topicIndicator,
                  { backgroundColor: getTopicColor(selectedTopicData.value) },
                ]}
              />
              <Text style={styles.selectedTopicText}>
                {selectedTopicData.label}
              </Text>
            </View>
          ) : (
            <Text style={styles.placeholderText}>All Topics</Text>
          )}
          
          <View style={styles.chevronContainer}>
            {isOpen ? (
              <ChevronUp size={20} color={Colors.lightText} />
            ) : (
              <ChevronDown size={20} color={Colors.lightText} />
            )}
          </View>
        </TouchableOpacity>
        
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        
        {isOpen && (
          <View style={styles.dropdown}>
            <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
              {/* All Topics Option */}
              <TouchableOpacity
                style={[
                  styles.topicItem,
                  !selectedTopic ? styles.selectedItem : null,
                ]}
                onPress={() => handleSelectTopic(null)}
              >
                <View style={[styles.topicIndicator, { backgroundColor: Colors.lightText }]} />
                <Text style={[
                  styles.topicText,
                  !selectedTopic ? styles.selectedItemText : null,
                ]}>
                  All Topics
                </Text>
              </TouchableOpacity>
              
              {/* Individual Topics */}
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
  
  // Dropdown Styles
  dropdownContainer: {
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: Colors.background,
    minHeight: 48,
  },
  selectedTopicOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomColor: "transparent",
  },
  selectedTopicContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
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
    flex: 1,
  },
  placeholderText: {
    fontSize: 16,
    color: Colors.lightText,
    flex: 1,
  },
  chevronContainer: {
    marginLeft: 8,
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
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
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
    color: Colors.primary,
  },
});

export default TopicSelector;