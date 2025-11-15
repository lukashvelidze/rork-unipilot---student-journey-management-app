import React, { useState } from "react";
import { StyleSheet, View, Text, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import DocumentCard from "@/components/DocumentCard";
import { useDocumentStore } from "@/store/documentStore";
import { Document, DocumentType } from "@/types/user";

export default function DocumentsScreen() {
  const router = useRouter();
  const Colors = useColors();
  const { documents } = useDocumentStore();
  const [selectedFilter, setSelectedFilter] = useState<DocumentType | "all">("all");
  
  const documentTypes: (DocumentType | "all")[] = [
    "all",
    "passport",
    "visa", 
    "transcript",
    "diploma",
    "letter_of_recommendation",
    "financial_statement",
    "health_certificate",
    "insurance",
    "other",
  ];
  
  const filteredDocuments = selectedFilter === "all"
    ? documents
    : documents.filter(doc => doc.type === selectedFilter);
  
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
          data={documentTypes}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterItem,
                { backgroundColor: Colors.lightBackground },
                selectedFilter === item && { backgroundColor: Colors.primary },
              ]}
              onPress={() => setSelectedFilter(item)}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: Colors.lightText },
                  selectedFilter === item && { color: Colors.white },
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
      
      {filteredDocuments.length > 0 ? (
        <FlatList
          data={filteredDocuments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DocumentCard
              document={item}
              onPress={() => router.push(`/documents/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.documentsList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: Colors.text }]}>No documents found</Text>
          <Text style={[styles.emptyText, { color: Colors.lightText }]}>
            {selectedFilter === "all"
              ? "Add your first document to keep track of important paperwork"
              : `No ${selectedFilter
                  .split("_")
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")} documents found. Add one to get started.`}
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