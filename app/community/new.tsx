import React, { useState } from "react";
import { StyleSheet, View, Text, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { useCommunityStore } from "@/store/communityStore";
import { Topic } from "@/types/community";
import { generateId } from "@/utils/helpers";

export default function NewPostScreen() {
  const router = useRouter();
  const { addPost } = useCommunityStore();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [topic, setTopic] = useState<Topic>("general");
  const [errors, setErrors] = useState({
    title: "",
    content: "",
  });
  
  const topics: { value: Topic; label: string }[] = [
    { value: "visa", label: "Visa" },
    { value: "university", label: "University" },
    { value: "accommodation", label: "Housing" },
    { value: "finances", label: "Finances" },
    { value: "culture", label: "Culture" },
    { value: "academics", label: "Academics" },
    { value: "career", label: "Career" },
    { value: "general", label: "General" },
  ];
  
  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...errors };
    
    if (!title.trim()) {
      newErrors.title = "Title is required";
      isValid = false;
    } else {
      newErrors.title = "";
    }
    
    if (!content.trim()) {
      newErrors.content = "Content is required";
      isValid = false;
    } else {
      newErrors.content = "";
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  const handleSubmit = () => {
    if (validateForm()) {
      const newPost = {
        id: generateId(),
        userId: "current_user", // In a real app, this would be the current user's ID
        userName: "You", // In a real app, this would be the current user's name
        userAvatar: undefined, // In a real app, this would be the current user's avatar
        title,
        content,
        topic,
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: [],
        isLiked: false,
        isPremium: false,
      };
      
      addPost(newPost);
      
      Alert.alert(
        "Success",
        "Post created successfully",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    }
  };
  
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Create New Discussion</Text>
      
      <Input
        label="Title"
        placeholder="Enter a descriptive title"
        value={title}
        onChangeText={setTitle}
        error={errors.title}
      />
      
      <Text style={styles.label}>Topic</Text>
      <View style={styles.topicContainer}>
        {topics.map((topicItem) => (
          <Button
            key={topicItem.value}
            title={topicItem.label}
            variant={topic === topicItem.value ? "primary" : "outline"}
            size="small"
            onPress={() => setTopic(topicItem.value)}
            style={styles.topicButton}
          />
        ))}
      </View>
      
      <Input
        label="Content"
        placeholder="Share your question, experience, or advice..."
        value={content}
        onChangeText={setContent}
        error={errors.content}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
        inputStyle={styles.contentInput}
      />
      
      <Button
        title="Post Discussion"
        onPress={handleSubmit}
        style={styles.submitButton}
        fullWidth
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
    marginBottom: 8,
  },
  topicContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  topicButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  contentInput: {
    height: 120,
    textAlignVertical: "top",
  },
  submitButton: {
    marginTop: 24,
  },
});