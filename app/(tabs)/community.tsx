import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text, FlatList, TouchableOpacity, TextInput, Image, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Plus, Search, X, Crown } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import PostCard from "@/components/PostCard";
import Card from "@/components/Card";
import { useCommunityStore } from "@/store/communityStore";
import { useUserStore } from "@/store/userStore";
import { Topic } from "@/types/community";
import { trpc } from "@/lib/trpc";

export default function CommunityScreen() {
  const router = useRouter();
  const Colors = useColors();
  const { user } = useUserStore();
  const {
    posts,
    filteredPosts,
    selectedTopic,
    searchQuery,
    isLoading,
    error,
    setPosts,
    filterByTopic,
    searchPosts,
    likePost,
    unlikePost,
    setLoading,
    setError,
  } = useCommunityStore();
  
  const isPremium = user?.isPremium || false;
  
  // Fetch posts from backend
  const { data: backendPosts, isLoading: postsLoading, error: postsError, refetch } = trpc.community.getPosts.useQuery({
    topic: selectedTopic || undefined,
    search: searchQuery || undefined,
  });
  
  const likePostMutation = trpc.community.likePost.useMutation({
    onSuccess: () => {
      // Refetch posts to get updated data
      refetch();
    },
    onError: (error) => {
      Alert.alert("Error", "Failed to update like status");
      console.error("Like post error:", error);
    },
  });
  
  // Update local state when backend data changes
  useEffect(() => {
    if (backendPosts) {
      setPosts(backendPosts);
    }
  }, [backendPosts, setPosts]);
  
  // Update loading state
  useEffect(() => {
    setLoading(postsLoading);
  }, [postsLoading, setLoading]);
  
  // Update error state
  useEffect(() => {
    if (postsError) {
      setError(postsError.message);
    } else {
      setError(null);
    }
  }, [postsError, setError]);
  
  const handleSearch = (text: string) => {
    searchPosts(text);
  };
  
  const clearSearch = () => {
    searchPosts("");
  };
  
  const handleLike = async (postId: string, isLiked: boolean) => {
    // Optimistic update
    if (isLiked) {
      unlikePost(postId);
    } else {
      likePost(postId);
    }
    
    // Update backend
    try {
      await likePostMutation.mutateAsync({
        postId,
        isLiked: !isLiked,
      });
    } catch (error) {
      // Revert optimistic update on error
      if (!isLiked) {
        unlikePost(postId);
      } else {
        likePost(postId);
      }
    }
  };
  
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: Colors.error }]}>Error loading posts: {error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Colors.primary }]}
            onPress={() => refetch()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: Colors.card, borderBottomColor: Colors.border }]}>
        <Text style={[styles.title, { color: Colors.text }]}>Community</Text>
        <TouchableOpacity
          style={[styles.newPostButton, { backgroundColor: Colors.primary }]}
          onPress={() => router.push("/community/new")}
        >
          <Plus size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, { backgroundColor: Colors.lightBackground }]}>
          <Search size={20} color={Colors.lightText} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: Colors.text }]}
            placeholder="Search discussions..."
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
      </View>
      
      {/* Premium UniPilot Promotion - Only show if not premium */}
      {!isPremium && (
        <Card style={[styles.premiumPromoCard, { backgroundColor: Colors.card }]}>
          <View style={styles.premiumPromoContent}>
            <View style={styles.premiumPromoTextContainer}>
              <View style={styles.premiumPromoHeader}>
                <Crown size={20} color="#FFD700" style={styles.crownIcon} />
                <Text style={[styles.premiumPromoTitle, { color: Colors.text }]}>UniPilot Premium</Text>
              </View>
              <Text style={[styles.premiumPromoDescription, { color: Colors.text }]}>
                Get expert advice on your visa applications, university choices, and more!
              </Text>
              <TouchableOpacity
                style={[styles.premiumPromoButton, { backgroundColor: Colors.primary }]}
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
      )}
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: Colors.lightText }]}>Loading discussions...</Text>
        </View>
      ) : filteredPosts.length > 0 ? (
        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              preview
              onPress={() => router.push(`/community/${item.id}`)}
              onLike={() => handleLike(item.id, item.isLiked || false)}
              onComment={() => router.push(`/community/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.postsList}
          showsVerticalScrollIndicator={false}
          refreshing={isLoading}
          onRefresh={() => refetch()}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: Colors.text }]}>No discussions found</Text>
          <Text style={[styles.emptyText, { color: Colors.lightText }]}>
            {searchQuery
              ? `No results for "${searchQuery}"`
              : selectedTopic
              ? `No discussions in the ${selectedTopic} category`
              : "Be the first to start a discussion"}
          </Text>
          <TouchableOpacity
            style={[styles.startDiscussionButton, { backgroundColor: Colors.primary }]}
            onPress={() => router.push("/community/new")}
          >
            <Text style={styles.startDiscussionText}>Start Discussion</Text>
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
  newPostButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  premiumPromoCard: {
    marginHorizontal: 16,
    marginBottom: 8,
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
  },
  premiumPromoDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 18,
  },
  premiumPromoButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  premiumPromoButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  premiumPromoImage: {
    flex: 2,
    height: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  loadingText: {
    fontSize: 16,
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
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  startDiscussionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  startDiscussionText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});