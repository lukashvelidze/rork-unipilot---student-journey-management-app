import React, { useEffect } from "react";
import { StyleSheet, View, Text, FlatList, TouchableOpacity, TextInput, Image, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Plus, Search, X, Crown, MessageCircle } from "lucide-react-native";
import Colors from "@/constants/colors";
import PostCard from "@/components/PostCard";
import Card from "@/components/Card";
import { useCommunityStore } from "@/store/communityStore";
import { useUserStore } from "@/store/userStore";
import { trpc } from "@/lib/trpc";

export default function CommunityScreen() {
  const router = useRouter();
  const { user, isPremium } = useUserStore();
  const {
    posts,
    filteredPosts,
    selectedTopic,
    searchQuery,
    isLoading,
    error,
    setPosts,
    searchPosts,
    likePost,
    unlikePost,
    setLoading,
    setError,
  } = useCommunityStore();
  
  const isUserPremium = isPremium || user?.isPremium || false;
  
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
    onError: (error: any) => {
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
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading posts: {error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
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
      
      {/* Premium UniPilot AI Assistant Promotion */}
      {!isUserPremium && (
        <Card style={styles.aiAssistantCard}>
          <View style={styles.aiAssistantContent}>
            <View style={styles.aiAssistantTextContainer}>
              <View style={styles.aiAssistantHeader}>
                <Crown size={20} color="#FFD700" style={styles.crownIcon} />
                <Text style={styles.aiAssistantTitle}>UniPilot AI Assistant</Text>
              </View>
              <Text style={styles.aiAssistantDescription}>
                Get instant answers to your study abroad questions from our AI education expert!
              </Text>
              <View style={styles.aiAssistantActions}>
                <TouchableOpacity
                  style={styles.aiAssistantButton}
                  onPress={() => router.push("/unipilot-ai")}
                >
                  <MessageCircle size={16} color={Colors.white} style={styles.aiButtonIcon} />
                  <Text style={styles.aiAssistantButtonText}>Try Now</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.premiumButton}
                  onPress={() => router.push("/premium")}
                >
                  <Text style={styles.premiumButtonText}>Subscribe $4.99</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Image 
              source={{ uri: "https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" }}
              style={styles.aiAssistantImage}
              resizeMode="cover"
            />
          </View>
        </Card>
      )}
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading discussions...</Text>
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
  aiAssistantCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 0,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  aiAssistantContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  aiAssistantTextContainer: {
    flex: 3,
    padding: 16,
  },
  aiAssistantHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  crownIcon: {
    marginRight: 6,
  },
  aiAssistantTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  aiAssistantDescription: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 12,
    lineHeight: 18,
  },
  aiAssistantActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  aiAssistantButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  aiButtonIcon: {
    marginRight: 4,
  },
  aiAssistantButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  premiumButton: {
    backgroundColor: "rgba(74, 144, 226, 0.1)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  premiumButtonText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  aiAssistantImage: {
    flex: 2,
    height: 140,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.lightText,
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
});