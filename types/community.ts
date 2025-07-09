export type Topic = "visa" | "university" | "accommodation" | "finances" | "culture" | "academics" | "career" | "general";

export interface Author {
  id: string;
  name: string;
  avatar?: string;
  country: string;
  university?: string;
}

export interface Comment {
  id: string;
  content: string;
  author: Author;
  createdAt: string;
  likes: number;
  isLiked: boolean;
  replies?: Comment[];
}

export interface Post {
  id: string;
  title: string;
  content: string;
  author: Author;
  topic: Topic;
  likes: number;
  comments: Comment[];
  createdAt: string;
  tags: string[];
  isPinned?: boolean;
  isLiked: boolean;
  imageUrl?: string;
  // Additional properties used in the app
  userId?: string;
  userName?: string;
  userAvatar?: string;
  isPremium?: boolean;
}

export interface CommunityStats {
  totalPosts: number;
  totalMembers: number;
  activeToday: number;
  topCountries: string[];
}