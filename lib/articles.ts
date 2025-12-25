import { supabase } from "./supabase";
import { Article, ArticleAccessTier, ArticleCategory } from "@/types/articles";
import { SubscriptionTier } from "@/types/user";

const DEFAULT_ARTICLE_BUCKET = "article-images";
const FALLBACK_ARTICLE_IMAGE = "https://yagdgijrdlifgcjkcnqe.supabase.co/storage/v1/object/public/article-images/articles/how-to-test-article-1766685291758.jpg";

const tierRank: Record<ArticleAccessTier | SubscriptionTier, number> = {
  free: 0,
  basic: 1,
  standard: 2,
  premium: 3,
  pro: 3,
};

export const normalizeSubscriptionTier = (tier?: string | null): SubscriptionTier => {
  if (!tier) return "free";
  const lower = tier.toLowerCase();

  if (lower === "basic") return "basic";
  if (lower === "standard") return "standard";
  if (lower === "premium") return "premium";
  if (lower === "pro") return "pro";

  return "free";
};

export const canAccessArticle = (
  accessTier: ArticleAccessTier,
  userTier?: SubscriptionTier | null
) => {
  const normalized = normalizeSubscriptionTier(userTier);
  return tierRank[normalized] >= tierRank[accessTier];
};

export const resolveArticleImageUrl = (coverImageUrl?: string | null) => {
  if (coverImageUrl && coverImageUrl.startsWith("http")) {
    return coverImageUrl;
  }

  if (coverImageUrl) {
    const { data } = supabase.storage
      .from(DEFAULT_ARTICLE_BUCKET)
      .getPublicUrl(coverImageUrl);

    if (data?.publicUrl) {
      return data.publicUrl;
    }
  }

  return FALLBACK_ARTICLE_IMAGE;
};

const mapCategory = (category: any): ArticleCategory | null => {
  if (!category) return null;

  return {
    id: category.id,
    slug: category.slug,
    title: category.title,
    description: category.description,
    sort_order: category.sort_order,
  };
};

const mapArticle = (article: any): Article => {
  const categories = (article.article_category_map || [])
    .map((relation: any) => mapCategory(relation?.article_categories))
    .filter(Boolean) as ArticleCategory[];

  const articleTier = (article.access_tier || "free").toString().toLowerCase();

  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    summary: article.summary,
    content: article.content,
    cover_image_url: resolveArticleImageUrl(article.cover_image_url),
    created_at: article.created_at,
    updated_at: article.updated_at,
    reading_time_minutes: article.reading_time_minutes,
    access_tier: (articleTier === "premium" || articleTier === "standard" || articleTier === "free"
      ? articleTier
      : "free") as ArticleAccessTier,
    destination_country_code: article.destination_country_code,
    origin_country_code: article.origin_country_code,
    is_global: article.is_global,
    categories,
  };
};

export async function fetchArticleCategories(): Promise<ArticleCategory[]> {
  const { data, error } = await supabase
    .from("article_categories")
    .select("id, slug, title, description, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error loading article categories:", error);
    throw error;
  }

  return (data || []).map((category) => ({
    id: category.id,
    slug: category.slug,
    title: category.title,
    description: category.description,
    sort_order: category.sort_order,
  }));
}

export async function fetchArticles(): Promise<Article[]> {
  const { data, error } = await supabase
    .from("articles")
    .select(`
      id,
      slug,
      title,
      summary,
      cover_image_url,
      created_at,
      updated_at,
      reading_time_minutes,
      access_tier,
      destination_country_code,
      origin_country_code,
      is_global,
      article_category_map (
        category_id,
        article_categories (
          id,
          slug,
          title,
          description,
          sort_order
        )
      )
    `)
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading articles:", error);
    throw error;
  }

  return (data || []).map(mapArticle);
}

export async function fetchArticleBySlug(slug: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from("articles")
    .select(`
      id,
      slug,
      title,
      summary,
      content,
      cover_image_url,
      created_at,
      updated_at,
      reading_time_minutes,
      access_tier,
      destination_country_code,
      origin_country_code,
      is_global,
      article_category_map (
        category_id,
        article_categories (
          id,
          slug,
          title,
          description,
          sort_order
        )
      )
    `)
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (error) {
    console.error("Error loading article:", error);
    return null;
  }

  if (!data) return null;

  return mapArticle(data);
}
