export interface ArticleAuthor {
  id: string;
  display_name?: string | null;
  avatar_url?: string | null;
  full_name?: string | null;
}

export interface Article {
  id: string;
  title: string;
  summary?: string | null;
  content: string;
  destination_country_code: string;
  origin_country_code?: string | null;
  visa_types?: string[] | null;
  is_global: boolean;
  published: boolean;
  author_id?: string | null;
  author?: ArticleAuthor | null;
  linked_article_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ArticleFilters {
  destinationCountry: string;
  originCountry?: string | null;
  visaType?: string | null;
  includeDrafts?: boolean;
}

export interface ArticleInput {
  id?: string;
  title: string;
  summary?: string | null;
  content: string;
  destination_country_code: string;
  origin_country_code?: string | null;
  visa_types?: string[] | null;
  is_global?: boolean;
  published?: boolean;
  author_id?: string | null;
}

export interface CommunityUserProfile {
  id: string;
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  full_name?: string | null;
}

export interface CommunityPost {
  id: string;
  title: string;
  body: string;
  destination_country_code: string;
  origin_country_code?: string | null;
  visa_type?: string | null;
  user_id?: string | null;
  anonymous?: boolean;
  linked_article_id?: string | null;
  is_hidden?: boolean;
  hidden_reason?: string | null;
  created_at?: string;
  article?: Pick<Article, "id" | "title"> | null;
  author?: CommunityUserProfile | null;
  comments?: CommunityComment[];
}

export interface CommunityPostFilters {
  destinationCountry: string;
  originCountry?: string | null;
  visaType?: string | null;
  linkedArticleId?: string | null;
}

export interface CommunityPostInput {
  title: string;
  body: string;
  destination_country_code: string;
  origin_country_code?: string | null;
  visa_type?: string | null;
  anonymous?: boolean;
  linked_article_id?: string | null;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  user_id?: string | null;
  body: string;
  anonymous?: boolean;
  parent_id?: string | null;
  is_hidden?: boolean;
  created_at?: string;
  author?: CommunityUserProfile | null;
  replies?: CommunityComment[];
}

export interface CommunityCommentInput {
  post_id: string;
  body: string;
  anonymous?: boolean;
  parent_id?: string | null;
}
