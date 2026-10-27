import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { CompactArticleCard } from "@/components/resources/ArticleCards";
import { GUTTER, RADIUS, UI } from "@/constants/design";
import { useAppBack } from "@/hooks/useAppBack";
import { canAccessArticle, fetchArticleCategories, fetchArticles, normalizeSubscriptionTier } from "@/lib/articles";
import { articleRelevance, fetchBookmarkIds, setBookmarked } from "@/lib/bookmarks";
import { openManageSubscription } from "@/lib/subscriptionManager";
import { useJourneyStore } from "@/store/journeyStore";
import { useUserStore } from "@/store/userStore";
import { Article, ArticleCategory } from "@/types/articles";

/** Full guide library, optionally opened on one category or country. */
export default function LibraryScreen() {
  const router = useRouter();
  const handleBack = useAppBack("/(tabs)/premium");
  const params = useLocalSearchParams<{ category?: string; scope?: string; title?: string }>();
  const { user } = useUserStore();
  const { journeys, activeJourneyKey } = useJourneyStore();

  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [category, setCategory] = useState<string | null>(params.category ?? null);
  const [loading, setLoading] = useState(true);

  const tier = normalizeSubscriptionTier(user?.subscriptionTier);
  const activeJourney = journeys.find((j) => j.key === activeJourneyKey) || journeys[0] || null;
  const destination = activeJourney?.destinationCountryCode || user?.destinationCountry?.code || null;
  const origin = user?.homeCountry?.code || null;
  const countryOnly = params.scope === "country";

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([fetchArticles(), fetchArticleCategories(), fetchBookmarkIds()])
        .then(([loadedArticles, loadedCategories, bookmarkIds]) => {
          if (!active) return;
          setArticles(loadedArticles);
          setCategories(loadedCategories);
          setSaved(bookmarkIds);
        })
        .catch((error) => console.error("Error loading library:", error))
        .finally(() => active && setLoading(false));
      return () => {
        active = false;
      };
    }, []),
  );

  const visible = useMemo(
    () =>
      articles
        .filter((a) => !category || a.categories.some((c) => c.slug === category))
        .filter(
          (a) =>
            !countryOnly ||
            (!!destination && a.destination_country_code?.toUpperCase() === destination.toUpperCase()),
        )
        .sort(
          (a, b) =>
            articleRelevance(b, { destination, origin }) - articleRelevance(a, { destination, origin }),
        ),
    [articles, category, countryOnly, destination, origin],
  );

  const toggleSave = async (article: Article) => {
    const next = !saved.has(article.id);
    const update = (value: boolean) =>
      setSaved((current) => {
        const copy = new Set(current);
        if (value) copy.add(article.id);
        else copy.delete(article.id);
        return copy;
      });
    update(next);
    try {
      await setBookmarked(article.id, next);
    } catch (error) {
      console.error("Could not update saved guide:", error);
      update(!next);
    }
  };

  const openArticle = (article: Article) => {
    if (!canAccessArticle(article.access_tier, tier)) {
      Alert.alert("Premium guide", "This guide is part of a paid plan. Upgrade to read it.", [
        { text: "Not now", style: "cancel" },
        { text: "View plans", onPress: () => openManageSubscription().catch(() => router.push("/premium" as any)) },
      ]);
      return;
    }
    router.push(`/premium/articles/${article.slug}` as any);
  };

  const title = category
    ? categories.find((c) => c.slug === category)?.title ?? params.title ?? "Guides"
    : params.title ?? "All guides";

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity accessibilityLabel="Go back" hitSlop={10} onPress={handleBack} style={styles.back}>
          <ArrowLeft color={UI.text} size={22} strokeWidth={2} />
        </TouchableOpacity>
        <Text accessibilityRole="header" numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        <View style={styles.back} />
      </View>

      {!countryOnly ? (
        <ScrollView
          horizontal
          contentContainerStyle={styles.chips}
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
        >
          {[{ slug: null as string | null, title: "All" }, ...categories].map((item) => {
            const active = category === item.slug;
            return (
              <TouchableOpacity
                key={item.slug ?? "all"}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => setCategory(item.slug)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.title}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}

      {loading ? (
        <ActivityIndicator color={UI.primary} style={styles.loading} />
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={visible}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          keyExtractor={(article) => article.id}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {countryOnly
                ? "We're still writing guides for your destination. Check back soon."
                : "No guides in this category yet."}
            </Text>
          }
          renderItem={({ item }) => (
            <CompactArticleCard
              article={item}
              locked={!canAccessArticle(item.access_tier, tier)}
              onPress={() => openArticle(item)}
              onToggleSave={() => toggleSave(item)}
              saved={saved.has(item.id)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: UI.background,
    flex: 1,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: GUTTER - 10,
    paddingVertical: 10,
  },
  back: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  title: {
    color: UI.text,
    flex: 1,
    fontSize: 19,
    fontWeight: "700",
    textAlign: "center",
  },
  chipsScroll: {
    flexGrow: 0,
  },
  chips: {
    gap: 8,
    paddingBottom: 6,
    paddingHorizontal: GUTTER,
  },
  chip: {
    backgroundColor: UI.card,
    borderColor: UI.border,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: UI.primary,
    borderColor: UI.primary,
  },
  chipText: {
    color: UI.text,
    fontSize: 13,
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  loading: {
    marginTop: 60,
  },
  list: {
    paddingBottom: 60,
    paddingHorizontal: GUTTER,
    paddingTop: 12,
  },
  separator: {
    height: 14,
  },
  empty: {
    color: UI.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 40,
    textAlign: "center",
  },
});
