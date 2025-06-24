export type ResourceType = "guide" | "video" | "webinar" | "tool" | "template" | "course";

export type ResourceCategory = 
  | "Application Materials"
  | "Research"
  | "Funding"
  | "Interviews"
  | "Visa & Legal"
  | "Community"
  | "Financial Planning"
  | "Life Abroad"
  | "Academic Success"
  | "Career Development";

export type DifficultyLevel = "Beginner" | "Intermediate" | "Advanced";

export interface PremiumResource {
  id: string;
  title: string;
  description: string;
  excerpt: string;
  type: ResourceType;
  category: ResourceCategory;
  difficulty: DifficultyLevel;
  estimatedTime: string;
  author: string;
  publishedDate: string;
  heroImage: string;
  rating: number;
  completions: number;
  isNew?: boolean;
  isFeatured?: boolean;
  tags: string[];
  previewContent: {
    introduction: string;
    sectionTitles: string[];
    keyTakeaways: string[];
  };
}

export interface ResourcePreview {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  category: ResourceCategory;
  difficulty: DifficultyLevel;
  estimatedTime: string;
  author: string;
  heroImage: string;
  rating: number;
  completions: number;
  isNew?: boolean;
  isFeatured?: boolean;
  previewText: string;
}