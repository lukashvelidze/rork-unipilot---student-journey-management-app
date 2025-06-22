export type Topic = 
  | "visa" 
  | "university" 
  | "accommodation" 
  | "finances" 
  | "culture" 
  | "academics" 
  | "career" 
  | "general";

export type User = {
  id: string;
  name: string;
  avatar?: string;
  homeCountry: string;
  destinationCountry: string;
  isPremium: boolean;
};

export type Comment = {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
  isPremium: boolean;
};

export type Post = {
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
  isLiked: boolean;
  isPremium: boolean;
};