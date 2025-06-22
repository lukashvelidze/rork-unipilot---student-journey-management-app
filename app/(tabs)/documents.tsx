import React, { useState } from "react";
import { StyleSheet, View, Text, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Plus, Filter } from "lucide-react-native";
import Colors from "@/constants/colors";
import DocumentCard from "@/components/DocumentCard";
import { useDocumentStore } from "@/store/documentStore";
import { DocumentType } from "@/types/user";

export default function DocumentsScreen() {
  const router = useRouter();
  const { documents } = useDocumentStore();
  const [selectedFilter, setSelectedFilter] = useState<DocumentType | "all">("all");
  
  const documentTypes: { id: DocumentType | "all"; label: string }[] = [
    { id: "all", label: "All" },
    { id: "passport", label: "Passport" },
    { id: "visa", label: "Visa" },
    { id: "i20", label: "I-20" },
    { id: "admission_letter", label: "Admission" },
    { id: "financial_documents", label: "Financial" },
    { id: "transcripts", label: "Transcripts" },
    { id: "test_scores", label: "Test Scores" },
    { id: "health_insurance", label: "Insurance" },
    { id: "other", label: "Other" },
  ];
  
  const filteredDocuments = selectedFilter === "all"
    ? documents
    : documents.filter(doc => doc.type === selectedFilter);
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Documents</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/documents/new")}
        >
          <Plus size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={documentTypes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterItem,
                selectedFilter === item.id && styles.selectedFilter,
              ]}
              onPress={() => setSelectedFilter(item.id)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === item.id && styles.selectedFilterText,
                ]}
              >
                {item.label}
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
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No documents found</Text>
          <Text style={styles.emptyText}>
            {selectedFilter === "all"
              ? "Add your first document to keep track of important paperwork"
              : `No ${selectedFilter.replace("_", " ")} documents found. Add one to get started.`}
          </Text>
          <TouchableOpacity
            style={styles.addDocumentButton}
            onPress={() => router.push("/documents/new")}
          >
            <Text style={styles.addDocumentText}>Add Document</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  filterContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
    backgroundColor: Colors.lightBackground,
  },
  selectedFilter: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.lightText,
  },
  selectedFilterText: {
    color: Colors.white,
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
    color: Colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.lightText,
    textAlign: "center",
    marginBottom: 24,
  },
  addDocumentButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addDocumentText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
});