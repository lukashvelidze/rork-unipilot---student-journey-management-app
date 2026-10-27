import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Image } from "expo-image";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ExternalLink,
  GraduationCap,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react-native";
import BottomSheet from "@/components/ui/BottomSheet";
import {
  categoryIcon,
  CompactArticleCard,
  FeaturedArticleCard,
} from "@/components/resources/ArticleCards";
import { CARD_SHADOW, GUTTER, RADIUS, UI } from "@/constants/design";
import { canAccessArticle, fetchArticleCategories, fetchArticles, normalizeSubscriptionTier } from "@/lib/articles";
import { articleRelevance, fetchBookmarkIds, setBookmarked } from "@/lib/bookmarks";
import {
  countryFlag,
  formatDeadline,
  formatRankingBadge,
  formatTuitionRange,
  getUniversityLevelDetails,
  UniversityRecord,
} from "@/lib/journeyRoutes";
import { openManageSubscription } from "@/lib/subscriptionManager";
import { useJourneyStore } from "@/store/journeyStore";
import { useUserStore } from "@/store/userStore";
import { Article, ArticleCategory } from "@/types/articles";

type Mode = "all" | "saved" | "uni";

const TILE_GAP = 10;

export default function ResourcesScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const { journeys, activeJourneyKey } = useJourneyStore();
  const { width: screenWidth } = useWindowDimensions();
  const tileWidth = Math.floor((screenWidth - GUTTER * 2 - TILE_GAP * 2) / 3);

  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<Mode>("all");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const tier = normalizeSubscriptionTier(user?.subscriptionTier);
  const activeJourney = journeys.find((j) => j.key === activeJourneyKey) || journeys[0] || null;
  const destination = activeJourney?.destinationCountryCode || user?.destinationCountry?.code || null;
  const origin = user?.homeCountry?.code || null;

  const load = useCallback(async () => {
    try {
      setError("");
      const [loadedArticles, loadedCategories, bookmarkIds] = await Promise.all([
        fetchArticles(),
        fetchArticleCategories(),
        fetchBookmarkIds(),
      ]);
      setArticles(loadedArticles);
      setCategories(loadedCategories);
      setSaved(bookmarkIds);
    } catch (loadError) {
      console.error("Error loading resources:", loadError);
      setError("We couldn't load resources. Pull down to try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const ranked = useMemo(
    () =>
      [...articles].sort(
        (a, b) =>
          articleRelevance(b, { destination, origin }) - articleRelevance(a, { destination, origin }),
      ),
    [articles, destination, origin],
  );
  const featured = ranked.slice(0, 2);

  const universities = useMemo(
    () =>
      journeys
        .map((j) => j.journey?.university)
        .filter((u): u is UniversityRecord => !!u),
    [journeys],
  );

  const searchResults = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle && !categoryFilter) return null;
    const inCategory = (article: Article) =>
      !categoryFilter || article.categories.some((c) => c.slug === categoryFilter);
    const matches = (article: Article) =>
      !needle ||
      `${article.title} ${article.summary ?? ""} ${article.categories.map((c) => c.title).join(" ")}`
        .toLowerCase()
        .includes(needle);
    return {
      articles: ranked.filter((a) => inCategory(a) && matches(a)),
      universities: needle
        ? universities.filter((u) => `${u.name} ${u.city ?? ""}`.toLowerCase().includes(needle))
        : [],
    };
  }, [categoryFilter, query, ranked, universities]);

  // ---------------------------------------------------------------------

  const openArticle = (article: Article) => {
    if (!canAccessArticle(article.access_tier, tier)) {
      Alert.alert(
        "Premium guide",
        "This guide is part of a paid plan. Upgrade to read it.",
        [
          { text: "Not now", style: "cancel" },
          { text: "View plans", onPress: () => openManageSubscription().catch(() => router.push("/premium" as any)) },
        ],
      );
      return;
    }
    router.push(`/premium/articles/${article.slug}` as any);
  };

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
    } catch (saveError) {
      console.error("Could not update saved guide:", saveError);
      update(!next);
      Alert.alert("Couldn't save", "Please check your connection and try again.");
    }
  };

  const openLibrary = (params: { category?: string; title: string; scope?: "country" }) =>
    router.push({ pathname: "/resources/library", params } as any);

  const cardProps = (article: Article) => ({
    article,
    locked: !canAccessArticle(article.access_tier, tier),
    onPress: () => openArticle(article),
    onToggleSave: () => toggleSave(article),
    saved: saved.has(article.id),
  });

  const tiles = [
    ...categories.map((category) => ({
      key: category.slug,
      label: category.title,
      Icon: categoryIcon(`${category.slug} ${category.title}`),
      onPress: () => openLibrary({ category: category.slug, title: category.title }),
    })),
    {
      key: "country",
      label: "Country guides",
      Icon: categoryIcon("country"),
      onPress: () =>
        openLibrary({ scope: "country", title: `${user?.destinationCountry?.name || "Country"} guides` }),
    },
    {
      key: "interview",
      label: "Interview prep",
      Icon: categoryIcon("interview"),
      onPress: () => router.push("/premium/interview-simulator" as any),
    },
  ];

  const savedArticles = ranked.filter((a) => saved.has(a.id));

  // ---------------------------------------------------------------------

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
            refreshing={refreshing}
            tintColor={UI.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text accessibilityRole="header" style={styles.title}>
          Resources
        </Text>

        <View style={styles.searchBox}>
          <Search color={UI.muted} size={18} strokeWidth={2} />
          <TextInput
            accessibilityLabel="Search resources"
            autoCorrect={false}
            onChangeText={setQuery}
            placeholder="Search guides, checklists, universities..."
            placeholderTextColor={UI.muted}
            returnKeyType="search"
            style={styles.searchInput}
            value={query}
          />
          {query ? (
            <TouchableOpacity accessibilityLabel="Clear search" hitSlop={10} onPress={() => setQuery("")}>
              <X color={UI.muted} size={16} strokeWidth={2.2} />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            accessibilityLabel="Filter by category"
            hitSlop={10}
            onPress={() => setFilterOpen(true)}
            style={styles.filterButton}
          >
            <SlidersHorizontal color={categoryFilter ? UI.primary : UI.textSecondary} size={18} strokeWidth={2} />
            {categoryFilter ? <View style={styles.filterDot} /> : null}
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          contentContainerStyle={styles.chips}
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
        >
          <Chip active={mode === "all"} label="All resources" onPress={() => setMode("all")} />
          <Chip active={mode === "saved"} label={`Saved ${saved.size}`} onPress={() => setMode("saved")} />
          <Chip active={mode === "uni"} label="Uni guides" onPress={() => setMode("uni")} />
        </ScrollView>

        {loading ? (
          <ActivityIndicator color={UI.primary} style={styles.loading} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : searchResults ? (
          <SearchResults
            cardProps={cardProps}
            categoryTitle={categories.find((c) => c.slug === categoryFilter)?.title ?? null}
            onClearCategory={() => setCategoryFilter(null)}
            results={searchResults}
          />
        ) : mode === "saved" ? (
          savedArticles.length ? (
            <View style={styles.stack}>
              {savedArticles.map((article) => (
                <CompactArticleCard key={article.id} {...cardProps(article)} />
              ))}
            </View>
          ) : (
            <EmptyNote
              text="Tap the bookmark on any guide to keep it here for later."
              title="No saved guides yet"
            />
          )
        ) : mode === "uni" ? (
          universities.length ? (
            <View style={styles.stack}>
              {universities.map((university) => (
                <UniversityGuide
                  key={university.id}
                  level={journeys.find((j) => j.journey?.university?.id === university.id)?.journey?.education_level ?? null}
                  university={university}
                />
              ))}
            </View>
          ) : (
            <EmptyNote
              actionLabel="Choose universities"
              onAction={() => router.push("/onboarding/step-universities?mode=manage" as any)}
              text="Pick the universities you're applying to and their key facts will appear here."
              title="No universities yet"
            />
          )
        ) : (
          <>
            {featured.length ? (
              <>
                <SectionHeader
                  action="See all"
                  onAction={() => openLibrary({ title: "All guides" })}
                  title="Featured for your journey"
                />
                <View style={[styles.stack, styles.stackInSection]}>
                  <FeaturedArticleCard {...cardProps(featured[0])} />
                  {featured[1] ? <CompactArticleCard {...cardProps(featured[1])} /> : null}
                </View>
              </>
            ) : null}

            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.85}
              onPress={() => router.push("/toolkit" as any)}
              style={styles.toolkitCard}
            >
              <View style={styles.toolkitIcon}>
                <Sparkles color="#FFFFFF" size={20} strokeWidth={2} />
              </View>
              <View style={styles.toolkitCopy}>
                <Text style={styles.toolkitTitle}>Your toolkit</Text>
                <Text numberOfLines={1} style={styles.toolkitText}>
                  Interview simulator, document vault and more
                </Text>
              </View>
              <ArrowRight color={UI.primary} size={18} strokeWidth={2.4} />
            </TouchableOpacity>

            <SectionHeader
              action="Browse library"
              onAction={() => openLibrary({ title: "All guides" })}
              title="Browse categories"
            />
            <View style={styles.grid}>
              {tiles.map(({ key, label, Icon, onPress }) => (
                <Pressable
                  key={key}
                  accessibilityLabel={label}
                  accessibilityRole="button"
                  onPress={onPress}
                  style={({ pressed }) => [styles.tile, { width: tileWidth }, pressed && styles.tilePressed]}
                >
                  <View style={styles.tileTop}>
                    <Icon color={UI.primary} size={24} strokeWidth={1.8} />
                    <ArrowUpRight color={UI.muted} size={15} strokeWidth={2} />
                  </View>
                  <Text numberOfLines={2} style={styles.tileLabel}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <BottomSheet onClose={() => setFilterOpen(false)} title="Filter guides" visible={filterOpen}>
        <View style={styles.filterList}>
          {[{ slug: null as string | null, title: "All categories" }, ...categories].map((category) => {
            const active = categoryFilter === category.slug;
            return (
              <TouchableOpacity
                key={category.slug ?? "all"}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                onPress={() => {
                  setCategoryFilter(category.slug);
                  setFilterOpen(false);
                }}
                style={styles.filterRow}
              >
                <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{category.title}</Text>
                {active ? <Check color={UI.primary} size={18} strokeWidth={2.4} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </Text>
      {action ? (
        <TouchableOpacity hitSlop={10} onPress={onAction}>
          <Text style={styles.sectionAction}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function EmptyNote({
  title,
  text,
  actionLabel,
  onAction,
}: {
  title: string;
  text: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
      {actionLabel ? (
        <TouchableOpacity activeOpacity={0.85} onPress={onAction} style={styles.emptyButton}>
          <Text style={styles.emptyButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function SearchResults({
  results,
  cardProps,
  categoryTitle,
  onClearCategory,
}: {
  results: { articles: Article[]; universities: UniversityRecord[] };
  cardProps: (article: Article) => React.ComponentProps<typeof CompactArticleCard>;
  categoryTitle: string | null;
  onClearCategory: () => void;
}) {
  const total = results.articles.length + results.universities.length;
  return (
    <View>
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {total} {total === 1 ? "result" : "results"}
        </Text>
        {categoryTitle ? (
          <TouchableOpacity onPress={onClearCategory} style={styles.activeFilter}>
            <Text style={styles.activeFilterText}>{categoryTitle}</Text>
            <X color={UI.primary} size={13} strokeWidth={2.4} />
          </TouchableOpacity>
        ) : null}
      </View>
      {total === 0 ? (
        <EmptyNote text="Try a different word or clear the category filter." title="Nothing found" />
      ) : (
        <View style={[styles.stack, styles.stackInSection]}>
          {results.universities.map((university) => (
            <UniversityGuide key={university.id} level={null} university={university} />
          ))}
          {results.articles.map((article) => (
            <CompactArticleCard key={article.id} {...cardProps(article)} />
          ))}
        </View>
      )}
    </View>
  );
}

function UniversityGuide({ university, level }: { university: UniversityRecord; level: string | null }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const details = getUniversityLevelDetails(university, level);
  const facts = [
    { label: "Apply via", value: university.metadata?.applicationSystem },
    { label: "Deadline", value: formatDeadline(details?.applicationDeadline) },
    { label: "Tuition", value: formatTuitionRange(details) },
  ].filter((fact): fact is { label: string; value: string } => !!fact.value);
  const badge = formatRankingBadge(university.ranking_global);
  // Generated notes can carry search citation markers such as "[3, 7]".
  const notes = university.metadata?.notes?.replace(/\s*\[\d+(?:,\s*\d+)*\]/g, "").trim();

  return (
    <View style={styles.uniCard}>
      <View style={styles.uniHeader}>
        <View style={styles.uniLogo}>
          {university.logo_url && !logoFailed ? (
            <Image
              contentFit="contain"
              onError={() => setLogoFailed(true)}
              source={{ uri: university.logo_url }}
              style={styles.uniLogoImage}
            />
          ) : (
            <GraduationCap color={UI.primary} size={22} strokeWidth={1.8} />
          )}
        </View>
        <View style={styles.uniTitleBlock}>
          <Text numberOfLines={2} style={styles.uniName}>
            {university.name}
          </Text>
          <Text numberOfLines={1} style={styles.uniMeta}>
            {[university.city, countryFlag(university.country_code)].filter(Boolean).join(" ")}
            {badge ? ` · ${badge}` : ""}
          </Text>
        </View>
      </View>
      {notes ? (
        <Text numberOfLines={4} style={styles.uniNotes}>
          {notes}
        </Text>
      ) : university.tagline ? (
        <Text style={styles.uniNotes}>{university.tagline}</Text>
      ) : null}
      {facts.length ? (
        <View style={styles.uniFacts}>
          {facts.map((fact) => (
            <View key={fact.label} style={styles.uniFact}>
              <Text style={styles.uniFactLabel}>{fact.label}</Text>
              <Text numberOfLines={1} style={styles.uniFactValue}>
                {fact.value}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      {university.website ? (
        <TouchableOpacity
          accessibilityRole="link"
          onPress={() => Linking.openURL(university.website as string).catch(() => null)}
          style={styles.uniLink}
        >
          <Text style={styles.uniLinkText}>Visit website</Text>
          <ExternalLink color={UI.primary} size={14} strokeWidth={2.2} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    backgroundColor: UI.background,
    flex: 1,
  },
  content: {
    paddingBottom: 130,
    paddingHorizontal: GUTTER,
  },
  title: {
    color: UI.text,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.6,
    paddingBottom: 16,
    paddingTop: 16,
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: UI.card,
    borderColor: UI.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    height: 50,
    paddingLeft: 14,
    paddingRight: 8,
  },
  searchInput: {
    color: UI.text,
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  filterButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  filterDot: {
    backgroundColor: UI.primary,
    borderRadius: 4,
    height: 8,
    position: "absolute",
    right: 5,
    top: 6,
    width: 8,
  },
  chipsScroll: {
    marginHorizontal: -GUTTER,
    marginTop: 14,
  },
  chips: {
    gap: 8,
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
  errorText: {
    color: UI.textSecondary,
    fontSize: 14,
    marginTop: 40,
    textAlign: "center",
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 26,
  },
  sectionTitle: {
    color: UI.text,
    fontSize: 18,
    fontWeight: "700",
  },
  sectionAction: {
    color: UI.primary,
    fontSize: 13.5,
    fontWeight: "600",
  },
  stack: {
    gap: 14,
    marginTop: 18,
  },
  stackInSection: {
    marginTop: 0,
  },
  toolkitCard: {
    alignItems: "center",
    backgroundColor: UI.primarySoft,
    borderRadius: RADIUS.tile,
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
    padding: 14,
  },
  toolkitIcon: {
    alignItems: "center",
    backgroundColor: UI.primary,
    borderRadius: 14,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  toolkitCopy: {
    flex: 1,
  },
  toolkitTitle: {
    color: UI.text,
    fontSize: 15,
    fontWeight: "700",
  },
  toolkitText: {
    color: UI.textSecondary,
    fontSize: 12.5,
    marginTop: 2,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: TILE_GAP,
  },
  tile: {
    backgroundColor: UI.card,
    borderColor: UI.border,
    borderRadius: RADIUS.tile,
    borderWidth: 1,
    minHeight: 92,
    padding: 12,
  },
  tilePressed: {
    opacity: 0.85,
  },
  tileTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  tileLabel: {
    color: UI.text,
    fontSize: 13,
    fontWeight: "700",
  },
  empty: {
    alignItems: "center",
    backgroundColor: UI.card,
    borderRadius: RADIUS.card,
    marginTop: 24,
    padding: 24,
    ...CARD_SHADOW,
  },
  emptyTitle: {
    color: UI.text,
    fontSize: 17,
    fontWeight: "700",
  },
  emptyText: {
    color: UI.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    textAlign: "center",
  },
  emptyButton: {
    backgroundColor: UI.primary,
    borderRadius: RADIUS.pill,
    marginTop: 16,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  resultsHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    marginTop: 20,
  },
  resultsCount: {
    color: UI.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  activeFilter: {
    alignItems: "center",
    backgroundColor: UI.primarySoft,
    borderRadius: RADIUS.pill,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  activeFilterText: {
    color: UI.primary,
    fontSize: 12.5,
    fontWeight: "700",
  },
  filterList: {
    paddingBottom: 8,
  },
  filterRow: {
    alignItems: "center",
    borderBottomColor: UI.hairline,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 15,
  },
  filterLabel: {
    color: UI.textSecondary,
    fontSize: 15.5,
  },
  filterLabelActive: {
    color: UI.text,
    fontWeight: "700",
  },
  uniCard: {
    backgroundColor: UI.card,
    borderRadius: RADIUS.tile,
    padding: 16,
    ...CARD_SHADOW,
  },
  uniHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  uniLogo: {
    alignItems: "center",
    backgroundColor: UI.background,
    borderRadius: 12,
    height: 52,
    justifyContent: "center",
    padding: 6,
    width: 52,
  },
  uniLogoImage: {
    height: "100%",
    width: "100%",
  },
  uniTitleBlock: {
    flex: 1,
  },
  uniName: {
    color: UI.text,
    fontSize: 16,
    fontWeight: "700",
  },
  uniMeta: {
    color: UI.muted,
    fontSize: 12.5,
    marginTop: 3,
  },
  uniNotes: {
    color: UI.textSecondary,
    fontSize: 13.5,
    lineHeight: 19,
    marginTop: 12,
  },
  uniFacts: {
    borderTopColor: UI.hairline,
    borderTopWidth: 1,
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
  },
  uniFact: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  uniFactLabel: {
    color: UI.muted,
    fontSize: 13,
  },
  uniFactValue: {
    color: UI.text,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
  },
  uniLink: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginTop: 12,
  },
  uniLinkText: {
    color: UI.primary,
    fontSize: 13.5,
    fontWeight: "700",
  },
});
