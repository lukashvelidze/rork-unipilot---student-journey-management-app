import React, { useState } from "react";
import { StyleSheet, View, Text, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { useUserStore } from "@/store/userStore";
import { Topic } from "@/types/community";
import { trpc } from "@/lib/trpc";

export default function NewPostScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [topic, setTopic] = useState<Topic>("general");
  const [errors, setErrors] = useState({
    title: "",
    content: "",
  });
  
  const createPostMutation = trpc.community.createPost.useMutation({
    onSuccess: () => {
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
    },
    onError: (error: any) => {
      Alert.alert("Error", "Failed to create post");
      console.error("Create post error:", error);
    },
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
  
  const handleSubmit = async () => {
    if (validateForm()) {
      try {
        await createPostMutation.mutateAsync({
          title,
          content,
          topic,
          userId: user?.id || "anonymous",
          userName: user?.name || "Anonymous User",
          userAvatar: user?.avatar,
          isPremium: user?.isPremium || false,
        });
      } catch (error) {
        // Error is handled in the mutation
      }
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
        title={createPostMutation.isLoading ? "Creating..." : "Post Discussion"}
        onPress={handleSubmit}
        style={styles.submitButton}
        fullWidth
        disabled={createPostMutation.isLoading}
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