import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text, FlatList, TouchableOpacity, TextInput, Image } from "react-native";
import { useRouter } from "expo-router";
import { Plus, Search, X, Crown } from "lucide-react-native";
import Colors from "@/constants/colors";
import PostCard from "@/components/PostCard";
import TopicSelector from "@/components/TopicSelector";
import Card from "@/components/Card";
import { useCommunityStore } from "@/store/communityStore";
import { Topic } from "@/types/community";
import { mockPosts } from "@/mocks/communityPosts";

export default function CommunityScreen() {
  const router = useRouter();
  const {
    posts,
    filteredPosts,
    selectedTopic,
    setPosts,
    filterByTopic,
    searchPosts,
    likePost,
    unlikePost,
  } = useCommunityStore();
  
  const [searchQuery, setSearchQuery] = useState("");
  
  // Initialize with mock posts if empty
  useEffect(() => {
    if (posts.length === 0) {
      setPosts(mockPosts);
    }
  }, [posts.length, setPosts]);
  
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    searchPosts(text);
  };
  
  const clearSearch = () => {
    setSearchQuery("");
    searchPosts("");
  };
  
  const handleLike = (postId: string, isLiked: boolean) => {
    if (isLiked) {
      unlikePost(postId);
    } else {
      likePost(postId);
    }
  };
  
  const topics: { id: Topic; label: string }[] = [
    { id: "visa", label: "Visa" },
    { id: "university", label: "University" },
    { id: "accommodation", label: "Housing" },
    { id: "finances", label: "Finances" },
    { id: "culture", label: "Culture" },
    { id: "academics", label: "Academics" },
    { id: "career", label: "Career" },
    { id: "general", label: "General" },
  ];
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Community</Text>
        <TouchableOpacity
          style={styles.newPostButton}
          onPress={() => router.push("/community/new")}
        >
          <Plus size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={Colors.lightText} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search discussions..."
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
      </View>
      
      {/* Premium UniPilot Promotion */}
      <Card style={styles.premiumPromoCard}>
        <View style={styles.premiumPromoContent}>
          <View style={styles.premiumPromoTextContainer}>
            <View style={styles.premiumPromoHeader}>
              <Crown size={20} color="#FFD700" style={styles.crownIcon} />
              <Text style={styles.premiumPromoTitle}>UniPilot Premium</Text>
            </View>
            <Text style={styles.premiumPromoDescription}>
              Get expert advice on your visa applications, university choices, and more!
            </Text>
            <TouchableOpacity
              style={styles.premiumPromoButton}
              onPress={() => router.push("/premium")}
            >
              <Text style={styles.premiumPromoButtonText}>Try for $4.99/month</Text>
            </TouchableOpacity>
          </View>
          <Image 
            source={{ uri: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" }}
            style={styles.premiumPromoImage}
            resizeMode="cover"
          />
        </View>
      </Card>
      
      <TopicSelector
        topics={topics}
        selectedTopic={selectedTopic}
        onSelectTopic={filterByTopic}
      />
      
      {filteredPosts.length > 0 ? (
        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              preview
              onPress={() => router.push(`/community/${item.id}`)}
              onLike={() => handleLike(item.id, item.isLiked)}
              onComment={() => router.push(`/community/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.postsList}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No discussions found</Text>
          <Text style={styles.emptyText}>
            {searchQuery
              ? `No results for "${searchQuery}"`
              : selectedTopic
              ? `No discussions in the ${selectedTopic} category`
              : "Be the first to start a discussion"}
          </Text>
          <TouchableOpacity
            style={styles.startDiscussionButton}
            onPress={() => router.push("/community/new")}
          >
            <Text style={styles.startDiscussionText}>Start Discussion</Text>
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
  newPostButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.lightBackground,
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
    color: Colors.text,
  },
  premiumPromoCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 0,
    overflow: "hidden",
  },
  premiumPromoContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  premiumPromoTextContainer: {
    flex: 3,
    padding: 16,
  },
  premiumPromoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  crownIcon: {
    marginRight: 6,
  },
  premiumPromoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  premiumPromoDescription: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 12,
    lineHeight: 18,
  },
  premiumPromoButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  premiumPromoButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  premiumPromoImage: {
    flex: 2,
    height: 120,
  },
  postsList: {
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
  startDiscussionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  startDiscussionText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
});