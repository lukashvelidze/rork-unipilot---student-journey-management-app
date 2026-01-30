import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Crown } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import { useAppBack } from "@/hooks/useAppBack";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { loadDocumentCategories, createDocumentEntry } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";

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
  
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
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
    setDocumentName("");
    setExpirationDate("");
    setErrors({});
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    if (fieldName === "documentName") {
      setDocumentName(value);
    }
    if (fieldName === "expirationDate") {
      setExpirationDate(value);
    }
    if (errors[fieldName]) {
      setErrors({ ...errors, [fieldName]: "" });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedCategory) {
      newErrors.category = "Please select a document category";
    }

    if (!documentName.trim()) {
      newErrors.documentName = "Document name is required";
    }

    if (!expirationDate.trim()) {
      newErrors.expirationDate = "Expiration date is required";
    } else if (isNaN(Date.parse(expirationDate))) {
      newErrors.expirationDate = "Use a valid date (YYYY-MM-DD)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !selectedCategory) {
      return;
    }

    try {
      setIsUploading(true);

      // Get user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const normalizedExpiration = new Date(expirationDate).toISOString();
      await createDocumentEntry(
        user.id,
        selectedCategory.id,
        documentName.trim(),
        normalizedExpiration
      );

      Alert.alert(
        "Success",
        "Document added successfully",
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
      <Text style={[styles.title, { color: Colors.text }]}>Add Document</Text>

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

      {/* Document Details */}
      {selectedCategory && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Document Details</Text>
          <View style={styles.fieldContainer}>
            <Input
              label="Document Name *"
              placeholder="Enter document name"
              value={documentName}
              onChangeText={(value) => handleFieldChange("documentName", value)}
              error={errors.documentName}
            />
          </View>
          <View style={styles.fieldContainer}>
            <Input
              label="Expiration Date *"
              placeholder="YYYY-MM-DD"
              value={expirationDate}
              onChangeText={(value) => handleFieldChange("expirationDate", value)}
              error={errors.expirationDate}
            />
          </View>
        </View>
      )}

      {/* Submit Button */}
      <Button
        title={isUploading ? "Saving..." : "Save Document"}
        onPress={handleSubmit}
        style={styles.submitButton}
        fullWidth
        disabled={isUploading || !selectedCategory}
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
