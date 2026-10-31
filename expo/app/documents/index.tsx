import React, { useState, useEffect, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import {
  ArrowLeft,
  BookUser,
  Check,
  Eye,
  FileText,
  FolderOpen,
  GraduationCap,
  Home,
  Plus,
  Stamp,
  Trash2,
  Wallet,
} from "lucide-react-native";
import { CARD_SHADOW, GUTTER, RADIUS, UI } from "@/constants/design";
import { useAppBack } from "@/hooks/useAppBack";
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
  const handleBack = useAppBack("/toolkit");
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

  const categoryTitle = (code: string) =>
    documents.find((doc) => doc.document_categories?.[0]?.code === code)?.document_categories?.[0]?.title ||
    code.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  const haveCodes = new Set(documents.map((doc) => doc.document_categories?.[0]?.code).filter(Boolean));
  const essentialsDone = ESSENTIALS.filter((item) => haveCodes.has(item.code)).length;

  const header = (
    <>
      <View style={styles.essentialsCard}>
        <View style={styles.essentialsHeader}>
          <Text style={styles.essentialsTitle}>Application essentials</Text>
          <Text style={styles.essentialsCount}>
            {essentialsDone} of {ESSENTIALS.length}
          </Text>
        </View>
        <View style={styles.essentialsTrack}>
          <View style={[styles.essentialsFill, { width: `${(essentialsDone / ESSENTIALS.length) * 100}%` }]} />
        </View>
        {ESSENTIALS.map((item) => {
          const have = haveCodes.has(item.code);
          return (
            <TouchableOpacity
              key={item.code}
              accessibilityRole="button"
              activeOpacity={0.7}
              disabled={have}
              onPress={() => router.push(`/documents/new?category=${item.code}` as any)}
              style={styles.essentialRow}
            >
              <View style={[styles.essentialIcon, have && styles.essentialIconDone]}>
                {have ? (
                  <Check color="#FFFFFF" size={13} strokeWidth={3} />
                ) : (
                  <item.Icon color={UI.muted} size={15} strokeWidth={2} />
                )}
              </View>
              <View style={styles.essentialCopy}>
                <Text style={[styles.essentialLabel, have && styles.essentialLabelDone]}>{item.label}</Text>
                {!have ? <Text style={styles.essentialHint}>{item.hint}</Text> : null}
              </View>
              {!have ? <Text style={styles.essentialAdd}>Add</Text> : null}
            </TouchableOpacity>
          );
        })}
      </View>

      {documents.length > 0 ? (
        <ScrollView
          horizontal
          contentContainerStyle={styles.filterList}
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroller}
        >
          {["all", ...categories].map((item) => {
            const active = selectedCategory === item;
            return (
              <TouchableOpacity
                key={item}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => setSelectedCategory(item)}
                style={[styles.filterItem, active && styles.filterItemActive]}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {item === "all" ? `All · ${documents.length}` : categoryTitle(item)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityLabel="Go back" onPress={handleBack} style={styles.roundButton}>
          <ArrowLeft color={UI.text} size={20} strokeWidth={2.2} />
        </TouchableOpacity>
        <Text accessibilityRole="header" style={styles.title}>
          Document Vault
        </Text>
        <TouchableOpacity
          accessibilityLabel="Add document"
          onPress={() => router.push("/documents/new")}
          style={[styles.roundButton, styles.addButton]}
        >
          <Plus color="#FFFFFF" size={20} strokeWidth={2.4} />
        </TouchableOpacity>
      </View>

      {isLoading && documents.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={UI.primary} />
          <Text style={styles.loadingText}>Loading documents…</Text>
        </View>
      ) : (
        <FlatList
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <FolderOpen color={UI.primary} size={26} strokeWidth={1.8} />
              </View>
              <Text style={styles.emptyTitle}>
                {documents.length === 0 ? "Your vault is empty" : "Nothing in this category"}
              </Text>
              <Text style={styles.emptyText}>
                Keep passports, transcripts and offer letters in one secure place, ready when an application asks.
              </Text>
            </View>
          }
          ListHeaderComponent={header}
          contentContainerStyle={styles.documentsList}
          data={filteredDocuments}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl onRefresh={handleRefresh} refreshing={refreshing} tintColor={UI.primary} />}
          renderItem={({ item }) => {
            const status = item.is_verified ? "verified" : item.is_rejected ? "rejected" : "pending";
            const expires = item.metadata?.expiration_date ? new Date(item.metadata.expiration_date) : null;
            const expiringSoon = !!expires && expires.getTime() - Date.now() < 1000 * 60 * 60 * 24 * 180;
            return (
              <View style={styles.documentCard}>
                <View style={styles.documentIcon}>
                  <FileText color={UI.primary} size={20} strokeWidth={1.9} />
                </View>
                <View style={styles.documentInfo}>
                  <Text numberOfLines={1} style={styles.documentName}>
                    {item.original_name}
                  </Text>
                  <Text numberOfLines={1} style={styles.documentMeta}>
                    {item.document_categories?.[0]?.title || "Other"} · Added{" "}
                    {new Date(item.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                  </Text>
                  <View style={styles.badgeRow}>
                    <View style={[styles.statusBadge, { backgroundColor: STATUS[status].soft }]}>
                      <Text style={[styles.statusText, { color: STATUS[status].text }]}>{STATUS[status].label}</Text>
                    </View>
                    {expires ? (
                      <View style={[styles.statusBadge, expiringSoon ? styles.expiryWarn : styles.expiryOk]}>
                        <Text style={[styles.statusText, { color: expiringSoon ? "#B7791F" : UI.textSecondary }]}>
                          Expires {expires.toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                <View style={styles.documentActions}>
                  {item.preview_url ? (
                    <TouchableOpacity
                      accessibilityLabel={`Preview ${item.original_name}`}
                      hitSlop={6}
                      onPress={() => handlePreview(item.preview_url)}
                      style={styles.iconButton}
                    >
                      <Eye color={UI.text} size={18} strokeWidth={2} />
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity
                    accessibilityLabel={`Delete ${item.original_name}`}
                    hitSlop={6}
                    onPress={() => handleDelete(item.id, item.file_path)}
                    style={styles.iconButton}
                  >
                    <Trash2 color={UI.danger} size={18} strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// The documents almost every study-abroad application asks for.
const ESSENTIALS = [
  { code: "passport", label: "Passport", hint: "Valid for your whole stay", Icon: BookUser },
  { code: "education", label: "Transcripts & diplomas", hint: "Grades and certificates", Icon: GraduationCap },
  { code: "financial", label: "Proof of funds", hint: "Bank statements or sponsor letter", Icon: Wallet },
  { code: "visa", label: "Visa documents", hint: "Forms, photos and appointment", Icon: Stamp },
  { code: "housing", label: "Housing", hint: "Dorm or rental confirmation", Icon: Home },
] as const;

const STATUS = {
  verified: { label: "Verified", soft: UI.successSoft, text: "#139C8F" },
  rejected: { label: "Needs attention", soft: UI.primarySoft, text: UI.danger },
  pending: { label: "Stored", soft: UI.hairline, text: UI.textSecondary },
} as const;

const styles = StyleSheet.create({
  container: {
    backgroundColor: UI.background,
    flex: 1,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 10,
    paddingHorizontal: GUTTER - 4,
    paddingTop: 6,
  },
  roundButton: {
    alignItems: "center",
    backgroundColor: UI.card,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
    ...CARD_SHADOW,
  },
  addButton: {
    backgroundColor: UI.primary,
  },
  title: {
    color: UI.text,
    fontSize: 17,
    fontWeight: "700",
  },
  loadingContainer: {
    alignItems: "center",
    flex: 1,
    gap: 12,
    justifyContent: "center",
  },
  loadingText: {
    color: UI.muted,
    fontSize: 14,
  },
  documentsList: {
    gap: 10,
    paddingBottom: 48,
    paddingHorizontal: GUTTER,
    paddingTop: 8,
  },
  essentialsCard: {
    backgroundColor: UI.card,
    borderRadius: RADIUS.card,
    marginBottom: 6,
    padding: 16,
    ...CARD_SHADOW,
  },
  essentialsHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  essentialsTitle: {
    color: UI.text,
    fontSize: 16,
    fontWeight: "700",
  },
  essentialsCount: {
    color: UI.success,
    fontSize: 13,
    fontWeight: "800",
  },
  essentialsTrack: {
    backgroundColor: UI.track,
    borderRadius: 3,
    height: 6,
    marginBottom: 6,
    marginTop: 10,
    overflow: "hidden",
  },
  essentialsFill: {
    backgroundColor: UI.success,
    borderRadius: 3,
    height: "100%",
  },
  essentialRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingVertical: 9,
  },
  essentialIcon: {
    alignItems: "center",
    backgroundColor: UI.hairline,
    borderRadius: 13,
    height: 26,
    justifyContent: "center",
    width: 26,
  },
  essentialIconDone: {
    backgroundColor: UI.success,
  },
  essentialCopy: {
    flex: 1,
  },
  essentialLabel: {
    color: UI.text,
    fontSize: 14.5,
    fontWeight: "600",
  },
  essentialLabelDone: {
    color: UI.textSecondary,
  },
  essentialHint: {
    color: UI.muted,
    fontSize: 12.5,
    marginTop: 1,
  },
  essentialAdd: {
    color: UI.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  filterScroller: {
    marginHorizontal: -GUTTER,
    marginTop: 8,
  },
  filterList: {
    gap: 8,
    paddingBottom: 4,
    paddingHorizontal: GUTTER,
  },
  filterItem: {
    backgroundColor: UI.card,
    borderColor: UI.border,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterItemActive: {
    backgroundColor: UI.primary,
    borderColor: UI.primary,
  },
  filterText: {
    color: UI.text,
    fontSize: 13.5,
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  documentCard: {
    alignItems: "center",
    backgroundColor: UI.card,
    borderRadius: RADIUS.tile,
    flexDirection: "row",
    gap: 12,
    padding: 14,
    ...CARD_SHADOW,
  },
  documentIcon: {
    alignItems: "center",
    backgroundColor: UI.primarySoft,
    borderRadius: 12,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    color: UI.text,
    fontSize: 15,
    fontWeight: "700",
  },
  documentMeta: {
    color: UI.muted,
    fontSize: 12.5,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  statusBadge: {
    borderRadius: RADIUS.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 11.5,
    fontWeight: "700",
  },
  expiryWarn: {
    backgroundColor: UI.warningSoft,
  },
  expiryOk: {
    backgroundColor: UI.hairline,
  },
  documentActions: {
    flexDirection: "row",
    gap: 4,
  },
  iconButton: {
    alignItems: "center",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  emptyIcon: {
    alignItems: "center",
    backgroundColor: UI.primarySoft,
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    marginBottom: 12,
    width: 56,
  },
  emptyTitle: {
    color: UI.text,
    fontSize: 17,
    fontWeight: "700",
  },
  emptyText: {
    color: UI.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    textAlign: "center",
  },
});
