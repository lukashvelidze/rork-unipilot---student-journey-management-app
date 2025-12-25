import React, { useState } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Camera, Image as ImageIcon, X, Check, ChevronDown } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useColors } from "@/hooks/useColors";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { useJourneyStore } from "@/store/journeyStore";
import { JourneyStage, MemoryMood } from "@/types/user";

export default function NewMemoryScreen() {
  const router = useRouter();
  const Colors = useColors();
  const { addMemory } = useJourneyStore();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedStage, setSelectedStage] = useState<JourneyStage>("research");
  const [selectedMood, setSelectedMood] = useState<MemoryMood>("happy");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [showStageSelector, setShowStageSelector] = useState(false);
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stageOptions: { value: JourneyStage; label: string; emoji: string }[] = [
    { value: "research", label: "Research", emoji: "🔍" },
    { value: "application", label: "Application", emoji: "📝" },
    { value: "visa", label: "Visa", emoji: "📋" },
    { value: "pre_departure", label: "Pre-Departure", emoji: "🎒" },
    { value: "arrival", label: "Arrival", emoji: "✈️" },
    { value: "academic", label: "Academic", emoji: "🎓" },
    { value: "career", label: "Career", emoji: "💼" },
  ];

  const moodOptions: { value: MemoryMood; label: string; emoji: string; color: string }[] = [
    { value: "excited", label: "Excited", emoji: "🤩", color: "#FF6B6B" },
    { value: "happy", label: "Happy", emoji: "😊", color: "#4ECDC4" },
    { value: "proud", label: "Proud", emoji: "😤", color: "#42A5F5" },
    { value: "nervous", label: "Nervous", emoji: "😰", color: "#9C27B0" },
    { value: "grateful", label: "Grateful", emoji: "🙏", color: "#66BB6A" },
    { value: "accomplished", label: "Accomplished", emoji: "🏆", color: "#FFA726" },
    { value: "hopeful", label: "Hopeful", emoji: "🌟", color: "#AB47BC" },
    { value: "determined", label: "Determined", emoji: "💪", color: "#EF5350" },
  ];

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim().toLowerCase())) {
      setTags([...tags, newTag.trim().toLowerCase()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title for your memory");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Error", "Please enter a description for your memory");
      return;
    }

    setIsSubmitting(true);

    try {
      await addMemory({
        title: title.trim(),
        description: description.trim(),
        stage: selectedStage,
        mood: selectedMood,
        tags,
        mediaUri,
      });
      
      // Show success message and navigate to memories page
      Alert.alert(
        "Memory Created! 🎉",
        "Your memory has been added to your journey timeline.",
        [
          {
            text: "View Memories",
            onPress: () => {
              router.replace("/(tabs)/journey?tab=memories");
            }
          }
        ]
      );
    } catch (error: any) {
      console.error("Error creating memory:", error);
      Alert.alert("Error", error?.message || "Failed to create memory. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const pickImage = async (source: "camera" | "library") => {
    try {
      const permission =
        source === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission needed", "Please allow access to your photos to add a memory image.");
        return;
      }

      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 0.8,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 0.8,
            });

      if (!result.canceled && result.assets?.length > 0) {
        setMediaUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error("Error selecting image:", err);
      Alert.alert("Error", "Unable to select image. Please try again.");
    }
  };

  const selectedStageOption = stageOptions.find(option => option.value === selectedStage);
  const selectedMoodOption = moodOptions.find(option => option.value === selectedMood);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: Colors.card, borderBottomColor: Colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <X size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors.text }]}>Create Memory</Text>
        <TouchableOpacity 
          onPress={handleSubmit} 
          style={[styles.headerButton, { opacity: isSubmitting ? 0.5 : 1 }]}
          disabled={isSubmitting}
        >
          <Check size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Section */}
        <Card style={[styles.imageSection, { backgroundColor: Colors.card }]}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Add Photo</Text>
          
          {mediaUri ? (
            <View style={styles.selectedImageContainer}>
              <Image source={{ uri: mediaUri }} style={styles.selectedImage} />
              <TouchableOpacity 
                style={[styles.removeImageButton, { backgroundColor: Colors.error }]}
                onPress={() => setMediaUri(null)}
              >
                <X size={16} color={Colors.white} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.imagePlaceholder, { backgroundColor: Colors.lightBackground, borderColor: Colors.border }]}
              onPress={() => pickImage("library")}
              activeOpacity={0.85}
            >
              <Camera size={32} color={Colors.lightText} />
              <Text style={[styles.imagePlaceholderText, { color: Colors.lightText }]}>Add a photo to capture the moment</Text>
            </TouchableOpacity>
          )}

          <View style={styles.photoActionsRow}>
            <TouchableOpacity
              style={[styles.photoActionButton, { backgroundColor: Colors.lightBackground, borderColor: Colors.border }]}
              onPress={() => pickImage("camera")}
            >
              <Camera size={18} color={Colors.text} />
              <Text style={[styles.photoActionText, { color: Colors.text }]}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.photoActionButton, { backgroundColor: Colors.lightBackground, borderColor: Colors.border }]}
              onPress={() => pickImage("library")}
            >
              <ImageIcon size={18} color={Colors.text} />
              <Text style={[styles.photoActionText, { color: Colors.text }]}>Gallery</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Title and Description */}
        <Card style={[styles.textSection, { backgroundColor: Colors.card }]}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Tell Your Story</Text>
          
          <TextInput
            style={[styles.titleInput, { backgroundColor: Colors.lightBackground, color: Colors.text, borderColor: Colors.border }]}
            placeholder="Give your memory a title..."
            placeholderTextColor={Colors.lightText}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
          
          <TextInput
            style={[styles.descriptionInput, { backgroundColor: Colors.lightBackground, color: Colors.text, borderColor: Colors.border }]}
            placeholder="Describe what happened, how you felt, what you learned..."
            placeholderTextColor={Colors.lightText}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
          />
          
          <Text style={[styles.characterCount, { color: Colors.lightText }]}>
            {description.length}/500 characters
          </Text>
        </Card>

        {/* Stage and Mood */}
        <Card style={[styles.metadataSection, { backgroundColor: Colors.card }]}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Journey Details</Text>
          
          {/* Stage Selector */}
          <View style={styles.selectorContainer}>
            <Text style={[styles.selectorLabel, { color: Colors.text }]}>Journey Stage</Text>
            <TouchableOpacity
              style={[styles.selector, { backgroundColor: Colors.lightBackground, borderColor: Colors.border }]}
              onPress={() => setShowStageSelector(!showStageSelector)}
            >
              <View style={styles.selectorContent}>
                <Text style={styles.selectorEmoji}>{selectedStageOption?.emoji}</Text>
                <Text style={[styles.selectorText, { color: Colors.text }]}>{selectedStageOption?.label}</Text>
              </View>
              <ChevronDown size={20} color={Colors.lightText} />
            </TouchableOpacity>
            
            {showStageSelector && (
              <View style={[styles.optionsContainer, { backgroundColor: Colors.card, borderColor: Colors.border }]}>
                {stageOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.option, selectedStage === option.value && { backgroundColor: Colors.lightBackground }]}
                    onPress={() => {
                      setSelectedStage(option.value);
                      setShowStageSelector(false);
                    }}
                  >
                    <Text style={styles.optionEmoji}>{option.emoji}</Text>
                    <Text style={[styles.optionText, { color: Colors.text }]}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Mood Selector */}
          <View style={styles.selectorContainer}>
            <Text style={[styles.selectorLabel, { color: Colors.text }]}>How did you feel?</Text>
            <TouchableOpacity
              style={[styles.selector, { backgroundColor: Colors.lightBackground, borderColor: Colors.border }]}
              onPress={() => setShowMoodSelector(!showMoodSelector)}
            >
              <View style={styles.selectorContent}>
                <Text style={styles.selectorEmoji}>{selectedMoodOption?.emoji}</Text>
                <Text style={[styles.selectorText, { color: Colors.text }]}>{selectedMoodOption?.label}</Text>
              </View>
              <ChevronDown size={20} color={Colors.lightText} />
            </TouchableOpacity>
            
            {showMoodSelector && (
              <View style={[styles.optionsContainer, { backgroundColor: Colors.card, borderColor: Colors.border }]}>
                {moodOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.option, selectedMood === option.value && { backgroundColor: Colors.lightBackground }]}
                    onPress={() => {
                      setSelectedMood(option.value);
                      setShowMoodSelector(false);
                    }}
                  >
                    <Text style={styles.optionEmoji}>{option.emoji}</Text>
                    <Text style={[styles.optionText, { color: Colors.text }]}>{option.label}</Text>
                    <View style={[styles.moodColorIndicator, { backgroundColor: option.color }]} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </Card>

        {/* Tags */}
        <Card style={[styles.tagsSection, { backgroundColor: Colors.card }]}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Tags</Text>
          <Text style={[styles.sectionDescription, { color: Colors.lightText }]}>
            Add tags to help organize and find your memories later
          </Text>
          
          <View style={styles.tagInputContainer}>
            <TextInput
              style={[styles.tagInput, { backgroundColor: Colors.lightBackground, color: Colors.text, borderColor: Colors.border }]}
              placeholder="Add a tag..."
              placeholderTextColor={Colors.lightText}
              value={newTag}
              onChangeText={setNewTag}
              onSubmitEditing={addTag}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.addTagButton, { backgroundColor: Colors.primary }]}
              onPress={addTag}
            >
              <Text style={styles.addTagButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          
          {tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {tags.map((tag, index) => (
                <View key={index} style={[styles.tag, { backgroundColor: Colors.lightBackground }]}>
                  <Text style={[styles.tagText, { color: Colors.primary }]}>#{tag}</Text>
                  <TouchableOpacity onPress={() => removeTag(tag)} style={styles.removeTagButton}>
                    <X size={12} color={Colors.lightText} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <Button
            title={isSubmitting ? "Creating Memory..." : "Create Memory"}
            onPress={handleSubmit}
            disabled={isSubmitting || !title.trim() || !description.trim()}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  imageSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  selectedImageContainer: {
    position: "relative",
    marginBottom: 16,
  },
  selectedImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholder: {
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  imagePlaceholderText: {
    fontSize: 16,
    marginTop: 8,
  },
  suggestedImagesScroll: {
    flexDirection: "row",
  },
  suggestedImageContainer: {
    marginRight: 8,
  },
  suggestedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  photoActionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  photoActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  photoActionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  textSection: {
    marginBottom: 16,
  },
  titleInput: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  descriptionInput: {
    height: 120,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 12,
    textAlign: "right",
  },
  metadataSection: {
    marginBottom: 16,
  },
  selectorContainer: {
    marginBottom: 16,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  selectorContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectorEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  selectorText: {
    fontSize: 16,
  },
  optionsContainer: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionEmoji: {
    fontSize: 18,
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
  moodColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  tagsSection: {
    marginBottom: 16,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  tagInputContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  tagInput: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    borderWidth: 1,
    marginRight: 8,
  },
  addTagButton: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  addTagButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "500",
  },
  removeTagButton: {
    marginLeft: 4,
    padding: 2,
  },
  submitContainer: {
    marginBottom: 32,
  },
  submitButton: {
    marginTop: 16,
  },
});
