import { SubscriptionTier } from "./user";

export type ArticleAccessTier = "free" | "standard" | "premium";

export interface ArticleCategory {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  sort_order?: number | null;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  content?: string | null;
  cover_image_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  reading_time_minutes?: number | null;
  access_tier: ArticleAccessTier;
  destination_country_code?: string | null;
  origin_country_code?: string | null;
  is_global?: boolean | null;
  categories: ArticleCategory[];
}

export type UserAccessTier = SubscriptionTier;
