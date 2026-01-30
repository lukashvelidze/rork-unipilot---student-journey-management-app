import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Plus, Trash2, Eye } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import Card from "@/components/Card";
import { loadUserDocuments, deleteDocument } from "@/lib/supabase";
import * as WebBrowser from "expo-web-browser";

interface Document {
  id: string;
  file_path: string;
  original_name: string;
  is_verified: boolean;
  is_rejected: boolean;
  admin_notes: string | null;
  created_at: string;
  preview_url: string | null;
  metadata?: {
    expiration_date?: string;
    [key: string]: any;
  } | null;
  document_categories: {
    id: string;
    title: string;
    code: string;
  }[];
}

export default function DocumentsScreen() {
  const router = useRouter();
  const Colors = useColors();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  const fetchDocuments = useCallback(async (showErrors = true) => {
    try {
      setIsLoading(true);
      // Small delay to ensure auth state is ready after navigation
      await new Promise(resolve => setTimeout(resolve, 100));
      const docs = await loadUserDocuments();
      const normalizedDocs = (docs || []).map((doc: any) => {
        const categories = Array.isArray(doc.document_categories)
          ? doc.document_categories
          : doc.document_categories
            ? [doc.document_categories]
            : [];
        return {
          ...doc,
          document_categories: categories,
        } as Document;
      });
      setDocuments(normalizedDocs);
    } catch (error: any) {
      console.error("Error loading documents:", error);
      
      // Check if it's an authentication error
      if (error?.message?.includes('not authenticated') || error?.message?.includes('Authentication error') || error?.message?.includes('Session error')) {
        if (showErrors) {
          // Automatically redirect to sign-in page
          router.replace("/sign-in");
          return;
        }
      } else if (showErrors) {
        Alert.alert("Error", error?.message || "Failed to load documents. Please try again.");
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments(false); // Don't show errors on initial load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh documents when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Small delay to ensure auth state is ready
      const timer = setTimeout(() => {
        fetchDocuments(true); // Show errors on focus refresh
      }, 300);
      return () => clearTimeout(timer);
    }, [fetchDocuments])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDocuments(true);
  };

  const handleDelete = async (documentId: string, filePath: string) => {
    Alert.alert(
      "Delete Document",
      "Are you sure you want to delete this document?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDocument(documentId, filePath);
              await fetchDocuments();
              Alert.alert("Success", "Document deleted successfully");
            } catch (error) {
              console.error("Error deleting document:", error);
              Alert.alert("Error", "Failed to delete document. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handlePreview = async (previewUrl: string | null) => {
    if (previewUrl) {
      try {
        await WebBrowser.openBrowserAsync(previewUrl);
      } catch (error) {
        console.error("Error opening preview:", error);
        Alert.alert("Error", "Failed to open document preview");
      }
    } else {
      Alert.alert("Error", "Preview not available for this document");
    }
  };

  // Get unique categories from documents
  const categories = Array.from(
    new Set(documents.map((doc) => doc.document_categories?.[0]?.code || "other"))
  );

  const filteredDocuments = selectedCategory === "all"
    ? documents
    : documents.filter(
        (doc) => doc.document_categories?.[0]?.code === selectedCategory
      );
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: Colors.card, borderBottomColor: Colors.border }]}>
        <Text style={[styles.title, { color: Colors.text }]}>Documents</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: Colors.primary }]}
          onPress={() => router.push("/documents/new")}
        >
          <Plus size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
      
      <View style={[styles.filterContainer, { borderBottomColor: Colors.border }]}>
        <FlatList
          horizontal
          data={["all", ...categories]}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterItem,
                { backgroundColor: Colors.lightBackground },
                selectedCategory === item && { backgroundColor: Colors.primary },
              ]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: Colors.lightText },
                  selectedCategory === item && { color: Colors.white },
                ]}
              >
                {item === "all" 
                  ? "All" 
                  : item
                      .split("_")
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(" ")}
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
        />
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.loadingText, { color: Colors.lightText }]}>Loading documents...</Text>
        </View>
      ) : filteredDocuments.length > 0 ? (
        <FlatList
          data={filteredDocuments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={[styles.documentCard, { backgroundColor: Colors.card }]}>
              <View style={styles.documentHeader}>
                <View style={styles.documentInfo}>
                  <Text style={[styles.documentName, { color: Colors.text }]} numberOfLines={1}>
                    {item.original_name}
                  </Text>
                  <Text style={[styles.documentCategory, { color: Colors.lightText }]}>
                    {item.document_categories?.[0]?.title || "Unknown Category"}
                  </Text>
                  <Text style={[styles.documentDate, { color: Colors.lightText }]}>
                    Uploaded: {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                  {item.metadata?.expiration_date && (
                    <Text style={[styles.documentDate, { color: Colors.lightText }]}>
                      Expires: {new Date(item.metadata.expiration_date).toLocaleDateString()}
                    </Text>
                  )}
                  <View style={styles.statusRow}>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: item.is_verified
                            ? Colors.success + "20"
                            : item.is_rejected
                            ? "#ff444420"
                            : Colors.lightBackground,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color: item.is_verified
                              ? Colors.success
                              : item.is_rejected
                              ? "#ff4444"
                              : Colors.lightText,
                          },
                        ]}
                      >
                        {item.is_verified
                          ? "Verified"
                          : item.is_rejected
                          ? "Rejected"
                          : "In Progress"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.documentActions}>
                {item.preview_url && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: Colors.primary }]}
                    onPress={() => handlePreview(item.preview_url)}
                  >
                    <Eye size={16} color={Colors.white} />
                    <Text style={[styles.actionButtonText, { color: Colors.white }]}>Preview</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: "#ff4444" }]}
                  onPress={() => handleDelete(item.id, item.file_path)}
                >
                  <Trash2 size={16} color={Colors.white} />
                  <Text style={[styles.actionButtonText, { color: Colors.white }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}
          contentContainerStyle={styles.documentsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: Colors.text }]}>No documents found</Text>
          <Text style={[styles.emptyText, { color: Colors.lightText }]}>
            {selectedCategory === "all"
              ? "Add your first document to keep track of important paperwork"
              : `No documents found in this category. Add one to get started.`}
          </Text>
          <TouchableOpacity
            style={[styles.addDocumentButton, { backgroundColor: Colors.primary }]}
            onPress={() => router.push("/documents/new")}
          >
            <Text style={[styles.addDocumentText, { color: Colors.white }]}>Add Document</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  filterContainer: {
    borderBottomWidth: 1,
  },
  filterList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
  },
  documentsList: {
    padding: 16,
  },
  documentCard: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
  },
  documentHeader: {
    marginBottom: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  documentCategory: {
    fontSize: 14,
    marginBottom: 4,
  },
  documentDate: {
    fontSize: 12,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  documentActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  addDocumentButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addDocumentText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
