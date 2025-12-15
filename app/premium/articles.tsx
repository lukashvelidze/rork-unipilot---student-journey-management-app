import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { ArrowRight, BookOpen, Check, ChevronDown, ChevronUp } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import { useUserStore } from "@/store/userStore";
import { Country } from "@/types/user";
import CountrySelector from "@/components/CountrySelector";
import Card from "@/components/Card";
import Button from "@/components/Button";
import {
  supabase,
  getCountries,
  fetchVisaTypesForDestination,
  fetchArticles,
  VisaTypeOption,
} from "@/lib/supabase";
import { Article } from "@/types/community";

const tierRank: Record<string, number> = {
  free: 0,
  basic: 1,
  standard: 2,
  premium: 3,
  pro: 3,
};

const MIN_ARTICLE_TIER = "standard";

const formatDate = (value?: string | null) => {
  if (!value) return "";
  try {
    const date = new Date(value);
    return date.toLocaleDateString();
  } catch {
    return value;
  }
};

export default function PremiumArticlesScreen() {
  const Colors = useColors();
  const router = useRouter();
  const { user } = useUserStore();
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [hasStandardAccess, setHasStandardAccess] = useState<boolean | null>(null);
  const [countries, setCountries] = useState<{ origin: Country[]; destination: Country[] }>({
    origin: [],
    destination: [],
  });
  const [selectedDestination, setSelectedDestination] = useState<Country | null>(null);
  const [selectedOrigin, setSelectedOrigin] = useState<Country | null>(null);
  const [selectedVisa, setSelectedVisa] = useState<VisaTypeOption | null>(null);
  const [visaOptions, setVisaOptions] = useState<VisaTypeOption[]>([]);
  const [visaLoading, setVisaLoading] = useState(false);
  const [profileVisa, setProfileVisa] = useState<string | null>(null);
  const [profileOriginCode, setProfileOriginCode] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [articlesError, setArticlesError] = useState<string | null>(null);
  const [articleModal, setArticleModal] = useState<Article | null>(null);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [visaModalVisible, setVisaModalVisible] = useState(false);

  const filterSummary = useMemo(
    () => [
      {
        key: "destination",
        label: "To",
        value: selectedDestination?.name || "Select destination",
      },
      {
        key: "origin",
        label: "From",
        value: selectedOrigin?.name || "All origins",
      },
      {
        key: "visa",
        label: "Visa",
        value: selectedVisa?.title || (profileVisa ? profileVisa.toUpperCase() : "All visas"),
      },
    ],
    [profileVisa, selectedDestination?.name, selectedOrigin?.name, selectedVisa?.title]
  );

  const hasInitializedRef = useRef(false);

  const getArticleCategory = useCallback((article: Article) => {
    if (article.is_global) return "Global Insight";
    if (article.visa_types?.length) return "Visa Guidance";
    if (article.origin_country_code) return `From ${article.origin_country_code.toUpperCase()}`;
    return "Student Journey";
  }, []);

  const getArticleExcerpt = useCallback((article: Article) => {
    const sourceText = article.summary || article.content || "";
    if (sourceText.length <= 200) {
      return sourceText;
    }
    return `${sourceText.slice(0, 197).trim()}…`;
  }, []);

  const getArticleReadTime = useCallback((article: Article) => {
    const words = article.content ? article.content.trim().split(/\s+/).length : 0;
    const minutes = Math.max(1, Math.round(words / 200));
    return `${minutes} min read`;
  }, []);

  const applyCountryDefaults = useCallback(
    (
      originCode?: string | null,
      destinationCode?: string | null,
      lists?: { origin: Country[]; destination: Country[] }
    ) => {
      const originList = lists?.origin ?? countries.origin;
      const destinationList = lists?.destination ?? countries.destination;
      const findCountry = (list: Country[], code?: string | null) => {
        if (!code) return null;
        return list.find((country) => country.code === code) || null;
      };

      const fallbackDestination = user?.destinationCountry || destinationList[0] || null;
      const fallbackOrigin = user?.homeCountry || null;

      setSelectedDestination(findCountry(destinationList, destinationCode) || fallbackDestination);
      setSelectedOrigin(findCountry(originList, originCode) || fallbackOrigin);
    },
    [countries.destination, countries.origin, user?.destinationCountry, user?.homeCountry]
  );

  const loadProfileDefaults = useCallback(
    async (lists?: { origin: Country[]; destination: Country[] }) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setHasStandardAccess(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("destination_country, country_origin, visa_type, subscription_tier")
        .eq("id", auth.user.id)
        .single();

      const tier = (profile?.subscription_tier || "free").toLowerCase();
      const hasAccess = (tierRank[tier] || 0) >= tierRank[MIN_ARTICLE_TIER];
      setHasStandardAccess(hasAccess);

      if (!hasAccess) {
        return;
      }

      setProfileVisa(profile?.visa_type || null);
      setProfileOriginCode(profile?.country_origin || null);
      applyCountryDefaults(profile?.country_origin, profile?.destination_country, lists);
    },
    [applyCountryDefaults]
  );

  const initialize = useCallback(async () => {
    try {
      setIsBootstrapping(true);
      const countryData = await getCountries();
      setCountries(countryData);
      await loadProfileDefaults(countryData);
    } catch (error) {
      console.error("Error loading articles defaults:", error);
    } finally {
      setIsBootstrapping(false);
    }
  }, [loadProfileDefaults]);

  useEffect(() => {
    if (hasInitializedRef.current) {
      return;
    }
    hasInitializedRef.current = true;
    initialize();
  }, [initialize]);

  const loadVisaOptionsForFilters = useCallback(
    async (destinationCode?: string | null, preferredVisa?: string | null) => {
      if (!destinationCode) {
        setVisaOptions([]);
        setSelectedVisa(null);
        return;
      }

      try {
        setVisaLoading(true);
        const visas = await fetchVisaTypesForDestination(destinationCode);
        setVisaOptions(visas);

        if (preferredVisa) {
          const matched = visas.find((visa) => visa.code === preferredVisa);
          setSelectedVisa(matched || null);
        }
      } catch (error) {
        console.error("Error loading visa options:", error);
      } finally {
        setVisaLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (selectedDestination?.code) {
      const defaultVisa = selectedVisa ? selectedVisa.code : profileVisa;
      loadVisaOptionsForFilters(selectedDestination.code, defaultVisa || profileVisa);
    }
  }, [selectedDestination?.code, profileVisa, selectedVisa?.code, loadVisaOptionsForFilters]);

  const loadArticlesData = useCallback(async () => {
    if (!selectedDestination?.code) {
      return;
    }

    try {
      setArticlesLoading(true);
      setArticlesError(null);
      const data = await fetchArticles({
        destinationCountry: selectedDestination.code,
        originCountry: selectedOrigin?.code || profileOriginCode || undefined,
        visaType: selectedVisa?.code || profileVisa || undefined,
        includeDrafts: false,
      });
      setArticles(data);
    } catch (error: any) {
      console.error("Error loading articles:", error);
      setArticlesError(error.message || "Unable to load articles");
    } finally {
      setArticlesLoading(false);
    }
  }, [profileOriginCode, profileVisa, selectedDestination?.code, selectedOrigin?.code, selectedVisa?.code]);

  useEffect(() => {
    if (!isBootstrapping && hasStandardAccess) {
      loadArticlesData();
    }
  }, [
    hasStandardAccess,
    isBootstrapping,
    loadArticlesData,
    selectedDestination?.code,
    selectedOrigin?.code,
    selectedVisa?.code,
  ]);

  const handleDestinationChange = (country: Country) => {
    setSelectedDestination(country);
    setSelectedVisa(null);
  };

  const handleOriginChange = (country: Country) => {
    setSelectedOrigin(country);
  };

  const handleFilterChipPress = () => {
    setFiltersExpanded((prev) => !prev);
  };

  const handleArticleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const totalScrollable = Math.max(1, contentSize.height - layoutMeasurement.height);
    setReadingProgress(Math.min(1, Math.max(0, contentOffset.y / totalScrollable)));
  };

  useEffect(() => {
    if (articleModal) {
      setReadingProgress(0);
    }
  }, [articleModal]);

  if (isBootstrapping || hasStandardAccess === null) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]} edges={["top"]}>
        <Stack.Screen options={{ title: "Articles" }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.loadingText, { color: Colors.lightText }]}>Loading curated guides...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasStandardAccess) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]} edges={["top"]}>
        <Stack.Screen options={{ title: "Articles" }} />
        <View style={styles.upgradeContainer}>
          <BookOpen size={48} color={Colors.primary} />
          <Text style={[styles.upgradeTitle, { color: Colors.text }]}>Articles require Standard</Text>
          <Text style={[styles.upgradeSubtitle, { color: Colors.lightText }]}>
            Upgrade to the Standard plan to unlock curated visa and journey guides tailored to your filters.
          </Text>
          <Button title="View plans" onPress={() => router.push("/premium")} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]} edges={["top"]}>
      <Stack.Screen
        options={{
          title: "Articles",
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Card style={[styles.tabSliderWrapper, { borderColor: Colors.border, backgroundColor: Colors.card }]}>
          <View style={styles.heroRow}>
            <BookOpen size={28} color={Colors.primary} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.heroTitle, { color: Colors.text }]}>Curated Articles</Text>
              <Text style={[styles.heroSubtitle, { color: Colors.lightText }]}>
                Editorial guidance matched to your journey filters.
              </Text>
            </View>
          </View>
        </Card>

        <View style={[styles.filterSummaryContainer, { borderColor: Colors.border, backgroundColor: Colors.card }]}>
          <View style={styles.filterSummaryRow}>
            {filterSummary.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.filterSummaryChip, { borderColor: Colors.border }]}
                onPress={handleFilterChipPress}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterSummaryLabel, { color: Colors.lightText }]}>{item.label}</Text>
                <Text style={{ color: Colors.text, fontWeight: "600" }} numberOfLines={1}>
                  {item.value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.filterToggle} onPress={handleFilterChipPress}>
            <Text style={{ color: Colors.text, fontWeight: "600" }}>Adjust filters</Text>
            {filtersExpanded ? <ChevronUp size={16} color={Colors.lightText} /> : <ChevronDown size={16} color={Colors.lightText} />}
          </TouchableOpacity>
        </View>

        {filtersExpanded && (
          <Card style={[styles.filterCard, { backgroundColor: Colors.card }]} variant="outlined">
            <CountrySelector
              label="Destination Country"
              value={selectedDestination}
              onChange={handleDestinationChange}
              countries={countries.destination}
              placeholder="Select destination"
            />
            <CountrySelector
              label="Origin Country"
              value={selectedOrigin}
              onChange={handleOriginChange}
              countries={countries.origin}
              placeholder="All origins"
            />
            {selectedOrigin && (
              <TouchableOpacity style={styles.clearButton} onPress={() => setSelectedOrigin(null)}>
                <Text style={{ color: Colors.primary, fontSize: 12 }}>Clear origin filter</Text>
              </TouchableOpacity>
            )}

            <View style={styles.selectorRow}>
              <View style={styles.selectorLabelRow}>
                <Text style={[styles.selectorLabel, { color: Colors.text }]}>Visa Type</Text>
                {visaLoading && <ActivityIndicator size="small" color={Colors.primary} />}
              </View>
              <TouchableOpacity
                style={[styles.selectorButton, { borderColor: Colors.border }]}
                onPress={() => setVisaModalVisible(true)}
                disabled={visaOptions.length === 0}
              >
                <Text style={{ color: selectedVisa ? Colors.text : Colors.lightText }}>
                  {selectedVisa ? selectedVisa.title : "All visa types"}
                </Text>
                <ArrowRight size={16} color={Colors.lightText} />
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {articlesLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={[styles.loadingText, { color: Colors.lightText }]}>Loading articles...</Text>
          </View>
        ) : articlesError ? (
          <Text style={[styles.errorText, { color: Colors.error }]}>{articlesError}</Text>
        ) : articles.length === 0 ? (
          <Card style={[styles.emptyStateCard, { backgroundColor: Colors.card }]} variant="outlined">
            <BookOpen size={28} color={Colors.lightText} />
            <Text style={[styles.emptyStateTitle, { color: Colors.text }]}>No articles yet</Text>
            <Text style={[styles.emptyStateDescription, { color: Colors.lightText }]}>
              We’re preparing guides for your filters. Try adjusting filters to see more content.
            </Text>
          </Card>
        ) : (
          articles.map((article) => (
            <Card key={article.id} style={[styles.articleCard, { backgroundColor: Colors.card }]} variant="outlined">
              <TouchableOpacity activeOpacity={0.85} onPress={() => setArticleModal(article)} style={styles.articleCardBody}>
                <View style={styles.articleHeaderRow}>
                  <Text style={[styles.articleCategory, { color: Colors.lightText }]}>{getArticleCategory(article).toUpperCase()}</Text>
                  <Text style={[styles.articleMetaText, { color: Colors.lightText }]}>{getArticleReadTime(article)}</Text>
                </View>
                <View style={styles.articleContentRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.articleTitle, { color: Colors.text }]} numberOfLines={2}>
                      {article.title}
                    </Text>
                    <Text style={[styles.articleExcerpt, { color: Colors.lightText }]} numberOfLines={3}>
                      {getArticleExcerpt(article)}
                    </Text>
                    <View style={styles.articleMetaRow}>
                      <Text style={[styles.articleMetaText, { color: Colors.lightText }]}>{formatDate(article.updated_at)}</Text>
                      <View style={[styles.metaDot, { backgroundColor: Colors.border }]} />
                      <Text style={[styles.articleMetaText, { color: Colors.lightText }]}>
                        {article.is_global ? "Global origin" : article.origin_country_code || "All origins"}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.articleThumbnail, { borderColor: Colors.border, backgroundColor: Colors.lightBackground }]}>
                    <Text style={{ color: Colors.lightText, fontWeight: "700" }}>
                      {(article.destination_country_code || "UP").slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.articleFooterRow}>
                  <Text style={{ color: Colors.primary, fontWeight: "600" }}>Tap to read</Text>
                  <ArrowRight size={16} color={Colors.lightText} />
                </View>
              </TouchableOpacity>
            </Card>
          ))
        )}
      </ScrollView>

      <Modal visible={visaModalVisible} animationType="slide" onRequestClose={() => setVisaModalVisible(false)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: Colors.background }]} edges={["top"]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: Colors.text }]}>Select Visa Type</Text>
            <TouchableOpacity onPress={() => setVisaModalVisible(false)}>
              <ArrowRight size={20} color={Colors.text} style={{ transform: [{ rotate: "180deg" }] }} />
            </TouchableOpacity>
          </View>
          <ScrollView>
            <TouchableOpacity
              style={[styles.modalOption, { borderColor: Colors.border }]}
              onPress={() => {
                setSelectedVisa(null);
                setVisaModalVisible(false);
              }}
            >
              <Text style={{ color: Colors.text }}>All visa types</Text>
            </TouchableOpacity>
            {visaOptions.map((visa) => (
              <TouchableOpacity
                key={visa.id}
                style={[
                  styles.modalOption,
                  {
                    borderColor: Colors.border,
                    backgroundColor: selectedVisa?.code === visa.code ? Colors.primary + "15" : "transparent",
                  },
                ]}
                onPress={() => {
                  setSelectedVisa(visa);
                  setVisaModalVisible(false);
                }}
              >
                <View>
                  <Text style={{ color: Colors.text }}>{visa.title}</Text>
                  <Text style={{ color: Colors.lightText, fontSize: 12 }}>{visa.code}</Text>
                </View>
                {selectedVisa?.code === visa.code && <Check size={16} color={Colors.primary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={!!articleModal} animationType="slide" onRequestClose={() => setArticleModal(null)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: Colors.background }]} edges={["top"]}>
          {articleModal && (
            <>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setArticleModal(null)}>
                  <ArrowRight size={20} color={Colors.text} style={{ transform: [{ rotate: "180deg" }] }} />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.modalTitle, { color: Colors.text }]} numberOfLines={2}>
                    {articleModal.title}
                  </Text>
                  <View style={styles.readingMetaRow}>
                    <Text style={{ color: Colors.lightText, fontSize: 12 }}>{getArticleCategory(articleModal).toUpperCase()}</Text>
                    <View style={[styles.metaDot, { backgroundColor: Colors.border }]} />
                    <Text style={{ color: Colors.lightText, fontSize: 12 }}>{getArticleReadTime(articleModal)}</Text>
                  </View>
                </View>
              </View>
              <View style={[styles.readingProgressTrack, { backgroundColor: Colors.border }]}>
                <View
                  style={[
                    styles.readingProgressFill,
                    { backgroundColor: Colors.primary, width: `${Math.round(readingProgress * 100)}%` },
                  ]}
                />
              </View>
              <ScrollView
                style={styles.readingScroll}
                contentContainerStyle={styles.readingBody}
                onScroll={handleArticleScroll}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
              >
                {articleModal.summary && (
                  <Text style={[styles.readingSummary, { color: Colors.lightText }]}>{articleModal.summary}</Text>
                )}
                <Text style={[styles.readingContent, { color: Colors.text }]}>{articleModal.content}</Text>
              </ScrollView>
            </>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
  },
  filterCard: {
    padding: 20,
    gap: 12,
  },
  tabSliderWrapper: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 16,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  filterSummaryContainer: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  filterSummaryRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  filterSummaryChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterSummaryLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  filterToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectorRow: {
    marginTop: 8,
  },
  selectorLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    alignItems: "center",
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  selectorButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  clearButton: {
    alignSelf: "flex-end",
    marginTop: -6,
    marginBottom: 4,
  },
  loadingState: {
    alignItems: "center",
    paddingVertical: 24,
  },
  errorText: {
    textAlign: "center",
    marginVertical: 12,
  },
  emptyStateCard: {
    alignItems: "center",
    padding: 24,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptyStateDescription: {
    textAlign: "center",
  },
  articleCard: {
    padding: 20,
  },
  articleCardBody: {
    gap: 12,
  },
  articleHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  articleCategory: {
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  articleContentRow: {
    flexDirection: "row",
    gap: 16,
  },
  articleTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  articleExcerpt: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  articleMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  articleMetaText: {
    fontSize: 12,
  },
  articleThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  articleFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  modalContainer: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  modalOption: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  readingMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  readingProgressTrack: {
    height: 4,
    borderRadius: 4,
    marginBottom: 12,
    overflow: "hidden",
  },
  readingProgressFill: {
    height: "100%",
  },
  readingScroll: {
    flex: 1,
  },
  readingBody: {
    paddingBottom: 24,
    gap: 12,
    maxWidth: 720,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 4,
  },
  readingSummary: {
    fontSize: 16,
    lineHeight: 24,
  },
  readingContent: {
    fontSize: 16,
    lineHeight: 26,
  },
  upgradeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  upgradeTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  upgradeSubtitle: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
});
