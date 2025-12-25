import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, BookmarkPlus, Clock3, Globe2 } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import {
  fetchArticleBySlug,
  canAccessArticle,
  normalizeSubscriptionTier,
  resolveArticleImageUrl,
} from "@/lib/articles";
import { supabase } from "@/lib/supabase";
import { Article } from "@/types/articles";
import { SubscriptionTier } from "@/types/user";
import Button from "@/components/Button";

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
  return `${minutes} min read`;
};

export default function ArticleDetailScreen() {
  const Colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug?: string }>();

  const [article, setArticle] = useState<Article | null>(null);
  const [userTier, setUserTier] = useState<SubscriptionTier>("free");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadArticle = async () => {
      if (!slug || typeof slug !== "string") {
        setErrorMessage("Missing article.");
        setIsLoading(false);
        return;
      }

      setErrorMessage(null);
      setIsLoading(true);

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

        const fetchedArticle = await fetchArticleBySlug(slug);
        if (!fetchedArticle) {
          setErrorMessage("We could not find this article.");
        }
        setArticle(fetchedArticle);
      } catch (error) {
        console.error("Failed to load article:", error);
        setErrorMessage("Unable to load this article. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadArticle();
  }, [slug]);

  const isLocked = useMemo(() => {
    if (!article) return false;
    return !canAccessArticle(article.access_tier, userTier);
  }, [article, userTier]);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: Colors.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[styles.loadingText, { color: Colors.lightText }]}>Loading article...</Text>
      </View>
    );
  }

  if (!article) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: Colors.background }]}>
        <Text style={[styles.errorTitle, { color: Colors.text }]}>{errorMessage || "Article not found."}</Text>
        <Button title="Go back" onPress={() => router.back()} />
      </View>
    );
  }

  const heroImage = resolveArticleImageUrl(article.cover_image_url);
  const categoryLabel = article.categories?.[0]?.title || "Premium Article";

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 16, 24) }}
      >
        <View style={styles.heroContainer}>
          <ImageBackground
            source={{ uri: heroImage }}
            style={styles.heroImage}
            imageStyle={styles.heroImageStyle}
          >
            <LinearGradient
              colors={["rgba(0,0,0,0.05)", "rgba(0,0,0,0.75)"]}
              style={styles.heroOverlay}
            >
              <View style={[styles.heroTopRow, { marginTop: insets.top + 10 }]}>
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={[styles.iconButton, { borderColor: Colors.white + "30" }]}
                  hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}
                >
                  <ArrowLeft size={22} color={Colors.white} />
                </TouchableOpacity>
                <View style={[styles.iconButton, { borderColor: Colors.white + "30" }]}>
                  <BookmarkPlus size={22} color={Colors.white} />
                </View>
              </View>

              <View style={styles.heroBottomContent}>
                <View style={[styles.badge, { backgroundColor: Colors.white + "20" }]}>
                  <Text style={[styles.badgeText, { color: Colors.white }]}>{categoryLabel}</Text>
                </View>
                <Text style={styles.heroTitle}>{article.title}</Text>
                <Text style={styles.heroMeta}>
                  {formatTimeAgo(article.created_at)} • {formatReadingTime(article.reading_time_minutes)}
                </Text>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>

        <View style={styles.bodyContainer}>
          <View style={styles.metaRow}>
            <View style={[styles.badge, { backgroundColor: Colors.primary + "16" }]}>
              <Clock3 size={14} color={Colors.primary} />
              <Text style={[styles.metaBadgeText, { color: Colors.primary }]}>
                {formatReadingTime(article.reading_time_minutes)}
              </Text>
            </View>
            {article.destination_country_code ? (
              <View style={[styles.badge, { backgroundColor: Colors.secondary + "16" }]}>
                <Globe2 size={14} color={Colors.secondary} />
                <Text style={[styles.metaBadgeText, { color: Colors.secondary }]}>
                  {article.destination_country_code.toUpperCase()}
                </Text>
              </View>
            ) : null}
          </View>

          {article.summary ? (
            <Text style={[styles.summary, { color: Colors.text }]}>{article.summary}</Text>
          ) : null}

          {isLocked ? (
            <View style={[styles.lockedCard, { borderColor: Colors.border, backgroundColor: Colors.card }]}>
              <Text style={[styles.lockedTitle, { color: Colors.text }]}>Premium content</Text>
              <Text style={[styles.lockedText, { color: Colors.lightText }]}>
                Upgrade your plan to read the full article and unlock more premium resources.
              </Text>
              <Button title="View plans" onPress={() => router.push("/premium")} fullWidth />
            </View>
          ) : (
            <View style={styles.contentBlock}>
              {article.content
                ? article.content
                    .split(/\n{2,}/)
                    .filter(Boolean)
                    .map((paragraph, index) => (
                      <Text
                        key={`${article.id}-paragraph-${index}`}
                        style={[styles.paragraph, { color: Colors.text }]}
                      >
                        {paragraph.trim()}
                      </Text>
                    ))
                : (
                  <Text style={[styles.paragraph, { color: Colors.text }]}>
                    Detailed content will be available soon.
                  </Text>
                )}
            </View>
          )}
        </View>
      </ScrollView>
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
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  heroContainer: {
    width: "100%",
  },
  heroImage: {
    height: 320,
  },
  heroImageStyle: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroOverlay: {
    flex: 1,
    justifyContent: "space-between",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  heroBottomContent: {
    gap: 8,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 32,
  },
  heroMeta: {
    color: "#E2E8F0",
    fontSize: 14,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "700",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  metaBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  bodyContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 16,
  },
  summary: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },
  lockedCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  lockedTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  lockedText: {
    fontSize: 14,
    lineHeight: 20,
  },
  contentBlock: {
    gap: 14,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
  },
});
