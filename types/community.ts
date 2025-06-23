export type Topic = 
  | "visa" 
  | "university" 
  | "accommodation" 
  | "finances" 
  | "culture" 
  | "academics" 
  | "career" 
  | "general";

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  likes: number;
  isLiked?: boolean;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  content: string;
  topic: Topic;
  createdAt: string;
  likes: number;
  comments: Comment[];
  isLiked?: boolean;
  isSaved?: boolean;
}

export interface CommunityUser {
  id: string;
  name: string;
  avatar?: string;
  homeCountry: string;
  destinationCountry: string;
  university?: string;
  joinDate: string;
  posts: number;
  comments: number;
  reputation: number;
}