import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, BookmarkPlus, Clock3, Flame } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import { useAppBack } from "@/hooks/useAppBack";
import {
  fetchArticleCategories,
  fetchArticles,
  canAccessArticle,
  normalizeSubscriptionTier,
  resolveArticleImageUrl,
} from "@/lib/articles";
import { Article, ArticleCategory } from "@/types/articles";
import { SubscriptionTier } from "@/types/user";
import { supabase } from "@/lib/supabase";

const formatTimeAgo = (dateString?: string | null) => {
  if (!dateString) return "Just now";
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo ago`;
};

const formatReadingTime = (minutes?: number | null) => {
  if (!minutes) return "Quick read";
  if (minutes < 1) return "Quick read";
  return `${minutes} min read`;
};

const CategoryPill = ({
  label,
  active,
  onPress,
  Colors,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  Colors: ReturnType<typeof useColors>;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.85}
    style={[
      styles.chip,
      active
        ? { backgroundColor: Colors.primary }
        : { backgroundColor: Colors.lightBackground, borderColor: Colors.border, borderWidth: 1 },
    ]}
  >
    <Text style={[styles.chipLabel, { color: active ? Colors.white : Colors.text }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const FeaturedArticleCard = ({
  article,
  onPress,
  Colors,
}: {
  article: Article;
  onPress: () => void;
  Colors: ReturnType<typeof useColors>;
}) => {
  const imageUrl = resolveArticleImageUrl(article.cover_image_url);
  const categoryLabel = article.categories?.[0]?.title || "Featured";

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.featuredContainer}>
      <ImageBackground
        source={{ uri: imageUrl }}
        style={styles.featuredImage}
        imageStyle={styles.featuredImageStyle}
      >
        <LinearGradient
          colors={["rgba(0,0,0,0.05)", "rgba(0,0,0,0.65)"]}
          style={styles.featuredOverlay}
        >
          <View style={styles.featuredTopRow}>
            <View style={[styles.badge, { backgroundColor: Colors.white + "30" }]}>
              <Flame size={14} color={Colors.white} />
              <Text style={styles.badgeLabel}>{categoryLabel}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: Colors.white + "20" }]}>
              <Clock3 size={14} color={Colors.white} />
              <Text style={styles.badgeLabel}>{formatReadingTime(article.reading_time_minutes)}</Text>
            </View>
          </View>
          <View style={styles.featuredContent}>
            <Text style={styles.featuredTitle} numberOfLines={2}>
              {article.title}
            </Text>
            <Text style={styles.featuredMeta}>
              {formatTimeAgo(article.created_at)} • {article.categories?.map((c) => c.title).slice(0, 2).join(", ")}
            </Text>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const ArticleListCard = ({
  article,
  onPress,
  Colors,
}: {
  article: Article;
  onPress: () => void;
  Colors: ReturnType<typeof useColors>;
}) => {
  const imageUrl = resolveArticleImageUrl(article.cover_image_url);
  const primaryCategory = article.categories?.[0]?.title || "Article";

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.articleCard, { backgroundColor: Colors.card, shadowColor: Colors.shadowLight }]}
    >
      <ImageBackground
        source={{ uri: imageUrl }}
        style={styles.articleImage}
        imageStyle={styles.articleImageStyle}
      />
      <View style={styles.articleContent}>
        <View style={[styles.badge, { backgroundColor: Colors.primary + "18" }]}>
          <Text style={[styles.badgeLabel, { color: Colors.primary }]}>{primaryCategory}</Text>
        </View>
        <Text style={[styles.articleTitle, { color: Colors.text }]} numberOfLines={2}>
          {article.title}
        </Text>
        <Text style={[styles.articleSummary, { color: Colors.lightText }]} numberOfLines={2}>
          {article.summary || "Tap to read the full story."}
        </Text>
        <View style={styles.articleMetaRow}>
          <View style={styles.metaItem}>
            <Clock3 size={14} color={Colors.lightText} />
            <Text style={[styles.metaText, { color: Colors.lightText }]}>{formatTimeAgo(article.created_at)}</Text>
          </View>
          <View style={styles.metaItem}>
            <BookmarkPlus size={14} color={Colors.lightText} />
            <Text style={[styles.metaText, { color: Colors.lightText }]}>{formatReadingTime(article.reading_time_minutes)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function PremiumArticlesScreen() {
  const Colors = useColors();
  const router = useRouter();
  const handleBack = useAppBack("/premium");
  const insets = useSafeAreaInsets();

  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [userTier, setUserTier] = useState<SubscriptionTier>("free");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadContent = useCallback(async () => {
    setErrorMessage(null);
    setIsRefreshing(true);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData?.user;
      let tier: SubscriptionTier = "free";

      if (authUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("subscription_tier")
          .eq("id", authUser.id)
          .single();

        if (profile?.subscription_tier) {
          tier = normalizeSubscriptionTier(profile.subscription_tier);
        }
      }

      setUserTier(tier);

      const [fetchedCategories, fetchedArticles] = await Promise.all([
        fetchArticleCategories(),
        fetchArticles(),
      ]);

      setCategories(fetchedCategories);
      setArticles(fetchedArticles);
    } catch (error) {
      console.error("Failed to load articles:", error);
      setErrorMessage("Unable to load articles right now. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const accessibleArticles = useMemo(
    () => articles.filter((article) => canAccessArticle(article.access_tier, userTier)),
    [articles, userTier]
  );

  const filteredArticles = useMemo(() => {
    if (selectedCategory === "all") return accessibleArticles;
    return accessibleArticles.filter((article) =>
      article.categories?.some(
        (category) => category.id === selectedCategory || category.slug === selectedCategory
      )
    );
  }, [accessibleArticles, selectedCategory]);

  const featuredArticle = filteredArticles[0] || accessibleArticles[0] || null;
  const listArticles = featuredArticle
    ? filteredArticles.filter((article) => article.id !== featuredArticle.id)
    : filteredArticles;

  const categoryLabel =
    selectedCategory === "all"
      ? "All"
      : categories.find((c) => c.id === selectedCategory || c.slug === selectedCategory)?.title ||
        "Selected";

  const renderHeader = () => (
    <View style={[styles.pageHeader, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={handleBack}
          style={[styles.iconButton, { borderColor: Colors.border }]}
          hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}
        >
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.title, { color: Colors.text }]}>Discover</Text>
      <Text style={[styles.subtitle, { color: Colors.lightText }]}>
        Fresh stories and guidance curated for your journey.
      </Text>

      <View style={styles.chipRow}>
        <CategoryPill
          label="All"
          active={selectedCategory === "all"}
          onPress={() => setSelectedCategory("all")}
          Colors={Colors}
        />
        {categories.map((category) => (
          <CategoryPill
            key={category.id}
            label={category.title}
            active={selectedCategory === category.id || selectedCategory === category.slug}
            onPress={() => setSelectedCategory(category.id)}
            Colors={Colors}
          />
        ))}
      </View>

      {featuredArticle ? (
        <FeaturedArticleCard
          article={featuredArticle}
          onPress={() => router.push(`/premium/articles/${featuredArticle.slug}`)}
          Colors={Colors}
        />
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: Colors.text }]}>
          Latest in {categoryLabel}
        </Text>
        <Text style={[styles.sectionHint, { color: Colors.lightText }]}>
          {listArticles.length} articles
        </Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: Colors.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[styles.loadingText, { color: Colors.lightText }]}>Loading articles...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <FlatList
        data={listArticles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ArticleListCard
            article={item}
            onPress={() => router.push(`/premium/articles/${item.slug}`)}
            Colors={Colors}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={loadContent} tintColor={Colors.primary} />
        }
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          featuredArticle ? (
            <View style={{ paddingVertical: 12 }} />
          ) : (
            <View style={styles.emptyState}>
              <BookmarkPlus size={32} color={Colors.lightText} />
              <Text style={[styles.emptyTitle, { color: Colors.text }]}>No articles yet</Text>
              <Text style={[styles.emptyText, { color: Colors.lightText }]}>
                Switch categories or check back soon for fresh updates.
              </Text>
            </View>
          )
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, 16), paddingHorizontal: 20 },
        ]}
        showsVerticalScrollIndicator={false}
      />
      {errorMessage ? (
        <View style={[styles.errorBanner, { backgroundColor: Colors.error + "10" }]}>
          <Text style={[styles.errorText, { color: Colors.error }]}>{errorMessage}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
  },
  listContent: {
    paddingBottom: 24,
  },
  pageHeader: {
    gap: 16,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  helperText: {
    fontSize: 12,
    fontWeight: "600",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  featuredContainer: {
    width: "100%",
    marginTop: 8,
  },
  featuredImage: {
    height: 220,
    width: "100%",
  },
  featuredImageStyle: {
    borderRadius: 18,
  },
  featuredOverlay: {
    flex: 1,
    borderRadius: 18,
    padding: 18,
    justifyContent: "space-between",
  },
  featuredTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  featuredContent: {
    gap: 8,
  },
  featuredTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 28,
  },
  featuredMeta: {
    color: "#F1F5F9",
    fontSize: 14,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  badgeLabel: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  sectionHeader: {
    marginTop: 6,
    marginBottom: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  sectionHint: {
    fontSize: 13,
    fontWeight: "500",
  },
  articleCard: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 12,
    gap: 12,
    marginBottom: 14,
    elevation: 2,
  },
  articleImage: {
    width: 110,
    height: 110,
  },
  articleImageStyle: {
    borderRadius: 14,
  },
  articleContent: {
    flex: 1,
    gap: 6,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
  },
  articleSummary: {
    fontSize: 13,
    lineHeight: 18,
  },
  articleMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  errorBanner: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    padding: 12,
    borderRadius: 12,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
});
