import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text, FlatList, TouchableOpacity, TextInput, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Search, X, Crown, Filter, BookOpen, Video, Target, FileText, Calendar, Zap } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import Card from "@/components/Card";
import Button from "@/components/Button";
import PremiumResourceCard from "@/components/PremiumResourceCard";
import { usePremiumResourcesStore } from "@/store/premiumResourcesStore";
import { useUserStore } from "@/store/userStore";
import { premiumResourcePreviews, featuredResources, newResources } from "@/mocks/premiumResources";
import { ResourceCategory, ResourceType } from "@/types/premiumResources";

const categories: (ResourceCategory | "All")[] = [
  "All",
  "Application Materials",
  "Research",
  "Funding",
  "Interviews",
  "Visa & Legal",
  "Financial Planning",
  "Life Abroad",
  "Academic Success",
  "Career Development",
];

const resourceTypes: (ResourceType | "All")[] = [
  "All",
  "guide",
  "video",
  "webinar",
  "tool",
  "template",
  "course",
];

export default function PremiumResourcesScreen() {
  const router = useRouter();
  const Colors = useColors();
  const { user } = useUserStore();
  const [showFilters, setShowFilters] = useState(false);
  
  const {
    resources,
    filteredResources,
    selectedCategory,
    selectedType,
    searchQuery,
    isLoading,
    error,
    setResources,
    filterByCategory,
    filterByType,
    searchResources,
    clearFilters,
  } = usePremiumResourcesStore();
  
  const isPremium = user?.isPremium || false;
  
  // Load resources on component mount
  useEffect(() => {
    setResources(premiumResourcePreviews);
  }, [setResources]);
  
  const handleSearch = (text: string) => {
    searchResources(text);
  };
  
  const clearSearch = () => {
    searchResources("");
  };
  
  const handleResourcePress = (resourceId: string) => {
    if (!isPremium) {
      Alert.alert(
        "Premium Required",
        "This resource is only available to premium members. Upgrade to access all premium resources and accelerate your study abroad journey.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Upgrade to Premium", onPress: () => router.push("/premium") },
        ]
      );
      return;
    }
    
    router.push(`/premium/${resourceId}`);
  };
  
  const getTypeIcon = (type: ResourceType | "All") => {
    switch (type) {
      case "guide": return BookOpen;
      case "video": return Video;
      case "webinar": return Calendar;
      case "tool": return Target;
      case "template": return FileText;
      case "course": return Zap;
      default: return FileText;
    }
  };
  
  const renderFilterChip = (
    label: string,
    isSelected: boolean,
    onPress: () => void,
    icon?: React.ReactNode
  ) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        { backgroundColor: isSelected ? Colors.primary : Colors.surface },
        { borderColor: isSelected ? Colors.primary : Colors.border },
      ]}
      onPress={onPress}
    >
      {icon}
      <Text
        style={[
          styles.filterChipText,
          { color: isSelected ? Colors.white : Colors.text },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: Colors.card, borderBottomColor: Colors.border }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.title, { color: Colors.text }]}>Premium Resources</Text>
            <Text style={[styles.subtitle, { color: Colors.lightText }]}>
              Expert guides to accelerate your journey
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.upgradeButton, { backgroundColor: Colors.primary }]}
            onPress={() => router.push("/premium")}
          >
            <Crown size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, { backgroundColor: Colors.lightBackground }]}>
          <Search size={20} color={Colors.lightText} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: Colors.text }]}
            placeholder="Search resources..."
            placeholderTextColor={Colors.lightText}
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <X size={18} color={Colors.lightText} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: showFilters ? Colors.primary : Colors.surface }]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color={showFilters ? Colors.white : Colors.text} />
        </TouchableOpacity>
      </View>
      
      {/* Filters */}
      {showFilters && (
        <View style={[styles.filtersContainer, { backgroundColor: Colors.card }]}>
          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionTitle, { color: Colors.text }]}>Categories</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {categories.map((category) => 
                renderFilterChip(
                  category,
                  selectedCategory === category,
                  () => filterByCategory(category)
                )
              )}
            </ScrollView>
          </View>
          
          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionTitle, { color: Colors.text }]}>Types</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {resourceTypes.map((type) => {
                const TypeIcon = getTypeIcon(type);
                return renderFilterChip(
                  type === "All" ? "All" : type.charAt(0).toUpperCase() + type.slice(1),
                  selectedType === type,
                  () => filterByType(type),
                  type !== "All" ? <TypeIcon size={14} color={selectedType === type ? Colors.white : Colors.text} /> : undefined
                );
              })}
            </ScrollView>
          </View>
          
          <View style={styles.filterActions}>
            <Button
              title="Clear Filters"
              onPress={clearFilters}
              variant="outline"
              style={styles.clearFiltersButton}
            />
          </View>
        </View>
      )}
      
      {/* Premium Promotion for Non-Premium Users */}
      {!isPremium && (
        <Card style={[styles.premiumPromoCard, { backgroundColor: Colors.card }]}>
          <View style={styles.premiumPromoContent}>
            <Crown size={24} color="#FFD700" />
            <View style={styles.premiumPromoText}>
              <Text style={[styles.premiumPromoTitle, { color: Colors.text }]}>
                Unlock All Premium Resources
              </Text>
              <Text style={[styles.premiumPromoDescription, { color: Colors.lightText }]}>
                Get access to expert guides, templates, and tools to accelerate your study abroad journey
              </Text>
            </View>
            <Button
              title="Upgrade"
              onPress={() => router.push("/premium")}
              style={styles.premiumPromoButton}
            />
          </View>
        </Card>
      )}
      
      {/* Featured Resources */}
      {!searchQuery && selectedCategory === "All" && selectedType === "All" && (
        <View style={styles.featuredSection}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Featured Resources</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredList}>
            {featuredResources.slice(0, 3).map((resource) => (
              <View key={resource.id} style={styles.featuredItem}>
                <PremiumResourceCard
                  resource={resource}
                  onPress={() => handleResourcePress(resource.id)}
                  isPremium={isPremium}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      )}
      
      {/* Resources List */}
      <View style={styles.resourcesSection}>
        {searchQuery || selectedCategory !== "All" || selectedType !== "All" ? (
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>
            {filteredResources.length} Resources Found
          </Text>
        ) : (
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>All Resources</Text>
        )}
        
        {filteredResources.length > 0 ? (
          <FlatList
            data={filteredResources}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <PremiumResourceCard
                resource={item}
                onPress={() => handleResourcePress(item.id)}
                isPremium={isPremium}
              />
            )}
            contentContainerStyle={styles.resourcesList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: Colors.text }]}>No resources found</Text>
            <Text style={[styles.emptyText, { color: Colors.lightText }]}>
              {searchQuery
                ? `No results for "${searchQuery}"`
                : "Try adjusting your filters"}
            </Text>
            <Button
              title="Clear Filters"
              onPress={clearFilters}
              variant="outline"
              style={styles.clearFiltersButton}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  upgradeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  filtersContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  filterSection: {
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 16,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "500",
  },
  filterActions: {
    alignItems: "flex-start",
  },
  clearFiltersButton: {
    paddingHorizontal: 16,
  },
  premiumPromoCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  premiumPromoContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  premiumPromoText: {
    flex: 1,
  },
  premiumPromoTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  premiumPromoDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  premiumPromoButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  featuredSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  featuredList: {
    paddingHorizontal: 16,
    gap: 16,
  },
  featuredItem: {
    width: 280,
  },
  resourcesSection: {
    flex: 1,
  },
  resourcesList: {
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
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
});