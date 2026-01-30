import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Upload, File, X, Lock, Crown } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import { useAppBack } from "@/hooks/useAppBack";
import Input from "@/components/Input";
import Button from "@/components/Button";
import Card from "@/components/Card";
import { loadDocumentCategories, uploadDocument } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
import * as ImagePicker from "expo-image-picker";
import { useUserStore } from "@/store/userStore";

interface DocumentCategory {
  id: string;
  code: string;
  title: string;
  description: string | null;
  is_active: boolean;
  is_premium: boolean;
  sort_order: number;
  document_category_fields: Array<{
    id: string;
    label: string;
    field_name: string;
    field_type: string;
    is_required: boolean;
    options: any;
    sort_order: number;
  }>;
}

export default function NewDocumentScreen() {
  const router = useRouter();
  const Colors = useColors();
  const handleBack = useAppBack("/(tabs)/documents");
  const { user } = useUserStore();
  
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | null>(null);
  const [selectedFile, setSelectedFile] = useState<{ uri: string; name: string; type: string; ext?: string } | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const cats = await loadDocumentCategories();
      setCategories(cats as DocumentCategory[]);
    } catch (error) {
      console.error("Error loading categories:", error);
      Alert.alert("Error", "Failed to load document categories. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorySelect = async (category: DocumentCategory) => {
    // Check premium locking
    if (category.is_premium) {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_tier")
        .eq("id", authUser.id)
        .single();

      if (profile?.subscription_tier === "free") {
        Alert.alert(
          "Premium Feature",
          "This document category is available for premium users only. Upgrade to unlock premium features.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Upgrade", onPress: () => router.push("/premium") },
            ]
        );
        return;
      }
    }

    setSelectedCategory(category);
    setFieldValues({});
    setSelectedFile(null);
    setErrors({});
  };

  const handlePickFile = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please grant access to your photo library to upload documents.");
        return;
      }

      // Pick document (using image picker for now, but expo-document-picker is recommended)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"] as any, // Using string to avoid deprecation warning
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        // Detect file extension from mimeType or URI
        let ext = "jpg";
        if (asset.mimeType) {
          if (asset.mimeType.includes("png")) ext = "png";
          else if (asset.mimeType.includes("jpeg") || asset.mimeType.includes("jpg")) ext = "jpg";
          else if (asset.mimeType.includes("gif")) ext = "gif";
          else if (asset.mimeType.includes("webp")) ext = "webp";
        } else {
          const uriExt = asset.uri.split('.').pop()?.toLowerCase();
          if (uriExt && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(uriExt)) {
            ext = uriExt === 'jpeg' ? 'jpg' : uriExt;
          }
        }
        
        setSelectedFile({
          uri: asset.uri,
          name: asset.fileName || `document_${Date.now()}.${ext}`,
          type: asset.mimeType || "image/jpeg",
          ext: ext, // Store extension for upload
        });
        setErrors({ ...errors, file: "" });
      }
    } catch (error) {
      console.error("Error picking file:", error);
      Alert.alert("Error", "Failed to pick file. Please try again.");
    }
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFieldValues({ ...fieldValues, [fieldName]: value });
    if (errors[fieldName]) {
      setErrors({ ...errors, [fieldName]: "" });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedCategory) {
      newErrors.category = "Please select a document category";
    }

    if (!selectedFile) {
      newErrors.file = "Please select a file to upload";
    }

    // Validate required fields
    if (selectedCategory) {
      selectedCategory.document_category_fields
        .filter((field) => field.is_required)
        .forEach((field) => {
          if (!fieldValues[field.field_name]) {
            newErrors[field.field_name] = `${field.label} is required`;
          }
        });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !selectedCategory || !selectedFile) {
      return;
    }

    try {
      setIsUploading(true);

      // Get user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Upload document using URI (function handles Blob conversion internally)
      // Pass the detected extension if available
      const fileExt = selectedFile.ext || "jpg";
      await uploadDocument(user.id, selectedCategory.id, selectedFile.uri, selectedFile.name, fileExt);

      Alert.alert(
        "Success",
        "Document uploaded successfully",
        [
          {
            text: "OK",
            onPress: handleBack,
          },
        ]
      );
    } catch (error: any) {
      console.error("Error uploading document:", error);
      
      // Check if it's an authentication error
      if (error?.message?.includes('not authenticated') || error?.message?.includes('Authentication error') || error?.message?.includes('Session error') || error?.message === "User not authenticated") {
        // Automatically redirect to sign-in page
        router.replace("/sign-in");
        return;
      }
      
      if (error.message === "Premium feature") {
        Alert.alert(
          "Premium Feature",
          "This document category is available for premium users only.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Upgrade", onPress: () => router.push("/premium") },
            ]
          );
      } else {
        Alert.alert("Error", error.message || "Failed to upload document. Please try again.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: Colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.loadingText, { color: Colors.lightText }]}>Loading categories...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: Colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.title, { color: Colors.text }]}>Upload Document</Text>

      {/* Category Selection */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: Colors.text }]}>Select Category</Text>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryCard,
              { backgroundColor: Colors.card, borderColor: Colors.border },
              selectedCategory?.id === category.id && { borderColor: Colors.primary, borderWidth: 2 },
            ]}
            onPress={() => handleCategorySelect(category)}
          >
            <View style={styles.categoryHeader}>
              <Text style={[styles.categoryTitle, { color: Colors.text }]}>{category.title}</Text>
              {category.is_premium && (
                <View style={styles.premiumBadge}>
                  <Crown size={14} color="#FFD700" />
                  <Text style={styles.premiumText}>Premium</Text>
                </View>
              )}
            </View>
            {category.description && (
              <Text style={[styles.categoryDescription, { color: Colors.lightText }]}>
                {category.description}
              </Text>
            )}
          </TouchableOpacity>
        ))}
        {errors.category && (
          <Text style={[styles.errorText, { color: "#ff4444" }]}>{errors.category}</Text>
        )}
      </View>

      {/* File Picker */}
      {selectedCategory && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Select File</Text>
          {selectedFile ? (
            <Card style={[styles.fileCard, { backgroundColor: Colors.card }]}>
              <View style={styles.fileInfo}>
                <File size={24} color={Colors.primary} />
                <View style={styles.fileDetails}>
                  <Text style={[styles.fileName, { color: Colors.text }]} numberOfLines={1}>
                    {selectedFile.name}
                  </Text>
                  <Text style={[styles.fileType, { color: Colors.lightText }]}>
                    {selectedFile.type}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedFile(null)}>
                  <X size={20} color={Colors.lightText} />
                </TouchableOpacity>
              </View>
            </Card>
          ) : (
            <TouchableOpacity
              style={[styles.filePicker, { backgroundColor: Colors.lightBackground, borderColor: Colors.border }]}
              onPress={handlePickFile}
            >
              <Upload size={24} color={Colors.primary} />
              <Text style={[styles.filePickerText, { color: Colors.text }]}>Tap to select file</Text>
            </TouchableOpacity>
          )}
          {errors.file && (
            <Text style={[styles.errorText, { color: "#ff4444" }]}>{errors.file}</Text>
          )}
        </View>
      )}

      {/* Dynamic Fields */}
      {selectedCategory && selectedCategory.document_category_fields.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Additional Information</Text>
          {selectedCategory.document_category_fields
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((field) => (
              <View key={field.id} style={styles.fieldContainer}>
                <Input
                  label={field.label + (field.is_required ? " *" : "")}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  value={fieldValues[field.field_name] || ""}
                  onChangeText={(value) => handleFieldChange(field.field_name, value)}
                  error={errors[field.field_name]}
                />
              </View>
            ))}
        </View>
      )}

      {/* Submit Button */}
      <Button
        title={isUploading ? "Uploading..." : "Upload Document"}
        onPress={handleSubmit}
        style={styles.submitButton}
        fullWidth
        disabled={isUploading || !selectedCategory || !selectedFile}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  categoryCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFD70020",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  premiumText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFD700",
  },
  categoryDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  filePicker: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  filePickerText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  fileCard: {
    padding: 16,
  },
  fileInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  fileType: {
    fontSize: 12,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    marginTop: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});
