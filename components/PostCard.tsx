import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { MessageCircle, Heart, Clock } from "lucide-react-native";
import Colors from "@/constants/colors";
import Card from "./Card";
import Avatar from "./Avatar";
import { Post, Topic } from "@/types/community";
import { formatDate } from "@/utils/dateUtils";
import { getTopicColor, truncateText } from "@/utils/helpers";

interface PostCardProps {
  post: Post;
  onPress?: () => void;
  onLike?: () => void;
  onComment?: () => void;
  preview?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  onPress,
  onLike,
  onComment,
  preview = false,
}) => {
  const topicColor = getTopicColor(post.topic);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.userContainer}>
            <Avatar
              imageUrl={post.userAvatar}
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
              <View style={styles.timeContainer}>
                <Clock size={12} color={Colors.lightText} style={styles.timeIcon} />
                <Text style={styles.timeText}>{formatDate(post.createdAt)}</Text>
              </View>
            </View>
          </View>
          <View
            style={[
              styles.topicBadge,
              { backgroundColor: `${topicColor}20` }, // 20% opacity
            ]}
          >
            <Text style={[styles.topicText, { color: topicColor }]}>
              {post.topic.charAt(0).toUpperCase() + post.topic.slice(1)}
            </Text>
          </View>
        </View>

        <Text style={styles.title}>{post.title}</Text>
        <Text style={styles.content} numberOfLines={preview ? 3 : undefined}>
          {preview ? truncateText(post.content, 150) : post.content}
        </Text>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onLike}
            activeOpacity={0.7}
          >
            <Heart
              size={18}
              color={post.isLiked ? Colors.error : Colors.lightText}
              fill={post.isLiked ? Colors.error : "transparent"}
            />
            <Text
              style={[
                styles.actionText,
                post.isLiked && styles.likedText,
              ]}
            >
              {post.likes}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={onComment}
            activeOpacity={0.7}
          >
            <MessageCircle size={18} color={Colors.lightText} />
            <Text style={styles.actionText}>{post.comments.length}</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
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
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeIcon: {
    marginRight: 4,
  },
  timeText: {
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
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },
  content: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 16,
  },
  footer: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 24,
  },
  actionText: {
    fontSize: 14,
    color: Colors.lightText,
    marginLeft: 6,
  },
  likedText: {
    color: Colors.error,
  },
});

export default PostCard;