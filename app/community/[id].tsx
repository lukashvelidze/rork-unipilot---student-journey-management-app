import React, { useState } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Heart, Send } from "lucide-react-native";
import Colors from "@/constants/colors";
import Avatar from "@/components/Avatar";
import Card from "@/components/Card";
import { useCommunityStore } from "@/store/communityStore";
import { useUserStore } from "@/store/userStore";
import { formatDate, formatTime } from "@/utils/dateUtils";
import { trpc } from "@/lib/trpc";

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
  isPremium: boolean;
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUserStore();
  const {
    likePost,
    unlikePost,
    likeComment,
    unlikeComment,
    addComment,
  } = useCommunityStore();
  
  const [commentText, setCommentText] = useState("");
  
  // Fetch post from backend
  const { data: post, isLoading, error, refetch } = trpc.community.getPost.useQuery(
    { id: id! },
    { enabled: !!id }
  );
  
  const likePostMutation = trpc.community.likePost.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error: any) => {
      Alert.alert("Error", "Failed to update like status");
      console.error("Like post error:", error);
    },
  });
  
  const likeCommentMutation = trpc.community.likeComment.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error: any) => {
      Alert.alert("Error", "Failed to update comment like status");
      console.error("Like comment error:", error);
    },
  });
  
  const addCommentMutation = trpc.community.addComment.useMutation({
    onSuccess: (newComment: any) => {
      // Add comment to local state
      if (post) {
        addComment(post.id, newComment);
      }
      setCommentText("");
      refetch();
    },
    onError: (error: any) => {
      Alert.alert("Error", "Failed to add comment");
      console.error("Add comment error:", error);
    },
  });
  
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading post...</Text>
        </View>
      </View>
    );
  }
  
  if (error || !post) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error?.message || "Post not found"}
          </Text>
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
  
  const handleLikePost = async () => {
    // Optimistic update
    if (post.isLiked) {
      unlikePost(post.id);
    } else {
      likePost(post.id);
    }
    
    // Update backend
    try {
      await likePostMutation.mutateAsync({
        postId: post.id,
        isLiked: !post.isLiked,
      });
    } catch (error) {
      // Revert optimistic update on error
      if (!post.isLiked) {
        unlikePost(post.id);
      } else {
        likePost(post.id);
      }
    }
  };
  
  const handleLikeComment = async (commentId: string, isLiked: boolean) => {
    // Optimistic update
    if (isLiked) {
      unlikeComment(post.id, commentId);
    } else {
      likeComment(post.id, commentId);
    }
    
    // Update backend
    try {
      await likeCommentMutation.mutateAsync({
        postId: post.id,
        commentId,
        isLiked: !isLiked,
      });
    } catch (error) {
      // Revert optimistic update on error
      if (!isLiked) {
        unlikeComment(post.id, commentId);
      } else {
        likeComment(post.id, commentId);
      }
    }
  };
  
  const handleAddComment = async () => {
    if (commentText.trim()) {
      try {
        await addCommentMutation.mutateAsync({
          postId: post.id,
          content: commentText,
          userId: user?.id || "anonymous",
          userName: user?.name || "Anonymous User",
          userAvatar: user?.avatar,
          isPremium: user?.isPremium || false,
        });
      } catch (error) {
        // Error is handled in the mutation
      }
    }
  };
  
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Card style={styles.postCard}>
          <View style={styles.postHeader}>
            <View style={styles.userContainer}>
              <Avatar
                name={post.userName}
                size="small"
                imageUrl={post.userAvatar}
              />
              <View style={styles.userInfo}>
                <View style={styles.nameContainer}>
                  <Text style={styles.userName}>{post.userName}</Text>
                  {post.isPremium && (
                    <View style={styles.premiumBadge}>
                      <Text style={styles.premiumText}>PRO</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.postDate}>{formatDate(post.createdAt)}</Text>
              </View>
            </View>
            <View
              style={[
                styles.topicBadge,
                { backgroundColor: `${Colors.primary}20` },
              ]}
            >
              <Text style={styles.topicText}>
                {post.topic.charAt(0).toUpperCase() + post.topic.slice(1)}
              </Text>
            </View>
          </View>
          
          <Text style={styles.postTitle}>{post.title}</Text>
          <Text style={styles.postContent}>{post.content}</Text>
          
          <View style={styles.postActions}>
            <TouchableOpacity
              style={styles.likeButton}
              onPress={handleLikePost}
              activeOpacity={0.7}
            >
              <Heart
                size={20}
                color={post.isLiked ? Colors.error : Colors.lightText}
                fill={post.isLiked ? Colors.error : "transparent"}
              />
              <Text
                style={[
                  styles.likeCount,
                  post.isLiked && styles.likedText,
                ]}
              >
                {post.likes} {post.likes === 1 ? "Like" : "Likes"}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
        
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>
            Comments ({post.comments.length})
          </Text>
          
          {post.comments.map((comment: Comment) => (
            <Card key={comment.id} style={styles.commentCard}>
              <View style={styles.commentHeader}>
                <View style={styles.commentUser}>
                  <Avatar
                    name={comment.userName}
                    size="small"
                    imageUrl={comment.userAvatar}
                  />
                  <View style={styles.commentUserInfo}>
                    <View style={styles.commentNameContainer}>
                      <Text style={styles.commentUserName}>{comment.userName}</Text>
                      {comment.isPremium && (
                        <View style={styles.premiumBadge}>
                          <Text style={styles.premiumText}>PRO</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.commentDate}>
                      {formatDate(comment.createdAt)} at {formatTime(comment.createdAt)}
                    </Text>
                  </View>
                </View>
              </View>
              
              <Text style={styles.commentContent}>{comment.content}</Text>
              
              <View style={styles.commentActions}>
                <TouchableOpacity
                  style={styles.commentLikeButton}
                  onPress={() => handleLikeComment(comment.id, comment.isLiked)}
                  activeOpacity={0.7}
                >
                  <Heart
                    size={16}
                    color={comment.isLiked ? Colors.error : Colors.lightText}
                    fill={comment.isLiked ? Colors.error : "transparent"}
                  />
                  <Text
                    style={[
                      styles.commentLikeCount,
                      comment.isLiked && styles.likedText,
                    ]}
                  >
                    {comment.likes}
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
      
      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment..."
          value={commentText}
          onChangeText={setCommentText}
          multiline
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            !commentText.trim() && styles.disabledSendButton,
          ]}
          onPress={handleAddComment}
          disabled={!commentText.trim() || addCommentMutation.isPending}
        >
          <Send
            size={20}
            color={commentText.trim() ? Colors.white : Colors.lightText}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
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
  postCard: {
    marginBottom: 16,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  userContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  userInfo: {
    marginLeft: 8,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginRight: 6,
  },
  premiumBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "700",
  },
  postDate: {
    fontSize: 12,
    color: Colors.lightText,
  },
  topicBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  topicText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },
  postContent: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 16,
  },
  postActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  likeButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  likeCount: {
    fontSize: 14,
    color: Colors.lightText,
    marginLeft: 6,
  },
  likedText: {
    color: Colors.error,
  },
  commentsSection: {
    marginBottom: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 12,
  },
  commentCard: {
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  commentUser: {
    flexDirection: "row",
    alignItems: "center",
  },
  commentUserInfo: {
    marginLeft: 8,
  },
  commentNameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginRight: 6,
  },
  commentDate: {
    fontSize: 12,
    color: Colors.lightText,
  },
  commentContent: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  commentActions: {
    flexDirection: "row",
  },
  commentLikeButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  commentLikeCount: {
    fontSize: 12,
    color: Colors.lightText,
    marginLeft: 4,
  },
  commentInputContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  commentInput: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  disabledSendButton: {
    backgroundColor: Colors.lightBackground,
  },
});