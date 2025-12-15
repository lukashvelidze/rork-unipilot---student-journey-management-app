import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useFocusEffect } from "expo-router";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Link2,
  MessageSquare,
  Plus,
  PlusCircle,
  Send,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import { useUserStore } from "@/store/userStore";
import { Country } from "@/types/user";
import CountrySelector from "@/components/CountrySelector";
import Card from "@/components/Card";
import Button from "@/components/Button";
import Input from "@/components/Input";
import {
  supabase,
  getCountries,
  fetchVisaTypesForDestination,
  fetchArticles,
  fetchCommunityPosts,
  createCommunityPost,
  createCommunityComment,
  upsertArticle,
  deleteArticle,
  VisaTypeOption,
} from "@/lib/supabase";
import { Article, CommunityComment, CommunityPost } from "@/types/community";

type TabKey = "articles" | "community";

interface ArticleFormState {
  title: string;
  summary: string;
  content: string;
  is_global: boolean;
  published: boolean;
  visa_types: string[];
}

const defaultArticleForm: ArticleFormState = {
  title: "",
  summary: "",
  content: "",
  is_global: false,
  published: true,
  visa_types: [],
};

const formatDate = (value?: string | null) => {
  if (!value) return "";
  try {
    const date = new Date(value);
    return date.toLocaleDateString();
  } catch {
    return value;
  }
};

export default function PremiumCommunityScreen() {
  const Colors = useColors();
  const { user } = useUserStore();
  const [activeTab, setActiveTab] = useState<TabKey>("articles");
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [countries, setCountries] = useState<{ origin: Country[]; destination: Country[] }>({
    origin: [],
    destination: [],
  });
  const [selectedDestination, setSelectedDestination] = useState<Country | null>(null);
  const [selectedOrigin, setSelectedOrigin] = useState<Country | null>(null);
  const [selectedVisa, setSelectedVisa] = useState<VisaTypeOption | null>(null);
  const [visaOptions, setVisaOptions] = useState<VisaTypeOption[]>([]);
  const [visaModalVisible, setVisaModalVisible] = useState(false);
  const [visaLoading, setVisaLoading] = useState(false);
  const [profileVisa, setProfileVisa] = useState<string | null>(null);
  const [profileOriginCode, setProfileOriginCode] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [articlesError, setArticlesError] = useState<string | null>(null);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [communityError, setCommunityError] = useState<string | null>(null);
  const [articleModal, setArticleModal] = useState<Article | null>(null);
  const [linkedArticleFilter, setLinkedArticleFilter] = useState<string | null>(null);
  const [newPost, setNewPost] = useState({
    title: "",
    body: "",
    anonymous: false,
    linkedArticleId: null as string | null,
  });
  const [creatingPost, setCreatingPost] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentAnonymous, setCommentAnonymous] = useState<Record<string, boolean>>({});
  const [commentReplyTargets, setCommentReplyTargets] = useState<Record<string, string | null>>({});
  const [submittingComments, setSubmittingComments] = useState<Record<string, boolean>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [articleForm, setArticleForm] = useState<ArticleFormState>(defaultArticleForm);
  const [articleFormDestination, setArticleFormDestination] = useState<Country | null>(null);
  const [articleFormOrigin, setArticleFormOrigin] = useState<Country | null>(null);
  const [articleFormVisaOptions, setArticleFormVisaOptions] = useState<VisaTypeOption[]>([]);
  const [articleFormLoading, setArticleFormLoading] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [articleFormError, setArticleFormError] = useState<string | null>(null);
  const [linkArticleModalVisible, setLinkArticleModalVisible] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [postComposerVisible, setPostComposerVisible] = useState(false);
  const [postReactions, setPostReactions] = useState<Record<string, { helpful: boolean; insightful: boolean }>>({});
  const [readingProgress, setReadingProgress] = useState(0);

  const selectedArticleForFilter = useMemo(
    () => articles.find((article) => article.id === linkedArticleFilter),
    [articles, linkedArticleFilter]
  );

  const getArticleCategory = useCallback((article: Article) => {
    if (article.is_global) return "Global Insight";
    if (article.visa_types?.length) return "Visa Guidance";
    if (article.origin_country_code) return `From ${article.origin_country_code.toUpperCase()}`;
    return "Student Journey";
  }, []);

  const getArticleExcerpt = useCallback((article: Article) => {
    const sourceText = article.summary || article.content || "";
    if (sourceText.length <= 180) {
      return sourceText;
    }
    return `${sourceText.slice(0, 177).trim()}…`;
  }, []);

  const getArticleReadTime = useCallback((article: Article) => {
    const words = article.content ? article.content.trim().split(/\s+/).length : 0;
    const minutes = Math.max(1, Math.round(words / 200));
    return `${minutes} min read`;
  }, []);

  const countComments = useCallback((comments?: CommunityComment[]): number => {
    if (!comments?.length) return 0;
    return comments.reduce((acc, comment) => acc + 1 + countComments(comment.replies), 0);
  }, []);

  const getPostTag = useCallback((post: CommunityPost) => {
    if (post.visa_type) return "Visas";
    if (post.article) return "Guides";
    if (post.destination_country_code) return "Destinations";
    return "Community";
  }, []);

  const getPostPreview = useCallback((post: CommunityPost) => {
    if (!post.body) return "";
    const trimmed = post.body.trim();
    if (trimmed.length <= 160) return trimmed;
    return `${trimmed.slice(0, 157)}…`;
  }, []);

  const formatRelativeTime = useCallback((value?: string) => {
    if (!value) return "";
    const created = new Date(value).getTime();
    const now = Date.now();
    const diff = Math.max(0, now - created);
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    if (diff < hour) {
      const minutes = Math.max(1, Math.round(diff / minute));
      return `${minutes}m ago`;
    }
    if (diff < day) {
      const hours = Math.round(diff / hour);
      return `${hours}h ago`;
    }
    const days = Math.round(diff / day);
    return `${days}d ago`;
  }, []);

  const togglePostReaction = useCallback((postId: string, key: "helpful" | "insightful") => {
    setPostReactions((prev) => {
      const existing = prev[postId] || { helpful: false, insightful: false };
      return {
        ...prev,
        [postId]: {
          ...existing,
          [key]: !existing[key],
        },
      };
    });
  }, []);

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

  // Track if initial data load has completed to prevent double fetches
  const hasInitializedRef = useRef(false);
  const hasInitiallyLoadedRef = useRef(false);
  const isLoadingRef = useRef({ articles: false, community: false });

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

  const loadProfileDefaults = useCallback(async (lists?: { origin: Country[]; destination: Country[] }) => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      applyCountryDefaults(user?.homeCountry?.code, user?.destinationCountry?.code, lists);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("destination_country, country_origin, visa_type, is_admin, role")
      .eq("id", auth.user.id)
      .single();

    if (profile) {
      setProfileVisa(profile.visa_type || null);
      setProfileOriginCode(profile.country_origin || null);
      const adminFlag = Boolean(profile.is_admin) || profile.role === "admin";
      setIsAdmin(adminFlag);
      applyCountryDefaults(profile.country_origin, profile.destination_country, lists);
    } else {
      applyCountryDefaults(user?.homeCountry?.code, user?.destinationCountry?.code, lists);
    }
  }, [applyCountryDefaults, user?.destinationCountry?.code, user?.homeCountry?.code]);

  const initialize = useCallback(async () => {
    try {
      setIsBootstrapping(true);
      const countryData = await getCountries();
      setCountries(countryData);
      await loadProfileDefaults(countryData);
    } catch (error) {
      console.error("Error loading community defaults:", error);
      Alert.alert("Error", "Unable to load community data. Please try again.");
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

  const handleFilterChipPress = useCallback(() => {
    setFiltersExpanded((prev) => !prev);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (isBootstrapping || !selectedDestination?.code) {
        return;
      }
      loadArticlesData();
      loadCommunityData();
    }, [isBootstrapping, loadArticlesData, loadCommunityData, selectedDestination?.code])
  );

  const handleArticleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const totalScrollable = Math.max(1, contentSize.height - layoutMeasurement.height);
    setReadingProgress(Math.min(1, Math.max(0, contentOffset.y / totalScrollable)));
  }, []);

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

  const loadVisaOptionsForArticleForm = useCallback(async (destinationCode?: string | null) => {
    if (!destinationCode) {
      setArticleFormVisaOptions([]);
      return;
    }

    try {
      const visas = await fetchVisaTypesForDestination(destinationCode);
      setArticleFormVisaOptions(visas);
    } catch (error) {
      console.error("Error loading admin visa options:", error);
    }
  }, []);

  useEffect(() => {
    if (selectedDestination?.code) {
      const defaultVisa = selectedVisa ? selectedVisa.code : profileVisa;
      loadVisaOptionsForFilters(selectedDestination.code, defaultVisa || profileVisa);
    }
  }, [selectedDestination?.code, profileVisa, loadVisaOptionsForFilters]);

  useEffect(() => {
    if (articleFormDestination?.code) {
      loadVisaOptionsForArticleForm(articleFormDestination.code);
    }
  }, [articleFormDestination?.code, loadVisaOptionsForArticleForm]);

  useEffect(() => {
    if (articleModal) {
      setReadingProgress(0);
    }
  }, [articleModal]);

  const handleDestinationChange = (country: Country) => {
    setSelectedDestination(country);
    setSelectedVisa(null);
    setLinkedArticleFilter(null);
  };

  const handleOriginChange = (country: Country) => {
    setSelectedOrigin(country);
  };

  const loadArticlesData = useCallback(async () => {
    if (!selectedDestination?.code) {
      return;
    }

    // Prevent concurrent fetches
    if (isLoadingRef.current.articles) {
      return;
    }

    try {
      isLoadingRef.current.articles = true;
      setArticlesLoading(true);
      setArticlesError(null);
      const data = await fetchArticles({
        destinationCountry: selectedDestination.code,
        originCountry: selectedOrigin?.code || profileOriginCode || undefined,
        visaType: selectedVisa?.code || profileVisa || undefined,
        includeDrafts: isAdmin,
      });
      setArticles(data);
    } catch (error: any) {
      console.error("Error loading articles:", error);
      setArticlesError(error.message || "Unable to load articles");
    } finally {
      isLoadingRef.current.articles = false;
      setArticlesLoading(false);
    }
  }, [isAdmin, profileOriginCode, profileVisa, selectedDestination?.code, selectedOrigin?.code, selectedVisa?.code]);

  const loadCommunityData = useCallback(async () => {
    if (!selectedDestination?.code) {
      return;
    }

    // Prevent concurrent fetches
    if (isLoadingRef.current.community) {
      return;
    }

    try {
      isLoadingRef.current.community = true;
      setCommunityLoading(true);
      setCommunityError(null);
      const posts = await fetchCommunityPosts({
        destinationCountry: selectedDestination.code,
        originCountry: selectedOrigin?.code || profileOriginCode || undefined,
        visaType: selectedVisa?.code || profileVisa || undefined,
        linkedArticleId: linkedArticleFilter || undefined,
      });
      setCommunityPosts(posts);
    } catch (error: any) {
      console.error("Error loading community posts:", error);
      setCommunityError(error.message || "Unable to load community posts");
    } finally {
      isLoadingRef.current.community = false;
      setCommunityLoading(false);
    }
  }, [
    linkedArticleFilter,
    profileOriginCode,
    profileVisa,
    selectedDestination?.code,
    selectedOrigin?.code,
    selectedVisa?.code,
  ]);

  // Effect to load data when filters change - use primitive values to avoid callback identity issues
  useEffect(() => {
    if (!isBootstrapping && selectedDestination) {
      // Mark initial load as complete after first load
      if (!hasInitiallyLoadedRef.current) {
        hasInitiallyLoadedRef.current = true;
      }
      loadArticlesData();
      loadCommunityData();
    }
    // Only depend on primitive filter values, not the callback functions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isBootstrapping,
    selectedDestination?.code,
    selectedOrigin?.code,
    selectedVisa?.code,
    linkedArticleFilter,
  ]);

  const handleCreatePost = async () => {
    if (!selectedDestination?.code) {
      Alert.alert("Select destination", "Choose a destination country to share a post.");
      return;
    }

    if (!newPost.title.trim() || !newPost.body.trim()) {
      Alert.alert("Missing details", "Please provide both a title and body for your post.");
      return;
    }

    try {
      setCreatingPost(true);
      await createCommunityPost({
        title: newPost.title.trim(),
        body: newPost.body.trim(),
        destination_country_code: selectedDestination.code,
        origin_country_code: selectedOrigin?.code || profileOriginCode || null,
        visa_type: selectedVisa?.code || profileVisa || null,
        anonymous: newPost.anonymous,
        linked_article_id: newPost.linkedArticleId,
      });
      setNewPost({
        title: "",
        body: "",
        anonymous: false,
        linkedArticleId: linkedArticleFilter,
      });
      await loadCommunityData();
      setPostComposerVisible(false);
    } catch (error) {
      console.error("Error creating community post:", error);
      Alert.alert("Error", "Unable to share your experience right now. Please try again.");
    } finally {
      setCreatingPost(false);
    }
  };

  const handleSubmitComment = async (postId: string) => {
    const commentBody = commentDrafts[postId];
    if (!commentBody || !commentBody.trim()) {
      return;
    }

    try {
      setSubmittingComments((prev) => ({ ...prev, [postId]: true }));
      await createCommunityComment({
        post_id: postId,
        body: commentBody.trim(),
        anonymous: commentAnonymous[postId] || false,
        parent_id: commentReplyTargets[postId] || null,
      });
      setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
      setCommentReplyTargets((prev) => ({ ...prev, [postId]: null }));
      await loadCommunityData();
    } catch (error) {
      console.error("Error posting comment:", error);
      Alert.alert("Error", "Unable to post your comment. Please try again.");
    } finally {
      setSubmittingComments((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleSelectArticleForPost = (articleId: string | null) => {
    setNewPost((prev) => ({ ...prev, linkedArticleId: articleId }));
    setLinkArticleModalVisible(false);
  };

  const handleDiscussArticle = (article: Article) => {
    setLinkedArticleFilter(article.id);
    setActiveTab("community");
  };

  const resetArticleForm = () => {
    setArticleForm(defaultArticleForm);
    setArticleFormDestination(null);
    setArticleFormOrigin(null);
    setArticleFormError(null);
    setEditingArticleId(null);
  };

  const handleEditArticle = (article: Article) => {
    setEditingArticleId(article.id);
    setArticleForm({
      title: article.title,
      summary: article.summary || "",
      content: article.content,
      is_global: article.is_global,
      published: article.published,
      visa_types: article.visa_types || [],
    });
    setArticleFormDestination(
      countries.destination.find((country) => country.code === article.destination_country_code) || null
    );
    setArticleFormOrigin(
      countries.origin.find((country) => country.code === article.origin_country_code) || null
    );
  };

  const handleSubmitArticle = async () => {
    if (!articleFormDestination) {
      setArticleFormError("Destination is required");
      return;
    }

    if (!articleForm.title.trim() || !articleForm.content.trim()) {
      setArticleFormError("Title and content are required");
      return;
    }

    try {
      setArticleFormLoading(true);
      setArticleFormError(null);
      await upsertArticle({
        id: editingArticleId || undefined,
        title: articleForm.title.trim(),
        summary: articleForm.summary.trim() || null,
        content: articleForm.content.trim(),
        destination_country_code: articleFormDestination.code,
        origin_country_code: articleForm.is_global ? null : articleFormOrigin?.code || null,
        visa_types: articleForm.visa_types,
        is_global: articleForm.is_global,
        published: articleForm.published,
      });

      resetArticleForm();
      await loadArticlesData();
    } catch (error) {
      console.error("Error saving article:", error);
      setArticleFormError("Unable to save article. Please try again.");
    } finally {
      setArticleFormLoading(false);
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    Alert.alert("Delete article", "Are you sure you want to delete this article?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteArticle(articleId);
            if (editingArticleId === articleId) {
              resetArticleForm();
            }
            await loadArticlesData();
          } catch (error) {
            console.error("Error deleting article:", error);
            Alert.alert("Error", "Unable to delete article.");
          }
        },
      },
    ]);
  };

  const renderComment = (comment: CommunityPost["comments"][number], depth = 0) => {
    if (!comment) return null;

    const isAnonymous = comment.anonymous;
    const authorName = isAnonymous
      ? "Anonymous member"
      : comment.author?.display_name || comment.author?.full_name || "Community member";
    const indentLevel = Math.min(depth, 1);

    return (
      <View key={comment.id} style={[styles.commentContainer, { marginLeft: indentLevel * 16 }]}>
        <Text style={[styles.commentAuthor, { color: Colors.text }]}>{authorName}</Text>
        <Text style={[styles.commentBody, { color: Colors.lightText }]}>{comment.body}</Text>
        <View style={styles.commentMetaRow}>
          <Text style={[styles.commentMeta, { color: Colors.lightText }]}>{formatDate(comment.created_at)}</Text>
          <TouchableOpacity
            onPress={() => {
              setCommentReplyTargets((prev) => ({ ...prev, [comment.post_id]: comment.id }));
            }}
          >
            <Text style={[styles.commentReplyText, { color: Colors.primary }]}>Reply</Text>
          </TouchableOpacity>
        </View>
        {comment.replies?.map((reply) => renderComment(reply, depth + 1))}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]} edges={['top']}>
      <Stack.Screen
        options={{
          title: "Community & Articles",
          headerBackTitleVisible: false,
        }}
      />
      {isBootstrapping ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.loadingText, { color: Colors.lightText }]}>Loading resources...</Text>
        </View>
      ) : (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={[styles.tabSliderWrapper, { borderColor: Colors.border, backgroundColor: Colors.card }]}>
          <Text style={[styles.sectionHint, { color: Colors.lightText }]}>Choose what to explore</Text>
          <View style={[styles.tabSliderContainer, { backgroundColor: Colors.lightBackground, borderColor: Colors.border }]}>
            {(["articles", "community"] as TabKey[]).map((tab) => {
              const isActive = activeTab === tab;
              const IconComponent = tab === "articles" ? BookOpen : Users;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tabSliderOption,
                    isActive && {
                      backgroundColor: Colors.card,
                      borderColor: Colors.primary,
                    },
                  ]}
                  onPress={() => setActiveTab(tab)}
                >
                  <IconComponent size={16} color={isActive ? Colors.primary : Colors.lightText} />
                  <Text
                    style={[
                      styles.tabButtonText,
                      { color: isActive ? Colors.primary : Colors.lightText },
                    ]}
                  >
                    {tab === "articles" ? "Articles" : "Community"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

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
            <SlidersHorizontal size={16} color={Colors.primary} />
            <Text style={{ color: Colors.text, fontWeight: "600" }}>Adjust filters</Text>
            {filtersExpanded ? <ChevronUp size={16} color={Colors.lightText} /> : <ChevronDown size={16} color={Colors.lightText} />}
          </TouchableOpacity>
        </View>

        {filtersExpanded && (
          <Card style={[styles.filterCard, { backgroundColor: Colors.card }]} variant="outlined">
            <Text style={[styles.sectionTitle, { color: Colors.text }]}>Filters</Text>
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

        {linkedArticleFilter && selectedArticleForFilter && (
          <View style={[styles.filterBadge, { backgroundColor: Colors.lightBackground }]}>
            <Text style={{ color: Colors.text, flex: 1 }} numberOfLines={1}>
              Discussing: {selectedArticleForFilter.title}
            </Text>
            <TouchableOpacity onPress={() => setLinkedArticleFilter(null)}>
              <X size={16} color={Colors.lightText} />
            </TouchableOpacity>
          </View>
        )}

        {activeTab === "articles" ? (
          <View>
            {articlesLoading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={[styles.loadingText, { color: Colors.lightText }]}>Loading articles...</Text>
              </View>
            ) : articlesError ? (
              <Text style={[styles.errorText, { color: Colors.error }]}>{articlesError}</Text>
            ) : articles.length === 0 ? (
              <Card style={[styles.emptyStateCard, { backgroundColor: Colors.card }]}>
                <BookOpen size={28} color={Colors.lightText} />
                <Text style={[styles.emptyStateTitle, { color: Colors.text }]}>No articles yet</Text>
                <Text style={[styles.emptyStateDescription, { color: Colors.lightText }]}>
                  We’ll keep researching guides for your filters. Try adjusting filters to see more content.
                </Text>
              </Card>
            ) : (
              articles.map((article) => (
                <Card key={article.id} style={[styles.articleCard, { backgroundColor: Colors.card }]} variant="outlined">
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setArticleModal(article)}
                    style={styles.articleCardBody}
                  >
                    <View style={styles.articleHeaderRow}>
                      <Text style={[styles.articleCategory, { color: Colors.lightText }]}>
                        {getArticleCategory(article).toUpperCase()}
                      </Text>
                      <View style={styles.articleHeaderMeta}>
                        {isAdmin && (
                          <View
                            style={[
                              styles.statusChip,
                              { backgroundColor: article.published ? Colors.success + "20" : Colors.warning + "20" },
                            ]}
                          >
                            <Text style={{ color: article.published ? Colors.success : Colors.warning, fontSize: 11, fontWeight: "600" }}>
                              {article.published ? "Published" : "Draft"}
                            </Text>
                          </View>
                        )}
                        <Text style={[styles.articleMetaText, { color: Colors.lightText }]}>{getArticleReadTime(article)}</Text>
                      </View>
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
                          <Text style={[styles.articleMetaText, { color: Colors.lightText }]}>
                            {formatDate(article.updated_at)}
                          </Text>
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
                      <TouchableOpacity onPress={() => handleDiscussArticle(article)}>
                        <Text style={{ color: Colors.primary, fontWeight: "600" }}>Discuss with peers</Text>
                      </TouchableOpacity>
                      <ArrowRight size={16} color={Colors.lightText} />
                    </View>
                  </TouchableOpacity>
                  {isAdmin && (
                    <View style={styles.adminActions}>
                      <TouchableOpacity onPress={() => handleEditArticle(article)}>
                        <Text style={{ color: Colors.primary }}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteArticle(article.id)}>
                        <Text style={{ color: Colors.error }}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </Card>
              ))
            )}
            {isAdmin && (
              <Card style={[styles.adminPanel, { backgroundColor: Colors.card }]} variant="outlined">
                <Text style={[styles.sectionTitle, { color: Colors.text }]}>
                  {editingArticleId ? "Edit Article" : "New Article"}
                </Text>
                <Input
                  label="Title"
                  placeholder="Enter article title"
                  value={articleForm.title}
                  onChangeText={(text) => setArticleForm((prev) => ({ ...prev, title: text }))}
                />
                <Input
                  label="Summary"
                  placeholder="Brief summary (optional)"
                  value={articleForm.summary}
                  onChangeText={(text) => setArticleForm((prev) => ({ ...prev, summary: text }))}
                />
                <Text style={[styles.inputLabel, { color: Colors.text }]}>Content</Text>
                <TextInput
                  style={[
                    styles.textArea,
                    { borderColor: Colors.border, backgroundColor: Colors.lightBackground, color: Colors.text },
                  ]}
                  multiline
                  numberOfLines={4}
                  value={articleForm.content}
                  onChangeText={(text) => setArticleForm((prev) => ({ ...prev, content: text }))}
                  placeholder="Write the full article content..."
                  placeholderTextColor={Colors.lightText}
                />

                <CountrySelector
                  label="Destination"
                  value={articleFormDestination}
                  onChange={setArticleFormDestination}
                  countries={countries.destination}
                  placeholder="Select destination"
                />
                <CountrySelector
                  label="Origin (optional)"
                  value={articleFormOrigin}
                  onChange={setArticleFormOrigin}
                  countries={countries.origin}
                  placeholder="All origins"
                />
                {articleFormOrigin && (
                  <TouchableOpacity style={styles.clearButton} onPress={() => setArticleFormOrigin(null)}>
                    <Text style={{ color: Colors.primary, fontSize: 12 }}>Set to all origins</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.toggleRow}>
                  <Text style={{ color: Colors.text }}>Global origin coverage</Text>
                  <Switch
                    value={articleForm.is_global}
                    onValueChange={(value) => setArticleForm((prev) => ({ ...prev, is_global: value }))}
                  />
                </View>
                <View style={styles.toggleRow}>
                  <Text style={{ color: Colors.text }}>Published</Text>
                  <Switch
                    value={articleForm.published}
                    onValueChange={(value) => setArticleForm((prev) => ({ ...prev, published: value }))}
                  />
                </View>

                <Text style={[styles.inputLabel, { color: Colors.text }]}>Visa Types</Text>
                <View style={styles.visaChipsContainer}>
                  {articleFormVisaOptions.length === 0 && (
                    <Text style={{ color: Colors.lightText, fontSize: 12 }}>Select a destination to load visas</Text>
                  )}
                  {articleFormVisaOptions.map((visa) => {
                    const isSelected = articleForm.visa_types.includes(visa.code);
                    return (
                      <TouchableOpacity
                        key={visa.id}
                        style={[
                          styles.visaChip,
                          {
                            backgroundColor: isSelected ? Colors.primary + "15" : Colors.lightBackground,
                            borderColor: isSelected ? Colors.primary : Colors.border,
                          },
                        ]}
                        onPress={() =>
                          setArticleForm((prev) => ({
                            ...prev,
                            visa_types: isSelected
                              ? prev.visa_types.filter((code) => code !== visa.code)
                              : [...prev.visa_types, visa.code],
                          }))
                        }
                      >
                        <Text style={{ color: isSelected ? Colors.primary : Colors.text }}>{visa.title}</Text>
                        {isSelected && <Check size={14} color={Colors.primary} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {articleFormError && <Text style={{ color: Colors.error }}>{articleFormError}</Text>}

                <View style={styles.cardActions}>
                  <Button
                    title={editingArticleId ? "Update Article" : "Publish Article"}
                    onPress={handleSubmitArticle}
                    loading={articleFormLoading}
                    style={styles.buttonFlex}
                  />
                  <Button
                    title="Clear"
                    onPress={resetArticleForm}
                    variant="outline"
                    style={styles.buttonFlex}
                  />
                </View>
              </Card>
            )}
          </View>
        ) : (
          <View>
            <Card style={[styles.communityHeaderCard, { backgroundColor: Colors.card }]} variant="elevated">
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: Colors.text, marginBottom: 4 }]}>Community stories</Text>
                <Text style={{ color: Colors.lightText }}>
                  See what fellow students with similar journeys are talking about.
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.shareButton, { backgroundColor: Colors.primary }]}
                onPress={() => setPostComposerVisible(true)}
                activeOpacity={0.8}
              >
                <Plus size={18} color="#fff" />
              </TouchableOpacity>
            </Card>

            {communityLoading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={[styles.loadingText, { color: Colors.lightText }]}>Loading community posts...</Text>
              </View>
            ) : communityError ? (
              <Text style={[styles.errorText, { color: Colors.error }]}>{communityError}</Text>
            ) : communityPosts.length === 0 ? (
              <Card style={[styles.emptyStateCard, { backgroundColor: Colors.card }]} variant="outlined">
                <Users size={28} color={Colors.lightText} />
                <Text style={[styles.emptyStateTitle, { color: Colors.text }]}>No discussions yet</Text>
                <Text style={[styles.emptyStateDescription, { color: Colors.lightText }]}>
                  Be the first to share insights for this combination of filters.
                </Text>
              </Card>
            ) : (
              communityPosts.map((post) => {
                const commentDraft = commentDrafts[post.id] || "";
                const isSubmitting = submittingComments[post.id];
                const replyTarget = commentReplyTargets[post.id];
                const reactions = postReactions[post.id] || { helpful: false, insightful: false };
                return (
                  <Card key={post.id} style={[styles.postCard, { backgroundColor: Colors.card }]}>
                    <View style={styles.postHeaderRow}>
                      <View style={styles.postTagRow}>
                        <View style={[styles.postTag, { backgroundColor: Colors.lightBackground }]}>
                          <Text style={{ color: Colors.lightText, fontSize: 12, fontWeight: "600" }}>
                            {getPostTag(post)}
                          </Text>
                        </View>
                        {post.linked_article_id && (
                          <View style={[styles.postBadge, { backgroundColor: Colors.primary + "15" }]}>
                            <Text style={{ color: Colors.primary, fontSize: 11, fontWeight: "600" }}>Linked</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.postMetaText, { color: Colors.lightText }]}>
                        {formatRelativeTime(post.created_at)}
                      </Text>
                    </View>
                    <Text style={[styles.postTitle, { color: Colors.text }]}>{post.title}</Text>
                    <Text style={[styles.postBody, { color: Colors.lightText }]}>{getPostPreview(post)}</Text>
                    <View style={styles.postMetaRow}>
                      <Text style={[styles.postMetaText, { color: Colors.lightText }]}>
                        {post.anonymous
                          ? "Anonymous member"
                          : post.author?.display_name || post.author?.full_name || "Community member"}
                      </Text>
                      <View style={[styles.metaDot, { backgroundColor: Colors.border }]} />
                      <Text style={[styles.postMetaText, { color: Colors.lightText }]}>
                        {countComments(post.comments)} comments
                      </Text>
                    </View>
                    {post.article && (
                      <TouchableOpacity
                        style={[styles.linkedArticlePill, { backgroundColor: Colors.lightBackground }]}
                        onPress={() => setArticleModal(articles.find((a) => a.id === post.article?.id) || null)}
                      >
                        <Link2 size={12} color={Colors.primary} />
                        <Text style={{ color: Colors.primary, fontSize: 12 }} numberOfLines={1}>
                          Discussing: {post.article.title}
                        </Text>
                      </TouchableOpacity>
                    )}

                    <View style={styles.reactionsRow}>
                      <TouchableOpacity
                        style={[
                          styles.reactionButton,
                          {
                            borderColor: reactions.helpful ? Colors.primary : Colors.border,
                            backgroundColor: reactions.helpful ? Colors.primary + "15" : "transparent",
                          },
                        ]}
                        onPress={() => togglePostReaction(post.id, "helpful")}
                      >
                        <Check size={14} color={reactions.helpful ? Colors.primary : Colors.lightText} />
                        <Text
                          style={{
                            color: reactions.helpful ? Colors.primary : Colors.text,
                            fontWeight: "600",
                            fontSize: 13,
                          }}
                        >
                          Helpful
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.reactionButton,
                          {
                            borderColor: reactions.insightful ? Colors.primary : Colors.border,
                            backgroundColor: reactions.insightful ? Colors.primary + "15" : "transparent",
                          },
                        ]}
                        onPress={() => togglePostReaction(post.id, "insightful")}
                      >
                        <MessageSquare
                          size={14}
                          color={reactions.insightful ? Colors.primary : Colors.lightText}
                          strokeWidth={2}
                        />
                        <Text
                          style={{
                            color: reactions.insightful ? Colors.primary : Colors.text,
                            fontWeight: "600",
                            fontSize: 13,
                          }}
                        >
                          Insightful
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {post.comments?.map((comment) => renderComment(comment))}

                    <View style={[styles.commentComposer, { borderColor: Colors.border }]}>
                      {replyTarget && (
                        <View style={styles.replyContext}>
                          <Text style={{ color: Colors.lightText, flex: 1 }}>Replying thoughtfully</Text>
                          <TouchableOpacity
                            onPress={() =>
                              setCommentReplyTargets((prev) => ({
                                ...prev,
                                [post.id]: null,
                              }))
                            }
                          >
                            <X size={14} color={Colors.lightText} />
                          </TouchableOpacity>
                        </View>
                      )}
                      <TextInput
                        style={[styles.commentInput, { color: Colors.text }]}
                        placeholder="Ask about any step of your journey..."
                        placeholderTextColor={Colors.lightText}
                        value={commentDraft}
                        onChangeText={(text) =>
                          setCommentDrafts((prev) => ({
                            ...prev,
                            [post.id]: text,
                          }))
                        }
                      />
                      <View style={styles.toggleRow}>
                        <Text style={{ color: Colors.text, fontSize: 12 }}>Anonymous</Text>
                        <Switch
                          value={commentAnonymous[post.id] || false}
                          onValueChange={(value) =>
                            setCommentAnonymous((prev) => ({
                              ...prev,
                              [post.id]: value,
                            }))
                          }
                        />
                      </View>
                      <Button
                        title="Respond"
                        onPress={() => handleSubmitComment(post.id)}
                        loading={isSubmitting}
                        icon={<Send size={14} color="#fff" />}
                      />
                    </View>
                  </Card>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
      )}

      <Modal visible={postComposerVisible} animationType="slide" onRequestClose={() => setPostComposerVisible(false)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: Colors.background }]} edges={['top']}>
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setPostComposerVisible(false)}>
                <X size={20} color={Colors.lightText} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: Colors.text }]}>Share your experience</Text>
            </View>
            <Input
              label="Title"
              placeholder="e.g. Visa interview timeline"
              value={newPost.title}
              onChangeText={(text) => setNewPost((prev) => ({ ...prev, title: text }))}
            />
            <Text style={[styles.inputLabel, { color: Colors.text }]}>Story</Text>
            <TextInput
              style={[
                styles.textArea,
                { borderColor: Colors.border, backgroundColor: Colors.lightBackground, color: Colors.text },
              ]}
              multiline
              numberOfLines={4}
              value={newPost.body}
              onChangeText={(text) => setNewPost((prev) => ({ ...prev, body: text }))}
              placeholder="Share what helped you or what to avoid..."
              placeholderTextColor={Colors.lightText}
            />
            <View style={styles.toggleRow}>
              <Text style={{ color: Colors.text }}>Post anonymously</Text>
              <Switch
                value={newPost.anonymous}
                onValueChange={(value) => setNewPost((prev) => ({ ...prev, anonymous: value }))}
              />
            </View>
            <TouchableOpacity
              style={[styles.selectorButton, { borderColor: Colors.border }]}
              onPress={() => setLinkArticleModalVisible(true)}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: Colors.text }}>
                  {newPost.linkedArticleId
                    ? `Linked to: ${articles.find((a) => a.id === newPost.linkedArticleId)?.title || "Article"}`
                    : "Link to a related article (optional)"}
                </Text>
              </View>
              <Link2 size={16} color={Colors.lightText} />
            </TouchableOpacity>
            <Button
              title="Share with community"
              onPress={handleCreatePost}
              loading={creatingPost}
              icon={<PlusCircle size={18} color="#fff" />}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={visaModalVisible} animationType="slide" onRequestClose={() => setVisaModalVisible(false)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: Colors.background }]} edges={['top']}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: Colors.text }]}>Select Visa Type</Text>
            <TouchableOpacity onPress={() => setVisaModalVisible(false)}>
              <X size={20} color={Colors.text} />
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
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: Colors.background }]} edges={['top']}>
          {articleModal && (
            <>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setArticleModal(null)}>
                  <X size={20} color={Colors.text} />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.modalTitle, { color: Colors.text }]} numberOfLines={2}>
                    {articleModal.title}
                  </Text>
                  <View style={styles.readingMetaRow}>
                    <Text style={{ color: Colors.lightText, fontSize: 12 }}>
                      {getArticleCategory(articleModal).toUpperCase()}
                    </Text>
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
              <Button
                title="Discuss with community"
                onPress={() => {
                  handleDiscussArticle(articleModal);
                  setArticleModal(null);
                }}
                icon={<MessageSquare size={16} color="#fff" />}
              />
            </>
          )}
        </SafeAreaView>
      </Modal>

      <Modal
        visible={linkArticleModalVisible}
        animationType="slide"
        onRequestClose={() => setLinkArticleModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: Colors.background }]} edges={['top']}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: Colors.text }]}>Link an article</Text>
            <TouchableOpacity onPress={() => setLinkArticleModalVisible(false)}>
              <X size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView>
            <TouchableOpacity
              style={[styles.modalOption, { borderColor: Colors.border }]}
              onPress={() => handleSelectArticleForPost(null)}
            >
              <Text style={{ color: Colors.text }}>No linked article</Text>
            </TouchableOpacity>
            {articles.length === 0 && (
              <Text style={{ color: Colors.lightText, padding: 12 }}>
                No articles available for the current filters.
              </Text>
            )}
            {articles.map((article) => (
              <TouchableOpacity
                key={article.id}
                style={[
                  styles.modalOption,
                  {
                    borderColor: Colors.border,
                    backgroundColor:
                      newPost.linkedArticleId === article.id ? Colors.primary + "15" : "transparent",
                  },
                ]}
                onPress={() => handleSelectArticleForPost(article.id)}
              >
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ color: Colors.text }}>{article.title}</Text>
                  {article.summary && (
                    <Text style={{ color: Colors.lightText, fontSize: 12 }} numberOfLines={1}>
                      {article.summary}
                    </Text>
                  )}
                </View>
                {newPost.linkedArticleId === article.id && <Check size={16} color={Colors.primary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
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
    paddingBottom: 80,
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
  },
  tabSliderWrapper: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  sectionHint: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tabSliderContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 999,
    padding: 4,
    gap: 4,
  },
  tabSliderOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 999,
    paddingVertical: 10,
    gap: 6,
  },
  filterCard: {
    padding: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
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
  filterBadge: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  tabButtonText: {
    fontWeight: "600",
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
    marginBottom: 16,
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
  articleHeaderMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  statusChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  cardActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  adminActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  buttonFlex: {
    flex: 1,
  },
  adminPanel: {
    padding: 20,
    marginTop: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    minHeight: 120,
    textAlignVertical: "top",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 6,
  },
  visaChipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  visaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  communityHeaderCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  shareButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  postCard: {
    padding: 20,
    marginBottom: 16,
  },
  postHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  postTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  postTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  postBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  postBody: {
    lineHeight: 20,
    marginBottom: 12,
  },
  postMetaText: {
    fontSize: 12,
  },
  postMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  linkedArticlePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  reactionsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  reactionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  commentContainer: {
    marginTop: 8,
    borderLeftWidth: 2,
    paddingLeft: 12,
    borderColor: "#E5E7EB",
  },
  commentAuthor: {
    fontWeight: "600",
    marginBottom: 2,
  },
  commentBody: {
    fontSize: 13,
  },
  commentMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  commentMeta: {
    fontSize: 12,
  },
  commentReplyText: {
    fontSize: 12,
    fontWeight: "600",
  },
  commentComposer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  commentInput: {
    minHeight: 60,
  },
  replyContext: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  modalContainer: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  modalContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    marginRight: 12,
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
  clearButton: {
    alignSelf: "flex-end",
    marginTop: -6,
    marginBottom: 4,
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
});
