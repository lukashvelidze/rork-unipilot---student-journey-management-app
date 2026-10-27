import { supabase } from "@/lib/supabase";
import { Article } from "@/types/articles";

/** IDs of the articles the signed-in student has saved. */
export const fetchBookmarkIds = async (): Promise<Set<string>> => {
  const { data, error } = await supabase.from("article_bookmarks").select("article_id");
  if (error) {
    console.error("Error loading saved articles:", error);
    return new Set();
  }
  return new Set((data || []).map((row: { article_id: string }) => row.article_id));
};

export const setBookmarked = async (articleId: string, saved: boolean) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { error } = saved
    ? await supabase
        .from("article_bookmarks")
        .upsert({ user_id: user.id, article_id: articleId }, { onConflict: "user_id,article_id" })
    : await supabase.from("article_bookmarks").delete().eq("user_id", user.id).eq("article_id", articleId);
  if (error) throw error;
};

/**
 * Relevance of an article to the student: guides for their destination (and
 * home country) first, then global guides, then everything else.
 */
export const articleRelevance = (
  article: Article,
  context: { destination?: string | null; origin?: string | null },
) => {
  const destination = context.destination?.toUpperCase();
  const origin = context.origin?.toUpperCase();
  const articleDest = article.destination_country_code?.toUpperCase();
  const articleOrigin = article.origin_country_code?.toUpperCase();
  let score = 0;
  if (destination && articleDest === destination) score += 4;
  if (origin && articleOrigin === origin) score += 2;
  if (article.is_global) score += 1;
  if (articleDest && destination && articleDest !== destination) score -= 3;
  return score;
};
