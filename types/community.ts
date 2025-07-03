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
  comments: number;
  createdAt: string;
  tags: string[];
  isPinned?: boolean;
  isLiked: boolean;
  imageUrl?: string;
}

export interface CommunityStats {
  totalPosts: number;
  totalMembers: number;
  activeToday: number;
  topCountries: string[];
}