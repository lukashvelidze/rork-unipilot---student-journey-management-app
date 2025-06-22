import React, { useState } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Heart, Send } from "lucide-react-native";
import Colors from "@/constants/colors";
import Avatar from "@/components/Avatar";
import Card from "@/components/Card";
import { useCommunityStore } from "@/store/communityStore";
import { formatDate, formatTime } from "@/utils/dateUtils";
import { generateId } from "@/utils/helpers";

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    posts,
    likePost,
    unlikePost,
    likeComment,
    unlikeComment,
    addComment,
  } = useCommunityStore();
  
  const [commentText, setCommentText] = useState("");
  
  const post = posts.find((p) => p.id === id);
  
  if (!post) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Post not found</Text>
      </View>
    );
  }
  
  const handleLikePost = () => {
    if (post.isLiked) {
      unlikePost(post.id);
    } else {
      likePost(post.id);
    }
  };
  
  const handleLikeComment = (commentId: string, isLiked: boolean) => {
    if (isLiked) {
      unlikeComment(post.id, commentId);
    } else {
      likeComment(post.id, commentId);
    }
  };
  
  const handleAddComment = () => {
    if (commentText.trim()) {
      const newComment = {
        id: generateId(),
        userId: "current_user", // In a real app, this would be the current user's ID
        userName: "You", // In a real app, this would be the current user's name
        userAvatar: undefined, // In a real app, this would be the current user's avatar
        content: commentText,
        createdAt: new Date().toISOString(),
        likes: 0,
        isLiked: false,
        isPremium: false,
      };
      
      addComment(post.id, newComment);
      setCommentText("");
    }
  };
  
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Card style={styles.postCard}>
          <View style={styles.postHeader}>
            <View style={styles.userContainer}>
              <Avatar
                source={post.userAvatar}
                name={post.userName}
                size="small"
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
                { backgroundColor: `${Colors.primary}20` }, // 20% opacity
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
          
          {post.comments.map((comment) => (
            <Card key={comment.id} style={styles.commentCard}>
              <View style={styles.commentHeader}>
                <View style={styles.commentUser}>
                  <Avatar
                    source={comment.userAvatar}
                    name={comment.userName}
                    size="small"
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
          disabled={!commentText.trim()}
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
    paddingBottom: 100, // Extra padding for comment input
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
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: "center",
    marginTop: 24,
  },
});